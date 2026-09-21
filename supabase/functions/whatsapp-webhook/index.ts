import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const enc = new TextEncoder();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const text = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
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

async function redacted(body: Obj, identityKey: string) {
  const entries = Array.isArray(body.entry) ? body.entry : [];
  const messageIds: string[] = [];
  const statusIds: string[] = [];
  const messageTypes: string[] = [];
  const statuses: string[] = [];
  const senderHashes: string[] = [];
  const phoneNumberIds: string[] = [];

  for (const entryRaw of entries) {
    const entry = (entryRaw ?? {}) as Obj;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const changeRaw of changes) {
      const change = (changeRaw ?? {}) as Obj;
      const value = (change.value ?? {}) as Obj;
      const metadata = (value.metadata ?? {}) as Obj;

      if (typeof metadata.phone_number_id === "string") phoneNumberIds.push(metadata.phone_number_id);

      const messages = Array.isArray(value.messages) ? value.messages : [];
      for (const messageRaw of messages) {
        const message = (messageRaw ?? {}) as Obj;
        if (typeof message.id === "string") messageIds.push(message.id);
        if (typeof message.type === "string") messageTypes.push(message.type);
        if (typeof message.from === "string") senderHashes.push(await senderHash(identityKey, message.from));
      }

      const statusList = Array.isArray(value.statuses) ? value.statuses : [];
      for (const statusRaw of statusList) {
        const status = (statusRaw ?? {}) as Obj;
        if (typeof status.id === "string") statusIds.push(status.id);
        if (typeof status.status === "string") statuses.push(status.status);
        if (typeof status.recipient_id === "string") senderHashes.push(await senderHash(identityKey, status.recipient_id));
      }
    }
  }

  return {
    object: typeof body.object === "string" ? body.object : null,
    message_ids: [...new Set(messageIds)],
    status_ids: [...new Set(statusIds)],
    message_types: [...new Set(messageTypes)],
    statuses: [...new Set(statuses)],
    sender_hashes: [...new Set(senderHashes)],
    phone_number_ids: [...new Set(phoneNumberIds)],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const verify = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN");
    if (!verify) return text("integration_not_configured", 503);
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode") ?? "";
    const token = url.searchParams.get("hub.verify_token") ?? "";
    const challenge = url.searchParams.get("hub.challenge") ?? "";
    if (mode === "subscribe" && safeEqual(token, verify)) return text(challenge, 200);
    return text("forbidden", 403);
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const appSecret = Deno.env.get("META_APP_SECRET");
  const payloadKey = Deno.env.get("WEBHOOK_PAYLOAD_KEY_B64");
  const identityKey = Deno.env.get("IDENTITY_HASH_KEY");
  if (!appSecret || !payloadKey || !identityKey) return json({ error: "integration_not_configured" }, 503);

  const raw = await req.text();
  const received = req.headers.get("x-hub-signature-256") ?? "";
  const expected = `sha256=${await hmacHex(appSecret, raw)}`;
  if (!safeEqual(received, expected)) return json({ error: "invalid_signature" }, 403);

  let body: Obj;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }

  const bodyHash = await sha256Hex(raw);
  const safePayload = await redacted(body, identityKey);
  const eventType =
    safePayload.message_ids.length ? "messages" :
    safePayload.status_ids.length ? "statuses" :
    "whatsapp_event";

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "server_misconfigured" }, 503);

  const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const externalEventId = `sha256:${bodyHash}`;

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "WHATSAPP_META")
    .eq("external_event_id", externalEventId)
    .maybeSingle();

  if (existing) return json({ received: true, duplicate: true });

  const { data: eventRow, error: eventError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "WHATSAPP_META",
      external_event_id: externalEventId,
      event_type: eventType,
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
