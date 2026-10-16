import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Batches & Products" };

export default function Page() {
  return (
    <ComingSoon
      title="Batches & Products"
      description="Add batches from farmers and partners, set packs and prices, and manage stock."
      step="Phase 2 · Step 5"
    />
  );
}
