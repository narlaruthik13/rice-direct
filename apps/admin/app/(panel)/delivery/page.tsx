import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Delivery" };

export default function Page() {
  return (
    <ComingSoon
      title="Delivery"
      description="Serviceable Hyderabad pincodes, delivery slots and delivery assignments."
      step="Phase 2 · Step 7"
    />
  );
}
