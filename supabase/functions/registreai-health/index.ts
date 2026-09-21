import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req: Request) => {
  return new Response(JSON.stringify({
    ok: true,
    service: "registreai-core",
    environment: "development",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
});
