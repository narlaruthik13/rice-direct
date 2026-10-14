import { useId, type CSSProperties } from "react";

// Season / light system for the hero.
//
// One CSS variable, --season (0 → 5), drives the sky, sun, moon, clouds and
// the ambient tint. It lives on .season-root elements (this sky and the tint
// overlay), never on the field, so scrubbing it only restyles ~40 sky elements.
//
// Each property is a piecewise-linear blend between six keyframes, written once
// as a static CSS expression (nested color-mix / calc with clamp). Only the
// variable changes at runtime.

export const SEASONS = ["monsoon", "clear", "golden", "dusk", "indoor", "morning"] as const;
export type SeasonKey = (typeof SEASONS)[number];
export const seasonIndex = (key: SeasonKey) => SEASONS.indexOf(key);

// Keyframe values, one per season (same order as SEASONS).
const K = {
  skyTop: ["#8E9DAB", "#7FBCE6", "#F0BE78", "#4E4170", "#3A2A1C", "#F6DDB8"],
  skyBottom: ["#C7D0D4", "#E2F0F3", "#F8E2B8", "#E7946A", "#5E412A", "#FBF2E2"],
  sun: ["#E9E4CF", "#FFF4C2", "#F6B53F", "#E66F3A", "#F2A24A", "#FFD39A"],
  sunX: [860, 780, 900, 1010, 1010, 300],
  sunY: [190, 130, 250, 430, 430, 330],
  sunOpacity: [0.35, 1, 1, 0.9, 0, 0.95],
  moonOpacity: [0, 0, 0, 0.85, 0, 0],
  cloud: ["#7D8A96", "#FFFFFF", "#FBE3BE", "#B9879A", "#5E412A", "#FFF3E0"],
  cloudOpacity: [0.95, 0.5, 0.35, 0.45, 0, 0.4],
  tint: ["#8FA3B8", "#FFFFFF", "#F4B868", "#7A5A92", "#E39A52", "#FFE6C2"],
  tintOpacity: [0.32, 0, 0.18, 0.4, 0.22, 0.1],
};

/** 0 → 1 progress through segment k (season k → k+1). */
const seg = (k: number) => `clamp(0, calc(var(--season) - ${k}), 1)`;

/** Piecewise colour blend across the keyframes. */
function blendColor(stops: string[]) {
  let expr = stops[0];
  for (let k = 1; k < stops.length; k++) expr = `color-mix(in srgb, ${stops[k]} calc(${seg(k - 1)} * 100%), ${expr})`;
  return expr;
}

/** Piecewise number blend across the keyframes, as a calc() in `unit`. */
function blendNumber(values: number[], unit = "") {
  let expr = `${values[0]}`;
  for (let k = 1; k < values.length; k++) {
    const d = values[k] - values[k - 1];
    if (d !== 0) expr += ` ${d < 0 ? "-" : "+"} ${Math.abs(d)} * ${seg(k - 1)}`;
  }
  return unit ? `calc((${expr}) * 1${unit})` : `calc(${expr})`;
}

const STYLE = {
  skyTop: { stopColor: blendColor(K.skyTop) },
  skyBottom: { stopColor: blendColor(K.skyBottom) },
  sun: {
    fill: blendColor(K.sun),
    opacity: blendNumber(K.sunOpacity),
    transform: `translate(${blendNumber(K.sunX, "px")}, ${blendNumber(K.sunY, "px")})`,
  },
  moon: { opacity: blendNumber(K.moonOpacity) },
  clouds: {
    fill: blendColor(K.cloud),
    opacity: blendNumber(K.cloudOpacity),
    transform: "translateX(calc(var(--season) * -70px))",
  },
  tint: { backgroundColor: blendColor(K.tint), opacity: blendNumber(K.tintOpacity) },
} satisfies Record<string, CSSProperties>;

const CLOUDS = [
  { x: 180, y: 120, s: 1.2 },
  { x: 470, y: 80, s: 0.9 },
  { x: 720, y: 170, s: 1.1 },
  { x: 1010, y: 100, s: 1.3 },
  { x: 1180, y: 210, s: 0.8 },
];

/** Sky, sun, moon and clouds (rain lives in MonsoonScene). Same viewBox and slice as PaddyField so the horizon lines up. */
/** `season` pins the light (0 monsoon → 5 morning) for a static frame; the scroll story tweens it instead. */
export function SeasonSky({ className = "", season }: { className?: string; season?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`season-root ${className}`}
      style={season === undefined ? undefined : ({ "--season": season } as CSSProperties)}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={STYLE.skyTop} />
          <stop offset="0.75" style={STYLE.skyBottom} />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill={`url(#${id}-sky)`} />

      {/* Sun (moves through the day); moon appears at dusk */}
      <g style={STYLE.sun}>
        <circle r="54" />
        <circle r="78" opacity="0.18" />
      </g>
      <path
        style={STYLE.moon}
        transform="translate(300 150)"
        d="M0,-26 A26,26 0 1,0 0,26 A20,20 0 1,1 0,-26 Z"
        fill="#F4EEDC"
      />

      {/* Clouds drift slightly as the story moves on */}
      <g style={STYLE.clouds}>
        {CLOUDS.map((c) => (
          <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <ellipse cx="0" cy="0" rx="70" ry="26" />
            <ellipse cx="-40" cy="8" rx="44" ry="20" />
            <ellipse cx="45" cy="6" rx="50" ry="22" />
            <ellipse cx="5" cy="-16" rx="40" ry="24" />
          </g>
        ))}
      </g>

    </svg>
  );
}

/**
 * Ambient light over the field and grains: one multiply-blended layer whose
 * colour and strength follow --season (cheap; no stalk is restyled).
 */
export function SeasonTint({ className = "", season }: { className?: string; season?: number }) {
  const style = season === undefined ? STYLE.tint : ({ ...STYLE.tint, "--season": season } as CSSProperties);
  return <div className={`season-root season-tint pointer-events-none ${className}`} style={style} aria-hidden="true" />;
}
