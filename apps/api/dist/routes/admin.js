import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";
export function registerAdminRoutes(app) {
    app.addHook("preHandler", async (req) => {
        const routeUrl = req.routeOptions?.url || req.routerPath || "";
        if (String(routeUrl).startsWith("/admin")) {
            await requireAuth(app)(req);
            await requireRole(["SUPER_ADMIN"])(req);
        }
    });
    app.get("/admin/tenants", async () => prisma.tenant.findMany({ orderBy: { createdAt: "desc" } }));
    app.post("/admin/tenants/:id/suspend", async (req) => {
        const id = req.params.id;
        return prisma.tenant.update({ where: { id }, data: { status: "SUSPENDED" } });
    });
    app.post("/admin/tenants/:id/activate", async (req) => {
        const id = req.params.id;
        return prisma.tenant.update({ where: { id }, data: { status: "ACTIVE" } });
    });
}
