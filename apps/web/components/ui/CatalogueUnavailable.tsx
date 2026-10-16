import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

/** Shown instead of products when the catalogue API can't be reached (the error is logged on the server). */
export function CatalogueUnavailable({ retryHref, className = "" }: { retryHref: string; className?: string }) {
  return (
    <div role="status" className={`rounded-2xl border border-dashed border-husk/30 bg-white/60 p-10 text-center ${className}`}>
      <p className="font-display text-2xl text-field">We&apos;re having trouble loading rice right now</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-soil/70">
        Our shelves will be back in a moment. Please try again in a minute; your cart is safe.
      </p>
      {/* A plain link (full reload), so the page asks the server again. */}
      <a href={retryHref} className={buttonClasses("primary", "mt-6")}>
        Try again
      </a>
      <p className="mt-4 text-sm">
        <Link href="/" className="text-field underline decoration-paddy underline-offset-4">
          Back to home
        </Link>
      </p>
    </div>
  );
}
