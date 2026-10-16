"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SeasonSky } from "@/components/hero/SeasonSky";
import { MonsoonScene } from "@/components/hero/MonsoonScene";
import { FinalFrame, HeroDataProvider, type HeroData } from "@/components/hero/HeroCta";
import { HERO_SECTION_VH } from "@/components/hero/heroMeta";

// Home hero shell. It is deliberately light (no GSAP, no scene engines):
//
// - Motion allowed: shows the story's first frame (sky + monsoon + intro), then, once the
//   hero is near the viewport, loads HeroStory (GSAP + ScrollTrigger + every scene) into
//   the same sticky stage. The section is sized from heroMeta before that chunk arrives.
// - Reduced motion: loads HeroPosters (five still frames with captions) instead; the scroll
//   scenes and the grain canvas are never mounted.
// - No JavaScript: <noscript> shows the story's final frame (the filled bag + CTA).

const HeroStory = dynamic(() => import("@/components/hero/HeroStory").then((m) => m.HeroStory), { ssr: false });
const HeroPosters = dynamic(() => import("@/components/hero/HeroPosters").then((m) => m.HeroPosters), {
  ssr: false,
  loading: () => <div className="min-h-[85svh]" />,
});

type Mode = "boot" | "story" | "posters";

/** The story's first frame, shown until the story chunk takes over the stage (and identical to it). */
function BootFrame() {
  return (
    <>
      <SeasonSky className="absolute inset-0 h-full w-full" />
      <MonsoonScene className="absolute inset-0" />
    </>
  );
}

/** `data`: the featured pack for the bag label and CTA, loaded by the home page on the server (null if unavailable). */
export function Hero({ data }: { data: HeroData | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("boot");
  /** The hero is (nearly) on screen: time to load the story chunk. */
  const [near, setNear] = useState(false);

  // Reduced motion → posters, otherwise the scroll story. Follows changes to the OS setting.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(mq.matches ? "posters" : "story");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Load GSAP + the scenes only when the hero is within ~one screen of the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (mode !== "story" || near || !section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [mode, near]);

  const storyReady = mode === "story" && near;

  return (
    <HeroDataProvider data={data}>
      <section
        ref={sectionRef}
        aria-label="From paddy field to your plate"
        // Height from the scene registry (CSS variable so reduced motion / no-JS can switch to auto).
        style={{ "--hero-h": `${HERO_SECTION_VH}vh` } as CSSProperties}
        className={`hero-section relative ${mode === "posters" ? "" : "h-[var(--hero-h)] motion-reduce:h-auto"}`}
      >
        {mode !== "posters" && (
          <div ref={stageRef} className="hero-stage sticky top-16 h-[calc(100svh-4rem)] overflow-hidden motion-reduce:hidden">
            {storyReady ? <HeroStory sectionRef={sectionRef} stageRef={stageRef} /> : <BootFrame />}

            {/* Intro: fades out as the story starts (the story's timeline targets .hero-intro). */}
            <div className="hero-intro absolute inset-x-0 top-[8%] z-[5] px-4 text-center short:top-[4%]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Kisa — mill-fresh rice</p>
              <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight text-field-dark sm:text-6xl short:text-3xl">
                From paddy field to your plate
              </h1>
              <p className="mx-auto mt-4 max-w-md text-lg text-soil/85 short:mt-2 short:text-base">
                Mill-fresh rice, honestly priced.
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-soil/65 short:hidden">Scroll to watch one season unfold.</p>
              <svg
                viewBox="0 0 24 24"
                className="mx-auto mt-6 h-6 w-6 animate-bounce text-field short:hidden"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}

        {mode === "posters" && <HeroPosters />}

        {/* No JavaScript: hide the stage and show the story's final frame instead of its first. */}
        <noscript>
          <style>{".hero-stage{display:none}.hero-section{height:auto!important}"}</style>
          <h1 className="sr-only">From paddy field to your plate</h1>
          <FinalFrame className="h-[calc(100svh-4rem)] min-h-[520px]" />
        </noscript>
      </section>
    </HeroDataProvider>
  );
}
