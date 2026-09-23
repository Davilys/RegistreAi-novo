import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

// Link seguro da credencial e-INPI (modo A). A senha chega só aqui, é cifrada na hora
// (AES-256-GCM, EINPI_CREDENTIAL_KEY_B64) e nunca é devolvida, logada nem exibida.
const ALLOWED_ORIGINS = new Set(["https://registreai.com.br", "https://www.registreai.com.br"]);
const enc = new TextEncoder();

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://registreai.com.br";
  return {
    "access-control-allow-origin": o,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "origin",
  };
}
const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors(origin) },
  });

function b64(bytes: Uint8Array) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function fromB64(v: string) { return Uint8Array.from(atob(v), (c) => c.charCodeAt(0)); }
const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256Hex(v: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(v))));
}
async function encrypt(plain: string, keyB64: string) {
  const raw = fromB64(keyB64);
  if (raw.length !== 32) throw new Error("bad_key");
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain)));
  return { ciphertextHex: "\\x" + hex(ct), nonceHex: "\\x" + hex(iv) }; // ct already includes the 16-byte tag
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ ok: false, code: "method" }, 405, origin);

  const keyB64 = Deno.env.get("EINPI_CREDENTIAL_KEY_B64");
  if (!keyB64) return json({ ok: false, code: "unavailable" }, 503, origin); // fail closed

  let body: { token?: string; login?: string; password?: string };
  try { body = await req.json(); } catch { return json({ ok: false, code: "bad_request" }, 400, origin); }
  const token = String(body.token ?? ""), login = String(body.login ?? "").trim(), password = String(body.password ?? "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return json({ ok: false, code: "invalid_link" }, 400, origin);
  if (!/^([0-9]{11}|[0-9]{14})$/.test(login)) return json({ ok: false, code: "invalid_login" }, 400, origin);
  if (!password || password.length > 64) return json({ ok: false, code: "invalid_password" }, 400, origin);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const tokenHash = await sha256Hex(token);
  const { data: t } = await db.from("credential_link_tokens").select("workspace_id,purpose,expires_at,used_at").eq("token_hash", tokenHash).maybeSingle();
  if (!t) return json({ ok: false, code: "invalid_link" }, 404, origin);
  if (t.used_at) return json({ ok: false, code: "used" }, 409, origin);
  if (new Date(t.expires_at).getTime() <= Date.now()) return json({ ok: false, code: "expired" }, 410, origin);

  const { data: claimed } = await db.from("credential_link_tokens").update({ used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash).is("used_at", null).select("token_hash");
  if ((claimed ?? []).length !== 1) return json({ ok: false, code: "used" }, 409, origin);

  const secret = await encrypt(password, keyB64);
  const { error } = await db.from("einpi_credentials").upsert({
    workspace_id: t.workspace_id, login, secret_ciphertext: secret.ciphertextHex, secret_nonce: secret.nonceHex,
    key_version: 1, stored_at: new Date().toISOString(), last_validated_at: null, last_validation_ok: null,
  }, { onConflict: "workspace_id" });
  if (error) return json({ ok: false, code: "unavailable" }, 503, origin);

  await db.from("credential_access_events").insert({ workspace_id: t.workspace_id, actor: "customer_secure_link", reason: t.purpose, action: "store" });
  await db.from("workflow_tasks").insert({
    workspace_id: t.workspace_id, task_type: "EINPI_CREDENTIAL_RECEIVED", owner_type: "SYSTEM", status: "pending",
    priority: 85, payload_redacted: { purpose: t.purpose }, idempotency_key: "einpi-cred:" + tokenHash,
  });
  return json({ ok: true }, 200, origin);
});
