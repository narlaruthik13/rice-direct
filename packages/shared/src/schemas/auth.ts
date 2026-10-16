// Request schemas for admin auth. Used by apps/api for validation and by apps/admin for forms.
import { z } from "zod";

export const AdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1, "Password is required").max(200),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1).max(2048),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
