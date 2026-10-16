import { Shell } from "@/components/shell/Shell";
import { getMe } from "@/lib/me";

// Every page in the panel needs the signed-in admin; never cache per-user pages.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getMe();
  return <Shell admin={admin}>{children}</Shell>;
}
