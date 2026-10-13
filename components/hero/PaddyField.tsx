import type { CSSProperties } from "react";
import gsap from "gsap";
import { mulberry32 } from "@/lib/random";

// Scene 1 + 2 of the hero: paddy stalks grow from the soil, sway, then ripen
// from green to gold while the grain heads bend under their weight.
//
// Everything is driven by CSS variables on the <svg class="pf-root">
// (--pf-grow, --pf-bend and colours; see globals.css). GSAP only scrubs those
// variables, and the reduced-motion media query pins them to the final
// "ripe" values, so the static fallback needs no JavaScript.

const r1 = (n: number) => Math.round(n * 10) / 10;

interface Leaf {
  y0: number;
  len: number;
  side: 1 | -1;
}

interface Stalk {
  x: number;
  height: number;
  lean: number;
  delay: number; // 0..0.45, when this stalk starts growing within --pf-grow
  bend: number; // degrees the head droops when fully ripe
  swayDur: number;
  swayDelay: number;
  leaves: Leaf[];
}

interface Row {
  y: number;
  scale: number;
  opacity: number;
  stalks: Stalk[];
}

export const VIEW_W = 1200;
export const VIEW_H = 800;

function buildRows(): Row[] {
  const rand = mulberry32(20260413);
  const rows = [
    { y: 520, scale: 0.5, opacity: 0.8, count: 24 },
    { y: 615, scale: 0.72, opacity: 0.92, count: 18 },
    { y: 735, scale: 1, opacity: 1, count: 12 },
  ];

  return rows.map(({ count, ...row }) => ({
    ...row,
    stalks: Array.from({ length: count }, (_, i) => {
      const leafCount = 3;
      return {
        x: r1(((i + 0.5) / count) * (VIEW_W + 40) - 20 + (rand() - 0.5) * 30),
        height: r1(190 + rand() * 70),
        lean: r1((rand() - 0.5) * 30),
        delay: r1(rand() * 0.45 * 100) / 100,
        bend: r1((100 + rand() * 40) * (rand() < 0.8 ? 1 : -1)),
        swayDur: r1(3 + rand() * 2.5),
        swayDelay: r1(-rand() * 5),
        leaves: Array.from({ length: leafCount }, (_, k) => ({
          y0: r1(6 + rand() * 30),
          len: r1(70 + rand() * 60),
          side: (k % 2 === 0 ? 1 : -1) as 1 | -1,
        })),
      };
    }),
  }));
}

const ROWS = buildRows();

/**
 * Centres of the ripe (fully bent) grain heads in the mid and front rows, in
 * viewBox units. GrainSpill uses these as the points grains fall from.
 */
export const HEAD_POINTS = ROWS.slice(1).flatMap((row) =>
  row.stalks.map((stalk) => {
    const theta = (stalk.bend * Math.PI) / 180;
    const r = 33 * 1.4; // half the head length x its scale
    const hx = stalk.lean + r * Math.sin(theta);
    const hy = -stalk.height - r * Math.cos(theta);
    return { x: r1(stalk.x + hx * row.scale), y: r1(row.y + hy * row.scale) };
  }),
);

function leafPath({ y0, len, side }: Leaf) {
  const s = side;
  return `M0,${-y0} Q${r1(s * len * 0.22)},${r1(-y0 - len * 0.55)} ${r1(s * len * 0.34)},${r1(-y0 - len)} Q${r1(s * len * 0.06)},${r1(-y0 - len * 0.5)} 0,${-y0 - 9} Z`;
}

/** One grain head (panicle), hanging up from (0,0). Reused via <use>. */
function HeadSymbol() {
  const pairs = Array.from({ length: 7 }, (_, k) => -(6 + k * 8));
  return (
    <g id="pf-head">
      <line className="pf-rachis" x1="0" y1="0" x2="0" y2="-62" strokeWidth="1.4" strokeLinecap="round" />
      {pairs.map((y) => (
        <g key={y}>
          <ellipse className="pf-grain" cx="-4" cy={y} rx="2.6" ry="5.5" transform={`rotate(-28 -4 ${y})`} />
          <ellipse className="pf-grain" cx="4" cy={y} rx="2.6" ry="5.5" transform={`rotate(28 4 ${y})`} />
        </g>
      ))}
      <ellipse className="pf-grain" cx="0" cy="-66" rx="2.6" ry="5.5" />
    </g>
  );
}

