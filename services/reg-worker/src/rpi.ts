import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { db } from "./db.js";
import { classifyDispatch, discoverEditionNumbers, normalizeDate } from "./rpi-domain.js";

const RPI_INDEX_URL = "https://revistas.inpi.gov.br/rpi/";
const RPI_BASE_URL = "https://revistas.inpi.gov.br";

type ParsedEvent = {
  processNumber: string;
  dispatchCode: string | null;
  dispatchText: string | null;
  eventType: string;
  requiresAction: boolean;
  rawEvidence: {
    rpi_number: number;
    publication_date: string | null;
    mark_name: string | null;
    nice_classes: number[];
  };
  fingerprint: string;
};

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function stripTags(value: string | null) {
  if (!value) return null;
  const clean = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
  return clean || null;
}

function attr(block: string, tag: string, name: string): string | null {
  const regex = new RegExp("<" + tag + "\\b[^>]*\\b" + name + "\\s*=\\s*[\"']([^\"']+)[\"']", "i");
  return block.match(regex)?.[1]?.trim() ?? null;
}

function tagText(block: string, tag: string): string | null {
  const regex = new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i");
  return stripTags(block.match(regex)?.[1] ?? null);
}

function markName(block: string) {
  return (
    attr(block, "marca", "nome") ??
    tagText(block, "marca") ??
    tagText(block, "nome") ??
    tagText(block, "denominacao")
  );
}

function niceClasses(block: string): number[] {
  const classes = new Set<number>();

  for (const match of block.matchAll(/<classe-nice\b[^>]*\bcodigo\s*=\s*["'](\d{1,2})["']/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 45) classes.add(value);
  }

  for (const match of block.matchAll(/\bNCL\s*\(?\s*(\d{1,2})\s*\)?/gi)) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 45) classes.add(value);
  }

  return [...classes].sort((a, b) => a - b);
}

function extractDispatches(block: string) {
  const matches = [...block.matchAll(/<despacho\b([^>]*)>([\s\S]*?)<\/despacho>/gi)];

  if (!matches.length) {
    return [{
      code: tagText(block, "codigo"),
      text: tagText(block, "texto-complementar") ?? tagText(block, "descricao") ?? tagText(block, "texto")
    }];
  }

  return matches.map((match) => {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    const code =
      attrs.match(/\bcodigo\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() ??
      tagText(body, "codigo");

    const text =
      tagText(body, "texto-complementar") ??
      tagText(body, "descricao") ??
      tagText(body, "texto") ??
      stripTags(body);

    return { code: code ?? null, text: text ?? null };
  });
}

function parseMagazineXml(args: {
  xml: string;
  rpiNumber: number;
  knownProcesses: Set<string>;
  publicationDate: string | null;
}): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const chunks = args.xml.split(/<\/processo>/i);

  for (const chunk of chunks) {
    const start = chunk.lastIndexOf("<processo");
    if (start < 0) continue;

    const block = chunk.slice(start) + "</processo>";
    const processNumber =
      attr(block, "processo", "numero")?.replace(/\D/g, "") ??
      block.match(/\b(\d{9})\b/)?.[1] ??
      null;

    if (!processNumber || !args.knownProcesses.has(processNumber)) continue;

    const mark = markName(block);
    const classes = niceClasses(block);

    for (const dispatch of extractDispatches(block)) {
      const classification = classifyDispatch(dispatch.code, dispatch.text);
      const evidence = {
        rpi_number: args.rpiNumber,
        publication_date: args.publicationDate,
        mark_name: mark,
        nice_classes: classes
      };

      const fingerprint = sha256(
        JSON.stringify({
          processNumber,
          dispatchCode: dispatch.code,
          dispatchText: dispatch.text,
          evidence
        })
      );

      events.push({
        processNumber,
        dispatchCode: dispatch.code,
        dispatchText: dispatch.text,
        eventType: classification.eventType,
        requiresAction: classification.requiresAction,
        rawEvidence: evidence,
        fingerprint
      });
    }
  }

  return events;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "RegistreAi/1.0 (+https://registreai.com.br)",
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) throw new Error("RPI_HTTP_" + response.status + ":" + url);
  return response.text();
}

