import { createHash, randomBytes } from "node:crypto";
import { config } from "./config.js";
import { db, queueEncryptedReply } from "./db.js";
import { getOnboardingPII } from "./profile.js";

const CONTRACT_VERSION = "registreai-v1.0";

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function money(cents: number) {
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildContractHtml(input: {
  holderName: string;
  cpfCnpj: string;
  email: string;
  planCode: "PROTECAO" | "ILIMITADO";
  setupFeeCents: number;
  monthlyFeeCents: number;
}) {
  const unlimited = input.planCode === "ILIMITADO";
  const planName = unlimited ? "Ilimitado" : "Proteção";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Contrato RegistreAi — Plano ${planName}</title>
<style>
body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55}
h1,h2{letter-spacing:-.02em} .box{padding:18px;border:1px solid #ddd;border-radius:12px;background:#fafafa}
small{color:#666}
</style>
</head>
<body>
<h1>Contrato de Prestação de Serviços — RegistreAi</h1>
<p><strong>Versão:</strong> ${CONTRACT_VERSION}</p>
<div class="box">
<p><strong>Contratante:</strong> ${escapeHtml(input.holderName)}</p>
<p><strong>CPF/CNPJ:</strong> ${escapeHtml(input.cpfCnpj)}</p>
<p><strong>E-mail:</strong> ${escapeHtml(input.email)}</p>
<p><strong>Plano:</strong> ${planName}</p>
<p><strong>Adesão:</strong> ${money(input.setupFeeCents)}</p>
<p><strong>Mensalidade:</strong> ${money(input.monthlyFeeCents)}</p>
</div>

<h2>1. Objeto</h2>
<p>A RegistreAi presta serviços de apoio ao pedido e acompanhamento de registro de marca perante o INPI, com atendimento e automações conduzidos pela inteligência artificial Reg.</p>

<h2>2. Atendimento por inteligência artificial</h2>
<p>O contratante declara ciência de que a jornada é conduzida por inteligência artificial especializada. A Reg solicitará ao cliente somente os dados, documentos, confirmações e pagamentos necessários para cada etapa.</p>

<h2>3. Titularidade</h2>
<p>Os pedidos serão vinculados ao titular informado pelo contratante, observadas as regras do INPI e as informações fornecidas.</p>

<h2>4. Plano contratado</h2>
<p>O Plano ${planName} possui adesão de ${money(input.setupFeeCents)} e mensalidade de ${money(input.monthlyFeeCents)}.</p>
${unlimited ? "<p>No Plano Ilimitado, a quantidade de pedidos abrangidos pelos honorários é ilimitada durante a vigência do plano, mas todos os pedidos devem utilizar exatamente o mesmo CPF ou CNPJ titular vinculado à contratação. O plano não pode ser compartilhado, cedido, revendido ou utilizado para registros em nome de terceiros.</p>" : "<p>No Plano Proteção, a contratação se refere a uma marca por assinatura, conforme as condições deste instrumento.</p>"}

<h2>5. Taxas oficiais</h2>
<p>Taxas, retribuições e demais valores oficiais cobrados pelo INPI não estão incluídos na adesão ou mensalidade, salvo condição expressa em contrário, e serão apresentados ao contratante quando aplicáveis.</p>

<h2>6. Viabilidade e decisão do INPI</h2>
<p>A RegistreAi não promete deferimento. A análise é baseada em viabilidade e cenário técnico. A decisão final pertence ao INPI.</p>

<h2>7. Exigências, oposições e indeferimentos</h2>
<p>Quando houver movimentação que exija manifestação, a Reg analisará o evento, solicitará somente os documentos ou informações que dependam do contratante, controlará o prazo, preparará a medida cabível prevista no plano e acompanhará o protocolo e as movimentações posteriores.</p>

<h2>8. Garantia comercial</h2>
<p>Os planos incluem a garantia comercial descrita na oferta vigente: recursos administrativos previstos no plano e, em caso de indeferimento definitivo dentro das condições contratuais, nova tentativa de registro para o mesmo titular sem novos honorários da RegistreAi. Taxas oficiais continuam sendo de responsabilidade do contratante.</p>

<h2>9. Prazos dependentes do cliente</h2>
<p>Quando uma etapa depender de documento, informação, confirmação ou pagamento do contratante, a Reg enviará avisos. Se o item não for fornecido dentro do prazo legal aplicável, a Reg registrará o ocorrido e informará a impossibilidade de concluir o ato tempestivamente.</p>

<h2>10. Dados pessoais e segurança</h2>
<p>Os dados serão tratados para execução do serviço, segurança, cumprimento de obrigações e comunicação com o cliente, conforme Política de Privacidade e legislação aplicável.</p>

<h2>11. Aceite eletrônico</h2>
<p>O aceite poderá ocorrer pelo canal oficial da RegistreAi. Ao responder <strong>ACEITO</strong> após receber o link deste contrato, o contratante manifesta concordância com esta versão do documento. O sistema preservará data, canal, identificador da mensagem e hash do documento para auditoria.</p>

<p><small>Documento gerado automaticamente pela RegistreAi.</small></p>
</body>
</html>`;
}

export async function issueContract(workspaceId: string) {
  const [{ data: profile, error: profileError }, pii] = await Promise.all([
    db.from("onboarding_profiles").select("*").eq("workspace_id", workspaceId).single(),
    getOnboardingPII(workspaceId)
  ]);

  if (profileError) throw profileError;
  if (profile.onboarding_status !== "ready_for_contract") {
    throw new Error("ONBOARDING_NOT_READY_FOR_CONTRACT");
  }

  if (!pii.holder_name || !pii.cpf_cnpj || !pii.email || !profile.plan_code) {
    throw new Error("CONTRACT_DATA_INCOMPLETE");
  }

  const { data: plan, error: planError } = await db.from("plans")
    .select("*")
    .eq("code", profile.plan_code)
    .eq("active", true)
    .single();
  if (planError) throw planError;

  let { data: holder, error: holderError } = await db.from("holders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("document_hash", profile.holder_document_hash)
    .maybeSingle();

  if (holderError) throw holderError;

  if (!holder) {
    const inserted = await db.from("holders").insert({
      workspace_id: workspaceId,
      holder_type: profile.holder_type,
      legal_name: profile.name_masked || "Titular",
      document_hash: profile.holder_document_hash,
      document_masked: profile.holder_document_masked,
      registration_status: "verified",
      verified_at: new Date().toISOString()
    }).select("*").single();

    if (inserted.error) throw inserted.error;
    holder = inserted.data;
  }

  let { data: subscription, error: subscriptionError } = await db.from("subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("holder_id", holder.id)
    .eq("plan_code", profile.plan_code)
    .in("status", ["pending","active","past_due","paused"])
    .maybeSingle();

  if (subscriptionError) throw subscriptionError;

  if (!subscription) {
    const inserted = await db.from("subscriptions").insert({
      workspace_id: workspaceId,
      plan_code: profile.plan_code,
      holder_id: holder.id,
      status: "pending",
      terms_version: CONTRACT_VERSION,
      holder_locked: true
    }).select("*").single();

    if (inserted.error) throw inserted.error;
    subscription = inserted.data;
  }

  const existing = await db.from("contract_documents")
    .select("id,object_path,document_sha256,status")
    .eq("subscription_id", subscription.id)
    .eq("contract_version", CONTRACT_VERSION)
    .in("status", ["issued","accepted"])
    .maybeSingle();

  if (existing.error) throw existing.error;

  let contractId: string;
  let objectPath: string;

  if (existing.data) {
    contractId = existing.data.id;
    objectPath = existing.data.object_path;
  } else {
    const html = buildContractHtml({
      holderName: pii.holder_name,
      cpfCnpj: pii.cpf_cnpj,
      email: pii.email,
      planCode: profile.plan_code,
      setupFeeCents: plan.setup_fee_cents,
      monthlyFeeCents: plan.monthly_fee_cents
    });

    const documentHash = sha256(html);
    objectPath = "workspaces/" + workspaceId + "/contracts/" + subscription.id + "/" + CONTRACT_VERSION + ".html";

    const upload = await db.storage.from("registreai-private").upload(
      objectPath,
      Buffer.from(html, "utf8"),
      { contentType: "text/html; charset=utf-8", upsert: false }
    );

    if (upload.error && !String(upload.error.message).toLowerCase().includes("already exists")) {
      throw upload.error;
    }

    const insertedContract = await db.from("contract_documents").insert({
      workspace_id: workspaceId,
      subscription_id: subscription.id,
      contract_version: CONTRACT_VERSION,
      object_path: objectPath,
      document_sha256: documentHash,
      status: "issued"
    }).select("id").single();

    if (insertedContract.error) throw insertedContract.error;
    contractId = insertedContract.data.id;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);

  const tokenInsert = await db.from("contract_access_tokens").insert({
    contract_document_id: contractId,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (tokenInsert.error) throw tokenInsert.error;

  const { data: thread, error: threadError } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .single();

  if (threadError) throw threadError;

  const link = config.PUBLIC_SITE_URL.replace(/\/$/, "") + "/contrato/" + token;

  await queueEncryptedReply({
    workspaceId,
    threadId: thread.id,
    body:
      "Seu contrato está pronto. Leia aqui: " + link +
      "\n\nSe estiver de acordo, responda apenas *ACEITO*. Depois eu gero seu Pix de adesão.",
    idempotencyKey: "contract-issued:" + contractId
  });

  return { contractId, subscriptionId: subscription.id, link };
}

export async function tryAcceptContract(args: {
  workspaceId: string;
  providerMessageId: string;
  phrase: string;
}) {
  if (args.phrase.trim().toUpperCase() !== "ACEITO") return false;

  const { data: profile, error: profileError } = await db.from("onboarding_profiles")
    .select("onboarding_status")
    .eq("workspace_id", args.workspaceId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.onboarding_status !== "ready_for_contract") return false;

  const { data: contract, error: contractError } = await db.from("contract_documents")
    .select("id,subscription_id,contract_version,document_sha256,status")
    .eq("workspace_id", args.workspaceId)
    .eq("status", "issued")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contractError) throw contractError;
  if (!contract) return false;

  const now = new Date().toISOString();

  const accept = await db.from("contract_documents").update({
    status: "accepted",
    accepted_phrase: "ACEITO",
    accepted_at: now,
    acceptance_channel: "whatsapp",
    acceptance_evidence: {
      provider_message_id: args.providerMessageId,
      accepted_at: now,
      document_sha256: contract.document_sha256
    }
  }).eq("id", contract.id).eq("status", "issued");

  if (accept.error) throw accept.error;

  const subscriptionUpdate = await db.from("subscriptions").update({
    terms_version: contract.contract_version,
    terms_accepted_at: now
  }).eq("id", contract.subscription_id);

  if (subscriptionUpdate.error) throw subscriptionUpdate.error;

  await db.from("onboarding_profiles").update({
    onboarding_status: "ready_for_payment"
  }).eq("workspace_id", args.workspaceId);

  const task = await db.from("workflow_tasks").insert({
    workspace_id: args.workspaceId,
    task_type: "CREATE_ASAAS_CHARGE",
    owner_type: "SYSTEM",
    status: "pending",
    priority: 95,
    payload_redacted: { subscription_id: contract.subscription_id, trigger: "contract_accepted" },
    idempotency_key: "setup-charge:" + contract.subscription_id
  });

  if (task.error && task.error.code !== "23505") throw task.error;

  return true;
}

export { CONTRACT_VERSION };
