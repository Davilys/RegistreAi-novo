import assert from "node:assert/strict";
import test from "node:test";
import { assertNoEinpiCredential, canAdvance, validateApplicant, validateCoOwnership, validateOperatingModel } from "../src/onboarding.js";
import { sha256, validateInstrumentEvidence } from "../src/signing.js";
import { assertFreshOfficialFee, requireExplicitConfirmation } from "../src/inpi-flow.js";

const pf = { kind: "BR_PF" as const, nationality: "Brasileira", legalNature: "Pessoa Física", cpf: "12345678901", legalName: "Cliente Exemplo", country: "Brasil", state: "SP", city: "São Paulo", street: "Rua A", number: "1", district: "Centro", postalCode: "01001000", email: "cliente@example.com" };
test("validates conditional PF and cotitularity shapes", () => {
  assert.deepEqual(validateApplicant(pf), []);
  assert.deepEqual(validateCoOwnership({ enabled: true, applicants: [pf, { ...pf, cpf: "98765432100" }] }), []);
  assert.equal(validateCoOwnership({ enabled: false, applicants: [pf, pf] })[0]?.code, "single_when_disabled");
});
test("rejects any nested e-INPI password field", () => {
  assert.throws(() => assertNoEinpiCredential({ applicant: { senha: "never" } }), /EINPI_CREDENTIAL_FORBIDDEN/);
});
test("forces sequential legal/product gates", () => {
  assert.equal(canAdvance("APPLICANT_DATA", "DISCOUNT_EVIDENCE"), true);
  assert.equal(canAdvance("TERMS_REVIEW", "POA_REVIEW"), false);
  assert.equal(canAdvance("GRU_CONFIRMED", "FILING_CONFIRMED"), false);
});
test("requires complete versioned acceptance evidence", () => {
  const at = "2026-09-22T10:00:00.000Z";
  assert.deepEqual(validateInstrumentEvidence({ instrumentKind:"TERMS", instrumentId:"i1", version:"v1", documentSha256:sha256("terms"), displayedAt:at, summaryDisplayedAt:at, checkboxUncheckedByDefault:true, checkboxAcceptedAt:at, identityId:"id1", identityMethod:"otp", authenticatedAt:at, channel:"web", providerEventId:"evt1", completedAt:at }), []);
});
test("blocks stale or nonofficial fee and unconfirmed effects", () => {
  assert.throws(() => assertFreshOfficialFee({ sourceUrl:"https://example.com", sourceRetrievedAt:new Date().toISOString(), serviceCode:"389", classCount:1, discountTier:"STANDARD", officialAmountCents:100, applicantSnapshotSha256:sha256("a") }), /NOT_OFFICIAL/);
  assert.throws(() => requireExplicitConfirmation("GRU", false, sha256("preview")), /CONFIRMATION_REQUIRED/);
});

