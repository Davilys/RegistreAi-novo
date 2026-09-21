import { db, queueEncryptedReply } from "./db.js";

type DeadlineRow = {
  id: string;
  workspace_id: string;
  process_id: string;
  kind: string;
  due_at: string;
  status: string;
  customer_dependency: boolean;
};

function milestoneFor(dueAt: string) {
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  const remainingMs = due - now;

  if (remainingMs < 0) return "MISSED" as const;

  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (days <= 0) return "D0" as const;
  if (days <= 1) return "D1" as const;
  if (days <= 3) return "D3" as const;
  if (days <= 7) return "D7" as const;
  if (days <= 15) return "D15" as const;
  return null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

async function openThread(workspaceId: string) {
  const { data, error } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
}

async function processLabel(processId: string) {
  const { data, error } = await db.from("processes")
    .select("inpi_process_number,trademarks(name)")
    .eq("id", processId)
    .single();

  if (error) throw error;

  const trademark = data.trademarks as unknown as { name?: string } | null;
  return {
    mark: trademark?.name ?? "sua marca",
    processNumber: data.inpi_process_number ?? null
  };
}

async function alreadySent(deadlineId: string, milestone: string) {
  const { data, error } = await db.from("deadline_reminders")
    .select("id")
    .eq("deadline_id", deadlineId)
    .eq("milestone", milestone)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function registerReminder(
  deadline: DeadlineRow,
  milestone: "D15" | "D7" | "D3" | "D1" | "D0" | "MISSED"
) {
  const { data, error } = await db.from("deadline_reminders").insert({
    workspace_id: deadline.workspace_id,
    process_id: deadline.process_id,
    deadline_id: deadline.id,
    milestone
  }).select("id").single();

  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }

  return data.id as string;
}

async function markReminderSent(reminderId: string) {
  const { error } = await db.from("deadline_reminders")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", reminderId);

  if (error) throw error;
}

function reminderText(args: {
  milestone: "D15" | "D7" | "D3" | "D1" | "D0";
  dueDate: string;
  mark: string;
  customerDependency: boolean;
}) {
  const prefix =
    args.milestone === "D0" ? "⚠️ O prazo do INPI vence hoje." :
    args.milestone === "D1" ? "⚠️ Falta 1 dia para o prazo do INPI." :
    args.milestone === "D3" ? "Faltam até 3 dias para o prazo do INPI." :
    args.milestone === "D7" ? "Faltam até 7 dias para o prazo do INPI." :
    "O prazo do INPI está se aproximando.";

  const dependency = args.customerDependency
    ? "\n\nAinda existe algo que depende de você. Assim que você enviar o que pedi, eu continuo daqui."
    : "\n\nEstou acompanhando e trabalhando nas etapas que dependem da Reg.";

  return (
    prefix +
    "\nMarca: " + args.mark +
    "\nData limite: " + args.dueDate +
    dependency
  );
}

async function handleMissed(deadline: DeadlineRow, reminderId: string) {
  const now = new Date().toISOString();

  const { error: deadlineError } = await db.from("deadlines").update({
    status: "missed",
    missed_at: now
  }).eq("id", deadline.id).eq("status", "open");

  if (deadlineError) throw deadlineError;

  const { error: caseError } = await db.from("legal_cases").update({
    status: "missed"
  }).eq("deadline_id", deadline.id).not("status", "in", '("filed","closed")');

  if (caseError) throw caseError;

  const { error: processError } = await db.from("processes").update({
    automation_hold: true,
    hold_reason: deadline.customer_dependency
      ? "LEGAL_DEADLINE_MISSED_CUSTOMER_DEPENDENCY"
      : "LEGAL_DEADLINE_MISSED_SYSTEM_DEPENDENCY"
  }).eq("id", deadline.process_id);

  if (processError) throw processError;

  const label = await processLabel(deadline.process_id);
  const threadId = await openThread(deadline.workspace_id);

  if (threadId) {
    await queueEncryptedReply({
      workspaceId: deadline.workspace_id,
      threadId,
      body:
        "⚠️ O prazo do INPI referente à marca " + label.mark + " terminou em " +
        formatDate(deadline.due_at) + "." +
        (deadline.customer_dependency
          ? "\n\nOs documentos ou informações necessários não foram recebidos a tempo, por isso não foi possível concluir a manifestação dentro do prazo. Registrei a ocorrência e continuo acompanhando o processo."
          : "\n\nA etapa não foi concluída dentro do prazo. O processo foi colocado em bloqueio de segurança para impedir qualquer ação incorreta e a ocorrência ficou registrada."),
      idempotencyKey: "deadline-missed:" + deadline.id
    });
  }

  await db.from("security_events").insert({
    workspace_id: deadline.workspace_id,
    process_id: deadline.process_id,
    severity: "CRITICAL",
    event_type: "LEGAL_DEADLINE_MISSED",
    source: "deadline-sweep",
    blocked: true,
    details_redacted: {
      deadline_id: deadline.id,
      kind: deadline.kind,
      due_at: deadline.due_at,
      customer_dependency: deadline.customer_dependency
    }
  });

  await markReminderSent(reminderId);
}

export async function sweepDeadlines() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000);

  const { data, error } = await db.from("deadlines")
    .select("id,workspace_id,process_id,kind,due_at,status,customer_dependency")
    .eq("status", "open")
    .lte("due_at", horizon.toISOString())
    .order("due_at", { ascending: true })
    .limit(500);

  if (error) throw error;

  let sent = 0;
  let missed = 0;

  for (const deadline of (data ?? []) as DeadlineRow[]) {
    const milestone = milestoneFor(deadline.due_at);
    if (!milestone) continue;
    if (await alreadySent(deadline.id, milestone)) continue;

    const reminderId = await registerReminder(deadline, milestone);
    if (!reminderId) continue;

    if (milestone === "MISSED") {
      await handleMissed(deadline, reminderId);
      missed += 1;
      continue;
    }

    const label = await processLabel(deadline.process_id);
    const threadId = await openThread(deadline.workspace_id);

    if (threadId) {
      await queueEncryptedReply({
        workspaceId: deadline.workspace_id,
        threadId,
        body: reminderText({
          milestone,
          dueDate: formatDate(deadline.due_at),
          mark: label.mark,
          customerDependency: deadline.customer_dependency
        }),
        idempotencyKey: "deadline-reminder:" + deadline.id + ":" + milestone
      });

      sent += 1;
    }

    await markReminderSent(reminderId);
  }

  return { sent, missed };
}
