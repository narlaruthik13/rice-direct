import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Partners" };

export default function Page() {
  return (
    <ComingSoon
      title="Partners"
      description="Rice mills and onion packhouses, their processing fees and certifications."
      step="Phase 2 · Step 5"
    />
  );
}
