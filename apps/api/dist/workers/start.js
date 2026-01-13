import { Worker } from "bullmq";
import dayjs from "dayjs";
import { billingQueue, connection, reconcileQueue } from "./queue.js";
import { runMonthEndBillingIfDue } from "./tasks/month-end-billing.js";
import { reconcilePendingTopups } from "./tasks/reconcile-pending.js";
export async function startWorkers(log) {
    // Repeat jobs
    await billingQueue.add("month-end-scan", {}, { repeat: { pattern: "10 0 * * *" } } // every day at 00:10
    );
    await reconcileQueue.add("reconcile-pending", {}, { repeat: { pattern: "*/10 * * * *" } } // every 10 minutes
    );
    // Workers
    new Worker("billing", async (job) => {
        log.info({ job: job.name }, "Billing job start");
        await runMonthEndBillingIfDue(log);
        log.info({ job: job.name }, "Billing job done");
    }, { connection });
    new Worker("reconcile", async (job) => {
        log.info({ job: job.name }, "Reconcile job start");
        await reconcilePendingTopups(log);
        log.info({ job: job.name }, "Reconcile job done");
    }, { connection });
    log.info({ at: dayjs().toISOString() }, "Workers started");
}
