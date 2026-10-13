"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { JourneyKey, JourneyStage } from "@/lib/journey";
import { formatDate } from "@/lib/format";

// Stages come from lib/journey.ts (category steps + sales model), so this
// component never hardcodes rice or onions.

const icons: Record<JourneyKey, JSX.Element> = {
  farm: <path d="M12 21v-8m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0 0C12 9 9 7 5 7c0 4 3 6 7 6ZM4 21h16" />,
  harvest: <path d="M5 19 19 5M8 5c4 0 8 2 11 6M5 8c0 4 2 8 6 11" />,
  purchase: <path d="M4 7h16v10H4V7Zm4 5h.01M16 12h.01M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  milling: (
    <>
      <circle cx="8" cy="13" r="4" />
      <circle cx="16" cy="13" r="4" />
      <path d="M9 3h6l-2 4h-2L9 3Z" />
    </>
  ),
  curing: <path d="M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  grading: <path d="M4 6h16M6 12h12M9 18h6" />,
  quality: <path d="M9 12l2 2 4-4M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" />,
  packing: <path d="M7 7c0-2 2-3 5-3s5 1 5 3l1 13H6L7 7Zm2 0h6" />,
  you: <path d="M3 11l9-7 9 7v9H3v-9Zm6 9v-6h6v6" />,
};

/**
 * A pack's journey as a vertical timeline. A gold line draws down as you
 * scroll; each stage's dot pops and its card rises in when it enters view (vertical, so hidden cards never cause sideways scroll).
 * Reduced motion: line fully drawn, everything static.
 */
export function TraceTimeline({ stages }: { stages: JourneyStage[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <ol ref={listRef} className="relative space-y-8 pl-14 sm:pl-20">
      {/* Track + animated progress line, centred on the dots */}
      <span className="absolute bottom-6 left-[19px] top-5 w-0.5 bg-husk/15 sm:left-[27px]" aria-hidden="true" />
      <motion.span
        className="absolute bottom-6 left-[19px] top-5 w-0.5 origin-top bg-paddy sm:left-[27px]"
        style={{ scaleY: reduce ? 1 : progress }}
        aria-hidden="true"
      />

      {stages.map((stage, i) => (
        <li key={stage.key} className="relative">
          <motion.span
            className="absolute -left-14 top-0 grid h-10 w-10 place-items-center rounded-full bg-field text-rice ring-4 ring-rice sm:-left-20 sm:h-14 sm:w-14"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {icons[stage.key]}
            </svg>
          </motion.span>

          <motion.article
            className="rounded-2xl bg-white/75 p-5 shadow-card ring-1 ring-husk/10 sm:p-6"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-bold tracking-widest text-paddy-dark">STEP {i + 1}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold text-field sm:text-2xl">{stage.title}</h2>
              {stage.date && (
                <time dateTime={stage.date} className="text-sm text-soil/60">
                  {formatDate(stage.date)}
                </time>
              )}
              {stage.gap && (
                <span className="rounded-full bg-rice-dim px-2.5 py-0.5 text-xs font-medium text-soil/70">{stage.gap}</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-soil/80 sm:text-base">{stage.body}</p>

            {stage.facts.length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-rice-dim/60 p-3 sm:grid-cols-4">
                {stage.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11px] uppercase tracking-wider text-soil/55">{f.label}</dt>
                    <dd className="text-sm font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {stage.link && (
              <Link
                href={stage.link.href}
                className="mt-2 inline-block py-2 text-sm font-semibold text-field underline decoration-paddy underline-offset-4"
              >
                {stage.link.label} →
              </Link>
            )}
          </motion.article>
        </li>
      ))}
    </ol>
  );
}
