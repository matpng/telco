import dayjs from "dayjs";
import { prisma } from "../lib/prisma.js";
import { SmsInboundSchema } from "@telcocredit/shared";
import { HttpError, assert } from "../lib/http-errors.js";
import { executeTopup } from "../services/topup-engine.js";
function normalizeText(t) {
    return t.trim().replace(/\s+/g, " ").toUpperCase();
}
export function registerSmsWebhookRoutes(app) {
    // Public endpoint - protect with IP allowlist or shared secret in production
    app.post("/webhooks/sms/inbound", async (req) => {
        const parsed = SmsInboundSchema.safeParse(req.body);
        if (!parsed.success)
            throw new HttpError(400, "Invalid SMS payload", parsed.error.flatten());
        const sms = parsed.data;
        const text = normalizeText(sms.text);
        const from = sms.from;
        // Find employee across tenants (MSISDN unique per tenant but we can search globally)
        const employee = await prisma.employee.findFirst({
            where: { msisdn: from, status: "ACTIVE" },
            include: { tenant: true }
        });
        if (!employee) {
            return {
                replyText: "Your number is not registered. Please contact your employer admin.",
                action: "REJECT"
            };
        }
        assert(employee.tenant.status === "ACTIVE", 400, "Employer account suspended");
        // Determine network by prefix (customize for PNG). Fallback: tenant config or manual.
        const network = from.replace("+", "").startsWith("6757") ? "DIGICEL" : "VODAFONE";
        if (text === "HELP") {
            return { replyText: "Commands: TOPUP <amount>, BAL, HISTORY, HELP", action: "HELP" };
        }
        if (text === "BAL") {
            // Current month usage from topups
            const monthStart = dayjs().startOf("month").toDate();
            const monthEnd = dayjs().endOf("month").toDate();
            const used = await prisma.topupRequest.aggregate({
                where: { tenantId: employee.tenantId, employeeId: employee.id, status: "SUCCESS", createdAt: { gte: monthStart, lte: monthEnd } },
                _sum: { amount: true }
            });
            const amt = Number(used._sum.amount || 0);
            return { replyText: `This month used: PGK ${amt.toFixed(2)}.`, action: "BAL" };
        }
        if (text === "HISTORY") {
            const last = await prisma.topupRequest.findMany({
                where: { tenantId: employee.tenantId, employeeId: employee.id },
                orderBy: { createdAt: "desc" },
                take: 3
            });
            if (last.length === 0)
                return { replyText: "No recent transactions.", action: "HISTORY" };
            const lines = last.map(t => `${dayjs(t.createdAt).format("DD/MM")}: ${t.network} PGK ${Number(t.amount).toFixed(2)} ${t.status}`).join("; ");
            return { replyText: `Last: ${lines}`, action: "HISTORY" };
        }
        const m = text.match(/^TOPUP\s+(\d+(?:\.\d{1,2})?)$/);
        if (m) {
            const amount = Number(m[1]);
            if (!Number.isFinite(amount) || amount <= 0)
                throw new HttpError(400, "Invalid amount");
            try {
                const r = await executeTopup({
                    tenantId: employee.tenantId,
                    employeeId: employee.id,
                    msisdn: employee.msisdn,
                    network,
                    amount,
                    idempotencyKey: sms.messageId,
                    channel: "SMS"
                });
                return {
                    replyText: r?.status === "SUCCESS"
                        ? `Topup SUCCESS: PGK ${amount.toFixed(2)} sent. Ref: ${r.telcoRef || "-"}`
                        : r?.status === "FAILED"
                            ? `Topup FAILED: ${r.failureReason || "Unknown"}`
                            : `Topup PENDING: we will confirm shortly.`,
                    action: "TOPUP",
                    topupStatus: r?.status || "UNKNOWN"
                };
            }
            catch (e) {
                return { replyText: `Request rejected: ${e.message || "Error"}`, action: "REJECT" };
            }
        }
        return { replyText: "Unknown command. Send HELP.", action: "UNKNOWN" };
    });
}
