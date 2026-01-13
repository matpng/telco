import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { EmployeeCreateSchema } from "@telcocredit/shared";
import { HttpError, assert } from "../lib/http-errors.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireTenant } from "../middleware/require-tenant.js";

export function registerEmployeeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req) => {
    // only guard /employees routes
    const routeUrl = (req as any).routeOptions?.url || (req as any).routerPath || "";
    if (String(routeUrl).startsWith("/employees")) {
      await requireAuth(app)(req);
      await requireTenant(req);
    }
  });

  app.post("/employees", async (req) => {
    const user = (req as any).user;
    const parsed = EmployeeCreateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid payload", parsed.error.flatten());

    const e = await prisma.employee.create({
      data: {
        tenantId: user.tenantId,
        fullName: parsed.data.fullName,
        msisdn: parsed.data.msisdn,
        department: parsed.data.department || null
      }
    });

    // If tenant has a default policy, auto-assign
    const policy = await prisma.allowancePolicy.findFirst({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "asc" } });
    assert(policy, 400, "No allowance policy exists for tenant");
    await prisma.employeeAllowanceAssignment.create({
      data: { tenantId: user.tenantId, employeeId: e.id, policyId: policy.id }
    });

    return e;
  });

  app.get("/employees", async (req) => {
    const user = (req as any).user;
    return prisma.employee.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: "desc" } });
  });

  app.patch("/employees/:id", async (req) => {
    const user = (req as any).user;
    const id = (req.params as any).id as string;
    const body = req.body as Partial<{ status: "ACTIVE" | "SUSPENDED"; department: string }>;

    const emp = await prisma.employee.findFirst({ where: { id, tenantId: user.tenantId } });
    assert(emp, 404, "Employee not found");

    return prisma.employee.update({
      where: { id },
      data: {
        status: body.status ?? emp.status,
        department: body.department ?? emp.department
      }
    });
  });
}
