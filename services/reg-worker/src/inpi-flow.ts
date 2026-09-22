/** Prepared gates only. Adapters must read official INPI state at execution time. */
export type TrademarkFilingData = {
  nature: "PRODUCT_SERVICE" | "COLLECTIVE" | "CERTIFICATION";
  presentation: "WORD" | "FIGURATIVE" | "MIXED" | "THREE_DIMENSIONAL" | "POSITION";
  markName: string;
  foreignExpressionTranslation?: string;
  imageObjectId?: string;
  niceClass: number;
  goodsServices: string[];
  holderActivityCompatibilityConfirmed: boolean;
  unionPriority?: { country: string; filingDate: string; applicationNumber: string };
  attachmentObjectIds: string[];
};

export type GruPreview = {
  sourceUrl: string;
  sourceRetrievedAt: string;
  sourceVersion?: string;
  serviceCode: string;
  classCount: number;
  discountTier: string;
  officialAmountCents: number;
  applicantSnapshotSha256: string;
};

export function assertFreshOfficialFee(p: GruPreview, now = Date.now()) {
  if (!p.sourceUrl.startsWith("https://www.gov.br/inpi/")) throw new Error("INPI_FEE_SOURCE_NOT_OFFICIAL");
  if (now - Date.parse(p.sourceRetrievedAt) > 24 * 60 * 60 * 1000) throw new Error("INPI_FEE_SOURCE_STALE");
  if (!Number.isInteger(p.officialAmountCents) || p.officialAmountCents <= 0) throw new Error("INPI_FEE_INVALID");
}

export function requireExplicitConfirmation(kind: "GRU" | "FILING", confirmed: boolean, snapshotSha256: string) {
  if (!confirmed || !/^[a-f0-9]{64}$/.test(snapshotSha256)) throw new Error(`${kind}_CONFIRMATION_REQUIRED`);
}
