import dayjs from "dayjs";
import { prisma } from "../lib/prisma.js";
import { assert } from "../lib/http-errors.js";
import { round2 } from "../lib/money.js";
import { pickConnector } from "../telco/registry.js";
import { createLedgerEntry, getTenantAvailableCredit } from "./ledger.js";
import { checkAllowanceAndIncrement } from "./allowances.js";
export async function executeTopup(opts) {
    // Idempotency: if exists return it
    const existing = await prisma.topupRequest.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
    if (existing)
        return existing;
    const employee = await prisma.employee.findUnique({ where: { id: opts.employeeId } });
    assert(employee && employee.status === "ACTIVE", 400, "Employee not active");
    const tenant = await prisma.tenant.findUnique({ where: { id: opts.tenantId } });
    assert(tenant && tenant.status === "ACTIVE", 400, "Tenant not active");
    // Period is current month
    const periodStart = dayjs().startOf("month").toDate();
    const periodEnd = dayjs().endOf("month").toDate();
    // Allowance check + increment counters
    await checkAllowanceAndIncrement({ tenantId: opts.tenantId, employeeId: opts.employeeId, amount: opts.amount });
    // Employer credit check
    const available = await getTenantAvailableCredit(opts.tenantId, periodStart, periodEnd);
    if (opts.amount > available)
        throw new Error(`Employer credit limit exceeded. Remaining credit: PGK ${available.toFixed(2)}`);
    // Create request
    const req = await prisma.topupRequest.create({
        data: {
            tenantId: opts.tenantId,
            employeeId: opts.employeeId,
            msisdn: opts.msisdn,
            network: opts.network,
            productType: "AIRTIME",
            amount: opts.amount,
            clientChannel: opts.channel,
            idempotencyKey: opts.idempotencyKey,
            status: "HELD"
        }
    });
    // Reserve credit (ledger)
    await createLedgerEntry({
        tenantId: opts.tenantId,
        topupRequestId: req.id,
        type: "CREDIT_LIMIT_USED",
        direction: "DEBIT",
        amount: opts.amount,
        description: `Reserve PGK ${opts.amount.toFixed(2)} for ${opts.network} topup ${opts.msisdn}`
    });
    // Execute telco topup
    const connector = pickConnector(opts.network);
    await prisma.topupRequest.update({ where: { id: req.id }, data: { status: "SENT" } });
    const result = await connector.topupAirtime({ toMsisdn: opts.msisdn, amount: opts.amount, idempotencyKey: opts.idempotencyKey });
    if (result.status === "SUCCESS") {
        await prisma.$transaction([
            prisma.topupRequest.update({
                where: { id: req.id },
                data: { status: "SUCCESS", telcoRef: result.telcoRef, failureReason: null }
            }),
            createLedgerEntry({
                tenantId: opts.tenantId,
                topupRequestId: req.id,
                type: "TOPUP_CHARGE",
                direction: "DEBIT",
                amount: round2(opts.amount),
                description: `Topup SUCCESS ${opts.network} ${opts.msisdn} ref=${result.telcoRef}`
            })
        ]);
    }
    else if (result.status === "FAILED") {
        await prisma.$transaction([
            prisma.topupRequest.update({
                where: { id: req.id },
                data: { status: "FAILED", telcoRef: result.telcoRef || null, failureReason: result.reason }
            }),
            createLedgerEntry({
                tenantId: opts.tenantId,
                topupRequestId: req.id,
                type: "CREDIT_LIMIT_RELEASED",
                direction: "CREDIT",
                amount: round2(opts.amount),
                description: `Topup FAILED - release reserve: ${result.reason}`
            })
        ]);
    }
    else {
        await prisma.topupRequest.update({
            where: { id: req.id },
            data: { status: "PENDING", telcoRef: result.telcoRef || null }
        });
        // Reservation remains held until reconciliation finalizes it.
    }
    return prisma.topupRequest.findUnique({ where: { id: req.id } });
}
