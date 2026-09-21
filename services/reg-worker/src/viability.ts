import { db, queueEncryptedReply } from "./db.js";
import { searchTrademark, type InpiConflict, type InpiSearchResult } from "./inpi.js";
import { NICE_CLASS_HEADINGS, suggestNiceClasses } from "./nice.js";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(value: string) {
  const text = "  " + normalize(value) + "  ";
  const grams = new Set<string>();
  for (let i = 0; i < text.length - 2; i++) grams.add(text.slice(i, i + 3));
  return grams;
}

function similarity(a: string, b: string) {
  const aa = trigrams(a);
  const bb = trigrams(b);
  if (!aa.size || !bb.size) return 0;

  let intersection = 0;
  for (const gram of aa) if (bb.has(gram)) intersection += 1;
  return (2 * intersection) / (aa.size + bb.size);
}

function looksInactive(status: string | null) {
  if (!status) return false;
  return /arquivad|extint|cancelad|caduc|pedido indeferido definitivamente|registro extinto/i.test(status);
}

function uniqueConflicts(results: InpiSearchResult[]) {
  const map = new Map<string, InpiConflict & { nice_class: number }>();

  for (const result of results) {
    for (const conflict of result.conflicts) {
      const key =
        (conflict.process_number ?? normalize(conflict.mark_name)) +
        ":" + result.nice_class +
        ":" + conflict.source_kind;

      if (!map.has(key)) {
        map.set(key, { ...conflict, nice_class: result.nice_class });
      }
    }
  }

  return [...map.values()];
}

async function transitionToConfirmation(processId: string, version: number) {
  const { data, error } = await db.rpc("transition_process", {
    p_process_id: processId,
    p_expected_version: version,
    p_to_status: "awaiting_customer_confirmation",
    p_actor_type: "system",
    p_actor_ref: "viability-engine",
    p_reason: "viability_completed"
  });

  if (error) throw error;
  return data;
}

