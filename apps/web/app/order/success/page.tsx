import type { Metadata } from "next";
import { OrderSuccess } from "@/components/checkout/OrderSuccess";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <OrderSuccess />
    </div>
  );
}
