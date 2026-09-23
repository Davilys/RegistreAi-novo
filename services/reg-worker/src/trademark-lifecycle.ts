/** Complete trademark-agency lifecycle. Domain state only; no external act is executed here. */
export const TRADEMARK_STAGES = [
  "LEAD_INTAKE", "QUALIFICATION", "TITULAR_DATA", "VIABILITY", "FILING_STRATEGY",
  "TERMS_ACCEPTANCE", "POA_SIGNATURE", "COMMERCIAL_PAYMENT", "OFFICIAL_FEE_PREVIEW",
  "GRU_CUSTOMER_CONFIRMATION", "GRU_HUMAN_ISSUANCE", "GRU_PAYMENT_TRACKING",
  "FILING_PREPARATION", "FILING_CUSTOMER_CONFIRMATION", "FILING_HUMAN_PROTOCOL",
  "PROTOCOL_DELIVERED", "RPI_MONITORING", "EXAMINATION", "ALLOWANCE", "GRANT_FEE_PREVIEW",
  "GRANT_FEE_CUSTOMER_CONFIRMATION", "GRANT_FEE_HUMAN_PAYMENT", "CERTIFICATE_PENDING",
  "CERTIFICATE_ISSUED", "CERTIFICATE_DELIVERED", "POST_GRANT_MONITORING", "RENEWAL_NOTICE",
  "RENEWAL_FEE_PREVIEW", "RENEWAL_CUSTOMER_CONFIRMATION", "RENEWAL_HUMAN_PAYMENT",
  "RENEWED", "CLOSED_DOSSIER"
] as const;
export type TrademarkStage = typeof TRADEMARK_STAGES[number];

export const LEGAL_BRANCHES = [
  "FORMAL_REQUIREMENT", "MERIT_REQUIREMENT", "OPPOSITION", "OPPOSITION_DEFENSE",
  "REFUSAL", "APPEAL", "ADMINISTRATIVE_NULLITY", "EXPIRY_OR_CANCELLATION_EVENT",
  "OWNERSHIP_OR_NAME_CHANGE", "ASSIGNMENT", "LICENSE_RECORDAL", "OTHER_PETITION"
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

const officialGateStages = new Set<TrademarkStage>(["GRU_HUMAN_ISSUANCE","FILING_HUMAN_PROTOCOL","GRANT_FEE_HUMAN_PAYMENT","RENEWAL_HUMAN_PAYMENT"]);
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


export type CustomerTouchpoint = "DOCUMENTS" | "ACCEPTANCE" | "SIGNATURE" | "PAYMENT" | "DECISION";
export const CUSTOMER_CHANNEL: "WHATSAPP" = "WHATSAPP";
export type LifecycleAcceptance = {
  customerChannel: typeof CUSTOMER_CHANNEL;
  customerTouchpoints: CustomerTouchpoint[];
  dedicatedProcuradorAtOfficialActs: true;
  legalStrategyHumanApproved: true;
  officialReceiptRequired: true;
  certificateDelivered: boolean;
  finalDossierDelivered: boolean;
};
export function validateCompletion(a: LifecycleAcceptance): string[] {
  const errors: string[] = [];
  for (const item of ["DOCUMENTS","ACCEPTANCE","SIGNATURE","PAYMENT","DECISION"] as CustomerTouchpoint[]) if (!a.customerTouchpoints.includes(item)) errors.push(`CUSTOMER_TOUCHPOINT_MISSING:${item}`);
  if (a.customerChannel !== "WHATSAPP") errors.push("CUSTOMER_MUST_REMAIN_IN_WHATSAPP");
  if (!a.dedicatedProcuradorAtOfficialActs) errors.push("DEDICATED_PROCURADOR_REQUIRED");
  if (!a.legalStrategyHumanApproved) errors.push("HUMAN_LEGAL_APPROVAL_REQUIRED");
  if (!a.officialReceiptRequired) errors.push("OFFICIAL_RECEIPT_REQUIRED");
  if (!a.certificateDelivered) errors.push("CERTIFICATE_NOT_DELIVERED");
  if (!a.finalDossierDelivered) errors.push("FINAL_DOSSIER_NOT_DELIVERED");
  return errors;
}

export const PROCEDURAL_WORKFLOW = [
  "RPI_DETECTED", "DEADLINE_VERIFIED", "PLAIN_LANGUAGE_RISK_EXPLAINED", "STRATEGY_PROPOSED",
  "EVIDENCE_REQUESTED", "EVIDENCE_COMPLETE", "DRAFT_PREPARED", "CUSTOMER_SUMMARY_DELIVERED",
  "CUSTOMER_APPROVED", "APPLICABLE_FEE_PAID", "HUMAN_LEGAL_APPROVED", "PROCURADOR_FILED",
  "OFFICIAL_RECEIPT_DELIVERED", "OUTCOME_MONITORING"
] as const;
export type ProceduralStep = typeof PROCEDURAL_WORKFLOW[number];
export type ProceduralCase = { branch: LegalBranch; step: ProceduralStep; deadlineVerified: boolean; feeApplicable: boolean };
export function advanceProceduralCase(c: ProceduralCase, target: ProceduralStep): ProceduralCase {
  const from=PROCEDURAL_WORKFLOW.indexOf(c.step),to=PROCEDURAL_WORKFLOW.indexOf(target);
  if(to!==from+1)throw new Error(`INVALID_PROCEDURAL_TRANSITION:${c.step}->${target}`);
  if(target==="PLAIN_LANGUAGE_RISK_EXPLAINED"&&!c.deadlineVerified)throw new Error("DEADLINE_MUST_BE_VERIFIED_FIRST");
  if(target==="HUMAN_LEGAL_APPROVED"&&c.feeApplicable&&c.step!=="APPLICABLE_FEE_PAID")throw new Error("APPLICABLE_FEE_NOT_PAID");
  return {...c,step:target};
}
export function evidenceRequiredForFiling(c: ProceduralCase): string[] {
  const reached=(s:ProceduralStep)=>PROCEDURAL_WORKFLOW.indexOf(c.step)>=PROCEDURAL_WORKFLOW.indexOf(s);
  return [
    !c.deadlineVerified&&"DEADLINE_UNVERIFIED",!reached("CUSTOMER_APPROVED")&&"CUSTOMER_APPROVAL_MISSING",
    c.feeApplicable&&!reached("APPLICABLE_FEE_PAID")&&"FEE_PAYMENT_MISSING",
    !reached("HUMAN_LEGAL_APPROVED")&&"HUMAN_LEGAL_APPROVAL_MISSING",
    !reached("PROCURADOR_FILED")&&"PROCURADOR_FILING_MISSING",
    !reached("OFFICIAL_RECEIPT_DELIVERED")&&"OFFICIAL_RECEIPT_MISSING"
  ].filter(Boolean) as string[];
}