async function fetchBytes(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "RegistreAi/1.0 (+https://registreai.com.br)",
      accept: "application/zip,application/octet-stream,*/*"
    }
  });

  if (!response.ok) throw new Error("RPI_ZIP_HTTP_" + response.status + ":" + url);
  return new Uint8Array(await response.arrayBuffer());
}

function extractMagazineDate(xml: string): string | null {
  const header = xml.slice(0, 5000);
  const value =
    header.match(/<revista\b[^>]*\bdata\s*=\s*["']([^"']+)["']/i)?.[1] ??
    header.match(/<data-publicacao\b[^>]*>([^<]+)<\/data-publicacao>/i)?.[1] ??
    null;

  return normalizeDate(value?.trim() ?? null);
}

function extractXml(zipBytes: Uint8Array) {
  const files = unzipSync(zipBytes);
  const entries = Object.entries(files)
    .filter(([name]) => name.toLowerCase().endsWith(".xml"));

  if (!entries.length) throw new Error("RPI_ZIP_XML_NOT_FOUND");

  entries.sort((a, b) => b[1].length - a[1].length);
  const largest = entries[0];
  if (!largest) throw new Error("RPI_ZIP_XML_NOT_FOUND_AFTER_SORT");
  return new TextDecoder("utf-8").decode(largest[1]);
}

async function knownProcesses() {
  const { data, error } = await db.from("processes")
    .select("id,workspace_id,inpi_process_number,status,version")
    .not("inpi_process_number", "is", null)
    .in("status", [
      "filed","monitoring","office_action","opposition","refused","appeal","granted","error_hold"
    ]);

  if (error) throw error;

  const byNumber = new Map<string, {
    id: string;
    workspace_id: string;
    inpi_process_number: string;
    status: string;
    version: number;
  }>();

  for (const row of data ?? []) {
    const number = String(row.inpi_process_number ?? "").replace(/\D/g, "");
    if (number) byNumber.set(number, { ...row, inpi_process_number: number });
  }

  return byNumber;
}

async function ensureEdition(rpiNumber: number, sourceUrl: string) {
  const { data, error } = await db.from("rpi_editions").upsert({
    rpi_number: rpiNumber,
    source_url: sourceUrl,
    status: "discovered"
  }, { onConflict: "rpi_number" }).select("*").single();

  if (error) throw error;
  return data;
}

async function saveEvents(args: {
  editionId: string;
  rpiNumber: number;
  publicationDate: string | null;
  sourceUrl: string;
  sourceSha256: string;
  events: ParsedEvent[];
  processMap: Awaited<ReturnType<typeof knownProcesses>>;
}) {
  let stored = 0;
  const touchedProcesses = new Set<string>();

  for (const event of args.events) {
    const process = args.processMap.get(event.processNumber);
    if (!process) continue;

    const externalId =
      "RPI:" + args.rpiNumber + ":" + event.processNumber + ":" + event.fingerprint.slice(0, 24);

    const { error } = await db.from("process_events").upsert({
      workspace_id: process.workspace_id,
      process_id: process.id,
      event_type: event.eventType,
      source: "RPI",
      source_external_id: externalId,
      occurred_at: args.publicationDate
        ? new Date(args.publicationDate + "T12:00:00-03:00").toISOString()
        : new Date().toISOString(),
      payload: {
        rpi_number: args.rpiNumber,
        source_url: args.sourceUrl,
        source_sha256: args.sourceSha256,
        dispatch_code: event.dispatchCode,
        dispatch_text: event.dispatchText,
        mark_name: event.rawEvidence.mark_name,
        nice_classes: event.rawEvidence.nice_classes,
        publication_date: args.publicationDate
      },
      classification: event.eventType,
      requires_action: event.requiresAction
    }, {
      onConflict: "source,source_external_id",
      ignoreDuplicates: true
    });

    if (error) throw error;
    stored += 1;
    touchedProcesses.add(process.id);

    if (event.requiresAction) {
      const { error: queueError } = await db.rpc("reg_queue_send", {
        p_queue: "legal_jobs",
        p_message: {
          job_type: "classify_legal_event",
          process_id: process.id,
          workspace_id: process.workspace_id,
          source_external_id: externalId,
          rpi_number: args.rpiNumber
        },
        p_delay: 0
      });

      if (queueError) throw queueError;
    }
  }

  for (const processId of touchedProcesses) {
    await db.from("processes").update({
      last_rpi_number: String(args.rpiNumber),
      last_rpi_date: args.publicationDate
    }).eq("id", processId);
  }

  const { error: editionError } = await db.from("rpi_editions").update({
    publication_date: args.publicationDate,
    source_sha256: args.sourceSha256,
    status: "processed",
    matching_processes: touchedProcesses.size,
    total_events: stored,
    processed_at: new Date().toISOString(),
    last_error: null
  }).eq("id", args.editionId);

  if (editionError) throw editionError;

  return { stored, matchedProcesses: touchedProcesses.size };
}

