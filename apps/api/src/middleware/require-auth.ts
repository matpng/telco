import type { FastifyInstance, FastifyRequest } from "fastify";
import { getBearerToken, verifyToken, type AuthUser } from "../lib/auth.js";
import { HttpError } from "../lib/http-errors.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export function requireAuth(app: FastifyInstance) {
  return async function (req: FastifyRequest) {
    const token = getBearerToken(req.headers.authorization);
    if (!token) throw new HttpError(401, "Missing Bearer token");
    req.user = verifyToken(token);
  };
}

export function requireRole(roles: AuthUser["role"][]) {
  return async function (req: FastifyRequest) {
    if (!req.user) throw new HttpError(401, "Unauthorized");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "Forbidden");
  };
}
