import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
async function main() {
    // Super admin (no tenant)
    const adminEmail = "admin@telcocredit.local";
    const passwordHash = await bcrypt.hash("Admin123!", 10);
    await prisma.tenantUser.upsert({
        where: { email: adminEmail },
        update: {},
        create: { email: adminEmail, passwordHash, role: "SUPER_ADMIN" }
    });
    // Sample tenant + employer admin
    const tenant = await prisma.tenant.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        update: {},
        create: {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Acme PNG Ltd",
            billingEmail: "billing@acme.local",
            creditLimitMonthly: 5000,
            paymentTermsDays: 7
        }
    });
    const employerAdminEmail = "acme.admin@telcocredit.local";
    await prisma.tenantUser.upsert({
        where: { email: employerAdminEmail },
        update: {},
        create: { tenantId: tenant.id, email: employerAdminEmail, passwordHash, role: "EMPLOYER_ADMIN" }
    });
    const policy = await prisma.allowancePolicy.create({
        data: {
            tenantId: tenant.id,
            name: "Field Staff Policy",
            dailyCap: 5,
            weeklyCap: 25,
            monthlyCap: 100,
            perTxnCap: 5,
            requireApprovalOver: 20
        }
    });
    const emp = await prisma.employee.create({
        data: {
            tenantId: tenant.id,
            fullName: "John K",
            msisdn: "+67570123456",
            department: "Field"
        }
    });
    await prisma.employeeAllowanceAssignment.create({
        data: { tenantId: tenant.id, employeeId: emp.id, policyId: policy.id }
    });
    console.log("Seeded users/tenant/employee.");
}
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
