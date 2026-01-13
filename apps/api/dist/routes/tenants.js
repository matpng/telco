import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { prisma } from "../lib/prisma.js";
import { assert, HttpError } from "../lib/http-errors.js";
import { EmployerSignupSchema } from "@telcocredit/shared";
import { env } from "../lib/env.js";
export function registerTenantRoutes(app) {
    // Self-signup: creates tenant + employer admin user + default policy
    app.post("/tenants/signup", async (req) => {
        const parsed = EmployerSignupSchema.safeParse(req.body);
        if (!parsed.success)
            throw new HttpError(400, "Invalid payload", parsed.error.flatten());
        const b = parsed.data;
        const existing = await prisma.tenantUser.findUnique({ where: { email: b.adminEmail } });
        assert(!existing, 400, "Admin email already exists");
        const passwordHash = await bcrypt.hash(b.adminPassword, 10);
        const tenant = await prisma.tenant.create({
            data: {
                name: b.companyName,
                ipaRegNo: b.ipaRegNo || null,
                billingEmail: b.billingEmail,
                creditLimitMonthly: 10000, // default; adjust for onboarding tier
                paymentTermsDays: env.paymentTermsDays
            }
        });
        const user = await prisma.tenantUser.create({
            data: {
                tenantId: tenant.id,
                email: b.adminEmail,
                passwordHash,
                role: "EMPLOYER_ADMIN"
            }
        });
        // Default allowance policy
        const policy = await prisma.allowancePolicy.create({
            data: {
                tenantId: tenant.id,
                name: "Default Policy",
                dailyCap: 10,
                weeklyCap: 50,
                monthlyCap: 200,
                perTxnCap: 10,
                requireApprovalOver: 20
            }
        });
        return { tenant, user: { id: user.id, email: user.email, role: user.role }, defaultPolicy: policy };
    });
    app.get("/tenants/:id", async (req) => {
        const id = req.params.id;
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new HttpError(404, "Tenant not found");
        return tenant;
    });
    // For employer dashboards
    app.get("/dashboard/summary", async (req) => {
        // expects header x-tenant-id or token tenantId; simplest: token tenantId
        const user = req.user;
        assert(user?.tenantId, 401, "Unauthorized");
        const tenantId = user.tenantId;
        const monthStart = dayjs().startOf("month").toDate();
        const monthEnd = dayjs().endOf("month").toDate();
        const topups = await prisma.topupRequest.findMany({
            where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd }, status: "SUCCESS" }
        });
        const totalSpend = topups.reduce((s, t) => s + Number(t.amount), 0);
        const employees = await prisma.employee.count({ where: { tenantId } });
        const byNetwork = topups.reduce((acc, t) => {
            acc[t.network] = (acc[t.network] || 0) + Number(t.amount);
            return acc;
        }, {});
        return { totalSpend, employees, byNetwork, periodStart: monthStart, periodEnd: monthEnd };
    });
}
