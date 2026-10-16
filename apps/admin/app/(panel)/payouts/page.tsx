import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Payouts" };

export default function Page() {
  return (
    <ComingSoon
      title="Payouts"
      description="Weekly settlements to each mill for the rice it packed and Kisa sold."
      step="Coming after Phase 2"
    />
  );
}
