import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { TopupCreateSchema } from "@telcocredit/shared";
import { HttpError, assert } from "../lib/http-errors.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireTenant } from "../middleware/require-tenant.js";
import { executeTopup } from "../services/topup-engine.js";

export function registerTopupRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req) => {
    const routeUrl = (req as any).routeOptions?.url || (req as any).routerPath || "";
    if (String(routeUrl).startsWith("/topups")) {
      await requireAuth(app)(req);
      await requireTenant(req);
    }
  });

  app.post("/topups", async (req) => {
    const user = (req as any).user;
    const parsed = TopupCreateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid payload", parsed.error.flatten());
    const b = parsed.data;

    const emp = b.employeeId
      ? await prisma.employee.findFirst({ where: { id: b.employeeId, tenantId: user.tenantId } })
      : await prisma.employee.findFirst({ where: { tenantId: user.tenantId, msisdn: b.msisdn } });
    assert(emp, 404, "Employee not found");

    const res = await executeTopup({
      tenantId: user.tenantId,
      employeeId: emp.id,
      msisdn: emp.msisdn,
      network: b.network,
      amount: Number(b.amount),
      idempotencyKey: b.idempotencyKey,
      channel: "WEB"
    });

    return res;
  });

  app.get("/topups", async (req) => {
    const user = (req as any).user;
    return prisma.topupRequest.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "desc" }, take: 200 });
  });
}
