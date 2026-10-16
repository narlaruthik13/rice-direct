import { useId, type CSSProperties } from "react";
import { OnionBagShape } from "@/components/product/OnionBag";

// The onion story as one SVG: pull → dry → sort → pack.
// Driven entirely by CSS variables on .os-root (--os-pull, --os-dry, --os-sort,
// --os-pack, each 0→1; see globals.css). OnionStory scrubs them with GSAP;
// OnionStoryStrip pins them inline to draw static frames.

export interface OnionBagInfo {
  farmerName: string;
  variety: string;
  weightKg: number;
  batchId: string;
  bulbColor: string;
}

type Vars = Partial<Record<"--os-pull" | "--os-dry" | "--os-sort" | "--os-pack", number>>;

// Field: neck x, bulb radius, tilt when lying after pulling (deg)
const PLANTS = [
  { x: 390, r: 24, tilt: -72 },
  { x: 460, r: 28, tilt: 64 },
  { x: 530, r: 22, tilt: -80 },
  { x: 600, r: 30, tilt: 76 },
  { x: 670, r: 26, tilt: -66 },
  { x: 740, r: 23, tilt: 84 },
  { x: 810, r: 27, tilt: -60 },
];
const LEAVES = [
  { a: -0.38, len: 128, droop: -38 },
  { a: 0.05, len: 150, droop: 26 },
  { a: 0.42, len: 118, droop: 44 },
];

// Sorting: bins (x centre) and the order bulbs ride the belt.
const BINS = {
  small: { x: 470, r: 16, label: "Small", mm: "40–55 mm" },
  medium: { x: 600, r: 21, label: "Medium", mm: "55–65 mm" },
  large: { x: 730, r: 26, label: "Large", mm: "65+ mm" },
} as const;
type Size = keyof typeof BINS;
const BELT_Y = 392;
const BELT_START = 300;
const CRATE_FLOOR = 546;
const ORDER: Size[] = ["medium", "small", "large", "small", "medium", "large", "small", "large", "medium"];
const SORT_BULBS = ORDER.map((size, i) => {
  const k = ORDER.slice(0, i).filter((s) => s === size).length; // 0,1,2 within its bin
  const bin = BINS[size];
  return { i, size, r: bin.r, bx: bin.x + (k - 1) * (bin.r * 1.25), y1: CRATE_FLOOR - bin.r - (k === 1 ? 6 : 0) };
});

// Packing: large bulbs arc from the crate side into the bag mouth.
const FLY = [0, 1, 2, 3].map((i) => ({ i, x0: 330 + i * 18, y0: 560, x1: 590 + (i % 2) * 20, y1: 300 }));

function Bulb({ r, papery = true }: { r: number; papery?: boolean }) {
  return (
    <>
      <ellipse className="os-bulb-skin" cx="0" cy="0" rx={r} ry={r * 0.92} />
      {papery && <ellipse className="os-papery" cx={-r * 0.3} cy={-r * 0.3} rx={r * 0.45} ry={r * 0.3} fill="#FFFFFF" />}
      <path d={`M0,${-r * 0.92} Q${r * 0.35},0 0,${r * 0.92}`} stroke="#000000" strokeOpacity="0.14" fill="none" />
      <path d={`M-3,${-r * 0.9} L0,${-r * 1.18} L3,${-r * 0.9} Z`} className="os-bulb-skin" />
    </>
  );
}

