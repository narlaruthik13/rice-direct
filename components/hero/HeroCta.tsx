import Link from "next/link";
import { HomeScene } from "@/components/hero/HomeScene";
import type { BagLabelInfo } from "@/components/hero/Sack";
import { buttonClasses } from "@/components/ui/Button";
import { getFarmer, getPartner, getRiceBatch, riceProducts } from "@/data/mock";
import { formatDate } from "@/lib/format";

// The hero's product and the closing call to action, shared by the scroll story,
// the reduced-motion poster frames and the no-JS final frame. No GSAP here.

// The bag in the final scene: the first featured farmer-owned rice, packed in the farmer's name.
export const heroProduct = riceProducts.find((p) => p.featured && p.salesModel === "FARMER_OWNED") ?? riceProducts[0];
export const heroFarmer = getFarmer(heroProduct.farmerId)!;
const heroMill = getPartner(heroProduct.partnerId)!;
export const heroBatch = getRiceBatch(heroProduct.batchId)!;

export const heroLabel: BagLabelInfo = {
  farmerName: heroFarmer.name,
  variety: heroProduct.variety,
  weightKg: heroProduct.bagSizeKg,
  batchId: heroBatch.id,
};

/** Final step card: whose bag this is, plus Shop Now and Trace links. Compact on short (landscape phone) screens. */
export function PourCta({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full max-w-sm rounded-2xl bg-rice/95 p-6 text-soil shadow-card short:max-w-xs short:p-4 ${className}`}>
      <p className="text-xs font-bold tracking-widest text-paddy-dark">08</p>
      <h2 className="mt-1 text-2xl font-semibold text-field short:text-lg">From {heroFarmer.name}&apos;s field to your plate.</h2>
      <p className="mt-2 text-sm leading-relaxed text-soil/80 short:hidden">
        {heroFarmer.name}&apos;s {heroProduct.name} from {heroFarmer.village}, milled at {heroMill.name} on{" "}
        {formatDate(heroBatch.millingDate)}. Every bag carries batch <span className="font-mono text-xs">{heroBatch.id}</span>.
      </p>
      <div className="mt-5 flex flex-wrap gap-3 short:mt-3">
        <Link href="/shop" className={buttonClasses("primary")}>
          Shop Now <span aria-hidden="true">→</span>
        </Link>
        <Link href={`/trace/${heroBatch.id}`} className={buttonClasses("secondary")}>
          Trace this bag
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
