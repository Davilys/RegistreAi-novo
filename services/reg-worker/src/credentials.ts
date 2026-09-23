// e-INPI credential custody (mode A, owner decision 23/09/2026).
// Credentials arrive ONLY through the one-time secure link (never chat), are encrypted with a
// dedicated key (EINPI_CREDENTIAL_KEY_B64, never the PII key), are never displayed anywhere
// (chat, /admin, logs) and are decrypted only in memory by the official-act step.
import { createHash, randomBytes } from "node:crypto";
import { decryptText, encryptText } from "./crypto.js";

export const LINK_TTL_MS = 15 * 60_000;
export const RETENTION_AFTER_CLOSE_MS = 30 * 24 * 60 * 60_000;

export type CredentialPurpose = "EINPI_NEW_REGISTRATION" | "EINPI_EXISTING" | "EINPI_RECOVERY";

export type LinkToken = {
  tokenHash: string;
  workspaceId: string;
  purpose: CredentialPurpose;
  expiresAt: Date;
  usedAt: Date | null;
};

export type StoredCredential = {
  workspaceId: string;
  login: string;              // e-INPI login (CPF/CNPJ digits); not secret
  ciphertextB64: string;
  nonceB64: string;
  keyVersion: number;
  storedAt: Date;
  lastValidatedAt: Date | null;
  lastValidationOk: boolean | null;
  expiresAt: Date | null;      // set to case close + 30 days
};

export type AccessEvent = { workspaceId: string; actor: string; reason: string; at: Date; action: "store" | "decrypt" | "delete" | "purge" };

