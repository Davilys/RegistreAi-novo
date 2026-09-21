import { config } from "./config.js";
import { handleNotificationJob, handleRegJob } from "./jobs.js";
import { handleInpiJob } from "./inpiJobs.js";
import { handleLegalJob } from "./legalJobs.js";
import { readQueue, retryQueueMessage, type QueueMessage } from "./db.js";

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

console.log("Reg worker starting");

await Promise.all([
  consumeQueue("reg_jobs", handleRegJob),
  consumeQueue("notifications", handleNotificationJob),
  consumeQueue("inpi_jobs", handleInpiJob),
  consumeQueue("legal_jobs", handleLegalJob)
]);
