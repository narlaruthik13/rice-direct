import type { CSSProperties } from "react";

// A few birds crossing the bright Grow sky. Flight is scroll-driven by one
// variable, --bd (0 → 1), on .bd-root (6 small nodes restyle); wings flap with a
// tiny CSS loop. Same viewBox/slice as the field so they sit above the horizon.

const BIRDS = [
  { x0: -160, speed: 1480, y: 170, s: 1.1, flap: 0 },
  { x0: -230, speed: 1520, y: 205, s: 0.9, flap: -0.2 },
  { x0: -110, speed: 1400, y: 236, s: 0.8, flap: -0.35 },
  { x0: -300, speed: 1560, y: 150, s: 1.0, flap: -0.1 },
  { x0: -60, speed: 1360, y: 262, s: 0.7, flap: -0.27 },
];

export function Birds({ className = "" }: { className?: string }) {
  return (
    <svg className={`bd-root ${className}`} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {BIRDS.map((b, i) => (
        <g key={i} className="bd-bird" style={{ "--bx": b.x0, "--bs": b.speed, "--by": b.y } as CSSProperties}>
          <g transform={`scale(${b.s})`}>
            <path
              className="bd-wing"
              d="M-13,0 Q-6.5,-8 0,0 Q6.5,-8 13,0"
              stroke="#2E2219"
              strokeOpacity="0.75"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ animationDelay: `${b.flap}s` }}
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
