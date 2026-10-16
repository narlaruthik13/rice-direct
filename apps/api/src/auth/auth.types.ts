import type { Request } from "express";
import type { AdminUser } from "@kisa/db";
import type { AdminProfile, AdminRole } from "@kisa/shared";

export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const JWT_ISSUER = "kisa-api";
export const JWT_AUDIENCE = "kisa-admin";

/** Claims in the access token. `typ` stops a refresh token being used as an access token. */
export interface AccessTokenPayload {
  sub: string;
  role: AdminRole;
  sid: string;
  typ: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  typ: "refresh";
}

/** The signed-in admin, set on the request by JwtAuthGuard. */
export interface AuthAdmin {
  id: string;
  role: AdminRole;
  sessionId: string;
}

export type AuthedRequest = Request & { admin?: AuthAdmin };

/** Device details stored on a session, to show and revoke sessions later. */
export interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

export const clientMeta = (req: Request): ClientMeta => ({
  userAgent: req.headers["user-agent"]?.slice(0, 300),
  ipAddress: req.ip,
});

/** The public view of an admin: never includes the password hash. */
export const toAdminProfile = (a: AdminUser): AdminProfile => ({
  id: a.id,
  email: a.email,
  name: a.name,
  role: a.role,
  lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
  createdAt: a.createdAt.toISOString(),
});
