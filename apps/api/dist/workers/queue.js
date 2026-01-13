import { Queue } from "bullmq";
import { env } from "../lib/env.js";
export const connection = {
    host: env.redisHost,
    port: env.redisPort
};
export const billingQueue = new Queue("billing", { connection });
export const reconcileQueue = new Queue("reconcile", { connection });
