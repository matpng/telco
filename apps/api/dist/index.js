import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { pino } from "pino";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerTenantRoutes } from "./routes/tenants.js";
import { registerEmployeeRoutes } from "./routes/employees.js";
import { registerAllowanceRoutes } from "./routes/allowances.js";
import { registerTopupRoutes } from "./routes/topups.js";
import { registerSmsWebhookRoutes } from "./routes/sms-webhooks.js";
import { registerInvoiceRoutes } from "./routes/invoices.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { startWorkers } from "./workers/start.js";
const logger = pino({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined
});
const app = Fastify({ logger });
await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(swagger, {
    openapi: {
        info: { title: "TelcoCredit API", version: "0.1.0" }
    }
});
await app.register(swaggerUI, { routePrefix: "/docs" });
app.get("/health", async () => ({ ok: true }));
registerAuthRoutes(app);
registerTenantRoutes(app);
registerEmployeeRoutes(app);
registerAllowanceRoutes(app);
registerTopupRoutes(app);
registerSmsWebhookRoutes(app);
registerInvoiceRoutes(app);
registerPaymentRoutes(app);
registerAdminRoutes(app);
await startWorkers(app.log);
const port = Number(process.env.PORT || 4000);
await app.listen({ port, host: "0.0.0.0" });
