import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  type AdminLoginInput,
  type AdminLoginResponse,
  AdminLoginSchema,
  type AdminProfile,
  type AuthTokens,
  type RefreshTokenInput,
  RefreshTokenSchema,
} from "@kisa/shared";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { type AuthAdmin, clientMeta, toAdminProfile } from "./auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "./guards";

const MINUTE = 60_000;
// Read per request (validated at startup in config/env.ts).
const loginLimit = () => Number(process.env.LOGIN_RATE_LIMIT_PER_MINUTE ?? 5);

@ApiTags("auth")
@Controller("auth/admin")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: loginLimit, ttl: MINUTE } }) // brute-force protection, per IP
  @ApiOperation({ summary: "Admin login. Returns a 15-minute access token and a 7-day refresh token." })
  @ZodApiBody(AdminLoginSchema)
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  @ApiResponse({ status: 429, description: "Too many attempts; try again in a minute" })
  login(
    @Body(new ZodValidationPipe(AdminLoginSchema)) body: AdminLoginInput,
    @Req() req: Request,
  ): Promise<AdminLoginResponse> {
    return this.auth.login(body, clientMeta(req));
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: MINUTE } })
  @ApiOperation({ summary: "Swap a refresh token for a new pair. The old refresh token stops working." })
  @ZodApiBody(RefreshTokenSchema)
  refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
    @Req() req: Request,
  ): Promise<AuthTokens> {
    return this.auth.refresh(body.refreshToken, clientMeta(req));
  }

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({ summary: "End the session of this refresh token." })
  @ZodApiBody(RefreshTokenSchema)
  async logout(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }
}

@ApiTags("admin")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  @ApiOperation({ summary: "The signed-in admin." })
  async me(@CurrentAdmin() current: AuthAdmin): Promise<AdminProfile> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: current.id } });
    if (!admin || !admin.isActive) throw new UnauthorizedException("Not authenticated");
    return toAdminProfile(admin);
  }
}
