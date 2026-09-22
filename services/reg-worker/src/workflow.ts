import { createMonthlySubscription, createSetupCharge } from "./billing.js";
import { issueContract } from "./contract.js";
import { prepareInitialInpiFee } from "./fee.js";
import { db } from "./db.js";

type WorkflowTask = {
  id: string;
  workspace_id: string;
  process_id: string | null;
  legal_case_id: string | null;
  task_type: string;
  status: string;
  attempts: number;
  payload_redacted: Record<string, unknown>;
};

async function getTask(taskId: string): Promise<WorkflowTask> {
  const { data, error } = await db.from("workflow_tasks")
    .select("id,workspace_id,process_id,legal_case_id,task_type,status,attempts,payload_redacted")
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return data as WorkflowTask;
}

async function setTaskStatus(
  taskId: string,
  status: "pending" | "in_progress" | "waiting" | "completed" | "failed",
  fields: Record<string, unknown> = {}
) {
  const { error } = await db.from("workflow_tasks")
    .update({
      status,
      ...fields,
      completed_at: status === "completed" ? new Date().toISOString() : null
    })
    .eq("id", taskId);

  if (error) throw error;
}

async function resolveSubscriptionId(task: WorkflowTask): Promise<string> {
  const payloadId = task.payload_redacted?.subscription_id;
  if (typeof payloadId === "string" && payloadId) return payloadId;

  const { data, error } = await db.from("subscriptions")
    .select("id")
    .eq("workspace_id", task.workspace_id)
    .in("status", ["pending","active","past_due","paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data.id;
}

async function dispatchViability(task: WorkflowTask) {
  if (!task.process_id) throw new Error("VIABILITY_PROCESS_ID_MISSING");

  const { error } = await db.rpc("reg_queue_send", {
    p_queue: "inpi_jobs",
    p_message: {
      job_type: "viability",
      workflow_task_id: task.id,
      workspace_id: task.workspace_id,
      process_id: task.process_id
    },
    p_delay: 0
  });

  if (error) throw error;
  await setTaskStatus(task.id, "waiting");
}

export async function handleWorkflowTask(taskId: string) {
  const task = await getTask(taskId);

  if (task.status === "completed" || task.status === "cancelled") return;
  if (!["pending","failed"].includes(task.status)) return;

  const nextAttempt = (task.attempts ?? 0) + 1;

  await setTaskStatus(task.id, "in_progress", {
    attempts: nextAttempt,
    last_error: null
  });

  try {
    switch (task.task_type) {
      case "START_CONTRACT":
        await issueContract(task.workspace_id);
        await setTaskStatus(task.id, "completed");
        return;

      case "CREATE_ASAAS_CHARGE": {
        const subscriptionId = await resolveSubscriptionId(task);
        await createSetupCharge(task.workspace_id, subscriptionId);
        await setTaskStatus(task.id, "completed");
        return;
      }

      case "CREATE_MONTHLY_SUBSCRIPTION": {
        const subscriptionId = await resolveSubscriptionId(task);
        await createMonthlySubscription(task.workspace_id, subscriptionId);
        await setTaskStatus(task.id, "completed");
        return;
      }

      case "START_VIABILITY":
        await dispatchViability(task);
        return;

      case "ANALYZE_LEGAL_CASE": {
        if (!task.legal_case_id) throw new Error("LEGAL_CASE_ID_MISSING");

        const { error: queueError } = await db.rpc("reg_queue_send", {
          p_queue: "legal_jobs",
          p_message: {
            job_type: "analyze_legal_case",
            workflow_task_id: task.id,
            workspace_id: task.workspace_id,
            process_id: task.process_id,
            legal_case_id: task.legal_case_id
          },
          p_delay: 0
        });

        if (queueError) throw queueError;
        await setTaskStatus(task.id, "waiting");
        return;
      }

      case "GENERATE_INPI_FEE": {
        // Fail closed until persisted Terms/POA/procurador/customer/human evidence is wired.
        // Retrying an unexecutable external act would create false readiness and queue noise.
        throw new Error("OFFICIAL_ACT_GATE_PERSISTENCE_NOT_WIRED");
      }

      default:
        throw new Error("UNSUPPORTED_WORKFLOW_TASK:" + task.task_type);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    await setTaskStatus(
      task.id,
      nextAttempt >= 5 ? "failed" : "pending",
      { last_error: message }
    );

    throw error;
  }
}
