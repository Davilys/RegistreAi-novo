import { config } from "./config.js";
import { handleNotificationJob, handleRegJob } from "./jobs.js";
import { handleInpiJob } from "./inpiJobs.js";
import { handleLegalJob } from "./legalJobs.js";
import { readQueue, retryQueueMessage, type QueueMessage } from "./db.js";
import { processDueFollowups } from "./followups.js";
import { supabaseFollowupStore } from "./followups-db.js";
import { purgeExpiredCredentials } from "./credentials.js";
import { supabaseCredentialStore } from "./credentials-db.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function consumeQueue(
  name: "reg_jobs" | "notifications" | "inpi_jobs" | "legal_jobs",
  handler: (job: QueueMessage) => Promise<void>
) {
  while (true) {
    try {
      const jobs = await readQueue(name);

      if (!jobs.length) {
        await sleep(config.WORKER_POLL_MS);
        continue;
      }

      for (const job of jobs) {
        try {
          await handler(job);
        } catch (error) {
          console.error("job_failed", name, job.msg_id, error);
          const delay = Math.min(900, 30 * Math.max(job.read_ct, 1));
          await retryQueueMessage(name, job.msg_id, delay);
        }
      }
    } catch (error) {
      console.error("queue_loop_error", name, error);
      await sleep(Math.max(config.WORKER_POLL_MS, 3000));
    }
  }
}

async function followupLoop() {
  const excluded = new Set(config.FOLLOWUP_EXCLUDED_PHONES.split(",").map((p) => p.replace(/\D/g, "")).filter(Boolean));
  let lastPurge = 0;
  while (true) {
    try {
      await processDueFollowups(supabaseFollowupStore, { now: new Date(), excludedPhones: excluded });
      if (Date.now() - lastPurge > 6 * 60 * 60_000) {
        await purgeExpiredCredentials(supabaseCredentialStore, new Date());
        lastPurge = Date.now();
      }
    } catch (error) {
      console.error("followup_loop_error", error instanceof Error ? error.message : "unknown_error");
    }
    await sleep(60_000);
  }
}

console.log("Reg worker starting");

await Promise.all([
  consumeQueue("reg_jobs", handleRegJob),
  consumeQueue("notifications", handleNotificationJob),
  consumeQueue("inpi_jobs", handleInpiJob),
  consumeQueue("legal_jobs", handleLegalJob),
  ...(config.FOLLOWUPS_ENABLED ? [followupLoop()] : [])
]);
