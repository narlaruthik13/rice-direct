import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <ComingSoon
      title="Settings"
      description="Admin users, roles and platform settings."
      step="Coming after Phase 2"
    />
  );
}