async function openThread(workspaceId: string) {
  const { data, error } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function runViability(workspaceId: string, processId: string) {
  const { data: existingReport, error: existingError } = await db.from("viability_reports")
    .select("id,verdict,summary,completed_at")
    .eq("process_id", processId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingReport) return existingReport;

  const { data: process, error: processError } = await db.from("processes")
    .select("id,workspace_id,status,version,trademark_id,trademarks(name,activity_description)")
    .eq("id", processId)
    .eq("workspace_id", workspaceId)
    .single();

  if (processError) throw processError;
  if (process.status !== "viability") {
    throw new Error("PROCESS_NOT_IN_VIABILITY_STATE:" + process.status);
  }

  const trademark = process.trademarks as unknown as {
    name: string;
    activity_description: string | null;
  };

  if (!trademark?.name) throw new Error("TRADEMARK_NAME_MISSING");
  if (!trademark.activity_description) throw new Error("TRADEMARK_ACTIVITY_MISSING");

  const suggestions = await suggestNiceClasses(trademark.activity_description);

  for (const item of suggestions.classes) {
    const { error } = await db.from("process_classes").upsert({
      process_id: processId,
      nice_class: item.nice_class,
      specification: NICE_CLASS_HEADINGS[item.nice_class],
      is_primary: item.primary
    }, { onConflict: "process_id,nice_class,specification" });

    if (error) throw error;
  }

  const searches = await Promise.all(
    suggestions.classes.map((item) => searchTrademark(trademark.name, item.nice_class))
  );

  if (searches.some((item) => !item.parser_confident)) {
    throw new Error("INPI_SEARCH_INCOMPLETE");
  }

  const conflicts = uniqueConflicts(searches);
  const activeExact = conflicts.filter(
    (item) => item.source_kind === "exact" && !looksInactive(item.status)
  );

  const anyExact = searches.some((item) => item.exact_count > 0);
  const anyRadical = searches.some((item) => item.radical_count > 0);

  const verdict: "GREEN" | "YELLOW" | "RED" =
    activeExact.length > 0
      ? "RED"
      : anyExact || anyRadical
      ? "YELLOW"
      : "GREEN";

  const searchedClasses = suggestions.classes.map((item) => item.nice_class).join(", ");
  const summary =
    verdict === "GREEN"
      ? "Não foram encontradas colidências exatas ou radicais nas classes pesquisadas. O cenário inicial é favorável, sem garantia de deferimento."
      : verdict === "RED"
      ? "Foram encontradas colidências exatas relevantes nas classes pesquisadas. O cenário exige cautela e análise antes de qualquer protocolo."
      : "Foram encontradas marcas exatas ou semelhantes que precisam ser consideradas antes do protocolo.";

  const { data: report, error: reportError } = await db.from("viability_reports").insert({
    process_id: processId,
    verdict,
    confidence: verdict === "GREEN" ? 0.82 : verdict === "RED" ? 0.9 : 0.72,
    summary,
    model: "deterministic-inpi-v1",
    search_version: "inpi-adapter-v1"
  }).select("id,verdict,summary,completed_at").single();

  if (reportError) throw reportError;

  if (conflicts.length > 0) {
    const rows = conflicts.map((conflict) => ({
      report_id: report.id,
      inpi_process_number: conflict.process_number,
      mark_name: conflict.mark_name,
      nice_class: conflict.nice_class,
      status: conflict.status,
      similarity: Math.min(1, Math.max(0, similarity(trademark.name, conflict.mark_name))),
      match_kind: conflict.source_kind,
      evidence: {
        class_text: conflict.class_text,
        holder: conflict.holder,
        source: "INPI",
        searched_mark: trademark.name
      }
    }));

    const { error: matchesError } = await db.from("viability_matches").insert(rows);
    if (matchesError) throw matchesError;
  }

  await transitionToConfirmation(processId, process.version);

  if (verdict === "GREEN") {
    const primaryClass = suggestions.classes.find((item) => item.primary)?.nice_class;
    if (!primaryClass) throw new Error("PRIMARY_NICE_CLASS_MISSING");

    const { error: confirmationError } = await db.from("viability_confirmations").upsert({
      workspace_id: workspaceId,
      process_id: processId,
      report_id: report.id,
      status: "PENDING",
      confirmed_class: primaryClass
    }, { onConflict: "process_id,report_id" });

    if (confirmationError) throw confirmationError;

    const { error: taskError } = await db.from("workflow_tasks").insert({
      workspace_id: workspaceId,
      process_id: processId,
      task_type: "CUSTOMER_VIABILITY_CONFIRMATION",
      owner_type: "CUSTOMER",
      status: "waiting",
      priority: 80,
      payload_redacted: {
        verdict,
        primary_class: primaryClass,
        classes: suggestions.classes.map((item) => ({
          nice_class: item.nice_class,
          primary: item.primary
        }))
      },
      idempotency_key: "viability-confirm:" + processId
    });

    if (taskError && taskError.code !== "23505") throw taskError;
  }

  const threadId = await openThread(workspaceId);

  const classesText = suggestions.classes
    .map((item) => (item.primary ? "principal " : "") + "classe " + item.nice_class)
    .join(", ");

  const message =
    verdict === "GREEN"
      ? "Terminei a busca da sua marca ✅\n\nO cenário é favorável nas classes pesquisadas (" + classesText + "). Isso não é garantia de deferimento, mas não encontrei colidências exatas ou radicais na pesquisa realizada.\n\nSe estiver de acordo em seguir com a classe principal sugerida, responda *CONFIRMO*."
      : verdict === "RED"
      ? "Terminei a busca da sua marca. Encontrei colidências exatas que aumentam bastante o risco do pedido. Não vou protocolar no automático sem te mostrar esse cenário.\n\nVou manter tudo organizado e podemos ajustar o nome ou a estratégia antes de seguir."
      : "Terminei a busca da sua marca. Encontrei marcas semelhantes que precisam ser consideradas antes do protocolo.\n\nNão vou tratar isso como marca livre. Vou usar essas colidências na análise antes de seguir.";

  await queueEncryptedReply({
    workspaceId,
    threadId,
    body: message,
    idempotencyKey: "viability-result:" + processId
  });

  return {
    ...report,
    searched_classes: searchedClasses,
    conflict_count: conflicts.length
  };
}
