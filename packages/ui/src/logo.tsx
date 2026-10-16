"use client";

import { motion } from "framer-motion";

// Kisa logo. Drawn as SVG paths (no font dependency), so it is crisp at any
// size and identical in the favicon.
//
//   wordmark  lowercase monoline "kisa"; the dot of the i is a tilted paddy-gold grain
//   mark      a sprout: two leaves rising from a grain (built on a 32px grid, works at 16px)
//   full      mark + wordmark
//
// The same mark paths are used in apps/web/app/icon.svg and apps/web/app/apple-icon.png.

type Variant = "full" | "wordmark" | "mark";
type Scheme = "light" | "dark";

const COLORS: Record<Scheme, { ink: string; grain: string; crease: string }> = {
  light: { ink: "#2F4A2A", grain: "#D4A62A", crease: "#A67E12" }, // field green + paddy gold
  dark: { ink: "#FAF6EC", grain: "#EBCB6E", crease: "#B88F2A" }, // rice off-white + light paddy
};

// ---------- Mark geometry (32 x 32) ----------
export const MARK_PATHS = {
  stem: "M16,23 C16,20 16,18 16,15.5",
  leftLeaf: "M15.5,18 C9.5,17.5 5.5,12.5 5,6 C11.5,6.5 15.5,11 15.5,18 Z",
  rightLeaf: "M16.5,16 C22.5,15.5 27,10.5 27.5,3.5 C20.5,4 16.5,9 16.5,16 Z",
  grain: { cx: 16, cy: 24.5, rx: 4.8, ry: 6.2, rotate: -18 },
};

// ---------- Wordmark geometry (viewBox 4 6 166 88; baseline y=86, x-height 46) ----------
const STROKE = 9;
const LETTERS = [
  "M12,14 V86", // k stem
  "M42,46 L14.5,69", // k arm
  "M25,60.2 L44,86", // k leg
  "M60,46 V86", // i stem (its dot is the grain)
  // s
  "M103.5,52.5 C101,48 96.5,45.5 91,45.5 C83.5,45.5 77.5,49.5 77.5,55.5 C77.5,62 84,64 91,65.8 C98.5,67.7 104.5,70.5 104.5,76.8 C104.5,83 98.5,86.5 91,86.5 C84.5,86.5 79.5,84 77,79.5",
  "M161,46 V86", // a stem
];
const A_BOWL = { cx: 141, cy: 66, r: 20 };
const I_GRAIN = { cx: 60, cy: 26, rx: 6.8, ry: 10.5, rotate: 28 };

function Grain({ g, fill, crease }: { g: { cx: number; cy: number; rx: number; ry: number; rotate: number }; fill: string; crease?: string }) {
  return (
    <g transform={`rotate(${g.rotate} ${g.cx} ${g.cy})`}>
      <ellipse cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fill={fill} />
      {crease && (
        <path
          d={`M${g.cx},${g.cy - g.ry * 0.62} L${g.cx},${g.cy + g.ry * 0.62}`}
          stroke={crease}
          strokeOpacity="0.55"
          strokeWidth={g.rx * 0.22}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

export function LogoMark({ size = 32, scheme = "light", tile = false, className = "" }: { size?: number; scheme?: Scheme; tile?: boolean; className?: string }) {
  // On a tile the background is field green, so the sprout uses the dark-scheme colours.
  const c = COLORS[tile ? "dark" : scheme];
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      {tile && <rect width="32" height="32" rx="7" fill="#2F4A2A" />}
      <path d={MARK_PATHS.stem} stroke={c.ink} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={MARK_PATHS.leftLeaf} fill={c.ink} />
      <path d={MARK_PATHS.rightLeaf} fill={c.ink} />
      <Grain g={MARK_PATHS.grain} fill={c.grain} />
    </svg>
  );
}

export function LogoWordmark({
  height = 28,
  scheme = "light",
  animated = false,
  className = "",
}: {
  height?: number;
  scheme?: Scheme;
  animated?: boolean;
  className?: string;
}) {
  const c = COLORS[scheme];
  const grain = <Grain g={I_GRAIN} fill={c.grain} crease={c.crease} />;
  return (
    <svg
      viewBox="4 6 166 88"
      height={height}
      width={(height * 166) / 88}
      className={className}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <g stroke={c.ink} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {LETTERS.map((d) => (
          <path key={d} d={d} />
        ))}
        <circle cx={A_BOWL.cx} cy={A_BOWL.cy} r={A_BOWL.r} />
      </g>
      {animated ? (
        // Page-load flourish: the grain drops onto the i and bounces to rest.
        // Under prefers-reduced-motion, MotionProvider skips the movement (it just appears).
        <motion.g
          initial={{ y: -46, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            y: { type: "spring", stiffness: 420, damping: 11, mass: 0.7, delay: 0.35 },
            opacity: { duration: 0.15, delay: 0.35 },
          }}
        >
          {grain}
        </motion.g>
      ) : (
        grain
      )}
    </svg>
  );
}

interface LogoProps {
  variant?: Variant;
  /** Height in px of the tallest part (the mark in "full"). */
  size?: number;
  scheme?: Scheme;
  /** Mark only: draw on a rounded field-green tile (icons). */
  tile?: boolean;
  /** Animate the grain dropping onto the "i" on mount. */
  animated?: boolean;
  className?: string;
}

/** Kisa logo: "full" (mark + wordmark), "wordmark" or "mark", light or dark. */
export function Logo({ variant = "full", size = 32, scheme = "light", tile = false, animated = false, className = "" }: LogoProps) {
  if (variant === "mark") {
    return (
      <span role="img" aria-label="Kisa" className={`inline-flex ${className}`}>
        <LogoMark size={size} scheme={scheme} tile={tile} />
      </span>
    );
  }
  if (variant === "wordmark") {
    return (
      <span role="img" aria-label="Kisa" className={`inline-flex ${className}`}>
        <LogoWordmark height={size} scheme={scheme} animated={animated} />
      </span>
    );
  }
  return (
    <span role="img" aria-label="Kisa" className={`inline-flex items-center ${className}`} style={{ gap: Math.round(size * 0.22) }}>
      <LogoMark size={size} scheme={scheme} />
      {/* Wordmark slightly shorter than the mark so the x-height sits optically centred */}
      <LogoWordmark height={Math.round(size * 0.82)} scheme={scheme} animated={animated} />
    </span>
  );
}