export function OnionScene({
  bag,
  className = "",
  vars,
  viewBox = "0 0 1200 800",
  preserveAspectRatio = "xMidYMax slice",
  label = "An onion harvest: pulled from the soil, dried in the sun, sorted by size and packed into a mesh bag",
}: {
  bag: OnionBagInfo;
  className?: string;
  vars?: Vars;
  viewBox?: string;
  preserveAspectRatio?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      className={`os-root ${className}`}
      style={{ ...(vars as CSSProperties), "--bulb": bag.bulbColor } as CSSProperties}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="os-sky-top" />
          <stop offset="1" className="os-sky-bottom" />
        </linearGradient>
        <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5E3C" />
          <stop offset="1" stopColor="#4A2F1B" />
        </linearGradient>
      </defs>

      {/* Sky, sun and hills (shared by every scene) */}
      <rect width="1200" height="800" fill={`url(#${id}-sky)`} />
      <circle className="os-sun" cx="850" cy="170" r="52" />
      <path d="M0,520 C160,480 300,500 430,486 C580,468 700,500 840,482 C980,466 1100,492 1200,480 L1200,560 L0,560 Z" fill="#6B4A6B" opacity="0.28" />

      {/* ---------- Scenes 1+2: the field ---------- */}
      <g className="os-field">
        <rect y="545" width="1200" height="255" fill="#9C6B45" />
        {PLANTS.map((p, i) => (
          <g key={p.x} transform={`translate(${p.x} 560)`}>
            <g className="os-plant" style={{ "--i": i, "--tilt": p.tilt } as CSSProperties}>
              {LEAVES.map((l, k) => {
                const tipX = Math.sin(l.a) * l.len * 0.7;
                return (
                  <path
                    key={k}
                    className="os-leaf"
                    style={{ "--droop": l.droop } as CSSProperties}
                    d={`M0,0 Q${(tipX * 0.4).toFixed(1)},${(-l.len * 0.55).toFixed(1)} ${tipX.toFixed(1)},${-l.len}`}
                    fill="none"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                );
              })}
              <g transform={`translate(0 ${p.r})`}>
                <Bulb r={p.r} />
                <g stroke="#E9D9B5" strokeWidth="1.5" strokeLinecap="round">
                  <path d={`M-6,${p.r * 0.9} l-4,10 M0,${p.r * 0.92} l0,12 M6,${p.r * 0.9} l4,10`} />
                </g>
              </g>
            </g>
          </g>
        ))}
        {/* Front soil hides the buried bulbs until they are pulled */}
        <path d="M0,556 C300,550 900,562 1200,552 L1200,800 L0,800 Z" fill={`url(#${id}-soil)`} />
        <g stroke="#3B2616" strokeOpacity="0.35" strokeWidth="2" fill="none">
          <path d="M0,620 C400,610 800,630 1200,615" />
          <path d="M0,720 C400,710 800,734 1200,716" />
        </g>
      </g>

      {/* ---------- Scene 3: the packhouse sorting line ---------- */}
      <g className="os-sorting">
        <rect y="580" width="1200" height="220" fill="#B08560" />
        <path d="M230,262 L600,150 L970,262 Z" fill="#8B5E3C" />
        <rect x="250" y="260" width="700" height="322" fill="#EAD9BA" />
        <g stroke="#CDB58C" strokeWidth="2">
          {[330, 410, 490, 570, 650, 730, 810, 890].map((x) => (
            <line key={x} x1={x} y1="262" x2={x} y2="580" />
          ))}
        </g>

        {/* Belt with spinning rollers */}
        <g stroke="#4A2F1B" strokeWidth="6">
          <line x1="300" y1={BELT_Y + 12} x2="300" y2="580" />
          <line x1="900" y1={BELT_Y + 12} x2="900" y2="580" />
        </g>
        <rect x="290" y={BELT_Y} width="620" height="14" rx="7" fill="#4A2F1B" />
        {Array.from({ length: 15 }, (_, k) => 302 + k * 43).map((x) => (
          <g key={x} className="os-roller">
            <circle cx={x} cy={BELT_Y + 7} r="6" fill="#8B5E3C" stroke="#2E2219" strokeWidth="1.5" />
            <line x1={x - 5} y1={BELT_Y + 7} x2={x + 5} y2={BELT_Y + 7} stroke="#2E2219" strokeWidth="1.5" />
          </g>
        ))}

        {/* Crates */}
        {(Object.keys(BINS) as Size[]).map((size) => {
          const b = BINS[size];
          return (
            <g key={size}>
              <rect x={b.x - 58} y="468" width="116" height="84" rx="4" fill="#A8774A" stroke="#6B4A2E" strokeWidth="2" />
              <line x1={b.x - 58} y1="496" x2={b.x + 58} y2="496" stroke="#6B4A2E" strokeOpacity="0.5" strokeWidth="2" />
              <line x1={b.x - 58} y1="524" x2={b.x + 58} y2="524" stroke="#6B4A2E" strokeOpacity="0.5" strokeWidth="2" />
              <text x={b.x} y="578" textAnchor="middle" fontSize="17" fontWeight="700" fill="#2E2219">
                {b.label}
              </text>
              <text x={b.x} y="597" textAnchor="middle" fontSize="12" fill="#5A4636">
                {b.mm}
              </text>
            </g>
          );
        })}

        {/* Bulbs riding the belt and dropping into their crate */}
        {SORT_BULBS.map((b) => (
          <g
            key={b.i}
            className="os-sort-bulb"
            style={
              {
                "--i": b.i,
                "--r": b.r,
                "--x0": BELT_START,
                "--bx": b.bx,
                "--y0": BELT_Y - b.r,
                "--y1": b.y1,
              } as CSSProperties
            }
          >
            <Bulb r={b.r} />
          </g>
        ))}
        {/* Crate fronts so bulbs sit inside */}
        {(Object.keys(BINS) as Size[]).map((size) => (
          <rect key={size} x={BINS[size].x - 58} y="526" width="116" height="26" fill="#A8774A" stroke="#6B4A2E" strokeWidth="2" />
        ))}
      </g>

      {/* ---------- Scene 4: into the mesh bag ---------- */}
      <g className="os-packing">
        <rect y="600" width="1200" height="200" fill="#B08560" />
        <rect x="380" y="582" width="440" height="20" rx="4" fill="#8B5E3C" />
        <rect x="400" y="600" width="14" height="120" fill="#6B4A2E" />
        <rect x="786" y="600" width="14" height="120" fill="#6B4A2E" />
        <g transform="translate(456 236) scale(1.2)">
          <g className="os-bag">
            <OnionBagShape
              farmerName={bag.farmerName}
              variety={bag.variety}
              weightKg={bag.weightKg}
              batchId={bag.batchId}
              bulbColor={bag.bulbColor}
            />
          </g>
        </g>
        {FLY.map((f) => (
          <g
            key={f.i}
            className="os-fly"
            style={{ "--i": f.i, "--x0": f.x0, "--y0": f.y0, "--x1": f.x1, "--y1": f.y1 } as CSSProperties}
          >
            <Bulb r={24} />
          </g>
        ))}
      </g>
    </svg>
  );
}