import { nextManualQuestions, readyForSummaryConfirmation, validateAutofill, type ProgressiveIntake, type Sourced } from "../src/onboarding.js";
const at = "2026-09-22T11:00:00.000Z";
const customer = <T>(value:T):Sourced<T> => ({ value, provenance:{ source:"CUSTOMER", retrievedAt:at }, confirmedAt:at });
const cep = <T>(value:T):Sourced<T> => ({ value, provenance:{ source:"CEP_PROVIDER", sourceUrl:"https://viacep.com.br", retrievedAt:at }, confirmedAt:at });
const cnpj = <T>(value:T):Sourced<T> => ({ value, provenance:{ source:"CNPJ_AUTHORITY", sourceUrl:"https://www.gov.br/receitafederal", retrievedAt:at }, confirmedAt:at });
test("asks PF first and only the progressive manual minimum", () => {
  assert.deepEqual(nextManualQuestions({})[0]?.field, "kind");
  const fields = nextManualQuestions({ kind:"PF", cpf:customer("123"), legalName:customer("Ana"), postalCode:customer("01001000"), number:customer("1"), email:customer("a@b.com") }).map(x=>x.field);
  assert.deepEqual(fields, ["complement"]);
  assert.equal(fields.includes("contactPhone"), false);
});
test("PJ fetches authoritative fields instead of asking customer to transcribe them", () => {
  assert.deepEqual(nextManualQuestions({ kind:"PJ" }), [{ field:"cnpj", reason:"Consultar dados oficiais da pessoa jurídica" }]);
  assert.deepEqual(nextManualQuestions({ kind:"PJ", cnpj:customer("12345678000199") }), []);
});
test("requires provenance, correction confirmation and transparent WhatsApp reuse", () => {
  const phone:Sourced<string> = { value:"+5511999999999", provenance:{source:"VERIFIED_WHATSAPP",retrievedAt:at} };
  assert.equal(validateAutofill({ kind:"PF", postalCode:customer("01001000"), street:cep("Praça da Sé"), district:cep("Sé"), city:cep("São Paulo"), state:cep("SP"), contactPhone:phone })[0]?.code, "contact_confirmation_required");
});
test("summary gate only opens after all load-bearing data is confirmed", () => {
  const intake:ProgressiveIntake = { kind:"PF", cpf:customer("12345678901"), legalName:customer("Ana Exemplo"), postalCode:customer("01001000"), street:cep("Praça da Sé"), district:cep("Sé"), city:cep("São Paulo"), state:cep("SP"), number:customer("1"), email:customer("ana@example.com"), contactPhone:{value:"+5511999999999",provenance:{source:"VERIFIED_WHATSAPP",retrievedAt:at},confirmedAt:at} };
  assert.equal(readyForSummaryConfirmation(intake), true);
});
test("PJ authoritative identity branch is accepted when sourced and confirmed", () => {
  const i:ProgressiveIntake = { kind:"PJ", cnpj:customer("12345678000199"), legalName:cnpj("Empresa X"), legalNature:cnpj("LTDA"), companyStatus:cnpj("ATIVA"), companySize:cnpj("ME"), postalCode:cnpj("01001000"), street:cnpj("Rua A"), district:cnpj("Centro"), city:cnpj("São Paulo"), state:cnpj("SP"), number:cnpj("1"), representativeName:customer("Ana"), representativeCpf:customer("12345678901"), representativeEmail:customer("ana@example.com"), contactPhone:{value:"+5511999999999",provenance:{source:"VERIFIED_WHATSAPP",retrievedAt:at},confirmedAt:at} };
  assert.equal(readyForSummaryConfirmation(i), true);
});

test("requires the definitive dedicated natural-person procurador lane", () => {
  assert.deepEqual(validateOperatingModel({ model:"FORMAL_REPRESENTATION", dedicatedNaturalPersonProcuradorId:"proc-1", representativeUsesOwnCredentials:true, poaInstrumentId:"poa-1", humanOfficialClickRequired:true, portfolio:"REGISTREAI" }), []);
});

import { assertRegistreAiPortfolio, authorizeHumanOfficialClick, validateDedicatedProcurador } from "../src/procurador-lane.js";
test("blocks CNPJ/sham or cross-portfolio procurador lanes and requires human click", () => {
  const p = { id:"proc-1", personName:"Procurador Dedicado", cpfHash:"a".repeat(64), portfolio:"REGISTREAI" as const, status:"ACTIVE" as const, ownEinpiIdentityConfirmedAt:at, exclusivityConfirmedAt:at, poaTemplateVersion:"poa-v1" };
  assert.deepEqual(validateDedicatedProcurador(p), []);
  assert.throws(() => assertRegistreAiPortfolio("OTHER_PORTFOLIO"), /CROSS_PORTFOLIO/);
  assert.throws(() => authorizeHumanOfficialClick(p, { portfolio:"REGISTREAI", procuradorId:"proc-1", processId:"p1", actType:"FILE_APPLICATION", immutablePreviewSha256:"a".repeat(64), customerConfirmedAt:at, termsInstrumentId:"t1", poaInstrumentId:"poa1" }), /HUMAN_PROCURADOR_CLICK_REQUIRED/);
  assert.doesNotThrow(() => authorizeHumanOfficialClick(p, { portfolio:"REGISTREAI", procuradorId:"proc-1", processId:"p1", actType:"FILE_APPLICATION", immutablePreviewSha256:"a".repeat(64), customerConfirmedAt:at, termsInstrumentId:"t1", poaInstrumentId:"poa1", humanReviewedAt:at, humanConfirmedAt:at }));
});
