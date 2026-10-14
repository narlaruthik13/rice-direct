import { mulberry32 } from "@/lib/random";

// Scene "Journey" (Harvest → Mill): at dusk the tractor hauls the full trolley
// along a village road. The rig (HarvestScene) holds its place on screen while
// the world scrolls past it in parallax: far fields → trees → the mill with a
// lit window → the road verge. The tractor faces left, so the world moves right.
//
// Driven by --jr (0 → 1) on .jr-root (see globals.css). Each layer is only a few
// merged paths, so the per-frame restyle stays tiny.

const r1 = (n: number) => Math.round(n * 10) / 10;

const circle = (cx: number, cy: number, r: number) =>
  `M${r1(cx - r)},${r1(cy)} a${r1(r)},${r1(r)} 0 1,0 ${r1(2 * r)},0 a${r1(r)},${r1(r)} 0 1,0 ${r1(-2 * r)},0 Z`;

/** Trunks and canopies of the mid-layer trees (coconut palms and round neem trees), as two paths. */
const TREES = (() => {
  const rand = mulberry32(1707);
  let trunks = "";
  let crowns = "";
  for (let x = -720; x <= 1520; x += 130 + Math.round(rand() * 70)) {
    const base = r1(612 + rand() * 26);
    const h = r1(90 + rand() * 60);
    if (rand() < 0.55) {
      // Coconut palm: a curved trunk and a crown of fronds.
      const lean = r1(6 + rand() * 10);
      trunks += `M${x - 3},${base} Q${r1(x + lean + 4)},${r1(base - h / 2)} ${r1(x + lean)},${r1(base - h)} L${r1(x + lean + 5)},${r1(base - h)} Q${r1(x + lean + 9)},${r1(base - h / 2)} ${x + 4},${base} Z `;
      const cx = r1(x + lean + 2.5);
      const cy = r1(base - h);
      for (const [dx, dy] of [[-48, 16], [-34, 30], [-6, -30], [30, 28], [46, 12], [16, -22]]) {
        crowns += `M${cx},${cy} Q${r1(cx + dx * 0.5)},${r1(cy + dy * 0.3 - 18)} ${r1(cx + dx)},${r1(cy + dy)} Q${r1(cx + dx * 0.5)},${r1(cy + dy * 0.3 - 6)} ${cx},${cy} Z `;
      }
    } else {
      // Round neem tree: short trunk and a cloud of three circles.
      const s = 0.75 + rand() * 0.4;
      trunks += `M${x - 5},${base} L${x - 3},${r1(base - 46 * s)} L${x + 3},${r1(base - 46 * s)} L${x + 5},${base} Z `;
      crowns += circle(x, base - 70 * s, 34 * s) + " " + circle(x - 28 * s, base - 52 * s, 24 * s) + " " + circle(x + 28 * s, base - 54 * s, 26 * s) + " ";
    }
  }
  return { trunks, crowns };
})();

/** Harvested fields on the far plain: alternating stubble strips. */
const FIELDS = Array.from({ length: 9 }, (_, i) => {
  const x = -320 + i * 200;
  return { d: `M${x},540 L${x + 210},540 L${x + 250},600 L${x + 30},600 Z`, light: i % 2 === 0 };
});

/** Grass tufts along the road's far verge (near layer, fastest). */
const TUFTS = (() => {
  let d = "";
  for (let x = -1000; x <= 1300; x += 46) {
    d += `M${x},690 l4,-14 l3,14 l5,-18 l3,18 l5,-12 l2,12 Z `;
  }
  return d;
})();

/** Small mill building with a silo and one lit window; base centre at (0, 0). */
function Mill() {
  return (
    <g>
      {/* window light spilling onto the ground */}
      <ellipse className="jr-glow" cx="-70" cy="6" rx="90" ry="14" fill="url(#jr-window-glow)" />
      {/* silo */}
      <rect x="92" y="-150" width="46" height="150" fill="#A88B6A" />
      <path d="M88,-150 L115,-176 L142,-150 Z" fill="#5B3A24" />
      <path d="M92,-110 h46 M92,-70 h46 M92,-30 h46" stroke="#7A5E44" strokeWidth="2" />
      {/* chute from the silo into the shed */}
      <path d="M92,-120 L60,-96" stroke="#5B3A24" strokeWidth="6" strokeLinecap="round" />
      {/* shed */}
      <rect x="-132" y="-104" width="200" height="104" fill="#8C6A4E" />
      <path d="M-146,-104 L-32,-150 L82,-104 Z" fill="#5B3A24" />
      <rect x="-24" y="-60" width="58" height="60" fill="#3B2A1E" />
      <path d="M5,-60 v60" stroke="#5B3A24" strokeWidth="2" />
      {/* the lit window, with a soft glow */}
      <circle className="jr-glow" cx="-80" cy="-62" r="48" fill="url(#jr-window-glow)" />
      <rect x="-100" y="-80" width="40" height="34" rx="2" fill="#FFD27A" />
      <path d="M-80,-80 v34 M-100,-63 h40" stroke="#8C6A4E" strokeWidth="3" />
      {/* dark top-window and chimney */}
      <rect x="-50" y="-132" width="20" height="16" fill="#3B2A1E" />
      <rect x="40" y="-150" width="12" height="40" fill="#5B3A24" />
    </g>
  );
}

export function JourneyScene({ className = "" }: { className?: string }) {
  return (
    <svg className={`jr-root pointer-events-none ${className}`} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="jr-window-glow">
          <stop offset="0" stopColor="#FFD27A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jr-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A5A3A" />
          <stop offset="1" stopColor="#4A2F1B" />
        </linearGradient>
      </defs>

      {/* ground (replaces the stubble field as it fades) */}
      <path d="M0,505 C300,495 900,515 1200,500 L1200,800 L0,800 Z" fill="url(#jr-ground)" />

      {/* far: tree line, harvested fields, a couple of huts */}
      <g className="jr-far">
        <path
          d="M-300,500 C-150,474 -40,492 80,476 C220,456 340,488 480,470 C620,452 740,482 880,464 C1000,450 1140,472 1400,462 L1400,520 L-300,520 Z"
          fill="#2F4A2A"
          opacity="0.45"
        />
        {FIELDS.map((f) => (
          <path key={f.d} d={f.d} fill={f.light ? "#9C7A45" : "#8A6A3C"} opacity="0.85" />
        ))}
        <path
          d="M240,532 v-22 h34 v22 Z M232,512 l25,-18 l25,18 Z M990,528 v-18 h28 v18 Z M984,512 l20,-14 l20,14 Z"
          fill="#4A3424"
        />
      </g>

      {/* mid: trees */}
      <g className="jr-mid">
        <path d={TREES.trunks} fill="#3B2A1E" />
        <path d={TREES.crowns} fill="#2F4A2A" />
      </g>

      {/* the mill, nearer than the trees; arrives behind the rig at the end */}
      <g className="jr-mill">
        <g transform="translate(-160 664)">
          <Mill />
        </g>
      </g>

      {/* the village road and its verge */}
      <path d="M0,690 C400,684 800,694 1200,686 L1200,800 L0,800 Z" fill="#7A5B3E" />
      <g className="jr-near">
        <path d={TUFTS} fill="#5E6B34" />
        <path d="M-1000,748 H1300 M-1000,790 H1300" stroke="#5E432C" strokeWidth="4" strokeDasharray="40 26" strokeLinecap="round" />
      </g>
    </svg>
  );
}
