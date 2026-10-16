"use client";

import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PaddyField, renderField } from "@/components/hero/PaddyField";
import { Birds } from "@/components/hero/Birds";
import { GlowMacro } from "@/components/hero/GlowMacro";
import { GrainSpill, type GrainSpillHandle } from "@/components/hero/GrainSpill";
import { HarvestBack, HarvestFront, HarvestLabel, renderHarvest } from "@/components/hero/HarvestScene";
import { MillMacro } from "@/components/hero/MillMacro";
import { SeasonSky, SeasonTint } from "@/components/hero/SeasonSky";
import { MonsoonScene } from "@/components/hero/MonsoonScene";
import { JourneyScene } from "@/components/hero/JourneyScene";
import { HomeScene } from "@/components/hero/HomeScene";
import { CTA_POSITION, PourCta, useHeroLabel } from "@/components/hero/HeroCta";
import { buildHeroTimeline, CAPTIONED_SCENES, isLayerMounted, sceneIndexAt, SCENES, TOTAL_UNITS } from "@/components/hero/scenes";

// The scroll story: every scene layer, the grain canvas, captions, the season
// indicator and the Skip button, driven by GSAP + ScrollTrigger. This module (and so
// GSAP) is code-split: the Hero shell loads it only when motion is allowed and the
// hero is near the viewport. It renders into the shell's sticky stage.

// Season indicator stages, in story order (several scenes can share one, e.g. Grow + Ripen = Kharif).
const STAGES = SCENES.map((s) => s.stage).filter((stage, i, all) => all.indexOf(stage) === i);

