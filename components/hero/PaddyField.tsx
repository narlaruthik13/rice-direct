import type { CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import { cutFrontX } from "@/components/hero/harvest";

// Paddy field for the hero: stalks are planted (Monsoon), grow (Grow), then ripen
// from green to gold while the heads bend (Ripen), then the harvester cuts it to
// stubble (Harvest).
//
// Performance design (Hero v2):
// - No per-frame CSS variables on the field root (those restyled every descendant,
//   including 54 <use> shadow trees). Instead a tiny renderer writes only the
//   transform attributes that changed: one per stalk's grow group and one per head.
// - Colours come from 3 shared paint servers (gradients); ripening changes 6 stop
//   colours, so leaves repaint but are never restyled.
// - Wind is 18 grouped "bands" (3 rows x 6 x-bands) skewing from their row's ground
//   line with staggered delays, so a breeze moves across the field (was 54 sways).
// - Static fallback (reduced motion / no JS): CSS overrides draw the ripe field.

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
  delay: number; // 0..0.45, when this stalk starts growing
  bend: number; // degrees the head droops when fully ripe
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
const BANDS = 6;

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
      const stalk = {
        x: r1(((i + 0.5) / count) * (VIEW_W + 40) - 20 + (rand() - 0.5) * 30),
        height: r1(190 + rand() * 70),
        lean: r1((rand() - 0.5) * 30),
        delay: r1(rand() * 0.45 * 100) / 100,
        bend: r1((100 + rand() * 40) * (rand() < 0.8 ? 1 : -1)),
      };
      rand(); // (former sway duration)
      rand(); // (former sway delay) — kept so the seeded layout is unchanged
      return {
        ...stalk,
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
/** All stalks in DOM order, with their row. */
const STALKS = ROWS.flatMap((row) => row.stalks.map((stalk) => ({ stalk, row })));

// ---------- Field state → transforms (shared by server markup and the renderer) ----------

export interface FieldState {
  /** 0 → 1 Grow progress. */
  grow: number;
  /** 0 → 1 Ripen progress (heads bend, green → gold). */
  bend: number;
  /** 0 → 1 Monsoon transplanting front (1 = every row planted). */
  plant: number;
  /** 0 → 1 Harvest progress: stalks behind the harvester's cutter bar become stubble. */
  harvest: number;
}

const INITIAL: FieldState = { grow: 0, bend: 0, plant: 1, harvest: 0 };
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const f3 = (n: number) => Math.round(n * 1000) / 1000;

const STUBBLE = 0.09;

/** 0 → 1 as the cutter bar (field x `cutX`) passes the stalk. */
const cutAmount = (s: Stalk, cutX: number) => clamp01((cutX - s.x) / 16);

function growTransform(s: Stalk, st: FieldState, cutX = -Infinity) {
  // Planted once the farmer's path (-60 → 1260) passes the stalk; then a 12% seedling until it grows.
  const planted = clamp01((-60 + st.plant * 1320 - s.x) / 30);
  const sy = Math.min(1, Math.max(0.12 * planted, (st.grow - s.delay) / 0.5));
  const cut = cutAmount(s, cutX);
  return `scale(1 ${f3(Math.max(0, sy + (Math.min(sy, STUBBLE) - sy) * cut))})`;
}

function headTransform(s: Stalk, st: FieldState, cutX = -Infinity) {
  const hs = clamp01((st.grow - s.delay - 0.35) / 0.15) * (1 - cutAmount(s, cutX));
  return `translate(${s.lean} ${-s.height}) scale(1.4) rotate(${f3(st.bend * s.bend)}) scale(${f3(hs)})`;
}

const GREEN = { leaf: "#5E8C3A", stem: "#4F7A30", grain: "#8FB356" };
const RIPE = { leaf: "#B39A3C", stem: "#C8A445", grain: "#D4A62A" };
type Paint = keyof typeof GREEN;

function mixHex(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}
// Ripen colours ease the same way the old CSS tween did (power1.inOut on bend).
const paintColor = (p: Paint, st: FieldState) => mixHex(GREEN[p], RIPE[p], st.bend);

// ---------- Geometry ----------

function leavesPath(leaves: Leaf[]) {
  return leaves
    .map(({ y0, len, side: s }) =>
      `M0,${-y0} Q${r1(s * len * 0.22)},${r1(-y0 - len * 0.55)} ${r1(s * len * 0.34)},${r1(-y0 - len)} Q${r1(s * len * 0.06)},${r1(-y0 - len * 0.5)} 0,${-y0 - 9} Z`,
    )
    .join(" ");
}

/** A rotated ellipse as path data (two arcs), so all grains of a head are one <path>. */
function ellipsePath(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  const p1 = `${r1(cx - dx)},${r1(cy - dy)}`;
  const p2 = `${r1(cx + dx)},${r1(cy + dy)}`;
  return `M${p1} A${rx},${ry} ${deg} 1 0 ${p2} A${rx},${ry} ${deg} 1 0 ${p1} Z`;
}

const GRAINS_PATH = [
  ...Array.from({ length: 7 }, (_, k) => -(6 + k * 8)).flatMap((y) => [
    ellipsePath(-4, y, 2.6, 5.5, -28),
    ellipsePath(4, y, 2.6, 5.5, 28),
  ]),
  ellipsePath(0, -66, 2.6, 5.5, 0),
].join(" ");

/** One grain head (panicle), hanging up from (0,0): 2 paths, reused via <use>. */
function HeadSymbol() {
  return (
    <g id="pf-head">
      <line x1="0" y1="0" x2="0" y2="-62" stroke="url(#pf-paint-stem)" strokeWidth="1.4" strokeLinecap="round" />
      <path d={GRAINS_PATH} fill="url(#pf-paint-grain)" />
    </g>
  );
}

/** A solid "paint" whose colour the renderer can change by editing two stops. */
function PaintServer({ id, color }: { id: Paint; color: string }) {
  return (
    <linearGradient id={`pf-paint-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" className={`pf-stop-${id}`} stopColor={color} />
      <stop offset="1" className={`pf-stop-${id}`} stopColor={color} />
    </linearGradient>
  );
}

function StalkShape({ stalk, index, st, cutX }: { stalk: Stalk; index: number; st: FieldState; cutX?: number }) {
  const { height: h, lean } = stalk;
  return (
    <g className="pf-grow" data-i={index} transform={growTransform(stalk, st, cutX)}>
      <path d={leavesPath(stalk.leaves)} fill="url(#pf-paint-leaf)" />
      <path
        d={`M0,0 Q${r1(lean * 0.5)},${r1(-h * 0.5)} ${lean},${-h}`}
        fill="none"
        stroke="url(#pf-paint-stem)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <use
        href="#pf-head"
        className="pf-head"
        transform={headTransform(stalk, st, cutX)}
        // Static per-head values for the CSS fallback (reduced motion), never animated.
        style={{ "--bend": stalk.bend, "--lean": `${lean}px`, "--h": `${-h}px` } as CSSProperties}
      />
    </g>
  );
}

/**
 * `sky={false}`: draw only hills, soil and stalks (the hero puts SeasonSky behind it).
 * `state` / `cutX` (field viewBox x of the cut front) render a fixed moment: the scroll
 * story leaves them at the start and drives the field with its renderer instead; the
 * static poster frames set them.
 */
export function PaddyField({
  className = "",
  sky = true,
  state,
  cutX,
}: {
  className?: string;
  sky?: boolean;
  state?: Partial<FieldState>;
  cutX?: number;
}) {
  const st: FieldState = { ...INITIAL, ...state };
  return (
    <svg
      className={`pf-root ${className}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="A paddy field growing from the soil and ripening from green to gold"
    >
      <defs>
        <linearGradient id="pf-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5E3C" />
          <stop offset="1" stopColor="#4A2F1B" />
        </linearGradient>
        {(Object.keys(GREEN) as Paint[]).map((p) => (
          <PaintServer key={p} id={p} color={paintColor(p, st)} />
        ))}
        <HeadSymbol />
      </defs>

      {sky && <rect width={VIEW_W} height={VIEW_H} fill="#E4EEF0" />}

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

      {ROWS.map((row, r) => (
        <g key={row.y} opacity={row.opacity}>
          {/* Breeze: each band of stalks skews from this row's ground line; delays make the gust travel across. */}
          {Array.from({ length: BANDS }, (_, b) => {
            const inBand = row.stalks.filter((s) => Math.min(BANDS - 1, Math.floor(((s.x + 20) / (VIEW_W + 40)) * BANDS)) === b);
            return (
              <g
                key={b}
                className="pf-band"
                style={{ transformOrigin: `0px ${row.y}px`, animationDelay: `${-(b * 0.38 + r * 0.25)}s` } as CSSProperties}
              >
                {inBand.map((stalk) => (
                  <g key={stalk.x} transform={`translate(${stalk.x} ${row.y}) scale(${row.scale})`}>
                    <StalkShape stalk={stalk} index={STALKS.findIndex((e) => e.stalk === stalk)} st={st} cutX={cutX} />
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      ))}

      {/* Foreground soil lip hides the front row's bases */}
      <path d="M0,770 C300,760 900,778 1200,764 L1200,800 L0,800 Z" fill="#4A2F1B" />
    </svg>
  );
}

// ---------- Renderer ----------

interface FieldEngine {
  state: FieldState;
  render: () => void;
}

const engines = new WeakMap<Element, FieldEngine>();

/** The field renderer for the .pf-root inside `scope` (created on first use). */
export function getFieldEngine(scope: Element): FieldEngine | null {
  const root = scope.matches?.(".pf-root") ? scope : scope.querySelector(".pf-root");
  if (!root) return null;
  const cached = engines.get(root);
  if (cached) return cached;

  const growEls: (Element | undefined)[] = [];
  const headEls: (Element | undefined)[] = [];
  root.querySelectorAll(".pf-grow").forEach((g) => {
    const i = Number(g.getAttribute("data-i"));
    growEls[i] = g;
    headEls[i] = g.querySelector(".pf-head") ?? undefined;
  });
  const stops = (Object.keys(GREEN) as Paint[]).map((p) => ({ p, els: Array.from(root.querySelectorAll(`.pf-stop-${p}`)) }));
  const lastGrow: string[] = [];
  const lastHead: string[] = [];
  const lastPaint: Record<string, string> = {};

  const state: FieldState = { ...INITIAL };
  const render = () => {
    const cutX = cutFrontX(state.harvest);
    STALKS.forEach(({ stalk }, i) => {
      const g = growTransform(stalk, state, cutX);
      if (g !== lastGrow[i]) {
        growEls[i]?.setAttribute("transform", g);
        lastGrow[i] = g;
      }
      const h = headTransform(stalk, state, cutX);
      if (h !== lastHead[i]) {
        headEls[i]?.setAttribute("transform", h);
        lastHead[i] = h;
      }
    });
    for (const { p, els } of stops) {
      const c = paintColor(p, state);
      if (c !== lastPaint[p]) {
        els.forEach((el) => el.setAttribute("stop-color", c));
        lastPaint[p] = c;
      }
    }
  };
  const engine = { state, render };
  engines.set(root, engine);
  return engine;
}

/** Re-render the field from its state (call after the timeline moves). */
export function renderField(scope: Element) {
  getFieldEngine(scope)?.render();
}
