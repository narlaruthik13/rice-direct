"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { type AdminProfile, AdminLoginSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormInput = z.input<typeof AdminLoginSchema>;
type FormOutput = z.output<typeof AdminLoginSchema>;

/** Only same-site relative paths; anything else goes to the dashboard. */
const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormOutput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; admin?: AdminProfile };
      if (!res.ok) {
        setError(body.message ?? "Sign-in failed. Please try again.");
        return;
      }
      toast.success(`Welcome back, ${body.admin?.name ?? "admin"}`);
      router.replace(safeNext(next));
      router.refresh();
    } catch {
      setError("Can't reach the admin server. Check your connection and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
      {error && (
        <p role="alert" data-testid="form-error" className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            Enter a valid email address.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
