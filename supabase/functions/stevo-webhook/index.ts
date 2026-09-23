import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const enc = new TextEncoder();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function safeEqual(a: string, b: string) {
  const aa = enc.encode(a), bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function b64(bytes: Uint8Array) {
  let out = "";
  for (const byte of bytes) out += String.fromCharCode(byte);
  return btoa(out);
}

function fromB64(value: string) {
  const raw = atob(value);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function hmacHex(secret: string, raw: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(raw));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(raw: string) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(raw));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function encrypt(raw: string, keyB64: string) {
  const keyBytes = fromB64(keyB64);
  if (keyBytes.length !== 32) throw new Error("WEBHOOK_PAYLOAD_KEY_B64 must decode to 32 bytes");
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, enc.encode(raw));
  return { ciphertext: b64(new Uint8Array(ciphertext)), nonceB64: b64(nonce) };
}

async function senderHash(secret: string, value: string) {
  return await hmacHex(secret, value);
}

type Obj = Record<string, unknown>;

// Webhook de entrada da Stevo (canal alternativo à API oficial da Meta).
// Aceita os 2 formatos provados na WebMarcas: data.messages[] e data.key + data.message.
function items(body: Obj): Obj[] {
  const data = (body.data ?? {}) as Obj;
  if (Array.isArray(data.messages)) return data.messages as Obj[];
  if (data.key) return [data];
  return [];
}

async function redacted(body: Obj, identityKey: string) {
  const messageIds: string[] = [];
  const messageTypes: string[] = [];
  const senderHashes: string[] = [];
  let fromMeCount = 0;
  for (const m of items(body)) {
    const key = (m.key ?? {}) as Obj;
    if (key.fromMe === true) { fromMeCount++; continue; }
    if (typeof key.id === "string") messageIds.push(key.id);
    const message = (m.message ?? {}) as Obj;
    const t = Object.keys(message)[0];
    if (t) messageTypes.push(t);
    const jid = typeof key.remoteJid === "string" ? key.remoteJid : "";
    const digits = jid.split("@")[0]?.replace(/\D/g, "") ?? "";
    if (digits) senderHashes.push(await hmacHex(identityKey, digits));
  }
  return {
    object: "stevo",
    event: typeof body.event === "string" ? body.event : null,
    message_ids: [...new Set(messageIds)],
    message_types: [...new Set(messageTypes)],
    sender_hashes: [...new Set(senderHashes)],
    from_me_ignored: fromMeCount,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("STEVO_WEBHOOK_SECRET");
  const payloadKey = Deno.env.get("WEBHOOK_PAYLOAD_KEY_B64");
  const identityKey = Deno.env.get("IDENTITY_HASH_KEY");
  if (!secret || !payloadKey || !identityKey) return json({ error: "integration_not_configured" }, 503);

  const supplied = new URL(req.url).searchParams.get("token") ?? "";
  if (!safeEqual(supplied, secret)) return json({ error: "unauthorized" }, 401);

  const raw = await req.text();
  let body: Obj;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }

  const safePayload = await redacted(body, identityKey);
  // Só mensagens do cliente viram evento; ecos das nossas mensagens (fromMe) e recibos são descartados.
  if (!safePayload.message_ids.length) return json({ received: true, ignored: true });

  const bodyHash = await sha256Hex(raw);
  const externalEventId = "stevo:" + [...safePayload.message_ids].sort().join(",");

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "server_misconfigured" }, 503);
  const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "WHATSAPP_STEVO")
    .eq("external_event_id", externalEventId)
    .maybeSingle();
  if (existing) return json({ received: true, duplicate: true });

  const { data: eventRow, error: eventError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "WHATSAPP_STEVO",
      external_event_id: externalEventId,
      event_type: "messages",
      signature_valid: true,
      processing_status: "received",
      payload: safePayload,
    })
    .select("id")
    .single();
  if (eventError || !eventRow) return json({ error: "persist_failed" }, 500);

  try {
    const secured = await encrypt(raw, payloadKey);
    const { error } = await supabase.from("webhook_payloads").insert({
      webhook_event_id: eventRow.id,
      ciphertext: secured.ciphertext,
      nonce_b64: secured.nonceB64,
      algorithm: "AES-256-GCM",
      key_version: 1,
      sha256_hex: bodyHash,
    });
    if (error) throw error;
  } catch {
    await supabase.from("webhook_events").delete().eq("id", eventRow.id);
    return json({ error: "secure_persist_failed" }, 500);
  }

  return json({ received: true });
});
