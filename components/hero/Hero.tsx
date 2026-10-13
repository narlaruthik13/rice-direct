"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PaddyField, paddyFieldTimeline } from "@/components/hero/PaddyField";
import {
  GrainSpill,
  grainMillTimeline,
  grainSpillTimeline,
  type GrainSpillHandle,
} from "@/components/hero/GrainSpill";
import { MillingScene, millingSceneTimeline } from "@/components/hero/MillingScene";
import { RicePour, ricePourTimeline } from "@/components/hero/RicePour";
import { buttonClasses } from "@/components/ui/Button";
import { getFarmer, getPartner, getRiceBatch, riceProducts } from "@/data/mock";
import { formatDate } from "@/lib/format";

// Master timeline positions (timeline units, not seconds; scroll maps onto them).
const SPILL_AT = 2.2;
const MILL_AT = 3.5;
const MILL_DURATION = 1.4;
const POUR_AT = 5.3;
const POUR_DURATION = 1.4;

// The bag in the final scene: the first featured farmer-owned rice, packed in the farmer's name.
const heroProduct = riceProducts.find((p) => p.featured && p.salesModel === "FARMER_OWNED") ?? riceProducts[0];
const heroFarmer = getFarmer(heroProduct.farmerId)!;
const heroMill = getPartner(heroProduct.partnerId)!;
const heroBatch = getRiceBatch(heroProduct.batchId)!;

