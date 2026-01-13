import { prisma } from "../lib/prisma.js";
import { round2, toNumber } from "../lib/money.js";
import { assert } from "../lib/http-errors.js";
export async function getTenantUsedThisPeriod(tenantId, periodStart, periodEnd) {
    const entries = await prisma.ledgerEntry.findMany({
        where: {
            tenantId,
            createdAt: { gte: periodStart, lte: periodEnd },
            type: { in: ["TOPUP_CHARGE", "FEE"] }
        }
    });
    const total = entries.reduce((s, e) => s + toNumber(e.amount), 0);
    return round2(total);
}
export async function getTenantAvailableCredit(tenantId, periodStart, periodEnd) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    assert(tenant, 404, "Tenant not found");
    const used = await getTenantUsedThisPeriod(tenantId, periodStart, periodEnd);
    const limit = toNumber(tenant.creditLimitMonthly);
    return round2(limit - used);
}
export function createLedgerEntry(opts) {
    return prisma.ledgerEntry.create({
        data: {
            tenantId: opts.tenantId,
            topupRequestId: opts.topupRequestId || null,
            type: opts.type,
            direction: opts.direction,
            amount: opts.amount,
            description: opts.description
        }
    });
}
