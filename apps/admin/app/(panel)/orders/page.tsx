import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return (
    <ComingSoon
      title="Orders"
      description="Follow every order from placed to delivered: status updates, stock and customer details."
      step="Phase 2 · Step 6"
    />
  );
}
