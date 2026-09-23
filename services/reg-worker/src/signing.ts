import { createHash } from "node:crypto";

export type InstrumentKind = "TERMS" | "POWER_OF_ATTORNEY";
export type InstrumentEvidence = {
  instrumentKind: InstrumentKind;
  instrumentId: string;
  version: string;
  documentSha256: string;
  displayedAt: string;
  summaryDisplayedAt: string;
  checkboxUncheckedByDefault: true;
  checkboxAcceptedAt: string;
  identityId: string;
  identityMethod: string;
  authenticatedAt: string;
  channel: string;
  providerEventId: string;
  ipAddress?: string;
  userAgent?: string;
  completedAt: string;
};

export function sha256(bytes: string | Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateInstrumentEvidence(e: InstrumentEvidence): string[] {
  const missing: string[] = [];
  for (const key of ["instrumentId","version","documentSha256","displayedAt","summaryDisplayedAt","checkboxAcceptedAt","identityId","identityMethod","authenticatedAt","channel","providerEventId","completedAt"] as const) {
    if (!e[key]) missing.push(key);
  }
  if (!/^[a-f0-9]{64}$/.test(e.documentSha256)) missing.push("documentSha256_invalid");
  if (e.checkboxUncheckedByDefault !== true) missing.push("checkbox_must_start_unchecked");
  if (Date.parse(e.displayedAt) > Date.parse(e.checkboxAcceptedAt)) missing.push("acceptance_before_display");
  return missing;
}

export const REQUIRED_POST_ACCEPTANCE_ARTIFACTS = ["accepted_pdf", "audit_certificate", "delivery_receipt"] as const;
