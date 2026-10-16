import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AdminRole } from "@kisa/shared";
import type { Env } from "../config/env";
import { type AccessTokenPayload, type AuthAdmin, type AuthedRequest, JWT_AUDIENCE, JWT_ISSUER } from "./auth.types";

/** Requires a valid access token (Authorization: Bearer ...) and sets req.admin. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException("Not authenticated");
    try {
      const p = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (p.typ !== "access") throw new Error("not an access token");
      req.admin = { id: p.sub, role: p.role, sessionId: p.sid };
      return true;
    } catch {
      throw new UnauthorizedException("Not authenticated");
    }
  }
}

const ROLES_KEY = "kisa:roles";

/** Roles allowed on a controller or route. Use after JwtAuthGuard. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;
    const admin = ctx.switchToHttp().getRequest<AuthedRequest>().admin;
    if (!admin) throw new UnauthorizedException("Not authenticated");
    if (!roles.includes(admin.role)) throw new ForbiddenException("You do not have access to this");
    return true;
  }
}

/** The admin set by JwtAuthGuard. */
export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthAdmin => ctx.switchToHttp().getRequest<AuthedRequest>().admin!,
);
