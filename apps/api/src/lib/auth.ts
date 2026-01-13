import jwt from "jsonwebtoken";
import { env } from "./env.js";
import type { UserRole } from "@telcocredit/shared";

export type AuthUser = {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
};

export function signToken(u: AuthUser) {
  return jwt.sign(u, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: env.tokenTtlSeconds
  });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  }) as AuthUser;
}

export function getBearerToken(authHeader?: string) {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || null;
}
