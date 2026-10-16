import type { AdminProfile } from "@kisa/shared";
import { Shell } from "@/components/shell/Shell";
import { apiFetch } from "@/lib/api";

// Every page in the panel needs the signed-in admin; never cache per-user pages.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await apiFetch<AdminProfile>("/admin/me");
  return <Shell admin={admin}>{children}</Shell>;
}
