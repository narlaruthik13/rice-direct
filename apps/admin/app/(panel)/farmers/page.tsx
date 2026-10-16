import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Farmers" };

export default function Page() {
  return (
    <ComingSoon
      title="Farmers"
      description="Farmer profiles, their farms and the batches they have sold through Kisa."
      step="Phase 2 · Step 5"
    />
  );
}
