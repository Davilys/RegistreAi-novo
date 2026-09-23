import { db } from "./db.js";
import type { CredentialStore, LinkToken, StoredCredential } from "./credentials.js";

const b64ToBytea = (v: string) => "\\x" + Buffer.from(v, "base64").toString("hex");
const byteaToB64 = (v: string) => Buffer.from(v.replace(/^\\x/, ""), "hex").toString("base64");

type CredRow = {
  workspace_id: string; login: string; secret_ciphertext: string; secret_nonce: string; key_version: number;
  stored_at: string; last_validated_at: string | null; last_validation_ok: boolean | null; expires_at: string | null;
};

const toCred = (d: CredRow): StoredCredential => ({
  workspaceId: d.workspace_id, login: d.login, ciphertextB64: byteaToB64(d.secret_ciphertext),
  nonceB64: byteaToB64(d.secret_nonce), keyVersion: d.key_version, storedAt: new Date(d.stored_at),
  lastValidatedAt: d.last_validated_at ? new Date(d.last_validated_at) : null,
  lastValidationOk: d.last_validation_ok, expiresAt: d.expires_at ? new Date(d.expires_at) : null
});

export const supabaseCredentialStore: CredentialStore = {
  async saveToken(t) {
    const { error } = await db.from("credential_link_tokens").insert({
      token_hash: t.tokenHash, workspace_id: t.workspaceId, purpose: t.purpose,
      expires_at: t.expiresAt.toISOString(), used_at: null
    });
    if (error) throw error;
  },
  async getToken(h): Promise<LinkToken | null> {
    const { data, error } = await db.from("credential_link_tokens").select("*").eq("token_hash", h).maybeSingle();
    if (error) throw error;
    return data ? { tokenHash: data.token_hash, workspaceId: data.workspace_id, purpose: data.purpose,
      expiresAt: new Date(data.expires_at), usedAt: data.used_at ? new Date(data.used_at) : null } : null;
  },
  async markTokenUsed(h, at) {
    const { data, error } = await db.from("credential_link_tokens").update({ used_at: at.toISOString() })
      .eq("token_hash", h).is("used_at", null).select("token_hash");
    if (error) throw error;
    return (data ?? []).length === 1;
  },
  async saveCredential(c) {
    const { error } = await db.from("einpi_credentials").upsert({
      workspace_id: c.workspaceId, login: c.login, secret_ciphertext: b64ToBytea(c.ciphertextB64),
      secret_nonce: b64ToBytea(c.nonceB64), key_version: c.keyVersion, stored_at: c.storedAt.toISOString(),
      last_validated_at: c.lastValidatedAt?.toISOString() ?? null, last_validation_ok: c.lastValidationOk,
      expires_at: c.expiresAt?.toISOString() ?? null
    }, { onConflict: "workspace_id" });
    if (error) throw error;
  },
  async getCredential(w) {
    const { data, error } = await db.from("einpi_credentials").select("*").eq("workspace_id", w).maybeSingle();
    if (error) throw error;
    return data ? toCred(data as CredRow) : null;
  },
  async deleteCredential(w) {
    const { error } = await db.from("einpi_credentials").delete().eq("workspace_id", w);
    if (error) throw error;
  },
  async listExpired(now) {
    const { data, error } = await db.from("einpi_credentials").select("workspace_id").lte("expires_at", now.toISOString());
    if (error) throw error;
    return (data ?? []).map((r) => r.workspace_id as string);
  },
  async logAccess(e) {
    const { error } = await db.from("credential_access_events").insert({
      workspace_id: e.workspaceId, actor: e.actor, reason: e.reason, action: e.action, occurred_at: e.at.toISOString()
    });
    if (error) throw error;
  }
};
