import dayjs from "dayjs";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../lib/env.js";
import { renderInvoicePdf } from "../../services/pdf-invoice.js";
import { renderUsageXlsx } from "../../services/xlsx-usage.js";
import { sendEmail } from "../../services/email.js";
import { toNumber, round2 } from "../../lib/money.js";
/**
 * Runs month-end billing on the 1st day of a month for the previous month,
 * or you can trigger manually by calling this function with a different date.
 */
export async function runMonthEndBillingIfDue(log) {
    const now = dayjs();
    // Only run on the 1st day of the month by default
    if (now.date() !== 1)
        return;
    const periodStart = now.subtract(1, "month").startOf("month").toDate();
    const periodEnd = now.subtract(1, "month").endOf("month").toDate();
    const issueDate = now.toDate();
    const tenants = await prisma.tenant.findMany({ where: { status: "ACTIVE" } });
    for (const t of tenants) {
        // Avoid double billing: if invoice exists for period skip
        const exists = await prisma.invoice.findFirst({
            where: { tenantId: t.id, periodStart, periodEnd }
        });
        if (exists)
            continue;
        const dueDate = dayjs(issueDate).add(t.paymentTermsDays || env.paymentTermsDays, "day").toDate();
        const topups = await prisma.topupRequest.findMany({
            where: { tenantId: t.id, status: "SUCCESS", createdAt: { gte: periodStart, lte: periodEnd } },
            include: { employee: true }
        });
        const totalTopups = round2(topups.reduce((s, x) => s + toNumber(x.amount), 0));
        // Platform fee (optional)
        const platformFee = env.platformFeeMonthly ? round2(env.platformFeeMonthly) : 0;
        const totalDue = round2(totalTopups + platformFee);
        const invoice = await prisma.invoice.create({
            data: {
                tenantId: t.id,
                periodStart,
                periodEnd,
                issueDate,
                dueDate,
                totalAmount: totalDue,
                status: "ISSUED",
                lines: {
                    create: [
                        ...(totalTopups > 0
                            ? [{ lineType: "TOPUP", description: "Mobile credit usage", quantity: 1, unitPrice: totalTopups, amount: totalTopups }]
                            : []),
                        ...(platformFee > 0
                            ? [{ lineType: "FEE", description: "Platform fee", quantity: 1, unitPrice: platformFee, amount: platformFee }]
                            : [])
                    ]
                }
            },
            include: { lines: true }
        });
        const invoiceNo = invoice.id.slice(0, 8).toUpperCase();
        const pdf = await renderInvoicePdf({
            invoiceNo,
            companyName: t.name,
            billingEmail: t.billingEmail,
            periodStart,
            periodEnd,
            issueDate,
            dueDate,
            total: totalDue,
            lines: invoice.lines.map(l => ({ description: l.description, amount: Number(l.amount) })),
            paymentInstructions: `Pay by bank transfer and use reference: INV-${invoiceNo}. Your account will be updated once matched.`
        });
        const xlsx = await renderUsageXlsx(topups.map(tp => ({
            employeeName: tp.employee?.fullName || "Unknown",
            msisdn: tp.msisdn,
            department: tp.employee?.department,
            network: tp.network,
            amount: Number(tp.amount),
            status: tp.status,
            createdAt: tp.createdAt,
            telcoRef: tp.telcoRef
        })));
        try {
            await sendEmail({
                to: t.billingEmail,
                subject: `Mobile Credit Statement – ${dayjs(periodStart).format("MMMM YYYY")} (${t.name})`,
                text: `Dear ${t.name},\n\nPlease find attached your statement for ${dayjs(periodStart).format("MMMM YYYY")}.\nTotal Due: PGK ${totalDue.toFixed(2)}\nDue Date: ${dayjs(dueDate).format("YYYY-MM-DD")}\nReference: INV-${invoiceNo}\n\nRegards,\nTelcoCredit PNG`,
                attachments: [
                    { filename: `Invoice-${invoiceNo}.pdf`, content: pdf },
                    { filename: `Usage-${dayjs(periodStart).format("YYYY-MM")}.xlsx`, content: xlsx }
                ]
            });
            log.info({ tenant: t.id, invoice: invoice.id }, "Statement emailed");
        }
        catch (e) {
            log.error({ tenant: t.id, err: e?.message || e }, "Failed to send statement email");
        }
    }
}
