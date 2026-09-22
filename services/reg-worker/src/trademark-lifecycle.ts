/** Complete trademark-agency lifecycle. Domain state only; no external act is executed here. */
export const TRADEMARK_STAGES = [
  "LEAD_INTAKE", "QUALIFICATION", "TITULAR_DATA", "VIABILITY", "FILING_STRATEGY",
  "TERMS_ACCEPTANCE", "POA_SIGNATURE", "COMMERCIAL_PAYMENT", "OFFICIAL_FEE_PREVIEW",
  "GRU_CUSTOMER_CONFIRMATION", "GRU_HUMAN_ISSUANCE", "GRU_PAYMENT_TRACKING",
  "FILING_PREPARATION", "FILING_CUSTOMER_CONFIRMATION", "FILING_HUMAN_PROTOCOL",
  "PROTOCOL_DELIVERED", "RPI_MONITORING", "EXAMINATION", "ALLOWANCE", "GRANT_FEE",
  "REGISTERED", "RENEWAL_MONITORING", "CLOSED_DOSSIER"
] as const;
export type TrademarkStage = typeof TRADEMARK_STAGES[number];

export const LEGAL_BRANCHES = [
  "FORMAL_REQUIREMENT", "MERIT_REQUIREMENT", "OPPOSITION", "OPPOSITION_DEFENSE",
  "REFUSAL", "APPEAL", "NULLITY", "OTHER_PETITION"
] as const;
export type LegalBranch = typeof LEGAL_BRANCHES[number];

export type LifecycleEvent = {
  type: "ADVANCE" | "RPI_EVENT" | "DELINQUENCY" | "PAYMENT_CONFIRMED" | "CANCEL" | "REACTIVATE";
  targetStage?: TrademarkStage;
  legalBranch?: LegalBranch;
};
export type LifecycleContext = {
  stage: TrademarkStage;
  legalBranch?: LegalBranch;
  monitoringActive: boolean;
  commercialStatus: "CURRENT" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
};
export type TransitionResult = LifecycleContext & { requiresHumanLegalReview: boolean; requiresOfficialActGate: boolean };

const officialGateStages = new Set<TrademarkStage>(["GRU_HUMAN_ISSUANCE","FILING_HUMAN_PROTOCOL","GRANT_FEE"]);
export function transitionLifecycle(c: LifecycleContext, e: LifecycleEvent): TransitionResult {
  if (e.type === "RPI_EVENT") {
    if (!e.legalBranch) throw new Error("RPI_LEGAL_BRANCH_REQUIRED");
    return { ...c, legalBranch:e.legalBranch, requiresHumanLegalReview:true, requiresOfficialActGate:false };
  }
  if (e.type === "DELINQUENCY") return { ...c, commercialStatus:"PAST_DUE", requiresHumanLegalReview:false, requiresOfficialActGate:false };
  if (e.type === "REACTIVATE") return { ...c, commercialStatus:"CURRENT", requiresHumanLegalReview:false, requiresOfficialActGate:false };
  if (e.type === "CANCEL") return { ...c, commercialStatus:"CANCELLED", monitoringActive:false, requiresHumanLegalReview:false, requiresOfficialActGate:false };
  if (e.type !== "ADVANCE" || !e.targetStage) throw new Error("LIFECYCLE_TARGET_REQUIRED");
  const from = TRADEMARK_STAGES.indexOf(c.stage), to = TRADEMARK_STAGES.indexOf(e.targetStage);
  if (to !== from + 1) throw new Error(`INVALID_LIFECYCLE_TRANSITION:${c.stage}->${e.targetStage}`);
  if (["PAST_DUE","SUSPENDED","CANCELLED"].includes(c.commercialStatus) && officialGateStages.has(e.targetStage)) throw new Error("OFFICIAL_ACT_BLOCKED_BY_COMMERCIAL_STATUS");
  return { ...c, stage:e.targetStage, requiresHumanLegalReview:false, requiresOfficialActGate:officialGateStages.has(e.targetStage) };
}

export const LEGAL_BRANCH_GATE: Record<LegalBranch,{analysisDraftAllowed:true;humanLegalApprovalRequired:true;customerConfirmationRequired:true;procuradorOfficialClickRequired:true}> = Object.fromEntries(LEGAL_BRANCHES.map(x=>[x,{analysisDraftAllowed:true,humanLegalApprovalRequired:true,customerConfirmationRequired:true,procuradorOfficialClickRequired:true}])) as never;
