import { prisma } from "../lib/prisma.js";
import { round2, toNumber } from "../lib/money.js";
import { assert } from "../lib/http-errors.js";
import type { LedgerDirection, LedgerType } from "@prisma/client";

export async function getTenantUsedThisPeriod(tenantId: string, periodStart: Date, periodEnd: Date) {
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

export async function getTenantAvailableCredit(tenantId: string, periodStart: Date, periodEnd: Date) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  assert(tenant, 404, "Tenant not found");
  const used = await getTenantUsedThisPeriod(tenantId, periodStart, periodEnd);
  const limit = toNumber(tenant.creditLimitMonthly);
  return round2(limit - used);
}

export function createLedgerEntry(opts: {
  tenantId: string;
  topupRequestId?: string | null;
  type: LedgerType | any;
  direction: LedgerDirection | any;
  amount: number;
  description: string;
}) {
  return prisma.ledgerEntry.create({
    data: {
      tenantId: opts.tenantId,
      topupRequestId: opts.topupRequestId || null,
      type: opts.type,
      direction: opts.direction,
      amount: opts.amount as any,
      description: opts.description
    }
  });
}
