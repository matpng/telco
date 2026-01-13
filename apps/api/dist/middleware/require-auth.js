import { getBearerToken, verifyToken } from "../lib/auth.js";
import { HttpError } from "../lib/http-errors.js";
export function requireAuth(app) {
    return async function (req) {
        const token = getBearerToken(req.headers.authorization);
        if (!token)
            throw new HttpError(401, "Missing Bearer token");
        req.user = verifyToken(token);
    };
}
export function requireRole(roles) {
    return async function (req) {
        if (!req.user)
            throw new HttpError(401, "Unauthorized");
        if (!roles.includes(req.user.role))
            throw new HttpError(403, "Forbidden");
    };
}
