import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireTenant } from "../middleware/require-tenant.js";
import { assert } from "../lib/http-errors.js";
import { createLedgerEntry } from "../services/ledger.js";

export function registerPaymentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req) => {
    const routeUrl = (req as any).routeOptions?.url || (req as any).routerPath || "";
    if (String(routeUrl).startsWith("/payments")) {
      await requireAuth(app)(req);
      await requireTenant(req);
    }
  });

  // Manual payment match (bank transfer)
  app.post("/payments/manual-match", async (req) => {
    const user = (req as any).user;
    const body = req.body as { invoiceId: string; amount: number; reference: string };
    const inv = await prisma.invoice.findFirst({ where: { id: body.invoiceId, tenantId: user.tenantId } });
    assert(inv, 404, "Invoice not found");

    const payment = await prisma.payment.create({
      data: {
        tenantId: user.tenantId,
        invoiceId: inv.id,
        amount: body.amount as any,
        reference: body.reference,
        status: "MATCHED"
      }
    });

    await prisma.invoice.update({ where: { id: inv.id }, data: { status: "PAID" } });

    await createLedgerEntry({
      tenantId: user.tenantId,
      type: "PAYMENT_RECEIVED",
      direction: "CREDIT",
      amount: body.amount,
      description: `Payment received for invoice ${inv.id} ref=${body.reference}`
    });

    return { ok: true, payment };
  });
}
