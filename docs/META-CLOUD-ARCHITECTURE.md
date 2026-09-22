# Meta Cloud API architecture
Status: code prepared, not connected, deployed, or homologated.

Flow: WhatsApp -> Meta webhook -> raw-body signature verification -> encrypted event store -> durable queue -> tenant resolver -> scoped memory/agent -> 24h/template policy -> Meta Messages API -> status webhook.

Security rules: scope every customer by `(phone_number_id, wa_id)`; deduplicate inbound by wamid and statuses by `(phone_number_id, wamid, status)`; download media immediately with bearer auth, never persist transient URLs, verify SHA-256, store privately encrypted; pass only one workspace to the model; block automation on opt-out/handoff; retry only 429/transient 5xx, stop on policy/auth errors; keep secrets out of Git/frontend.

Components: `supabase/functions/whatsapp-webhook` challenge/signature/encrypted persistence; `services/reg-worker/src/meta` normalization, media, outbound, policy and harness; prepared migration in `supabase/migrations`, not applied.

Real-account gates: assisted Meta passkey for read-only inspection, then separate approval for test-number callback/subscription and messages. Never touch +55 11 92068-1100 during homologation.

Official references:
https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components/
https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages/
https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media/
