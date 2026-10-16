import { createHash, randomUUID } from "node:crypto";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import type { AdminUser } from "@kisa/db";
import type { AdminLoginInput, AdminLoginResponse, AuthTokens } from "@kisa/shared";
import type { Env } from "../config/env";
import { PrismaService } from "../prisma/prisma.service";
import {
  ACCESS_TTL_SECONDS,
  type AccessTokenPayload,
  type ClientMeta,
  JWT_AUDIENCE,
  JWT_ISSUER,
  REFRESH_TTL_SECONDS,
  type RefreshTokenPayload,
  toAdminProfile,
} from "./auth.types";

// One message for unknown email, wrong password and disabled account, so a caller
// cannot find out which emails have admin accounts.
const INVALID_LOGIN = "Invalid email or password";
const INVALID_REFRESH = "Invalid or expired refresh token";

/** Refresh tokens are long random JWTs, so a fast SHA-256 is enough to store them safely. */
const sha256 = (token: string) => createHash("sha256").update(token).digest("hex");

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Compared against when the email is unknown, so both cases take the same time.
  private readonly dummyHash = bcrypt.hashSync(randomUUID(), 12);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login(input: AdminLoginInput, meta: ClientMeta): Promise<AdminLoginResponse> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: input.email } });
    const passwordOk = await bcrypt.compare(input.password, admin?.passwordHash ?? this.dummyHash);
    if (!admin || !admin.isActive || !passwordOk) throw new UnauthorizedException(INVALID_LOGIN);

    const updated = await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const sessionId = randomUUID();
    const tokens = await this.signTokens(updated, sessionId);
    await this.prisma.adminSession.create({ data: this.sessionData(updated.id, sessionId, tokens, meta) });
    return { ...tokens, admin: toAdminProfile(updated) };
  }

  /**
   * Swaps a refresh token for a new pair. The old session is revoked and points to
   * its replacement. If a token that was already rotated comes back, someone may have
   * copied it, so every session of that admin is ended.
   */
  async refresh(refreshToken: string, meta: ClientMeta): Promise<AuthTokens> {
    const payload = await this.verifyRefresh(refreshToken);
    if (!payload) throw new UnauthorizedException(INVALID_REFRESH);

    const session = await this.prisma.adminSession.findUnique({
      where: { id: payload.sid },
      include: { adminUser: true },
    });
    if (!session || session.refreshTokenHash !== sha256(refreshToken)) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (session.revokedAt) {
      await this.prisma.adminSession.updateMany({
        where: { adminUserId: session.adminUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Reused refresh token for admin ${session.adminUserId}; all sessions revoked`);
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (session.expiresAt <= new Date() || !session.adminUser.isActive) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    const newSessionId = randomUUID();
    const tokens = await this.signTokens(session.adminUser, newSessionId);
    await this.prisma.$transaction(async (tx) => {
      // Conditional revoke: if two refreshes race with the same token, only one wins.
      const { count } = await tx.adminSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date(), replacedById: newSessionId },
      });
      if (count !== 1) throw new UnauthorizedException(INVALID_REFRESH);
      await tx.adminSession.create({ data: this.sessionData(session.adminUserId, newSessionId, tokens, meta) });
    });
    return tokens;
  }

  /** Revokes the session of this refresh token. Always succeeds, so it reveals nothing. */
  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefresh(refreshToken, { ignoreExpiration: true });
    if (!payload) return;
    await this.prisma.adminSession.updateMany({
      where: { id: payload.sid, refreshTokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async signTokens(admin: AdminUser, sessionId: string): Promise<AuthTokens> {
    const access: AccessTokenPayload = { sub: admin.id, role: admin.role, sid: sessionId, typ: "access" };
    const refresh: RefreshTokenPayload = { sub: admin.id, sid: sessionId, typ: "refresh" };
    const common = { issuer: JWT_ISSUER, audience: JWT_AUDIENCE };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access, {
        ...common,
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: ACCESS_TTL_SECONDS,
      }),
      this.jwt.signAsync(refresh, {
        ...common,
        secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
        expiresIn: REFRESH_TTL_SECONDS,
        jwtid: randomUUID(),
      }),
    ]);
    return {
      tokenType: "Bearer",
      accessToken,
      expiresIn: ACCESS_TTL_SECONDS,
      refreshToken,
      refreshExpiresIn: REFRESH_TTL_SECONDS,
    };
  }

  private sessionData(adminUserId: string, id: string, tokens: AuthTokens, meta: ClientMeta) {
    return {
      id,
      adminUserId,
      refreshTokenHash: sha256(tokens.refreshToken),
      expiresAt: new Date(Date.now() + tokens.refreshExpiresIn * 1000),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    };
  }

  private async verifyRefresh(token: string, opts: { ignoreExpiration?: boolean } = {}) {
    try {
      const p = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        ignoreExpiration: opts.ignoreExpiration,
      });
      return p.typ === "refresh" && typeof p.sid === "string" ? p : null;
    } catch {
      return null;
    }
  }
}
