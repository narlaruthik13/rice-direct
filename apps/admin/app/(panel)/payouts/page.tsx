import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Payouts" };

export default function Page() {
  return (
    <ComingSoon
      title="Payouts"
      description="Weekly settlements to farmers and partners, split by sales model."
      step="Coming after Phase 2"
    />
  );
}
