/**
 * PREPARATION ONLY: RegistreAi's official-act lane.
 * The procurador is a real natural person using their own e-INPI credentials.
 * Credentials are never accepted by this service and the final official act is human-confirmed.
 */
export type Portfolio = "REGISTREAI";
export type ProcuradorStatus = "PENDING_LEGAL" | "ACTIVE" | "SUSPENDED" | "OFFBOARDED";
export type DedicatedProcurador = {
  id: string;
  personName: string;
  cpfHash: string;
  portfolio: Portfolio;
  status: ProcuradorStatus;
  ownEinpiIdentityConfirmedAt?: string;
  exclusivityConfirmedAt?: string;
  poaTemplateVersion: string;
};

export type OfficialActReview = {
  portfolio: Portfolio;
  procuradorId: string;
  processId: string;
  actType: "ISSUE_GRU" | "FILE_APPLICATION" | "FILE_RESPONSE" | "FILE_APPEAL";
  immutablePreviewSha256: string;
  customerConfirmedAt: string;
  termsInstrumentId: string;
  poaInstrumentId: string;
  feeSourceRetrievedAt?: string;
  humanReviewedAt?: string;
  humanConfirmedAt?: string;
  officialReceiptId?: string;
};

const sha = /^[a-f0-9]{64}$/;
export function validateDedicatedProcurador(p: DedicatedProcurador): string[] {
  const errors: string[] = [];
  if (p.portfolio !== "REGISTREAI") errors.push("PORTFOLIO_MUST_BE_REGISTREAI");
  if (p.status !== "ACTIVE") errors.push("PROCURADOR_NOT_ACTIVE");
  if (!p.ownEinpiIdentityConfirmedAt) errors.push("OWN_EINPI_IDENTITY_NOT_CONFIRMED");
  if (!p.exclusivityConfirmedAt) errors.push("PORTFOLIO_SEPARATION_NOT_CONFIRMED");
  if (!p.poaTemplateVersion) errors.push("POA_TEMPLATE_VERSION_MISSING");
  return errors;
}

export function authorizeHumanOfficialClick(p: DedicatedProcurador, a: OfficialActReview): void {
  const errors = validateDedicatedProcurador(p);
  if (a.portfolio !== "REGISTREAI" || a.procuradorId !== p.id) errors.push("PROCURADOR_LANE_MISMATCH");
  if (!sha.test(a.immutablePreviewSha256)) errors.push("PREVIEW_HASH_INVALID");
  if (!a.customerConfirmedAt) errors.push("CUSTOMER_CONFIRMATION_REQUIRED");
  if (!a.termsInstrumentId || !a.poaInstrumentId) errors.push("TERMS_AND_POA_REQUIRED");
  if (!a.humanReviewedAt || !a.humanConfirmedAt) errors.push("HUMAN_PROCURADOR_CLICK_REQUIRED");
  if (errors.length) throw new Error(errors.join(","));
}

export function assertRegistreAiPortfolio(portfolio: string): void {
  if (portfolio !== "REGISTREAI") throw new Error("CROSS_PORTFOLIO_REFERENCE_FORBIDDEN");
}
