import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { AllowancePolicySchema } from "@telcocredit/shared";
import { HttpError, assert } from "../lib/http-errors.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireTenant } from "../middleware/require-tenant.js";

export function registerAllowanceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req) => {
    const routeUrl = (req as any).routeOptions?.url || (req as any).routerPath || "";
    if (String(routeUrl).startsWith("/allowance")) {
      await requireAuth(app)(req);
      await requireTenant(req);
    }
  });

  app.post("/allowance/policies", async (req) => {
    const user = (req as any).user;
    const parsed = AllowancePolicySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid payload", parsed.error.flatten());

    return prisma.allowancePolicy.create({
      data: {
        tenantId: user.tenantId,
        name: parsed.data.name,
        dailyCap: parsed.data.dailyCap as any,
        weeklyCap: parsed.data.weeklyCap as any,
        monthlyCap: parsed.data.monthlyCap as any,
        perTxnCap: parsed.data.perTxnCap as any,
        requireApprovalOver: parsed.data.requireApprovalOver as any
      }
    });
  });

  app.get("/allowance/policies", async (req) => {
    const user = (req as any).user;
    return prisma.allowancePolicy.findMany({ where: { tenantId: user.tenantId } });
  });

  app.post("/allowance/assign", async (req) => {
    const user = (req as any).user;
    const body = req.body as { employeeId: string; policyId: string };
    const emp = await prisma.employee.findFirst({ where: { id: body.employeeId, tenantId: user.tenantId } });
    assert(emp, 404, "Employee not found");

    // end existing assignment
    await prisma.employeeAllowanceAssignment.updateMany({
      where: { tenantId: user.tenantId, employeeId: emp.id, effectiveTo: null },
      data: { effectiveTo: new Date() }
    });

    return prisma.employeeAllowanceAssignment.create({
      data: { tenantId: user.tenantId, employeeId: emp.id, policyId: body.policyId }
    });
  });
}
