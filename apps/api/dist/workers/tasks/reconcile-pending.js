import dayjs from "dayjs";
import { prisma } from "../../lib/prisma.js";
import { createLedgerEntry } from "../../services/ledger.js";
/**
 * Reconcile PENDING topups. In a real implementation:
 * - Query telco API for status OR ask SIM gateway for last known status by txnId
 * - If success, capture. If failed, release.
 *
 * This starter marks very old PENDING (>30 min) as FAILED and releases reserve.
 */
export async function reconcilePendingTopups(log) {
    const cutoff = dayjs().subtract(30, "minute").toDate();
    const pendings = await prisma.topupRequest.findMany({
        where: { status: "PENDING", createdAt: { lte: cutoff } },
        take: 50
    });
    for (const p of pendings) {
        // Conservative: fail and release. Replace with real reconciliation.
        await prisma.$transaction([
            prisma.topupRequest.update({
                where: { id: p.id },
                data: { status: "FAILED", failureReason: "Reconcile timeout - no confirmation from telco" }
            }),
            createLedgerEntry({
                tenantId: p.tenantId,
                topupRequestId: p.id,
                type: "CREDIT_LIMIT_RELEASED",
                direction: "CREDIT",
                amount: Number(p.amount),
                description: "Auto-release reserve after pending timeout"
            })
        ]);
        log.warn({ topup: p.id }, "Pending topup auto-failed and reserve released");
    }
}
