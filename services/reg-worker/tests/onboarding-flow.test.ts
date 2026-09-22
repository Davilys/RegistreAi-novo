import assert from "node:assert/strict";
import test from "node:test";
import { assertNoEinpiCredential, canAdvance, validateApplicant, validateCoOwnership } from "../src/onboarding.js";
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
