import type { CSSProperties } from "react";

// Mill macro (the hero detail): the camera has zoomed into the huller's roller
// window and one golden grain fills the screen. The husk cracks along its seam,
// the two halves peel away, and a shining white rice grain is revealed with a
// soft highlight sweeping across it.
//
// Driven by --mm (0 → 1) on .mm-root; the phases are derived in globals.css:
//   0–0.18 fade in · 0.25–0.4 crack · 0.4–0.62 peel · 0.55–0.8 shine · 0.84–1 fade out

const BOKEH = [
  { x: 180, y: 160, r: 40, o: 0.18 },
  { x: 1030, y: 130, r: 56, o: 0.14 },
  { x: 960, y: 640, r: 30, o: 0.2 },
  { x: 260, y: 620, r: 24, o: 0.22 },
  { x: 1120, y: 420, r: 18, o: 0.3 },
  { x: 90, y: 400, r: 14, o: 0.3 },
];

// Husk half: the upper shell (the lower one is mirrored), with ridges and an awn at the tip.
const SHELL = "M-236,0 C-226,-70 -150,-112 -10,-110 C140,-108 222,-70 246,0 Z";
const RIDGES = "M-190,-38 C-110,-84 90,-86 196,-36 M-140,-70 C-60,-98 70,-98 150,-68";
const CRACK = "M-236,0 L-180,5 L-122,-4 L-62,6 L0,-5 L62,6 L122,-4 L182,5 L246,0";

/** `progress` pins --mm for a static frame; the scroll story tweens it instead. */
export function MillMacro({ className = "", progress }: { className?: string; progress?: number }) {
  return (
    <svg
      className={`mm-root pointer-events-none ${className}`}
      style={progress === undefined ? undefined : ({ "--mm": progress } as CSSProperties)}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mm-bg" gradientUnits="userSpaceOnUse" cx="600" cy="400" r="900">
          <stop offset="0" stopColor="#6A4522" />
          <stop offset="0.55" stopColor="#3A2412" />
          <stop offset="1" stopColor="#1A1009" />
        </radialGradient>
        <linearGradient id="mm-husk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0C759" />
          <stop offset="1" stopColor="#B4841C" />
        </linearGradient>
        <linearGradient id="mm-husk-b" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#D9A93A" />
          <stop offset="1" stopColor="#9C7012" />
        </linearGradient>
        <radialGradient id="mm-rice" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor="#F7F1E4" />
          <stop offset="1" stopColor="#E3D7BF" />
        </radialGradient>
        <radialGradient id="mm-glow">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFE2A0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mm-shine-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id="mm-rice-clip">
          <ellipse rx="206" ry="76" />
        </clipPath>
      </defs>

      {/* warm, lamp-lit backdrop (bleeds past the edges) */}
      <rect x="-1200" y="-800" width="3600" height="2400" fill="url(#mm-bg)" />
      <g fill="#FFD58A">
        {BOKEH.map((b) => (
          <circle key={b.x} cx={b.x} cy={b.y} r={b.r} opacity={b.o} />
        ))}
      </g>

      <g transform="translate(600 410) rotate(-14)">
        <g className="mm-grain">
          {/* soft glow behind the revealed rice */}
          <circle className="mm-glow" r="300" fill="url(#mm-glow)" />

          {/* the rice grain inside */}
          <ellipse rx="206" ry="76" fill="url(#mm-rice)" />
          <path d="M196,-14 Q212,0 196,14" stroke="#D9CCB0" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="-70" cy="-34" rx="92" ry="14" fill="#FFFFFF" opacity="0.7" />
          <g clipPath="url(#mm-rice-clip)">
            <rect className="mm-shine" x="-40" y="-120" width="80" height="240" fill="url(#mm-shine-g)" />
          </g>

          {/* the two husk halves, which peel away */}
          <g className="mm-husk-top">
            <path d={SHELL} fill="url(#mm-husk)" />
            <path d={RIDGES} stroke="#A67E12" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M246,0 L300,-18" stroke="#A67E12" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="-90" cy="-74" rx="70" ry="10" fill="#FFF4C4" opacity="0.45" />
          </g>
          <g className="mm-husk-bot">
            <path d={SHELL} transform="scale(1 -1)" fill="url(#mm-husk-b)" />
            <path d={RIDGES} transform="scale(1 -1)" stroke="#7E5A0C" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <path className="mm-crack" d={CRACK} stroke="#4A2E08" strokeWidth="5" fill="none" strokeLinejoin="round" pathLength="100" />
        </g>
      </g>
    </svg>
  );
}
