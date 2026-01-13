import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireTenant } from "../middleware/require-tenant.js";
import { assert } from "../lib/http-errors.js";
export function registerInvoiceRoutes(app) {
    app.addHook("preHandler", async (req) => {
        const routeUrl = req.routeOptions?.url || req.routerPath || "";
        if (String(routeUrl).startsWith("/invoices")) {
            await requireAuth(app)(req);
            await requireTenant(req);
        }
    });
    app.get("/invoices", async (req) => {
        const user = req.user;
        return prisma.invoice.findMany({ where: { tenantId: user.tenantId }, orderBy: { issueDate: "desc" } });
    });
    app.get("/invoices/:id", async (req) => {
        const user = req.user;
        const id = req.params.id;
        const inv = await prisma.invoice.findFirst({ where: { id, tenantId: user.tenantId }, include: { lines: true } });
        assert(inv, 404, "Invoice not found");
        return inv;
    });
}
