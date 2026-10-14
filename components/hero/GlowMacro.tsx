// Ripe-grain macro moment: the field zooms into one stalk (a transform on the
// field's zoom wrapper), and this close-up of a golden panicle fades in with its
// grains glowing, then everything zooms back out.
// Driven by --gl (0 → 1) on .gl-root; one CSS pulse animates the glow group.

const B = { p0: [0, 0], p1: [-30, 130], p2: [-40, 270], p3: [-130, 390] }; // drooping rachis (cubic Bézier)

function bezier(t: number) {
  const u = 1 - t;
  const x = u * u * u * B.p0[0] + 3 * u * u * t * B.p1[0] + 3 * u * t * t * B.p2[0] + t * t * t * B.p3[0];
  const y = u * u * u * B.p0[1] + 3 * u * u * t * B.p1[1] + 3 * u * t * t * B.p2[1] + t * t * t * B.p3[1];
  const dx = 3 * u * u * (B.p1[0] - B.p0[0]) + 6 * u * t * (B.p2[0] - B.p1[0]) + 3 * t * t * (B.p3[0] - B.p2[0]);
  const dy = 3 * u * u * (B.p1[1] - B.p0[1]) + 6 * u * t * (B.p2[1] - B.p1[1]) + 3 * t * t * (B.p3[1] - B.p2[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

// Grains alternate either side of the rachis, slightly smaller towards the tip.
const GRAINS = Array.from({ length: 16 }, (_, i) => {
  const t = 0.06 + (i / 15) * 0.9;
  const { x, y, angle } = bezier(t);
  const side = i % 2 === 0 ? 1 : -1;
  const n = (angle + 90) * (Math.PI / 180);
  const off = 20 * side;
  const scale = 1 - t * 0.3;
  return {
    x: Math.round((x + Math.cos(n) * off) * 10) / 10,
    y: Math.round((y + Math.sin(n) * off) * 10) / 10,
    rot: Math.round(angle - 90 + side * 28),
    scale: Math.round(scale * 100) / 100,
  };
});

const BOKEH = [
  { x: 210, y: 180, r: 26, o: 0.25 },
  { x: 340, y: 560, r: 14, o: 0.4 },
  { x: 930, y: 150, r: 34, o: 0.2 },
  { x: 1010, y: 470, r: 18, o: 0.35 },
  { x: 820, y: 640, r: 22, o: 0.25 },
  { x: 150, y: 420, r: 10, o: 0.45 },
  { x: 1100, y: 300, r: 12, o: 0.4 },
];

export function GlowMacro({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`gl-root pointer-events-none ${className}`}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="gl-vignette" gradientUnits="userSpaceOnUse" cx="600" cy="360" r="1000">
          <stop offset="0.35" stopColor="#3A2A10" stopOpacity="0" />
          <stop offset="1" stopColor="#2A1C08" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="gl-grain" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFF4C4" />
          <stop offset="0.45" stopColor="#F2C14E" />
          <stop offset="1" stopColor="#B88416" />
        </radialGradient>
        <radialGradient id="gl-halo">
          <stop offset="0" stopColor="#FFE08A" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFE08A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* warm evening vignette over the zoomed field; bleeds past the edges so the
          scaling close-up never shows a hard rectangle */}
      <rect x="-1200" y="-800" width="3600" height="2400" fill="url(#gl-vignette)" />
      <g fill="#FFE7A0">
        {BOKEH.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} opacity={b.o} />
        ))}
      </g>

      <g transform="translate(640 210) rotate(14)">
        {/* glow behind every grain (one pulsing group) */}
        <g className="gl-halos">
          {GRAINS.map((g, i) => (
            <circle key={i} cx={g.x} cy={g.y} r={42 * g.scale} fill="url(#gl-halo)" />
          ))}
        </g>
        <path
          d={`M${B.p0.join(",")} C${B.p1.join(",")} ${B.p2.join(",")} ${B.p3.join(",")}`}
          stroke="#C8A445"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {GRAINS.map((g, i) => (
          <g key={i} transform={`translate(${g.x} ${g.y}) rotate(${g.rot}) scale(${g.scale})`}>
            <ellipse rx="15" ry="30" fill="url(#gl-grain)" stroke="#A67E12" strokeOpacity="0.5" strokeWidth="1.5" />
            <path d="M0,-22 L0,22" stroke="#A67E12" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="-5" cy="-10" rx="4" ry="10" fill="#FFFFFF" opacity="0.45" />
          </g>
        ))}
      </g>
    </svg>
  );
}
