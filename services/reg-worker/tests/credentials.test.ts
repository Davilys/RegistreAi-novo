import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import {
  MemoryCredentialStore, createCredentialLink, submitCredential, useCredential, needsCredential,
  credentialSummary, assertNoSecret, asksPasswordInChat, purgeExpiredCredentials, retentionFromCaseClose,
  deleteCredential, LINK_TTL_MS
} from "../src/credentials.js";
import { assertNoEinpiCredential } from "../src/onboarding.js";

const key = randomBytes(32).toString("base64");
const now = new Date("2026-09-23T12:00:00Z");
const W = "ws-1";
const PASSWORD = "Tr0caSenha9";
const tokenOf = (url: string) => url.split("/seguro/")[1];

async function stored() {
  const s = new MemoryCredentialStore();
  const { url } = await createCredentialLink(s, { workspaceId: W, purpose: "EINPI_EXISTING", siteUrl: "https://registreai.com.br", now });
  const r = await submitCredential(s, { token: tokenOf(url), login: "maria2026", password: PASSWORD, keyB64: key, now });
  assert.deepEqual(r, { ok: true });
  return s;
}

test("secure link: one-time, expires in 15min, token stored only as hash", async () => {
  const s = new MemoryCredentialStore();
  const { url, expiresAt } = await createCredentialLink(s, { workspaceId: W, purpose: "EINPI_NEW_REGISTRATION", siteUrl: "https://registreai.com.br/", now });
  assert.match(url, /^https:\/\/registreai\.com\.br\/seguro\/[A-Za-z0-9_-]{43}$/);
  assert.equal(expiresAt.getTime() - now.getTime(), LINK_TTL_MS);
  assert.ok(![...s.tokens.keys()].includes(tokenOf(url)));
  const late = new Date(now.getTime() + LINK_TTL_MS + 1);
  assert.deepEqual(await submitCredential(s, { token: tokenOf(url), login: "maria2026", password: PASSWORD, keyB64: key, now: late }), { ok: false, code: "expired" });
  assert.deepEqual(await submitCredential(s, { token: tokenOf(url), login: "maria2026", password: PASSWORD, keyB64: key, now }), { ok: true });
  assert.deepEqual(await submitCredential(s, { token: tokenOf(url), login: "maria2026", password: PASSWORD, keyB64: key, now }), { ok: false, code: "used" });
  assert.equal((await submitCredential(new MemoryCredentialStore(), { token: "x", login: "maria2026", password: PASSWORD, keyB64: key, now })).ok, false);
  assert.deepEqual(await submitCredential(s, { token: "forged", login: "maria2026", password: PASSWORD, keyB64: key, now }), { ok: false, code: "invalid_link" });
});

test("password is never stored in plaintext and never shown (admin summary, chat, logs)", async () => {
  const s = await stored();
  const row = JSON.stringify([...s.creds.values()]);
  assert.ok(!row.includes(PASSWORD), "stored row must hold ciphertext only");
  assert.ok(!JSON.stringify(s.events).includes(PASSWORD), "audit log must not contain the password");
  const summary = credentialSummary(await s.getCredential(W));
  assert.equal(summary, "credencial cadastrada em 23/09");
  assert.ok(!summary.includes(PASSWORD));
  assert.throws(() => assertNoSecret("Sua senha é " + PASSWORD, [PASSWORD]), /SECRET_LEAK_BLOCKED/);
  assert.doesNotThrow(() => assertNoSecret(summary, [PASSWORD]));
});

test("decrypt only inside the official-act step, audited, errors redacted", async () => {
  const s = await stored();
  const got = await useCredential(s, { workspaceId: W, actor: "official_act", reason: "gru", keyB64: key, now }, async (l, p) => l + ":" + p.length);
  assert.equal(got, "maria2026:" + PASSWORD.length);
  await assert.rejects(
    useCredential(s, { workspaceId: W, actor: "official_act", reason: "gru", keyB64: key, now }, async (_l, p) => { throw new Error("login failed for " + p); }),
    (e: Error) => !e.message.includes(PASSWORD) && e.message.includes("[REDACTED]")
  );
  assert.deepEqual(s.events.map((e) => e.action), ["store", "decrypt", "decrypt"]);
});

test("never re-asks unless INPI rejected the stored login", async () => {
  const s = await stored();
  assert.equal(await needsCredential(s, W), false);
  const c = (await s.getCredential(W))!;
  await s.saveCredential({ ...c, lastValidationOk: false });
  assert.equal(await needsCredential(s, W), true);
  assert.equal(await needsCredential(new MemoryCredentialStore(), W), true);
});

test("retention: case close + 30 days purge, and client delete", async () => {
  const s = await stored();
  const c = (await s.getCredential(W))!;
  const closed = new Date("2026-10-01T00:00:00Z");
  await s.saveCredential({ ...c, expiresAt: retentionFromCaseClose(closed) });
  assert.equal(await purgeExpiredCredentials(s, new Date("2026-10-30T00:00:00Z")), 0);
  assert.equal(await purgeExpiredCredentials(s, new Date("2026-10-31T00:00:01Z")), 1);
  assert.equal(await s.getCredential(W), null);
  const s2 = await stored();
  await deleteCredential(s2, W, "customer", now);
  assert.equal(await s2.getCredential(W), null);
});

test("chat never asks for the password and chat payloads still reject it", () => {
  assert.equal(asksPasswordInChat("Me manda sua senha do INPI aqui"), true);
  assert.equal(asksPasswordInChat("Qual é a senha do e-INPI?"), true);
  assert.equal(asksPasswordInChat("Te mandei um link seguro pra cadastrar login e senha"), false);
  assert.throws(() => assertNoEinpiCredential({ applicant: { senha: "x" } }), /EINPI_CREDENTIAL_FORBIDDEN/);
});
