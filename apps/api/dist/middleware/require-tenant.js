import { HttpError } from "../lib/http-errors.js";
export async function requireTenant(req) {
    if (!req.user?.tenantId)
        throw new HttpError(400, "Tenant context missing for this user");
}
