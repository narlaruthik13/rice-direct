import { useId } from "react";
import { BAG, BAG_QR } from "@/components/hero/harvest";
import { mulberry32 } from "@/lib/random";

// The Kisa jute sack: shared geometry and art for the Pour scene (HarvestScene),
// the Your Home table (HomeScene), the poster frames and the no-JS final frame, plus
// the printed label as HTML (BagLabel). No GSAP or engine code here, so it is cheap
// to import from the hero shell.

export const JUTE = "#C8A16B";
export const SACK_TOP = -BAG.h;
// Front edge of the open mouth (the near half of the mouth ellipse, ry 9).
export const SACK_BODY = `M${-BAG.mouthHalfW},${SACK_TOP} C-58,-70 -66,-30 -58,-4 Q0,8 58,-4 C66,-30 58,-70 ${BAG.mouthHalfW},${SACK_TOP} Q0,${SACK_TOP + 18} ${-BAG.mouthHalfW},${SACK_TOP} Z`;
export const FLAP_TOP = SACK_TOP - 22;
/** Stitch along the folded top: y on the curve at x (it is a shallow arc). */
export const stitchY = (x: number) => SACK_TOP - 7 - 4 * (1 - (x / 44) ** 2);

/** QR stamp: a fixed 9×9 pattern with finder squares (decorative). */
export const QR_PATH = (() => {
  const rand = mulberry32(412);
  const n = 9;
  const cell = BAG_QR.size / n;
  // Solid 3×3 finder squares in three corners, a clear gutter around them, random data cells elsewhere.
  const finder = (x: number, y: number) => (x < 3 && y < 3) || (x >= n - 3 && y < 3) || (x < 3 && y >= n - 3);
  const gutter = (x: number, y: number) =>
    (x === 3 && (y < 4 || y >= n - 4)) ||
    (y === 3 && (x < 4 || x >= n - 4)) ||
    (x === n - 4 && y < 4) ||
    (y === n - 4 && x < 4);
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const on = finder(x, y) || (!gutter(x, y) && rand() < 0.5);
      if (on)
        d += `M${(x * cell).toFixed(2)},${(y * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h${(-cell).toFixed(2)}Z`;
    }
  }
  return d;
})();

/** Woven jute fill for the sack. */
export function JutePattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill={JUTE} />
      <path d="M0,1.5 H6" stroke="#A97F4B" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M1.5,0 V6" stroke="#A97F4B" strokeOpacity="0.3" strokeWidth="1" />
    </pattern>
  );
}

export const FLAP_PATH = `M-52,${FLAP_TOP + 6} Q0,${FLAP_TOP - 6} 52,${FLAP_TOP + 6} L50,${SACK_TOP + 6} Q0,${SACK_TOP + 18} -50,${SACK_TOP + 6} Z`;
export const STITCH_PATH = `M-44,${stitchY(-44)} Q0,${SACK_TOP - 15} 44,${stitchY(44)}`;
export const SACK_SHADE = "M-58,-4 C-66,-30 -58,-70 -46,-96 C-50,-60 -52,-30 -40,-2 Z";

/** The finished bag (closed, stitched, QR-stamped), as static art: used on the Your Home table. */
export function ClosedSack() {
  const id = useId().replace(/:/g, "");
  return (
    <g>
      <defs>
        <JutePattern id={`${id}-jute`} />
      </defs>
      <path d={SACK_BODY} fill={`url(#${id}-jute)`} stroke="#8A6638" strokeWidth="2" />
      <path d={SACK_SHADE} fill="#000" opacity="0.08" />
      <path d={FLAP_PATH} fill="#B48D58" stroke="#8A6638" strokeWidth="1.5" />
      <path d={STITCH_PATH} fill="none" stroke="#5B3A24" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
      <g transform={`translate(${BAG_QR.x} ${BAG_QR.y}) rotate(-8 ${BAG_QR.size / 2} ${BAG_QR.size / 2})`}>
        <rect x="-2" y="-2" width={BAG_QR.size + 4} height={BAG_QR.size + 4} rx="1.5" fill="#FBF6EA" opacity="0.9" />
        <path d={QR_PATH} fill="#2F4A2A" />
      </g>
    </g>
  );
}

/** What the hero's bag label shows: Kisa + variety + weight (and the batch id). */
export interface BagLabelInfo {
  variety: string;
  weightKg: number;
  /** Missing only on the fallback label, when the catalogue can't be loaded. */
  batchId?: string;
}

/**
 * The bag's printed label, as HTML (no SVG <text>, so it never waits on the web font).
 * Every size is a multiple of --u, one local bag unit, set by whoever places it.
 */
export function BagLabel({ variety, weightKg, batchId, className = "" }: BagLabelInfo & { className?: string }) {
  const u = (n: number) => `calc(var(--u) * ${n})`;
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center overflow-hidden border-field bg-[#FBF6EA] text-center ${className}`}
      style={{ borderWidth: u(1.5), borderRadius: u(4.5), padding: u(3), boxShadow: `0 ${u(1.5)} 0 rgba(0,0,0,0.12)` }}
    >
      <p className="font-bold leading-none tracking-[0.3em] text-field" style={{ fontSize: u(4.25) }}>
        KISA
      </p>
      <p className="font-display font-semibold leading-[1.02] text-[#2E2219]" style={{ marginTop: u(2), fontSize: u(8.5) }}>
        {variety}
      </p>
      <p className="font-extrabold leading-none text-field" style={{ marginTop: u(1), fontSize: u(9.5) }}>
        {weightKg} kg
      </p>
      {batchId && (
        <p className="font-mono leading-none text-[#5A4636]" style={{ marginTop: u(2), fontSize: u(3.25) }}>
          {batchId}
        </p>
      )}
    </div>
  );
}

