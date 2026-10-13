import { useId, type CSSProperties } from "react";
import gsap from "gsap";

// Scene 4 close-up: paddy drops through the huller's rubber rollers, lands in a
// row, and each grain's husk cracks into two halves that fly off, leaving white rice.
//
// Driven by one CSS variable, --ms-mill (0→1), on .ms-root (see globals.css).
// Each grain staggers by its --i. Reduced motion pins --ms-mill to a mid-way
// value so the static picture shows the husk-to-rice sequence.

const NIP_X = 300; // where grains leave the rollers
const SLOT_Y = 200;
const GRAINS = [
  { x: 140, tilt: -16 },
  { x: 220, tilt: 10 },
  { x: 300, tilt: -8 },
  { x: 380, tilt: 14 },
  { x: 460, tilt: -12 },
];

function Roller({ cx, className }: { cx: number; className: string }) {
  return (
    <g className={className}>
      <circle cx={cx} cy="78" r="34" fill="#6B4A2E" stroke="#2E2219" strokeWidth="3" />
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={cx - 28}
          y1="78"
          x2={cx + 28}
          y2="78"
          stroke="#2E2219"
          strokeOpacity="0.5"
          strokeWidth="2"
          transform={`rotate(${a} ${cx} 78)`}
        />
      ))}
      <circle cx={cx} cy="78" r="8" fill="#D4A62A" />
    </g>
  );
}

export function MillingScene({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const huskFill = `url(#${id}-husk)`;

  return (
    <svg className={`ms-root ${className}`} viewBox="0 0 600 300" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-husk`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9C04A" />
          <stop offset="1" stopColor="#B0821A" />
        </linearGradient>
      </defs>

      {/* Hopper full of paddy, feeding two counter-rotating rollers */}
      <path d="M210,0 L390,0 L338,40 L262,40 Z" fill="#8B5E3C" />
      <g fill="#D4A62A">
        {[232, 256, 280, 304, 328, 352].map((x, i) => (
          <ellipse key={x} cx={x} cy={i % 2 ? 14 : 20} rx="9" ry="4" transform={`rotate(${i * 25} ${x} 17)`} />
        ))}
      </g>
      <Roller cx={NIP_X - 36} className="ms-roller-a" />
      <Roller cx={NIP_X + 36} className="ms-roller-b" />

      {GRAINS.map((g, i) => (
        <g key={g.x} transform={`translate(${g.x} ${SLOT_Y})`}>
          <g className="ms-grain" style={{ "--i": i, "--dx": NIP_X - g.x } as CSSProperties}>
            <g transform={`rotate(${g.tilt})`}>
              <g className="ms-rice">
                <ellipse rx="31" ry="12" fill="#FBF8F0" stroke="#DCCFB4" strokeWidth="1.5" />
                <ellipse cx="-8" cy="-4" rx="12" ry="3" fill="#FFFFFF" opacity="0.8" />
              </g>
              <g className="ms-husk-top">
                <path d="M-38,0 Q-20,-21 0,-18 Q24,-16 40,0 Z" fill={huskFill} />
                <path d="M-28,-6 Q0,-14 30,-5" stroke="#A67E12" strokeWidth="1.5" fill="none" />
                <path d="M40,0 L49,-4" stroke="#A67E12" strokeWidth="2" strokeLinecap="round" />
              </g>
              <g className="ms-husk-bottom">
                <path d="M-38,0 Q-20,21 0,18 Q24,16 40,0 Z" fill={huskFill} />
                <path d="M-28,6 Q0,14 30,5" stroke="#A67E12" strokeWidth="1.5" fill="none" />
              </g>
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Milling close-up: fades in, then --ms-mill 0→1 over `duration`. */
export function millingSceneTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const root = scope.querySelector(".ms-root");
  if (!root) return tl;
  return tl
    .fromTo(root, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power1.out" })
    .fromTo(root, { "--ms-mill": 0 }, { "--ms-mill": 1, duration, ease: "none" }, 0.15);
}
