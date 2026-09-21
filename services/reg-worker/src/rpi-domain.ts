export function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const br = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (br) return br[3] + "-" + br[2] + "-" + br[1];
  return null;
}

export function classifyDispatch(code: string | null, text: string | null) {
  const joined = ((code ?? "") + " " + (text ?? "")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/oposi(c|ç)ao|oponente|manifestacao a oposicao/.test(joined)) return { eventType: "OPPOSITION", requiresAction: true };
  if (/indefer|recusa|pedido de registro indeferido/.test(joined)) return { eventType: "REFUSAL", requiresAction: true };
  if (/exigencia|cumprimento de exigencia|exigência/.test(joined)) {
    return { eventType: /exame formal|formalidade|formal/.test(joined) ? "FORMAL_REQUIREMENT" : "MERIT_REQUIREMENT", requiresAction: true };
  }
  if (/deferid|concessao|concessão|registro concedido/.test(joined)) return { eventType: "GRANTED", requiresAction: false };
  if (/arquivad|extint|caduc/.test(joined)) return { eventType: "ARCHIVED", requiresAction: false };
  return { eventType: "RPI_PUBLICATION", requiresAction: false };
}

export function discoverEditionNumbers(html: string) {
  const numbers = new Set<number>();
  for (const match of html.matchAll(/RM(\d{4})\.zip/gi)) {
    const number = Number(match[1]);
    if (number >= 2500 && number <= 9999) numbers.add(number);
  }
  return [...numbers].sort((a, b) => a - b);
}
