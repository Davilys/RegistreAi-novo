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

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
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

function redacted(body: Record<string, unknown>) {
  const payment = (body.payment ?? {}) as Record<string, unknown>;
  const subscription = (body.subscription ?? {}) as Record<string, unknown>;
  return {
    event: typeof body.event === "string" ? body.event : "UNKNOWN",
    id: typeof body.id === "string" ? body.id : null,
    payment: {
      id: typeof payment.id === "string" ? payment.id : null,
      status: typeof payment.status === "string" ? payment.status : null,
      billingType: typeof payment.billingType === "string" ? payment.billingType : null,
      customer: typeof payment.customer === "string" ? payment.customer : null,
      subscription: typeof payment.subscription === "string" ? payment.subscription : null,
    },
    subscription: {
      id: typeof subscription.id === "string" ? subscription.id : null,
      status: typeof subscription.status === "string" ? subscription.status : null,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("ASAAS_WEBHOOK_AUTH_TOKEN");
  const payloadKey = Deno.env.get("WEBHOOK_PAYLOAD_KEY_B64");
  const supplied = req.headers.get("asaas-access-token") ?? "";

  if (!expected || !payloadKey) return json({ error: "integration_not_configured" }, 503);
  if (!safeEqual(supplied, expected)) return json({ error: "unauthorized" }, 401);

  const raw = await req.text();
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }

  const eventType = typeof body.event === "string" ? body.event : "UNKNOWN";
  const bodyHash = await sha256Hex(raw);
  const externalEventId =
    typeof body.id === "string" && body.id ? body.id : `sha256:${bodyHash}`;

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ error: "server_misconfigured" }, 503);

  const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "ASAAS")
    .eq("external_event_id", externalEventId)
    .maybeSingle();

  if (existing) return json({ received: true, duplicate: true });

  const { data: eventRow, error: eventError } = await supabase
    .from("webhook_events")
    .insert({
      provider: "ASAAS",
      external_event_id: externalEventId,
      event_type: eventType,
      signature_valid: true,
      processing_status: "received",
      payload: redacted(body),
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