export interface CredentialStore {
  saveToken(t: LinkToken): Promise<void>;
  getToken(tokenHash: string): Promise<LinkToken | null>;
  markTokenUsed(tokenHash: string, at: Date): Promise<boolean>; // false if already used (atomic)
  saveCredential(c: StoredCredential): Promise<void>;
  getCredential(workspaceId: string): Promise<StoredCredential | null>;
  deleteCredential(workspaceId: string): Promise<void>;
  listExpired(now: Date): Promise<string[]>;
  logAccess(e: AccessEvent): Promise<void>;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createCredentialLink(
  store: CredentialStore,
  args: { workspaceId: string; purpose: CredentialPurpose; siteUrl: string; now: Date }
): Promise<{ url: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(args.now.getTime() + LINK_TTL_MS);
  await store.saveToken({ tokenHash: hashToken(token), workspaceId: args.workspaceId, purpose: args.purpose, expiresAt, usedAt: null });
  return { url: args.siteUrl.replace(/\/$/, "") + "/seguro/" + token, expiresAt };
}

export function validLogin(login: string): boolean {
  const digits = login.replace(/\D/g, "");
  return (digits.length === 11 || digits.length === 14) && digits === login.trim();
}

export async function submitCredential(
  store: CredentialStore,
  args: { token: string; login: string; password: string; keyB64: string; now: Date }
): Promise<{ ok: true } | { ok: false; code: "invalid_link" | "expired" | "used" | "invalid_login" | "invalid_password" }> {
  const t = await store.getToken(hashToken(args.token));
  if (!t) return { ok: false, code: "invalid_link" };
  if (t.usedAt) return { ok: false, code: "used" };
  if (t.expiresAt.getTime() <= args.now.getTime()) return { ok: false, code: "expired" };
  if (!validLogin(args.login)) return { ok: false, code: "invalid_login" };
  if (!args.password || args.password.length > 64) return { ok: false, code: "invalid_password" };
  if (!(await store.markTokenUsed(t.tokenHash, args.now))) return { ok: false, code: "used" };

  const enc = encryptText(args.password, args.keyB64);
  await store.saveCredential({
    workspaceId: t.workspaceId, login: args.login.trim(), ciphertextB64: enc.ciphertextB64, nonceB64: enc.nonceB64,
    keyVersion: 1, storedAt: args.now, lastValidatedAt: null, lastValidationOk: null, expiresAt: null
  });
  await store.logAccess({ workspaceId: t.workspaceId, actor: "customer_secure_link", reason: t.purpose, at: args.now, action: "store" });
  return { ok: true };
}

/** Only the official-act step may call this. The secret stays in memory of the caller. */
export async function useCredential<T>(
  store: CredentialStore,
  args: { workspaceId: string; actor: string; reason: string; keyB64: string; now: Date },
  fn: (login: string, password: string) => Promise<T>
): Promise<T> {
  const c = await store.getCredential(args.workspaceId);
  if (!c) throw new Error("EINPI_CREDENTIAL_MISSING");
  await store.logAccess({ workspaceId: args.workspaceId, actor: args.actor, reason: args.reason, at: args.now, action: "decrypt" });
  const password = decryptText(c.ciphertextB64, c.nonceB64, args.keyB64);
  try {
    return await fn(c.login, password);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(password ? msg.split(password).join("[REDACTED]") : msg);
  }
}

/** Never re-ask while a credential exists, unless INPI rejected the last login. */
export async function needsCredential(store: CredentialStore, workspaceId: string): Promise<boolean> {
  const c = await store.getCredential(workspaceId);
  return !c || c.lastValidationOk === false;
}

export async function deleteCredential(store: CredentialStore, workspaceId: string, actor: string, now: Date) {
  await store.deleteCredential(workspaceId);
  await store.logAccess({ workspaceId, actor, reason: "delete_request", at: now, action: "delete" });
}

export function retentionFromCaseClose(closedAt: Date): Date {
  return new Date(closedAt.getTime() + RETENTION_AFTER_CLOSE_MS);
}

export async function purgeExpiredCredentials(store: CredentialStore, now: Date): Promise<number> {
  const ids = await store.listExpired(now);
  for (const id of ids) {
    await store.deleteCredential(id);
    await store.logAccess({ workspaceId: id, actor: "retention_job", reason: "case_closed_plus_30d", at: now, action: "purge" });
  }
  return ids.length;
}

/** The only representation allowed outside the official-act step (admin, chat, logs). */
export function credentialSummary(c: StoredCredential | null): string {
  if (!c) return "sem credencial cadastrada";
  const d = c.storedAt;
  const dd = String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0");
  const v = c.lastValidationOk === null ? "" : c.lastValidationOk ? ", última validação OK" : ", última validação FALHOU";
  return "credencial cadastrada em " + dd + v;
}

/** Guard for anything leaving the system (WhatsApp body, admin payload, log line). */
export function assertNoSecret(text: string, secrets: string[]): void {
  for (const s of secrets) {
    if (s && s.length >= 4 && text.includes(s)) throw new Error("SECRET_LEAK_BLOCKED");
  }
}

const PASSWORD_ASK = /(me (manda|envia|passa|informa)|digite|mande|envie|informe|qual)[^.?!\n]{0,40}(senha|password)/i;
/** Chat replies must never ask for a password in the conversation. */
export function asksPasswordInChat(text: string): boolean {
  return PASSWORD_ASK.test(text) && !/link seguro/i.test(text);
}

export class MemoryCredentialStore implements CredentialStore {
  tokens = new Map<string, LinkToken>();
  creds = new Map<string, StoredCredential>();
  events: AccessEvent[] = [];
  async saveToken(t: LinkToken) { this.tokens.set(t.tokenHash, { ...t }); }
  async getToken(h: string) { const t = this.tokens.get(h); return t ? { ...t } : null; }
  async markTokenUsed(h: string, at: Date) { const t = this.tokens.get(h); if (!t || t.usedAt) return false; t.usedAt = at; return true; }
  async saveCredential(c: StoredCredential) { this.creds.set(c.workspaceId, { ...c }); }
  async getCredential(w: string) { const c = this.creds.get(w); return c ? { ...c } : null; }
  async deleteCredential(w: string) { this.creds.delete(w); }
  async listExpired(now: Date) { return [...this.creds.values()].filter((c) => c.expiresAt && c.expiresAt <= now).map((c) => c.workspaceId); }
  async logAccess(e: AccessEvent) { this.events.push(e); }
}
