import { config } from "./config.js";
import {
  findOrCreateAsaasCustomer,
  findOrCreateMonthlyPixSubscription,
  findOrCreatePixCharge,
  getPixQrCode
} from "./asaas.js";
import { db, getPrimaryWhatsApp, queueEncryptedReply } from "./db.js";
import { getOnboardingPII } from "./profile.js";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDate(date);
}

function nextMonth() {
  const date = new Date();
  const day = date.getDate();
  date.setMonth(date.getMonth() + 1);
  if (date.getDate() < day) date.setDate(0);
  return isoDate(date);
}

function money(cents: number) {
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

async function getOpenThread(workspaceId: string) {
  const { data, error } = await db.from("conversation_threads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .limit(1)
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function createSetupCharge(workspaceId: string, subscriptionId: string) {
  const [{ data: subscription, error: subscriptionError }, pii] = await Promise.all([
    db.from("subscriptions")
      .select("id,holder_id,plan_code,status,asaas_customer_id,setup_payment_id")
      .eq("id", subscriptionId)
      .eq("workspace_id", workspaceId)
      .single(),
    getOnboardingPII(workspaceId)
  ]);

  if (subscriptionError) throw subscriptionError;

  const { data: plan, error: planError } = await db.from("plans")
    .select("code,name,setup_fee_cents,monthly_fee_cents")
    .eq("code", subscription.plan_code)
    .single();

  if (planError) throw planError;

  if (!pii.holder_name || !pii.cpf_cnpj || !pii.email) {
    throw new Error("BILLING_PROFILE_INCOMPLETE");
  }

  const mobilePhone = (await getPrimaryWhatsApp(workspaceId)).replace(/\D/g, "");

  const customer = subscription.asaas_customer_id
    ? { id: subscription.asaas_customer_id }
    : await findOrCreateAsaasCustomer({
        name: pii.holder_name,
        cpfCnpj: pii.cpf_cnpj,
        email: pii.email,
        mobilePhone,
        externalReference: "registreai:workspace:" + workspaceId
      });

  if (!subscription.asaas_customer_id) {
    const update = await db.from("subscriptions")
      .update({ asaas_customer_id: customer.id })
      .eq("id", subscriptionId);
    if (update.error) throw update.error;
  }

  const externalReference = "registreai:setup:" + subscriptionId;

  const charge = await findOrCreatePixCharge({
    customer: customer.id,
    value: plan.setup_fee_cents / 100,
    dueDate: tomorrow(),
    description: "Adesão RegistreAi - Plano " + plan.name,
    externalReference
  });

  const qr = await getPixQrCode(charge.id);

  const paymentUpsert = await db.from("payments").upsert({
    workspace_id: workspaceId,
    subscription_id: subscriptionId,
    payment_type: "SETUP",
    provider: "ASAAS",
    external_id: charge.id,
    amount_cents: plan.setup_fee_cents,
    due_date: charge.dueDate ?? tomorrow(),
    status: "pending",
    pix_copy_paste: qr.payload ?? null,
    pix_qr_payload: qr.encodedImage ?? null,
    raw_status: charge.status ?? null
  }, { onConflict: "provider,external_id" });

  if (paymentUpsert.error) throw paymentUpsert.error;

  const subUpdate = await db.from("subscriptions")
    .update({ setup_payment_id: charge.id })
    .eq("id", subscriptionId);

  if (subUpdate.error) throw subUpdate.error;

  await db.from("onboarding_profiles")
    .update({ onboarding_status: "ready_for_payment" })
    .eq("workspace_id", workspaceId);

  const threadId = await getOpenThread(workspaceId);
  const pix = qr.payload ?? "Abra o link da cobrança para pagar.";

  await queueEncryptedReply({
    workspaceId,
    threadId,
    body:
      "Contrato aceito ✅\n\nSua adesão do Plano " + plan.name + " é " + money(plan.setup_fee_cents) + ".\n\nPIX copia e cola:\n" +
      pix +
      "\n\nAssim que o Asaas confirmar o pagamento, eu continuo automaticamente com a análise da sua marca.",
    idempotencyKey: "setup-pix:" + charge.id
  });

  return {
    paymentId: charge.id,
    subscriptionId,
    customerId: customer.id
  };
}

export async function createMonthlySubscription(workspaceId: string, subscriptionId: string) {
  const { data: subscription, error: subscriptionError } = await db.from("subscriptions")
    .select("id,plan_code,asaas_customer_id,asaas_subscription_id")
    .eq("id", subscriptionId)
    .eq("workspace_id", workspaceId)
    .single();

  if (subscriptionError) throw subscriptionError;

  const { data: plan, error: planError } = await db.from("plans")
    .select("name,monthly_fee_cents")
    .eq("code", subscription.plan_code)
    .single();

  if (planError) throw planError;
  if (!subscription.asaas_customer_id) throw new Error("ASAAS_CUSTOMER_MISSING");

  if (subscription.asaas_subscription_id) return { id: subscription.asaas_subscription_id };

  const externalReference = "registreai:monthly:" + subscriptionId;
  const asaasSubscription = await findOrCreateMonthlyPixSubscription({
    customer: subscription.asaas_customer_id,
    value: plan.monthly_fee_cents / 100,
    nextDueDate: nextMonth(),
    description: "Mensalidade RegistreAi - Plano " + plan.name,
    externalReference
  });

  const update = await db.from("subscriptions")
    .update({ asaas_subscription_id: asaasSubscription.id })
    .eq("id", subscriptionId);

  if (update.error) throw update.error;

  return asaasSubscription;
}
