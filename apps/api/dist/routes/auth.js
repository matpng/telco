import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/auth.js";
import { HttpError } from "../lib/http-errors.js";
export function registerAuthRoutes(app) {
    app.post("/auth/login", async (req, reply) => {
        const body = req.body;
        const user = await prisma.tenantUser.findUnique({ where: { email: body.email } });
        if (!user)
            throw new HttpError(401, "Invalid credentials");
        const ok = await bcrypt.compare(body.password, user.passwordHash);
        if (!ok)
            throw new HttpError(401, "Invalid credentials");
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
        return reply.send({ token, user: { email: user.email, role: user.role, tenantId: user.tenantId } });
    });
}
