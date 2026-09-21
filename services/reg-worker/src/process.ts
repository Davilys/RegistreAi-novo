import { db } from "./db.js";
import { getOnboardingPII } from "./profile.js";

async function transition(processId: string, expectedVersion: number, toStatus: string, reason: string) {
  const { data, error } = await db.rpc("transition_process", {
    p_process_id: processId,
    p_expected_version: expectedVersion,
    p_to_status: toStatus,
    p_actor_type: "system",
    p_actor_ref: "reg-worker",
    p_reason: reason
  });

  if (error) throw error;
  return data;
}

export async function ensureInitialProcess(workspaceId: string, subscriptionId: string) {
  const [{ data: subscription, error: subscriptionError }, pii] = await Promise.all([
    db.from("subscriptions")
      .select("id,workspace_id,holder_id,plan_code,status")
      .eq("id", subscriptionId)
      .eq("workspace_id", workspaceId)
      .single(),
    getOnboardingPII(workspaceId)
  ]);

  if (subscriptionError) throw subscriptionError;
  if (!pii.mark_name) throw new Error("MARK_NAME_MISSING_AFTER_PAYMENT");

  const { data: existingTrademark, error: trademarkLookupError } = await db
    .from("trademarks")
    .select("id,status")
    .eq("workspace_id", workspaceId)
    .eq("holder_id", subscription.holder_id)
    .ilike("name", pii.mark_name)
    .maybeSingle();

  if (trademarkLookupError) throw trademarkLookupError;

  let trademarkId = existingTrademark?.id ?? null;

  if (!trademarkId) {
    const insertedTrademark = await db.from("trademarks").insert({
      workspace_id: workspaceId,
      holder_id: subscription.holder_id,
      name: pii.mark_name,
      normalized_name: pii.mark_name,
      presentation_type: "nominativa",
      activity_description: pii.activity ?? null,
      status: "draft"
    }).select("id").single();

    if (insertedTrademark.error) throw insertedTrademark.error;
    trademarkId = insertedTrademark.data.id;
  }

  const { data: existingProcess, error: processLookupError } = await db
    .from("processes")
    .select("id,status,version")
    .eq("workspace_id", workspaceId)
    .eq("subscription_id", subscriptionId)
    .eq("trademark_id", trademarkId)
    .maybeSingle();

  if (processLookupError) throw processLookupError;

  if (existingProcess) return existingProcess;

  const insertedProcess = await db.from("processes").insert({
    workspace_id: workspaceId,
    subscription_id: subscriptionId,
    trademark_id: trademarkId,
    holder_id: subscription.holder_id,
    status: "intake"
  }).select("id,status,version").single();

  if (insertedProcess.error) throw insertedProcess.error;

  let process = insertedProcess.data;
  process = await transition(process.id, process.version, "contracting", "contract_accepted");
  process = await transition(process.id, process.version, "awaiting_setup_payment", "setup_charge_created");
  process = await transition(process.id, process.version, "viability", "setup_payment_confirmed");

  await db.from("trademarks").update({ status: "viability" }).eq("id", trademarkId);

  return process;
}
