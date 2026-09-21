import { config } from "./config.js";

export type InpiConflict = {
  process_number: string | null;
  mark_name: string;
  status: string | null;
  holder: string | null;
  class_text: string | null;
  source_kind: "exact" | "radical";
};

export type InpiSearchResult = {
  source: "legacy_web" | "official_api";
  queried_at: string;
  mark: string;
  nice_class: number;
  exact_count: number;
  radical_count: number;
  conflicts: InpiConflict[];
  parser_confident: boolean;
};

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractCount(html: string): number | null {
  const text = stripHtml(html);
  const patterns = [
    /Foram encontrados\s+(\d+)\s+processos?/i,
    /Foram encontradas\s+(\d+)\s+marcas?/i,
    /(\d+)\s+processos?\s+que satisfazem/i,
    /(\d+)\s+resultados?/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  if (/nenhum resultado|nenhum processo|não foram encontrados/i.test(text)) return 0;
  return null;
}

function parseRows(html: string, sourceKind: "exact" | "radical"): InpiConflict[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const conflicts: InpiConflict[] = [];

  for (const row of rows) {
    const rowHtml = row[1] ?? "";
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((cell) => stripHtml(cell[1] ?? ""));

    if (cells.length < 4) continue;

    const processCellIndex = cells.findIndex((cell) => /\b\d{9}\b/.test(cell));
    if (processCellIndex < 0) continue;

    const processCell = cells[processCellIndex] ?? "";
    const processMatch = processCell.match(/\b(\d{9})\b/);
    const processNumber = processMatch?.[1] ?? null;

    const remaining = cells.filter((_, index) => index !== processCellIndex);
    const classText = remaining.find((cell) => /NCL|classe/i.test(cell)) ?? null;
    const status = remaining.find((cell) =>
      /aguardando|deferid|indeferid|registro|arquivad|extint|oposi|exame|pedido/i.test(cell)
    ) ?? null;

    const markName = remaining.find((cell) =>
      cell.length >= 2 &&
      cell !== classText &&
      cell !== status &&
      !/^\d{2}\/\d{2}\/\d{4}$/.test(cell)
    ) ?? "Marca não identificada";

    conflicts.push({
      process_number: processNumber,
      mark_name: markName,
      status,
      holder: null,
      class_text: classText,
      source_kind: sourceKind
    });
  }

  const seen = new Set<string>();
  return conflicts.filter((item) => {
    const key = item.process_number ?? item.mark_name + ":" + item.source_kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.INPI_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function legacySearch(mark: string, niceClass: number): Promise<InpiSearchResult> {
  const login = await fetchWithTimeout(
    "https://busca.inpi.gov.br/pePI/servlet/LoginController?action=login",
    {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0 RegistreAi/1.0",
        accept: "text/html,application/xhtml+xml"
      },
      redirect: "follow"
    }
  );

  if (!login.ok) throw new Error("INPI_LOGIN_HTTP_" + login.status);

  const cookie = login.headers.get("set-cookie") ?? "";
  const endpoint = "https://busca.inpi.gov.br/pePI/servlet/MarcasServletController";

  async function run(kind: "exact" | "radical") {
    const form = new URLSearchParams();
    form.set("Action", "SearchMarcas");
    form.set("Marca", mark);
    form.set("NCL", String(niceClass).padStart(2, "0"));
    form.set("TipoPesquisaMarca", kind === "exact" ? "1" : "2");

    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 RegistreAi/1.0",
        referer: "https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp",
        ...(cookie ? { cookie } : {})
      },
      body: form.toString(),
      redirect: "follow"
    });

    if (!response.ok) throw new Error("INPI_SEARCH_HTTP_" + response.status);
    const html = await response.text();

    if (/erro interno|temporariamente indisponível|service unavailable/i.test(html)) {
      throw new Error("INPI_SEARCH_UNAVAILABLE");
    }

    const count = extractCount(html);
    if (count === null) throw new Error("INPI_SEARCH_PARSER_UNCERTAIN");

    const conflicts = parseRows(html, kind);
    return { count, conflicts };
  }

  const [exact, radical] = await Promise.all([run("exact"), run("radical")]);

  return {
    source: "legacy_web",
    queried_at: new Date().toISOString(),
    mark,
    nice_class: niceClass,
    exact_count: exact.count,
    radical_count: radical.count,
    conflicts: [...exact.conflicts, ...radical.conflicts],
    parser_confident: true
  };
}

async function officialApiSearch(_mark: string, _niceClass: number): Promise<InpiSearchResult> {
  if (!config.INPI_OFFICIAL_API_BASE) {
    throw new Error("INPI_OFFICIAL_API_NOT_CONFIGURED");
  }

  // O Portal de Serviços do INPI ainda não publicou, nesta implementação,
  // um contrato transacional documentado de busca que possamos assumir sem validação.
  // Este adaptador fica explicitamente bloqueado até os endpoints oficiais serem confirmados.
  throw new Error("INPI_OFFICIAL_API_CONTRACT_PENDING_VALIDATION");
}

export async function searchTrademark(mark: string, niceClass: number) {
  if (config.INPI_SEARCH_MODE === "official_api") {
    return officialApiSearch(mark, niceClass);
  }

  return legacySearch(mark, niceClass);
}
