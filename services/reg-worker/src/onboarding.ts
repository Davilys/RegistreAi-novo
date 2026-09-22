/**
 * PREPARATION ONLY. Customer onboarding rules for legal/product review.
 * No function in this module creates an INPI account, issues a GRU or files a mark.
 */
export type ApplicantKind = "BR_PF" | "BR_PJ" | "FOREIGN_PF" | "FOREIGN_PJ";
export type Applicant = {
  kind: ApplicantKind;
  nationality?: string;
  legalNature: string;
  cpf?: string;
  cnpj?: string;
  legalName: string;
  country: string;
  state?: string;
  city: string;
  street: string;
  number?: string;
  district?: string;
  complement?: string;
  postalCode?: string;
  email: string;
  activity?: string;
  occupation?: string;
  phone?: string;
  mobile?: string;
  disabilityFederalRegistry?: boolean;
  cadUnicoLowIncome?: boolean;
  participatesInSameFieldCompany?: boolean;
  brazilRepresentativeRequired?: boolean;
};

export type CoOwnership = { enabled: boolean; applicants: Applicant[] };
export type ValidationIssue = { field: string; code: string };

const forbiddenKeys = new Set(["password", "senha", "einpi_password", "govbr_password"]);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const digits = (v = "") => v.replace(/\D/g, "");

export function assertNoEinpiCredential(value: unknown, path = "root"): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (forbiddenKeys.has(key.toLowerCase())) throw new Error(`EINPI_CREDENTIAL_FORBIDDEN:${path}.${key}`);
    assertNoEinpiCredential(child, `${path}.${key}`);
  }
}

export function validateApplicant(a: Applicant): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const required = (field: keyof Applicant) => {
    const value = a[field];
    if (value === undefined || value === null || value === "") issues.push({ field, code: "required" });
  };
  ["legalNature", "legalName", "country", "city", "street", "email"].forEach((f) => required(f as keyof Applicant));
  if (a.email && !isEmail(a.email)) issues.push({ field: "email", code: "invalid" });

  if (a.kind === "BR_PF") {
    required("nationality"); required("cpf"); required("state"); required("number"); required("district"); required("postalCode");
    if (a.cpf && digits(a.cpf).length !== 11) issues.push({ field: "cpf", code: "invalid_length" });
  }
  if (a.kind === "BR_PJ") {
    required("nationality"); required("cnpj"); required("state"); required("number"); required("district"); required("postalCode");
    if (a.cnpj && digits(a.cnpj).length !== 14) issues.push({ field: "cnpj", code: "invalid_length" });
  }
  if (a.kind.startsWith("FOREIGN_")) {
    if (!a.brazilRepresentativeRequired) issues.push({ field: "brazilRepresentativeRequired", code: "must_be_true" });
  }
  return issues;
}

export function validateCoOwnership(input: CoOwnership): ValidationIssue[] {
  if (!input.applicants.length) return [{ field: "applicants", code: "at_least_one" }];
  if (!input.enabled && input.applicants.length !== 1) return [{ field: "applicants", code: "single_when_disabled" }];
  return input.applicants.flatMap((a, i) => validateApplicant(a).map((x) => ({ ...x, field: `applicants.${i}.${x.field}` })));
}

export const ONBOARDING_STAGES = [
  "APPLICANT_DATA", "DISCOUNT_EVIDENCE", "TERMS_REVIEW", "TERMS_ACCEPTED",
  "POA_REVIEW", "POA_SIGNED", "GRU_PREVIEW", "GRU_CONFIRMED", "TRADEMARK_DATA", "FILING_CONFIRMED"
] as const;

export type Stage = typeof ONBOARDING_STAGES[number];
export function canAdvance(from: Stage, to: Stage): boolean {
  return ONBOARDING_STAGES.indexOf(to) === ONBOARDING_STAGES.indexOf(from) + 1;
}
