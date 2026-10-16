"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Logo as StaticLogo, type LogoProps as StaticLogoProps, LogoWordmark as StaticWordmark, type WordmarkProps } from "./logo-static";

// The website's logo: the static logo (./logo-static) plus an optional page-load
// flourish where the grain drops onto the i and bounces to rest. Under
// prefers-reduced-motion, the website's MotionProvider skips the movement.

export { LogoMark, MARK_PATHS } from "./logo-static";

const dropGrain = (grain: ReactNode) => (
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
);

export function LogoWordmark({ animated = false, ...props }: Omit<WordmarkProps, "renderGrain"> & { animated?: boolean }) {
  return <StaticWordmark {...props} renderGrain={animated ? dropGrain : undefined} />;
}

interface LogoProps extends Omit<StaticLogoProps, "renderGrain"> {
  /** Animate the grain dropping onto the "i" on mount. */
  animated?: boolean;
}

/** Kisa logo: "full" (mark + wordmark), "wordmark" or "mark", light or dark. */
export function Logo({ animated = false, ...props }: LogoProps) {
  return <StaticLogo {...props} renderGrain={animated ? dropGrain : undefined} />;
}
