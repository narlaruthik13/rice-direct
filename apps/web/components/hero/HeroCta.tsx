import Link from "next/link";
import { HomeScene } from "@/components/hero/HomeScene";
import type { BagLabelInfo } from "@/components/hero/Sack";
import { buttonClasses } from "@/components/ui/Button";
import { getTrace, products } from "@/data/mock";
import { formatDate } from "@/lib/format";
import { typeLabel } from "@/lib/rice";

// The hero's product and the closing call to action, shared by the scroll story,
// the reduced-motion poster frames and the no-JS final frame. No GSAP here.

// The bag in the final scene: the first featured pack in stock.
export const heroProduct = products.find((p) => p.featured && p.inStock) ?? products[0];
const heroPassport = getTrace(heroProduct.batchId)!.passport;

export const heroLabel: BagLabelInfo = {
  variety: heroProduct.variety.name,
  weightKg: heroProduct.bagSizeKg,
  batchId: heroProduct.batchId,
};

/** Final step card: the ending line, plus Shop Now and the Quality Passport. Compact on short (landscape phone) screens. */
export function PourCta({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full max-w-sm rounded-2xl bg-rice/95 p-6 text-soil shadow-card short:max-w-xs short:p-4 ${className}`}>
      <p className="text-xs font-bold tracking-widest text-paddy-dark">08</p>
      <h2 className="mt-1 text-2xl font-semibold text-field short:text-lg">From the mill to your plate.</h2>
      <p className="mt-2 text-sm leading-relaxed text-soil/80 short:hidden">
        {heroProduct.variety.name}, {typeLabel(heroProduct.riceType).toLowerCase()} rice, milled on {formatDate(heroPassport.millingDate)} and packed in a
        Kisa bag. Every bag carries batch <span className="font-mono text-xs">{heroProduct.batchId}</span> and its Quality Passport.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 short:mt-3">
        <Link href="/shop" className={buttonClasses("primary")}>
          Shop Now <span aria-hidden="true">→</span>
        </Link>
        <Link href={`/trace/${heroProduct.batchId}`} className={buttonClasses("secondary")}>
          See the Quality Passport
        </Link>
      </div>
    </div>
  );
}

/** Where the CTA card sits over the Your Home scene: below the bag, or to its right on wide screens. */
export const CTA_POSITION =
  "pointer-events-none absolute inset-0 flex items-end justify-center px-4 pb-14 wide:items-center wide:justify-end wide:pb-0 wide:pr-[6%]";

/** The story's last frame, fully shown: the bag on the kitchen table beside steaming rice, plus the CTA. */
export function FinalFrame({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <HomeScene label={heroLabel} className="absolute inset-0" />
      <div className={CTA_POSITION}>
        <PourCta className="pointer-events-auto" />
      </div>
    </div>
  );
}
