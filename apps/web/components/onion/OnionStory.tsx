"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OnionScene, type OnionBagInfo } from "@/components/onion/OnionScene";
import { OnionStoryStrip, onionCaptions } from "@/components/onion/OnionStoryStrip";

// Scroll-synced onion story for /shop/onions, built like the rice hero: a tall
// section with a sticky stage; GSAP only scrubs OnionScene's four CSS variables.
// Reduced motion: the scroll section is hidden and the static strip shows instead.

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Timeline positions (units; scroll maps onto them).
const AT = { pull: 0, dry: 1.1, sort: 2.3, pack: 4.1 };

export function OnionStory({ bag, skipTo }: { bag: OnionBagInfo; skipTo: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captions = onionCaptions(bag.farmerName);

  useIsoLayoutEffect(() => {
    const section = sectionRef.current;
    const root = stageRef.current?.querySelector(".os-root");
    if (!section || !root) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: section, start: "top 64px", end: "bottom bottom", scrub: 0.6 },
          })
          .fromTo(root, { "--os-pull": 0 }, { "--os-pull": 1, duration: 1 }, AT.pull)
          .fromTo(root, { "--os-dry": 0 }, { "--os-dry": 1, duration: 1 }, AT.dry)
          .fromTo(root, { "--os-sort": 0 }, { "--os-sort": 1, duration: 1.6 }, AT.sort)
          .fromTo(root, { "--os-pack": 0 }, { "--os-pack": 1, duration: 1 }, AT.pack)
          .to(".os-intro", { autoAlpha: 0, y: -20, duration: 0.25 }, 0.05)
          .to(".os-caption-pull", { autoAlpha: 1, y: 0, duration: 0.15 }, 0.2)
          .to(".os-caption-pull", { autoAlpha: 0, y: -12, duration: 0.15 }, AT.dry)
          .to(".os-caption-dry", { autoAlpha: 1, y: 0, duration: 0.15 }, AT.dry + 0.15)
          .to(".os-caption-dry", { autoAlpha: 0, y: -12, duration: 0.15 }, AT.sort)
          .to(".os-caption-sort", { autoAlpha: 1, y: 0, duration: 0.15 }, AT.sort + 0.15)
          .to(".os-caption-sort", { autoAlpha: 0, y: -12, duration: 0.15 }, AT.pack)
          .to(".os-caption-pack", { autoAlpha: 1, y: 0, duration: 0.15 }, AT.pack + 0.3)
          .to({}, { duration: 0.4 });
      },
      section,
    );
    return () => mm.revert();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="onion-story"
        aria-label="The onion story"
        className="relative h-[380vh] scroll-mt-16 motion-reduce:hidden"
      >
        <div ref={stageRef} className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
          <OnionScene bag={bag} className="absolute inset-0 h-full w-full" />

          <div className="os-intro absolute inset-x-0 top-[8%] px-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8E2F45]">The onion story</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold leading-tight text-field-dark sm:text-5xl">
              From soil to sack in four steps
            </h2>
            <p className="mx-auto mt-3 max-w-md text-soil/75">Scroll to follow one harvest.</p>
            <a href={skipTo} className="mt-2 inline-block py-2 text-sm font-semibold text-field underline decoration-[#8E2F45] underline-offset-4">
              Skip to the onions ↓
            </a>
          </div>

          {captions.map((c) => (
            <div
              key={c.key}
              className={`os-caption-${c.key} invisible absolute left-4 right-4 top-4 max-w-sm translate-y-3 rounded-2xl bg-rice/90 p-5 opacity-0 shadow-card backdrop-blur sm:bottom-10 sm:left-10 sm:right-auto sm:top-auto`}
            >
              <p className="text-xs font-bold tracking-widest text-[#8E2F45]">{c.step}</p>
              <h3 className="mt-1 text-2xl font-semibold text-field">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-soil/80">{c.text}</p>
              {c.key === "pack" && (
                <a
                  href={skipTo}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#8E2F45] px-4 py-2 text-sm font-semibold text-rice"
                >
                  Shop these onions <span aria-hidden="true">↓</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reduced-motion fallback: the same story as four still frames. */}
      <section aria-label="The onion story" className="mx-auto hidden max-w-site px-4 py-10 motion-reduce:block sm:px-6">
        <h2 className="text-2xl font-semibold text-field">The onion story</h2>
        <OnionStoryStrip bag={bag} className="mt-6" />
      </section>
    </>
  );
}
