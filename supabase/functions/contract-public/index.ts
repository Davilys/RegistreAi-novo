import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const encoder = new TextEncoder();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer"
    }
  });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!/^[a-f0-9]{64}$/i.test(token)) return json({ error: "invalid_token" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return json({ error: "server_misconfigured" }, 503);

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const tokenHash = await sha256Hex(token);

  const { data: access, error: accessError } = await supabase
    .from("contract_access_tokens")
    .select("id,contract_document_id,expires_at,revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (accessError) return json({ error: "lookup_failed" }, 500);
  if (!access || access.revoked_at) return json({ error: "not_found" }, 404);
  if (new Date(access.expires_at).getTime() <= Date.now()) return json({ error: "expired" }, 410);

  const { data: contract, error: contractError } = await supabase
    .from("contract_documents")
    .select("id,contract_version,object_path,document_sha256,status,accepted_at")
    .eq("id", access.contract_document_id)
    .single();

  if (contractError || !contract) return json({ error: "contract_not_found" }, 404);

  const { data: file, error: fileError } = await supabase.storage
    .from("registreai-private")
    .download(contract.object_path);

  if (fileError || !file) return json({ error: "document_unavailable" }, 500);

  const html = await file.text();

  await supabase
    .from("contract_access_tokens")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", access.id);

  return json({
    version: contract.contract_version,
    sha256: contract.document_sha256,
    status: contract.status,
    accepted_at: contract.accepted_at,
    html
  });
});