export async function pollRpi() {
  const html = await fetchText(RPI_INDEX_URL);
  const discovered = discoverEditionNumbers(html);

  if (!discovered.length) throw new Error("RPI_INDEX_NO_XML_EDITIONS_FOUND");

  const { data: existing, error: existingError } = await db.from("rpi_editions")
    .select("rpi_number,status")
    .in("rpi_number", discovered);

  if (existingError) throw existingError;

  const processed = new Set(
    (existing ?? [])
      .filter((row) => row.status === "processed")
      .map((row) => row.rpi_number)
  );

  const missing = discovered
    .filter((number) => !processed.has(number))
    .slice(-8);

  for (const rpiNumber of missing) {
    const { error } = await db.rpc("reg_queue_send", {
      p_queue: "inpi_jobs",
      p_message: { job_type: "process_rpi", rpi_number: rpiNumber },
      p_delay: 0
    });
    if (error) throw error;
  }

  return {
    latest: discovered[discovered.length - 1],
    queued: missing
  };
}

export async function processRpiEdition(rpiNumber: number) {
  if (!Number.isInteger(rpiNumber) || rpiNumber < 2500) {
    throw new Error("INVALID_RPI_NUMBER");
  }

  const sourceUrl = RPI_BASE_URL + "/txt/RM" + rpiNumber + ".zip";
  const edition = await ensureEdition(rpiNumber, sourceUrl);

  if (edition.status === "processed") {
    return {
      rpiNumber,
      alreadyProcessed: true,
      matchedProcesses: edition.matching_processes,
      stored: edition.total_events
    };
  }

  await db.from("rpi_editions").update({
    status: "downloading",
    attempts: (edition.attempts ?? 0) + 1,
    last_error: null
  }).eq("id", edition.id);

  try {
    const zipBytes = await fetchBytes(sourceUrl);
    const sourceHash = sha256(zipBytes);

    await db.from("rpi_editions").update({ status: "processing" }).eq("id", edition.id);

    const xml = extractXml(zipBytes);
    const publicationDate = extractMagazineDate(xml);
    const processMap = await knownProcesses();

    if (!processMap.size) {
      await db.from("rpi_editions").update({
        publication_date: publicationDate,
        source_sha256: sourceHash,
        status: "processed",
        matching_processes: 0,
        total_events: 0,
        processed_at: new Date().toISOString()
      }).eq("id", edition.id);

      return { rpiNumber, matchedProcesses: 0, stored: 0 };
    }

    const events = parseMagazineXml({
      xml,
      rpiNumber,
      knownProcesses: new Set(processMap.keys()),
      publicationDate
    });

    const result = await saveEvents({
      editionId: edition.id,
      rpiNumber,
      publicationDate,
      sourceUrl,
      sourceSha256: sourceHash,
      events,
      processMap
    });

    return { rpiNumber, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    await db.from("rpi_editions").update({
      status: "failed",
      last_error: message
    }).eq("id", edition.id);

    throw error;
  }
}
