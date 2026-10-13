import type { CategoryId, SalesModel } from "@/lib/types";
import { salesModelInfo } from "@/lib/categories";

interface SalesModelBadgeProps {
  model: SalesModel;
  categoryId: CategoryId;
  size?: "sm" | "md";
  className?: string;
}

/** "Farmer-Owned" or "Mill-Direct" / "Packhouse-Direct", with the meaning on hover and for screen readers. */
export function SalesModelBadge({ model, categoryId, size = "sm", className = "" }: SalesModelBadgeProps) {
  const info = salesModelInfo(model, categoryId);
  const farmerOwned = model === "FARMER_OWNED";

  return (
    <span
      title={info.description}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      } ${farmerOwned ? "bg-white/90 text-field ring-field/30" : "bg-white/90 text-husk-dark ring-husk/35"} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {farmerOwned ? (
          <path d="M12 21v-8m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0 0C12 9 9 7 5 7c0 4 3 6 7 6Z" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M3 10l9-6 9 6v10H3V10Zm5 10v-6h8v6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {info.label}
      <span className="sr-only">: {info.description}</span>
    </span>
  );
}
