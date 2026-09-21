import { archiveQueueMessage, db, retryQueueMessage, type QueueMessage } from "./db.js";
import { runViability } from "./viability.js";
import { pollRpi, processRpiEdition } from "./rpi.js";

async function updateWorkflowTask(
  taskId: string,
  status: "completed" | "waiting" | "failed",
  lastError: string | null = null
) {
  const { error } = await db.from("workflow_tasks").update({
    status,
    last_error: lastError,
    completed_at: status === "completed" ? new Date().toISOString() : null
  }).eq("id", taskId);

  if (error) throw error;
}

export async function handleInpiJob(job: QueueMessage) {
  const jobType = String(job.message.job_type ?? "");

  if (jobType === "rpi_poll") {
    await pollRpi();
    await archiveQueueMessage("inpi_jobs", job.msg_id);
    return;
  }

  if (jobType === "process_rpi") {
    const rpiNumber = Number(job.message.rpi_number ?? 0);
    if (!Number.isInteger(rpiNumber) || rpiNumber < 2500) {
      throw new Error("RPI_JOB_MALFORMED");
    }

    try {
      await processRpiEdition(rpiNumber);
      await archiveQueueMessage("inpi_jobs", job.msg_id);
    } catch (error) {
      if (job.read_ct >= 5) {
        await archiveQueueMessage("inpi_jobs", job.msg_id);
        return;
      }
      await retryQueueMessage("inpi_jobs", job.msg_id, Math.min(3600, 120 * Math.max(job.read_ct, 1)));
    }
    return;
  }

  if (jobType === "viability") {
    const workflowTaskId = String(job.message.workflow_task_id ?? "");
    const workspaceId = String(job.message.workspace_id ?? "");
    const processId = String(job.message.process_id ?? "");

    if (!workflowTaskId || !workspaceId || !processId) {
      throw new Error("INPI_VIABILITY_JOB_MALFORMED");
    }

    try {
      await runViability(workspaceId, processId);
      await updateWorkflowTask(workflowTaskId, "completed");
      await archiveQueueMessage("inpi_jobs", job.msg_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";

      const { data: task } = await db.from("workflow_tasks")
        .select("attempts")
        .eq("id", workflowTaskId)
        .maybeSingle();

      const attempts = (task?.attempts ?? 0) + 1;

      await db.from("workflow_tasks")
        .update({
          status: attempts >= 5 ? "failed" : "waiting",
          attempts,
          last_error: message
        })
        .eq("id", workflowTaskId);

      if (attempts >= 5) {
        await archiveQueueMessage("inpi_jobs", job.msg_id);
        return;
      }

      await retryQueueMessage("inpi_jobs", job.msg_id, Math.min(1800, 60 * attempts));
    }
    return;
  }

  if (jobType === "generate_gru") {
    // This job is intentionally NOT archived until the real authenticated
    // INPI/GRU adapter is configured. Silently discarding it could lose a legal step.
    if (job.read_ct >= 20) {
      await retryQueueMessage("inpi_jobs", job.msg_id, 3600);
      return;
    }
    await retryQueueMessage("inpi_jobs", job.msg_id, 1800);
    return;
  }

  await archiveQueueMessage("inpi_jobs", job.msg_id);
}
