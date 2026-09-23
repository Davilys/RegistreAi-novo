import test from "node:test";
import assert from "node:assert/strict";
import { ChannelRegistry, MetaCloudChannel, StevoChannel, StevoTransientError, normalizeStevoWebhook, parseProvider } from "../src/channels/index.js";
import { stevoEventsAsMessages } from "../src/channels/inbound.js";

const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test("registry: default provider and per-conversation provider", () => {
  const r = new ChannelRegistry({ defaultProvider: "stevo", meta: {}, stevo: {} });
  assert.equal(r.resolve().provider, "stevo");
  assert.equal(r.resolve(null).provider, "stevo");
  assert.equal(r.resolve("meta").provider, "meta");
  assert.equal(r.resolve("WHATSAPP_META").provider, "meta");
  assert.equal(r.resolve("garbage").provider, "stevo");
  assert.equal(parseProvider("WHATSAPP_STEVO", "meta"), "stevo");
});

test("24h window rule applies only to Meta", () => {
  assert.equal(new MetaCloudChannel({}).enforcesCustomerServiceWindow, true);
  assert.equal(new StevoChannel({}).enforcesCustomerServiceWindow, false);
});

test("meta channel keeps the Graph API contract", async () => {
  const calls: any[] = [];
  const ch = new MetaCloudChannel({ accessToken: "t", phoneNumberId: "pn", graphVersion: "v25.0" },
    (async (u: any, i: any) => { calls.push([u, i]); return ok({ messages: [{ id: "wamid.1" }] }); }) as any);
  assert.deepEqual(await ch.sendText("5511999990001", "oi"), { providerMessageId: "wamid.1" });
  assert.equal(calls[0][0], "https://graph.facebook.com/v25.0/pn/messages");
  assert.equal(JSON.parse(calls[0][1].body).text.body, "oi");
  await assert.rejects(new MetaCloudChannel({}).sendText("1", "x"), /META_NOT_CONFIGURED/);
});

test("stevo channel sends text via central API", async () => {
  const calls: any[] = [];
  const ch = new StevoChannel({ instance: "inst-1", apiKey: "k" },
    (async (u: any, i: any) => { calls.push([u, i]); return ok({ data: { id: "3EB0ABC" } }); }) as any);
  assert.deepEqual(await ch.sendText("+55 (11) 99999-0001", "Olá"), { providerMessageId: "3EB0ABC" });
  assert.equal(calls[0][0], "https://openapi.stevo.chat/v1/instances/inst-1/messages");
  assert.equal(calls[0][1].headers.authorization, "Bearer k");
  assert.deepEqual(JSON.parse(calls[0][1].body), { to: "5511999990001", text: "Olá" });
});

test("stevo: 502 is transient (retry, not rebind); 4xx is permanent; missing config fails closed", async () => {
  const s502 = new StevoChannel({ instance: "i", apiKey: "k" }, (async () => new Response("bad gateway", { status: 502 })) as any);
  await assert.rejects(s502.sendText("1", "x"), (e: unknown) => e instanceof StevoTransientError);
  const reset = new StevoChannel({ instance: "i", apiKey: "k" }, (async () => { throw new Error("ECONNRESET"); }) as any);
  await assert.rejects(reset.sendText("1", "x"), (e: unknown) => e instanceof StevoTransientError);
  const s400 = new StevoChannel({ instance: "i", apiKey: "k" }, (async () => ok({ error: "x" }, 400)) as any);
  await assert.rejects(s400.sendText("1", "x"), (e: unknown) => !(e instanceof StevoTransientError) && /STEVO_HTTP_400/.test(String(e)));
  await assert.rejects(new StevoChannel({}).sendText("1", "x"), /STEVO_NOT_CONFIGURED/);
});

test("stevo reaction goes to the SM v2 server with apikey", async () => {
  const calls: any[] = [];
  const ch = new StevoChannel({ instance: "i", apiKey: "k" }, (async (u: any, i: any) => {
    calls.push([u, i]);
    return calls.length === 1 ? ok({ data: { server_url: "https://sm.example/", token: "smtok" } }) : ok({});
  }) as any);
  await ch.react("MSG1", "5511999990001", "👂");
  assert.equal(calls[1][0], "https://sm.example/message/react");
  assert.equal(calls[1][1].headers.apikey, "smtok");
  assert.deepEqual(JSON.parse(calls[1][1].body), { id: "MSG1", number: "5511999990001", reaction: "👂", fromMe: false });
});

test("stevo inbound: both payload shapes, ignores fromMe and groups", () => {
  const list = normalizeStevoWebhook({ data: { messages: [
    { key: { id: "A1", remoteJid: "5511999990001@s.whatsapp.net", fromMe: false }, messageTimestamp: 1790000000, message: { conversation: "Quero registrar minha marca" } },
    { key: { id: "A2", remoteJid: "5511999990001@s.whatsapp.net", fromMe: true }, message: { conversation: "eco" } },
    { key: { id: "A3", remoteJid: "12036@g.us", fromMe: false }, message: { conversation: "grupo" } },
    { key: { id: "A4", remoteJid: "5511999990001@s.whatsapp.net", fromMe: false }, message: { audioMessage: {} } }
  ] } });
  assert.deepEqual(list.map((e: any) => [e.providerMessageId, e.messageType, e.text]), [["A1", "text", "Quero registrar minha marca"], ["A4", "audio", undefined]]);
  const single = normalizeStevoWebhook({ data: { key: { id: "B1", remoteJid: "5511988887777@s.whatsapp.net" }, message: { extendedTextMessage: { text: "oi" } } } });
  assert.equal(single.length, 1);
  const msgs = stevoEventsAsMessages(list);
  assert.deepEqual(msgs[0], { id: "A1", from: "5511999990001", timestamp: "1790000000", type: "text", text: { body: "Quero registrar minha marca" } });
  assert.equal(msgs[1]?.text, undefined);
});