function StalkShape({ stalk }: { stalk: Stalk }) {
  const { height: h, lean } = stalk;
  const vars = {
    "--d": stalk.delay,
    "--bend": stalk.bend,
    "--sway-dur": `${stalk.swayDur}s`,
    "--sway-delay": `${stalk.swayDelay}s`,
  } as CSSProperties;

  return (
    <g className="pf-sway" style={vars}>
      <g className="pf-grow">
        {stalk.leaves.map((leaf, i) => (
          <path key={i} className="pf-leaf" d={leafPath(leaf)} />
        ))}
        <path
          className="pf-stem"
          d={`M0,0 Q${r1(lean * 0.5)},${r1(-h * 0.5)} ${lean},${-h}`}
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <g transform={`translate(${lean} ${-h}) scale(1.4)`}>
          <use href="#pf-head" className="pf-head" />
        </g>
      </g>
    </g>
  );
}

export function PaddyField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pf-root ${className}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="A paddy field growing from the soil and ripening from green to gold"
    >
      <defs>
        <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="pf-sky-top" />
          <stop offset="1" className="pf-sky-bottom" />
        </linearGradient>
        <linearGradient id="pf-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5E3C" />
          <stop offset="1" stopColor="#4A2F1B" />
        </linearGradient>
        <HeadSymbol />
      </defs>

      {/* Sky + sun (sun rises as the field ripens) */}
      <rect width={VIEW_W} height={VIEW_H} fill="url(#pf-sky)" />
      <circle className="pf-sun" cx="930" cy="170" r="54" />

      {/* Distant tree line */}
      <path
        d="M0,500 C120,470 200,488 300,472 C420,452 520,486 640,468 C760,450 860,480 980,462 C1080,448 1150,470 1200,462 L1200,520 L0,520 Z"
        fill="#2F4A2A"
        opacity="0.35"
      />

      {/* Soil */}
      <path d="M0,505 C300,495 900,515 1200,500 L1200,800 L0,800 Z" fill="url(#pf-soil)" />
      <g stroke="#3B2616" strokeOpacity="0.35" strokeWidth="2" fill="none">
        <path d="M0,560 C400,550 800,570 1200,556" />
        <path d="M0,650 C400,640 800,662 1200,646" />
        <path d="M0,745 C400,735 800,758 1200,740" />
      </g>

      {ROWS.map((row) => (
        <g key={row.y} opacity={row.opacity}>
          {row.stalks.map((stalk, i) => (
            <g key={i} transform={`translate(${stalk.x} ${row.y}) scale(${row.scale})`}>
              <StalkShape stalk={stalk} />
            </g>
          ))}
        </g>
      ))}

      {/* Foreground soil lip hides the front row's bases */}
      <path d="M0,770 C300,760 900,778 1200,764 L1200,800 L0,800 Z" fill="#4A2F1B" />
    </svg>
  );
}

const RIPE = {
  "--pf-leaf": "#B39A3C",
  "--pf-stem": "#C8A445",
  "--pf-grain": "#D4A62A",
  "--pf-sky-top": "#F2D49B",
  "--pf-sky-bottom": "#F8EBCB",
  "--pf-sun": "#F5B942",
};

const GREEN = {
  "--pf-leaf": "#5E8C3A",
  "--pf-stem": "#4F7A30",
  "--pf-grain": "#8FB356",
  "--pf-sky-top": "#CFE2E3",
  "--pf-sky-bottom": "#F3EFDD",
  "--pf-sun": "#F7E3A1",
};

/**
 * Timeline for the Grow (duration 1) and Ripen (duration 1) scenes.
 * The Hero composes this into its scroll-scrubbed master timeline.
 */
export function paddyFieldTimeline(scope: Element) {
  const tl = gsap.timeline();
  const root = scope.querySelector(".pf-root");
  if (!root) return tl;

  tl.addLabel("grow")
    .fromTo(root, { "--pf-grow": 0 }, { "--pf-grow": 1, duration: 1, ease: "none" })
    .addLabel("ripen")
    .fromTo(
      root,
      { "--pf-bend": 0, ...GREEN },
      { "--pf-bend": 1, ...RIPE, duration: 1, ease: "power1.inOut" },
    );

  return tl;
}
