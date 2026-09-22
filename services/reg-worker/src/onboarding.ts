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

export type Provenance = {
  source: "CUSTOMER" | "VERIFIED_WHATSAPP" | "CEP_PROVIDER" | "CNPJ_AUTHORITY";
  sourceUrl?: string;
  retrievedAt: string;
};
export type Sourced<T> = { value: T; provenance: Provenance; confirmedAt?: string };
export type ProgressiveIntake = {
  kind?: "PF" | "PJ";
  cpf?: Sourced<string>;
  cnpj?: Sourced<string>;
  legalName?: Sourced<string>;
  legalNature?: Sourced<string>;
  companyStatus?: Sourced<string>;
  companySize?: Sourced<string>;
  postalCode?: Sourced<string>;
  street?: Sourced<string>;
  district?: Sourced<string>;
  city?: Sourced<string>;
  state?: Sourced<string>;
  number?: Sourced<string>;
  complement?: Sourced<string>;
  email?: Sourced<string>;
  contactPhone?: Sourced<string>;
  representativeName?: Sourced<string>;
  representativeCpf?: Sourced<string>;
  representativeEmail?: Sourced<string>;
  nationality?: Sourced<string>;
  foreignApplicant?: boolean;
  coOwnership?: boolean;
};

export type IntakeQuestion = { field: keyof ProgressiveIntake; reason: string; optional?: boolean };
const complete = (f?: Sourced<unknown>) => Boolean(f?.value && f.confirmedAt);

/** Manual questions only. INPI-required normalized data remains in Applicant. */
export function nextManualQuestions(i: ProgressiveIntake): IntakeQuestion[] {
  if (!i.kind) return [{ field: "kind", reason: "Pessoa física ou jurídica define o ramo" }];
  if (i.foreignApplicant) return []; // dedicated foreign flow; never force Brazilian identifiers
  if (i.kind === "PF") {
    const q: IntakeQuestion[] = [];
    if (!i.cpf?.value) q.push({ field: "cpf", reason: "Identificar o titular" });
    if (!i.legalName?.value) q.push({ field: "legalName", reason: "Nome completo não foi resolvido com confiança" });
    if (!i.postalCode?.value) q.push({ field: "postalCode", reason: "Localizar endereço" });
    if (!i.number?.value) q.push({ field: "number", reason: "Completar endereço" });
    if (!i.complement?.value) q.push({ field: "complement", reason: "Completar endereço, se houver", optional: true });
    if (!i.email?.value) q.push({ field: "email", reason: "Contrato e comunicação" });
    return q;
  }
  const q: IntakeQuestion[] = [];
  if (!i.cnpj?.value) return [{ field: "cnpj", reason: "Consultar dados oficiais da pessoa jurídica" }];
  if (!i.legalName?.value || !i.legalNature?.value || !i.companyStatus?.value || !i.companySize?.value) {
    return []; // fetch first; do not ask customer to transcribe authoritative company data
  }
  if (!i.postalCode?.value) q.push({ field: "postalCode", reason: "Endereço oficial ausente/divergente" });
  if (!i.number?.value) q.push({ field: "number", reason: "Endereço oficial incompleto" });
  if (!i.complement?.value) q.push({ field: "complement", reason: "Completar endereço, se houver", optional: true });
  if (!i.representativeName?.value) q.push({ field: "representativeName", reason: "Contrato e confirmação do responsável" });
  if (!i.representativeCpf?.value) q.push({ field: "representativeCpf", reason: "Contrato e confirmação do responsável" });
  if (!i.representativeEmail?.value) q.push({ field: "representativeEmail", reason: "Contrato e confirmação do responsável" });
  return q;
}

export function validateAutofill(i: ProgressiveIntake): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const field of ["street", "district", "city", "state"] as const) {
    const f = i[field];
    if (i.postalCode?.value && !f?.value) issues.push({ field, code: "cep_resolution_incomplete" });
    if (f?.provenance.source === "CEP_PROVIDER" && !f.provenance.retrievedAt) issues.push({ field, code: "provenance_missing" });
  }
  if (i.kind === "PJ" && i.cnpj?.value) {
    for (const field of ["legalName", "legalNature", "companyStatus", "companySize"] as const) {
      const f = i[field];
      if (!f?.value) issues.push({ field, code: "authoritative_resolution_required_or_fallback" });
      else if (f.provenance.source !== "CNPJ_AUTHORITY") issues.push({ field, code: "authoritative_source_required" });
    }
  }
  if (i.contactPhone?.provenance.source === "VERIFIED_WHATSAPP" && !i.contactPhone.confirmedAt) {
    issues.push({ field: "contactPhone", code: "contact_confirmation_required" });
  }
  return issues;
}

export function readyForSummaryConfirmation(i: ProgressiveIntake): boolean {
  if (validateAutofill(i).length) return false;
  const fields = i.kind === "PF"
    ? [i.cpf, i.legalName, i.postalCode, i.street, i.district, i.city, i.state, i.number, i.email, i.contactPhone]
    : [i.cnpj, i.legalName, i.legalNature, i.companyStatus, i.companySize, i.postalCode, i.street, i.district, i.city, i.state, i.number, i.representativeName, i.representativeCpf, i.representativeEmail, i.contactPhone];
  return fields.every(complete);
}

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

export type InpiOperatingModel = "ASSISTED_SELF_SERVICE" | "FORMAL_REPRESENTATION";
export type OperatingModelDecision = {
  model: InpiOperatingModel;
  titularPersonallyAuthenticatesOfficialActs: boolean;
  representativeUsesOwnCredentials: boolean;
  poaInstrumentId?: string;
};

export function validateOperatingModel(d: OperatingModelDecision): ValidationIssue[] {
  if (d.model === "ASSISTED_SELF_SERVICE") {
    if (!d.titularPersonallyAuthenticatesOfficialActs) return [{ field: "titularPersonallyAuthenticatesOfficialActs", code: "must_be_true" }];
    if (d.representativeUsesOwnCredentials || d.poaInstrumentId) return [{ field: "model", code: "self_service_cannot_use_representative" }];
  }
  if (d.model === "FORMAL_REPRESENTATION") {
    if (!d.representativeUsesOwnCredentials) return [{ field: "representativeUsesOwnCredentials", code: "must_be_true" }];
    if (!d.poaInstrumentId) return [{ field: "poaInstrumentId", code: "required" }];
    if (d.titularPersonallyAuthenticatesOfficialActs) return [{ field: "model", code: "representation_branch_conflict" }];
  }
  return [];
}

export const ONBOARDING_STAGES = [
  "APPLICANT_DATA", "DISCOUNT_EVIDENCE", "TERMS_REVIEW", "TERMS_ACCEPTED",
  "OPERATING_MODEL_SELECTED", "GRU_PREVIEW", "GRU_CONFIRMED", "TRADEMARK_DATA", "FILING_CONFIRMED"
] as const;

export type Stage = typeof ONBOARDING_STAGES[number];
export function canAdvance(from: Stage, to: Stage): boolean {
  return ONBOARDING_STAGES.indexOf(to) === ONBOARDING_STAGES.indexOf(from) + 1;
}
