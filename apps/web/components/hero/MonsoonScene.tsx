import type { CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";

// Scene 1 "Monsoon":
//   1. macro close-up: one seed in wet mud, a sprout pushes up
//   2. zoom out to the wet field: puddles with ripples, light rain
//   3. a farmer silhouette transplants seedlings row by row; the seedlings are the
//      real PaddyField stalks, revealed behind the farmer (field renderer's `plant`)
//
// Driven by --mn (0 → 1) on .mn-root (see globals.css). Rain is CSS-animated
// lines (80 desktop / 30 mobile) on a .season-root, so it fades as --season clears.

const DROPS = (() => {
  const rand = mulberry32(2026);
  return Array.from({ length: 80 }, () => ({
    left: Math.round(rand() * 1000) / 10,
    len: Math.round(14 + rand() * 16),
    dur: Math.round((0.55 + rand() * 0.45) * 100) / 100,
    delay: -Math.round(rand() * 100) / 100,
    alpha: Math.round((0.45 + rand() * 0.45) * 100) / 100,
  }));
})();

// Puddles on the field soil (viewBox units), each with two ripple rings.
const PUDDLES = [
  { x: 470, y: 690, rx: 70, ry: 12 },
  { x: 720, y: 640, rx: 55, ry: 9 },
  { x: 610, y: 760, rx: 90, ry: 14 },
];

/** Bent-over farmer with a conical hat, planting a seedling; drawn with feet at (0,0). */
function Farmer() {
  return (
    <g>
      <g className="mn-walk">
        {/* legs */}
        <path d="M-6,-60 L-16,0 M8,-60 L18,-2" stroke="#3B2A1E" strokeWidth="9" strokeLinecap="round" />
        {/* bent torso */}
        <path d="M-10,-58 C-6,-92 20,-112 46,-110 L52,-96 C30,-96 14,-80 10,-56 Z" fill="#3B2A1E" />
        {/* arm reaching down with a seedling */}
        <path d="M40,-100 C52,-80 56,-56 58,-30" stroke="#3B2A1E" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M58,-30 l-4,-16 M58,-30 l4,-15 M58,-30 l0,-18" stroke="#6FA544" strokeWidth="2.5" strokeLinecap="round" />
        {/* other arm holding a seedling bundle */}
        <path d="M30,-104 C18,-96 8,-86 0,-78" stroke="#3B2A1E" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M-2,-78 l-10,-22 M-2,-78 l-4,-24 M-2,-78 l4,-23 M-2,-78 l10,-20" stroke="#6FA544" strokeWidth="3" strokeLinecap="round" />
        {/* head + conical hat */}
        <circle cx="56" cy="-116" r="9" fill="#3B2A1E" />
        <path d="M30,-118 L58,-140 L86,-114 Z" fill="#8B5E3C" />
      </g>
    </g>
  );
}

/** `progress` pins --mn for a static frame; the scroll story tweens it instead. */
export function MonsoonScene({ className = "", progress }: { className?: string; progress?: number }) {
  return (
    <div
      className={`mn-root pointer-events-none ${className}`}
      style={progress === undefined ? undefined : ({ "--mn": progress } as CSSProperties)}
      aria-hidden="true"
    >
      {/* Wet field: puddles + ripples, and the farmer (same viewBox/slice as PaddyField so rows align) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
        <g className="mn-puddles season-root">
          {PUDDLES.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              <ellipse rx={p.rx} ry={p.ry} fill="#9DB0C2" opacity="0.55" />
              <ellipse rx={p.rx * 0.6} ry={p.ry * 0.45} fill="#DCE6EE" opacity="0.35" />
              {[0, 1].map((k) => (
                <ellipse
                  key={k}
                  className="mn-ripple"
                  rx={p.rx * 0.5}
                  ry={p.ry * 0.5}
                  fill="none"
                  stroke="#EEF3F7"
                  strokeWidth="1.5"
                  style={{ animationDelay: `${-(i * 0.6 + k * 0.9)}s` } as CSSProperties}
                />
              ))}
            </g>
          ))}
        </g>
        <g transform="translate(0 668)">
          <g className="mn-farmer">
            <Farmer />
          </g>
        </g>
      </svg>

      {/* Macro close-up: a seed in wet mud; shrinks away (zoom out) to reveal the field */}
      <svg className="mn-macro absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" overflow="visible">
        <defs>
          <linearGradient id="mn-mud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6A4630" />
            <stop offset="1" stopColor="#2E1D12" />
          </linearGradient>
          <linearGradient id="mn-seed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9AC4A" />
            <stop offset="1" stopColor="#8A6424" />
          </linearGradient>
        </defs>
        {/* Mud extends far past the edges so the shrinking close-up never shows a hard rectangle */}
        <path d="M-900,436 C-400,426 0,446 260,428 C520,450 760,430 960,420 C1300,440 1700,426 2100,434 L2100,1500 L-900,1500 Z" fill="url(#mn-mud)" />
        {/* wet sheen and mud lumps */}
        <g fill="#C9D2D6" opacity="0.16">
          <ellipse cx="300" cy="520" rx="160" ry="10" />
          <ellipse cx="900" cy="560" rx="200" ry="12" />
          <ellipse cx="560" cy="700" rx="260" ry="14" />
        </g>
        <g fill="#24170E" opacity="0.45">
          <ellipse cx="180" cy="610" rx="70" ry="22" />
          <ellipse cx="1010" cy="660" rx="90" ry="26" />
          <ellipse cx="420" cy="760" rx="110" ry="24" />
        </g>
        {/* sprout (behind the mud lip, rises from the seed) */}
        <g className="mn-sprout">
          <path d="M588,578 C580,500 600,440 618,372" stroke="#7FB24A" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M618,372 C580,340 548,346 532,362 C566,376 596,380 618,372 Z" fill="#8BC34A" />
          <path d="M618,372 C650,330 690,326 706,338 C676,362 646,374 618,372 Z" fill="#7FB24A" />
        </g>
        {/* the seed, half buried */}
        <g transform="translate(600 610) rotate(-14)">
          <ellipse rx="112" ry="44" fill="url(#mn-seed)" />
          <path d="M-90,-8 C-40,-26 40,-26 92,-6 M-86,10 C-30,-4 40,-4 90,12" stroke="#7A5418" strokeOpacity="0.55" strokeWidth="3" fill="none" />
          <ellipse cx="-30" cy="-20" rx="40" ry="8" fill="#FFFFFF" opacity="0.25" />
        </g>
        <path d="M380,640 C470,618 560,630 640,628 C730,626 800,618 860,640 L900,800 L340,800 Z" fill="#3A2416" />
        {/* water droplets on the mud */}
        <g fill="#FFFFFF" opacity="0.55">
          <circle cx="470" cy="590" r="5" />
          <circle cx="742" cy="604" r="4" />
          <circle cx="660" cy="560" r="3" />
          <circle cx="520" cy="660" r="4" />
        </g>
      </svg>

      {/* Light rain: CSS-animated lines (30 shown under 640px). Fades as the season clears. */}
      <div className="mn-rain season-root absolute inset-0 overflow-hidden">
        {DROPS.map((d, i) => (
          <span
            key={i}
            className="mn-drop"
            style={
              {
                left: `${d.left}%`,
                "--len": `${d.len}px`,
                "--dur": `${d.dur}s`,
                "--delay": `${d.delay}s`,
                opacity: d.alpha,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