export function HeroStory({
  sectionRef,
  stageRef,
}: {
  sectionRef: RefObject<HTMLElement>;
  stageRef: RefObject<HTMLDivElement>;
}) {
  const spillRef = useRef<GrainSpillHandle>(null);
  /** Current (scrubbed) timeline time, in units. */
  const timeRef = useRef(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const activeRef = useRef(0);
  /** Scene on screen; drives which layers are mounted (mount-on-demand). */
  const [active, setActive] = useState(0);
  /** True once the scroll driver is set up. */
  const [storyOn, setStoryOn] = useState(false);

  // 1) Scroll driver. One ScrollTrigger scrubs a single clock 0 → TOTAL_UNITS; the master
  //    timeline follows the clock. The shell only mounts this with motion allowed.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const clock = { t: 0 };
      gsap.to(clock, {
        t: TOTAL_UNITS,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 64px", // just below the sticky navbar
          end: "bottom bottom",
          scrub: 0.6,
        },
        onUpdate: () => {
          timeRef.current = clock.t;
          tlRef.current?.time(clock.t, false);
          renderField(section); // writes only the stalk transforms / paint colours that changed
          renderHarvest(section); // same for the harvester / trolley transforms
          const i = sceneIndexAt(clock.t);
          if (i !== activeRef.current) {
            activeRef.current = i;
            setActive(i);
          }
        },
      });
    });
    setStoryOn(true);
    return () => {
      setStoryOn(false);
      ctx.revert();
    };
  }, [sectionRef]);

  // Skip story: scroll just past the hero (under the 64px sticky navbar) and move focus to
  // the next section, so keyboard and screen-reader users land there too.
  const skipStory = () => {
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().bottom + window.scrollY - 64;
    window.scrollTo({ top, behavior: "smooth" });
    const next = section.nextElementSibling;
    if (next instanceof HTMLElement) {
      next.setAttribute("tabindex", "-1");
      next.focus({ preventScroll: true });
    }
  };

  // 2) Master timeline, (re)built whenever the active scene changes which layers are
  //    mounted. Tweens resolve their targets at build time, so a newly mounted layer
  //    needs a fresh timeline. The old one is reverted first (elements back to their
  //    initial state), then the new one jumps to the current time before paint, so
  //    scrubbing in either direction lands on exactly the same frame.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const spill = spillRef.current;
    if (!storyOn || !section || !stage || !spill) return;

    const ctx = gsap.context(() => {
      const tl = buildHeroTimeline({ section, stage, spill });
      tl.time(timeRef.current, false);
      renderField(section);
      renderHarvest(section);
      spill.render();
      tlRef.current = tl;
    }, section);
    return () => {
      tlRef.current = null;
      ctx.revert();
    };
  }, [storyOn, active, sectionRef, stageRef]);

  const heroLabel = useHeroLabel(); // stable: the page passes it once
  // Heavy layers are memoised so a scene change only mounts/unmounts them, never re-renders.
  const fieldLayer = useMemo(
    () => (
      // Wrapper takes the Monsoon zoom-out (one compositor transform), so the stalks are never restyled for it.
      <div className="hero-field absolute inset-0 origin-[50%_92%]">
        {/* Inner wrapper takes the Glow zoom into one stalk (separate origin from the Monsoon zoom). */}
        <div className="hero-field-zoom absolute inset-0 origin-[52%_50%]">
          <PaddyField sky={false} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    ),
    [],
  );
  const birdsLayer = useMemo(() => <Birds className="absolute inset-0 h-full w-full" />, []);
  const glowLayer = useMemo(() => <GlowMacro className="absolute inset-0 h-full w-full" />, []);
  const harvestBackLayer = useMemo(() => <HarvestBack className="absolute inset-0 h-full w-full" />, []);
  const harvestFrontLayer = useMemo(
    () => (
      <>
        <HarvestFront className="absolute inset-0 h-full w-full" />
        {/* The bag's label: HTML (no SVG <text>), placed on the sack by the harvest renderer. */}
        <HarvestLabel {...heroLabel} />
      </>
    ),
    [heroLabel],
  );
  const journeyLayer = useMemo(() => <JourneyScene className="invisible absolute inset-0 h-full w-full opacity-0" />, []);
  const monsoonLayer = useMemo(() => <MonsoonScene className="absolute inset-0" />, []);
  const skyLayer = useMemo(() => <SeasonSky className="absolute inset-0 h-full w-full" />, []);
  const millMacroLayer = useMemo(() => <MillMacro className="absolute inset-0 h-full w-full" />, []);
  const homeLayer = useMemo(
    () => (
      // Your Home: kitchen table scene (starts hidden), and the CTA below the bag or to its right on wide screens.
      <>
        <HomeScene label={heroLabel} className="invisible absolute inset-0 opacity-0" />
        <div className={CTA_POSITION}>
          <PourCta className="hero-pour-cta pointer-events-auto invisible translate-y-4 opacity-0" />
        </div>
      </>
    ),
    [heroLabel],
  );

  return (
    <>
      {/* Season sky (always mounted, cheap): the only element whose --season changes besides the tint. */}
      {skyLayer}

      {/* Layers mount only while the active scene is within ±1 of a scene that uses them (see scenes.ts). */}
      {isLayerMounted("birds", active) && birdsLayer}
      {isLayerMounted("field", active) && fieldLayer}
      {isLayerMounted("monsoon", active) && monsoonLayer}

      {/* Village road at dusk (Journey), under the rig; the mill backdrop covers it. */}
      {isLayerMounted("journey", active) && journeyLayer}

      {/* Mill interior backdrop (Mill + Pour): warm lamplight from above, dark enough for white rice to read. */}
      {isLayerMounted("millBg", active) && (
        <div className="hero-mill-bg invisible absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,#8A5A2E_0%,#4A2E18_45%,#1F140C_100%)] opacity-0" />
      )}

      {/* Harvester, tractor and the trolley's inside (above the mill backdrop so the trolley stays for Mill). */}
      {isLayerMounted("harvest", active) && harvestBackLayer}

      {/* The grain canvas stays mounted: its particles are a pure function of the timeline. */}
      <GrainSpill ref={spillRef} className="hero-grains absolute inset-0 h-full w-full" />

      {/* The trolley's slatted side, over the grains so the heap shows between the planks. */}
      {isLayerMounted("harvest", active) && harvestFrontLayer}

      {/* Ambient light over field + grains: one blended layer, no per-stalk restyling. */}
      <SeasonTint className="absolute inset-0" />

      {/* Ripe-grain close-up sits above the tint so its grains keep their glow. */}
      {isLayerMounted("glow", active) && glowLayer}

      {/* Mill macro: one grain fills the screen while the camera is zoomed into the rollers. */}
      {isLayerMounted("millMacro", active) && millMacroLayer}
      {isLayerMounted("home", active) && homeLayer}

      {/* Season indicator: highlights the current stage. Hidden on very short screens. */}
      <ol
        aria-label="Season"
        className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1 px-3 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-5 [@media(max-height:379px)]:hidden"
      >
        {STAGES.map((stage, i) => {
          const activeStage = STAGES.indexOf(SCENES[active].stage);
          const current = storyOn && i === activeStage;
          return (
            <li key={stage} className="flex items-center gap-1">
              {i > 0 && <span className="hidden h-px w-3 bg-soil/25 sm:block" aria-hidden="true" />}
              <span
                aria-current={current ? "step" : undefined}
                className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur transition-colors duration-300 sm:px-2.5 sm:text-[11px] ${
                  current ? "bg-field text-rice" : i < activeStage ? "bg-rice/80 text-field" : "bg-rice/60 text-soil/60"
                }`}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Skip the story: smooth-scrolls to the content after the hero. Not needed on the last scene. */}
      {storyOn && active < SCENES.length - 1 && (
        <button
          type="button"
          onClick={skipStory}
          className="absolute bottom-14 right-3 z-10 rounded-full bg-rice/85 px-3 py-1.5 text-xs font-semibold text-field shadow-sm backdrop-blur transition-colors hover:bg-rice focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-field sm:bottom-6 sm:right-6 short:bottom-3"
        >
          Skip story <span aria-hidden="true">↓</span>
        </button>
      )}

      {/* Captions are revealed by the scroll timeline. On short (landscape phone) screens they
          shrink to a small card in the top-left corner, clear of the action at the bottom. */}
      {CAPTIONED_SCENES.map(({ id, caption: c }) => (
        <div
          key={id}
          className={`hero-caption-${id} invisible absolute left-4 right-4 top-4 z-10 max-w-sm translate-y-3 rounded-2xl bg-rice/90 p-5 opacity-0 shadow-card backdrop-blur sm:left-10 sm:right-auto ${
            c.placement === "top" ? "sm:top-16 lg:top-8" : "sm:bottom-10 sm:top-auto"
          } short:bottom-auto short:left-3 short:top-3 short:max-w-[15rem] short:p-3`}
        >
          <p className="text-xs font-bold tracking-widest text-paddy-dark short:text-[10px]">{c.step}</p>
          <h2 className="mt-1 text-2xl font-semibold text-field short:mt-0 short:text-base">{c.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-soil/80 short:mt-0.5 short:text-xs short:leading-snug">{c.text}</p>
        </div>
      ))}
    </>
  );
}