// useLayoutEffect sets the animation's start state before paint; fall back on the server.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const captions = [
  {
    key: "grow",
    step: "01",
    title: "Grow",
    text: "Seedlings rise from Godavari delta soil, tended by the farmer for four months.",
  },
  {
    key: "ripen",
    step: "02",
    title: "Ripen",
    text: "Green turns to gold. Heavy grain heads bow. Harvest is close.",
  },
  {
    key: "spill",
    step: "03",
    title: "Harvest",
    text: "The paddy is cut and threshed. Golden grains, still in their husks, pile into the farmer's heap.",
  },
  {
    key: "mill",
    step: "04",
    title: "Mill",
    text: "At the partner mill, rubber rollers crack off the husk. Golden paddy becomes white rice, and it is still the farmer's own.",
  },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<GrainSpillHandle>(null);

  useIsoLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const spill = spillRef.current;
    if (!section || !stage || !spill) return;
    gsap.registerPlugin(ScrollTrigger);

    // Only build the scroll story when the user hasn't asked for reduced motion.
    // mm.revert() undoes every tween + ScrollTrigger, e.g. if the preference changes.
    const mm = gsap.matchMedia();
    mm.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top 64px", // just below the sticky navbar
            end: "bottom bottom",
            scrub: 0.6,
          },
        });

        tl.add(paddyFieldTimeline(section), 0)
          .to(".hero-intro", { autoAlpha: 0, y: -24, duration: 0.25 }, 0.05)
          .to(".hero-caption-grow", { autoAlpha: 1, y: 0, duration: 0.15 }, 0.15)
          .to(".hero-caption-grow", { autoAlpha: 0, y: -12, duration: 0.15 }, 0.9)
          .to(".hero-caption-ripen", { autoAlpha: 1, y: 0, duration: 0.15 }, 1.1)

          // Scene 3: grains fall from the heads into a heap; the field dims.
          .addLabel("spill", SPILL_AT)
          .to(".hero-caption-ripen", { autoAlpha: 0, y: -12, duration: 0.15 }, "spill")
          .add(grainSpillTimeline(spill), "spill")
          .to(".hero-caption-spill", { autoAlpha: 1, y: 0, duration: 0.15 }, "spill+=0.15")
          .to(".pf-root", { opacity: 0.6, duration: 0.5 }, "spill+=0.7")

          // Scene 4: the field gives way to the mill; heap + close-up mill together.
          .addLabel("mill", MILL_AT)
          .to(".hero-caption-spill", { autoAlpha: 0, y: -12, duration: 0.15 }, "mill")
          .to(".pf-root", { opacity: 0, duration: 0.4 }, "mill")
          .to(".hero-mill-bg", { autoAlpha: 1, duration: 0.4 }, "mill")
          .add(millingSceneTimeline(stage, MILL_DURATION), "mill+=0.1")
          .add(grainMillTimeline(spill, MILL_DURATION), "mill+=0.25")
          .to(".hero-caption-mill", { autoAlpha: 1, y: 0, duration: 0.15 }, "mill+=0.25")

          // Scene 5: close-up and heap clear away; rice pours into the farmer's bag, then the CTA.
          .addLabel("pour", POUR_AT)
          .to(".hero-caption-mill", { autoAlpha: 0, y: -12, duration: 0.15 }, "pour")
          .to(".hero-mill-scene", { autoAlpha: 0, y: -30, duration: 0.3 }, "pour")
          .to(".hero-grains", { autoAlpha: 0, y: 60, duration: 0.4 }, "pour")
          .add(ricePourTimeline(stage, POUR_DURATION), "pour+=0.15")
          .to(".hero-pour-cta", { autoAlpha: 1, y: 0, duration: 0.3 }, `pour+=${0.35 + POUR_DURATION * 0.85}`)

          // Hold so the full bag and CTA rest before the section scrolls away.
          .to({}, { duration: 0.5 });
      },
      section,
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="From paddy field to your plate"
      className="relative h-[560vh] motion-reduce:h-auto"
    >
      <div
        ref={stageRef}
        className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden motion-reduce:relative motion-reduce:top-0 motion-reduce:h-[85svh]"
      >
        <PaddyField className="absolute inset-0 h-full w-full" />

        {/* Mill interior backdrop, faded in for scene 4 and kept for scene 5. Dark so white rice reads clearly. */}
        <div className="hero-mill-bg invisible absolute inset-0 bg-gradient-to-b from-[#3A2A1C] to-[#1F160E] opacity-0" />

        <GrainSpill ref={spillRef} className="hero-grains absolute inset-0 h-full w-full motion-reduce:hidden" />

        {/* Wrapper centres the close-up, so GSAP can animate the SVG's own transform freely. */}
        <div className="hero-mill-scene pointer-events-none absolute inset-x-0 top-[30%] flex justify-center px-4 sm:top-[16%] motion-reduce:hidden">
          <MillingScene className="invisible w-full max-w-[640px] opacity-0" />
        </div>

        {/* Scene 5: bag + CTA. Both start hidden; the timeline reveals them. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 py-6 sm:flex-row sm:gap-16 motion-reduce:hidden">
          <RicePour product={heroProduct} farmer={heroFarmer} className="invisible h-[50%] w-auto opacity-0 sm:h-[80%]" />
          <PourCta className="hero-pour-cta invisible translate-y-4 opacity-0" />
        </div>

        <div className="hero-intro absolute inset-x-0 top-[8%] px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Farmer → Mill → You</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight text-field-dark sm:text-6xl">
            From paddy field to your plate
          </h1>
          <p className="mx-auto mt-4 max-w-md text-soil/75 motion-reduce:hidden">Scroll to watch one season unfold.</p>
          <svg
            viewBox="0 0 24 24"
            className="mx-auto mt-6 h-6 w-6 text-field motion-safe:animate-bounce motion-reduce:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Captions are revealed by the scroll timeline; hidden in reduced-motion mode. */}
        {captions.map((c) => (
          <div
            key={c.key}
            className={`hero-caption-${c.key} invisible absolute left-4 right-4 top-4 max-w-sm translate-y-3 rounded-2xl bg-rice/90 p-5 opacity-0 shadow-card backdrop-blur sm:bottom-10 sm:left-10 sm:right-auto sm:top-auto motion-reduce:hidden`}
          >
            <p className="text-xs font-bold tracking-widest text-paddy-dark">{c.step}</p>
            <h2 className="mt-1 text-2xl font-semibold text-field">{c.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-soil/80">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Reduced-motion fallback: the whole story as a static strip under the ripe field. */}
      <div className="hidden bg-gradient-to-b from-[#3A2A1C] to-[#1F160E] px-4 py-14 text-rice motion-reduce:block sm:px-6">
        <MillingScene className="mx-auto w-full max-w-xl" />
        <ol className="mx-auto mt-10 grid max-w-site gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {captions.map((c) => (
            <li key={c.key}>
              <p className="text-xs font-bold tracking-widest text-paddy-light">{c.step}</p>
              <h2 className="mt-1 text-xl font-semibold">{c.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-rice/75">{c.text}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-14 flex max-w-site flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
          <RicePour product={heroProduct} farmer={heroFarmer} className="h-80 w-auto" />
          <PourCta />
        </div>
      </div>
    </section>
  );
}

/** Final step card: whose bag this is, plus Shop Now and Trace links. */
function PourCta({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full max-w-sm rounded-2xl bg-rice/95 p-6 text-soil shadow-card ${className}`}>
      <p className="text-xs font-bold tracking-widest text-paddy-dark">05</p>
      <h2 className="mt-1 text-2xl font-semibold text-field">Packed in the farmer&apos;s name</h2>
      <p className="mt-2 text-sm leading-relaxed text-soil/80">
        {heroFarmer.name}&apos;s {heroProduct.name} from {heroFarmer.village}, milled at {heroMill.name} on{" "}
        {formatDate(heroBatch.millingDate)}. Every bag carries batch <span className="font-mono text-xs">{heroBatch.id}</span>.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/shop" className={buttonClasses("primary")}>
          Shop Now <span aria-hidden="true">→</span>
        </Link>
        <Link href={`/trace/${heroBatch.id}`} className={buttonClasses("secondary")}>
          Trace this bag
        </Link>
      </div>
    </div>
  );
}
