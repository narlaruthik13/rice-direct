import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminController, AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard, RolesGuard } from "./guards";

// Secrets are passed per call (access and refresh use different ones), so JwtModule has no defaults.
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, AdminController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
