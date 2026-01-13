import jwt from "jsonwebtoken";
import { env } from "./env.js";
export function signToken(u) {
    return jwt.sign(u, env.jwtSecret, {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        expiresIn: env.tokenTtlSeconds
    });
}
export function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret, {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience
    });
}
export function getBearerToken(authHeader) {
    if (!authHeader)
        return null;
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    return m?.[1] || null;
}
