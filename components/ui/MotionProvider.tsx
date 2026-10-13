"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** One place to make every Framer Motion animation respect prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
