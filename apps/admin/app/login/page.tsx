import type { Metadata } from "next";
import { Logo } from "@kisa/ui/logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  expired: "Your session has ended. Please sign in again.",
  "signed-out": "You have signed out.",
  unavailable: "Can't reach the Kisa server right now. Please try again in a moment.",
};

export default function LoginPage({ searchParams }: { searchParams: { next?: string; reason?: string; error?: string } }) {
  const notice = NOTICES[searchParams.error ?? searchParams.reason ?? ""];
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={40} />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-husk">Admin</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your Kisa admin email and password.</p>
          {notice && (
            <p role="status" className="mt-4 rounded-md bg-secondary px-3 py-2 text-sm">
              {notice}
            </p>
          )}
          <LoginForm next={searchParams.next} />
        </div>
      </div>
    </main>
  );
}
