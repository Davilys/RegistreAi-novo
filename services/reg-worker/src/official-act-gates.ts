import type { DedicatedProcurador, OfficialActReview } from "./procurador-lane.js";
import { authorizeHumanOfficialClick } from "./procurador-lane.js";

export type OfficialActGateInput = {
  procurador?: DedicatedProcurador;
  review?: OfficialActReview;
  acceptedTermsDeliveredAt?: string;
  poaDeliveredAt?: string;
  feeSourceVerifiedAt?: string;
  discountEvidenceVerifiedAt?: string;
};

export type GateDecision = { ready: true } | { ready: false; blockers: string[] };

export function evaluateOfficialActGates(input: OfficialActGateInput, now = Date.now()): GateDecision {
  const blockers: string[] = [];
  if (!input.procurador) blockers.push("DEDICATED_PROCURADOR_NOT_ASSIGNED");
  if (!input.review) blockers.push("OFFICIAL_ACT_REVIEW_MISSING");
  if (!input.acceptedTermsDeliveredAt) blockers.push("ACCEPTED_TERMS_NOT_DELIVERED");
  if (!input.poaDeliveredAt) blockers.push("SIGNED_POA_NOT_DELIVERED");
  if (!input.discountEvidenceVerifiedAt) blockers.push("DISCOUNT_EVIDENCE_NOT_VERIFIED");
  if (!input.feeSourceVerifiedAt) blockers.push("OFFICIAL_FEE_NOT_VERIFIED");
  else if (now - Date.parse(input.feeSourceVerifiedAt) > 24 * 60 * 60 * 1000) blockers.push("OFFICIAL_FEE_VERIFICATION_STALE");
  if (input.procurador && input.review) {
    try { authorizeHumanOfficialClick(input.procurador, input.review); }
    catch (error) { blockers.push(...String(error instanceof Error ? error.message : error).split(",")); }
  }
  return blockers.length ? { ready:false, blockers:[...new Set(blockers)] } : { ready:true };
}

export function assertTaskCannotBypassGates(taskType: string, decision: GateDecision): void {
  if (!["GENERATE_INPI_FEE", "FILE_INPI_APPLICATION", "FILE_INPI_RESPONSE", "FILE_INPI_APPEAL"].includes(taskType)) return;
  if (!decision.ready) throw new Error(`OFFICIAL_ACT_BLOCKED:${decision.blockers.join("|")}`);
}
