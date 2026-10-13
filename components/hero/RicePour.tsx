import type { CSSProperties } from "react";
import gsap from "gsap";
import type { Farmer, Product } from "@/lib/types";
import { RiceBagShape } from "@/components/product/RiceBag";

// Scene 5: white rice pours from the mill's spout into a jute bag printed with
// the farmer's name. The bag fills out as the rice goes in.
//
// Driven by --rp-pour (0→1) on .rp-root (see globals.css). The stream is three
// dashed strokes with round caps (each dash reads as a rice grain); scrubbing
// shifts their dash offset so the grains flow. Reduced motion pins --rp-pour to 1:
// a full bag, no stream.

const STREAMS = [
  { d: "M116,34 Q113,140 117,262", dash: "7 12", offset: 0 },
  { d: "M120,34 Q121,140 120,262", dash: "6 15", offset: 9 },
  { d: "M124,34 Q127,140 123,262", dash: "8 11", offset: 4 },
];

export function RicePour({ product, farmer, className = "" }: { product: Product; farmer: Farmer; className?: string }) {
  return (
    <svg
      className={`rp-root ${className}`}
      viewBox="0 0 240 465"
      role="img"
      aria-label={`Rice pouring into a ${product.bagSizeKg} kg bag labelled ${farmer.name}`}
    >
      {/* Stream first, so the bag covers where the grains drop in */}
      <g className="rp-stream">
        {STREAMS.map((s) => (
          <path
            key={s.d}
            className="rp-flow"
            d={s.d}
            fill="none"
            stroke="#FBF7EE"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={s.dash}
            style={{ "--o": s.offset } as CSSProperties}
          />
        ))}
      </g>

      <g transform="translate(0 160)">
        <RiceBagShape
          farmerName={farmer.name}
          variety={product.variety}
          weightKg={product.bagSizeKg}
          batchId={product.batchId}
          aged={product.age === "aged"}
        />
      </g>

      {/* Mill output spout */}
      <path d="M88,0 L152,0 L136,34 L104,34 Z" fill="#6B4A2E" />
      <rect x="100" y="30" width="40" height="6" rx="2" fill="#4A2F1B" />
    </svg>
  );
}

/** Pour: bag fades in, then --rp-pour 0→1 over `duration`. */
export function ricePourTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const root = scope.querySelector(".rp-root");
  if (!root) return tl;
  return tl
    .fromTo(root, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power1.out" })
    .fromTo(root, { "--rp-pour": 0 }, { "--rp-pour": 1, duration, ease: "none" }, 0.2);
}
