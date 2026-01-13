import dayjs from "dayjs";
import { prisma } from "../lib/prisma.js";
import { assert } from "../lib/http-errors.js";
import { toNumber, round2 } from "../lib/money.js";

export async function getActivePolicyForEmployee(tenantId: string, employeeId: string) {
  const assignment = await prisma.employeeAllowanceAssignment.findFirst({
    where: { tenantId, employeeId, effectiveTo: null },
    include: { policy: true }
  });
  assert(assignment?.policy, 400, "No allowance policy assigned to employee");
  return assignment.policy;
}

export function currentPeriodBounds(periodType: "DAY" | "WEEK" | "MONTH") {
  const now = dayjs();
  if (periodType === "DAY") {
    return { start: now.startOf("day").toDate(), end: now.endOf("day").toDate() };
  }
  if (periodType === "WEEK") {
    return { start: now.startOf("week").toDate(), end: now.endOf("week").toDate() };
  }
  return { start: now.startOf("month").toDate(), end: now.endOf("month").toDate() };
}

export async function getOrCreateCounter(tenantId: string, employeeId: string, periodType: "DAY"|"WEEK"|"MONTH") {
  const { start, end } = currentPeriodBounds(periodType);
  const existing = await prisma.employeeAllowanceCounter.findFirst({
    where: { tenantId, employeeId, periodType, periodStart: start }
  });
  if (existing) return existing;
  return prisma.employeeAllowanceCounter.create({
    data: { tenantId, employeeId, periodType, periodStart: start, periodEnd: end, amountUsed: 0 as any }
  });
}

export async function checkAllowanceAndIncrement(opts: { tenantId: string; employeeId: string; amount: number }) {
  const policy = await getActivePolicyForEmployee(opts.tenantId, opts.employeeId);

  // Per txn cap
  if (opts.amount > toNumber(policy.perTxnCap)) {
    throw new Error(`Per-transaction cap exceeded. Max PGK ${toNumber(policy.perTxnCap).toFixed(2)}`);
  }

  const dayCounter = await getOrCreateCounter(opts.tenantId, opts.employeeId, "DAY");
  const weekCounter = await getOrCreateCounter(opts.tenantId, opts.employeeId, "WEEK");
  const monthCounter = await getOrCreateCounter(opts.tenantId, opts.employeeId, "MONTH");

  const dayAfter = round2(toNumber(dayCounter.amountUsed) + opts.amount);
  const weekAfter = round2(toNumber(weekCounter.amountUsed) + opts.amount);
  const monthAfter = round2(toNumber(monthCounter.amountUsed) + opts.amount);

  if (dayAfter > toNumber(policy.dailyCap)) throw new Error(`Daily cap exceeded. Remaining: PGK ${(toNumber(policy.dailyCap) - toNumber(dayCounter.amountUsed)).toFixed(2)}`);
  if (weekAfter > toNumber(policy.weeklyCap)) throw new Error(`Weekly cap exceeded.`);
  if (monthAfter > toNumber(policy.monthlyCap)) throw new Error(`Monthly cap exceeded.`);

  // Increment counters (transactional)
  await prisma.$transaction([
    prisma.employeeAllowanceCounter.update({ where: { id: dayCounter.id }, data: { amountUsed: dayAfter as any } }),
    prisma.employeeAllowanceCounter.update({ where: { id: weekCounter.id }, data: { amountUsed: weekAfter as any } }),
    prisma.employeeAllowanceCounter.update({ where: { id: monthCounter.id }, data: { amountUsed: monthAfter as any } })
  ]);

  return { policy, dayAfter, weekAfter, monthAfter };
}
