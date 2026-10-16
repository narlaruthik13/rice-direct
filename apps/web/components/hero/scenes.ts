// Hero scene registry. The story's timing is derived from this list: scene start
// positions, caption in/out positions, total timeline length and which scene layers
// are mounted. Scene lengths and caption copy come from heroMeta.ts (GSAP-free, so the
// hero shell can size the section and the posters can show the copy without this module).
//
// Add / reorder / retime a scene here (and its length in heroMeta.ts) and the hero
// follows. Each scene's timeline factory uses positions RELATIVE to its own start.

import gsap from "gsap";
import type { GrainSpillHandle } from "@/components/hero/GrainSpill";
import { computeFrame, M_ZOOM_IN, M_ZOOM_OUT, MILL, MILL_X, stageMapping } from "@/components/hero/harvest";
import { seasonIndex, type SeasonKey } from "@/components/hero/SeasonSky";
import { SCENE_COPY, SCENE_DURATIONS } from "@/components/hero/heroMeta";
import {
  birdsTimeline,
  glowTimeline,
  grainHarvestTimeline,
  grainMillTimeline,
  grainPourTimeline,
  harvestDriveTimeline,
  harvestMillTimeline,
  harvestPourTimeline,
  harvestTimeline,
  homeTimeline,
  journeyTimeline,
  millMacroTimeline,
  monsoonTimeline,
  paddyGrowTimeline,
  paddyHarvestTimeline,
  paddyRipenTimeline,
} from "@/components/hero/timelines";

/** Visual layers on the hero stage. The grain canvas is always mounted, so it isn't listed. */
export type LayerId = "monsoon" | "field" | "birds" | "glow" | "harvest" | "journey" | "millBg" | "millMacro" | "home";

export interface SceneContext {
  section: HTMLElement;
  stage: HTMLElement;
  spill: GrainSpillHandle;
}

export interface SceneCaption {
  step: string;
  title: string;
  text: string;
  /** Fade in at this offset from the scene start. */
  in: number;
  /** Fade out at this offset (default: the scene's end, i.e. the next scene's start). */
  out?: number;
  /** Where the card sits on larger screens (default bottom-left; "top" keeps the ground clear). */
  placement?: "bottom" | "top";
}

export interface SceneDef {
  id: string;
  /** Timeline units. */
  duration: number;
  /** Label in the season indicator (Monsoon → Kharif → Harvest → Mill → Your Home). */
  stage: string;
  /**
   * Light this scene moves to. --season tweens from the previous scene's season to
   * `to`, starting at the scene start and lasting `span` × duration (default 1).
   */
  season: { to: SeasonKey; span?: number };
  caption?: SceneCaption;
  /** Layers this scene shows; a layer is mounted while the active scene is within ±1 of a scene using it. */
  layers: LayerId[];
  timeline: (ctx: SceneContext) => gsap.core.Timeline;
}

// Scene timelines share the master's old default ease, so their own tweens animate exactly as before.
const sceneTimeline = () => gsap.timeline({ defaults: { ease: "none" } });

/** Adds a tween only if its target exists (unmounted layers are skipped, then picked up on rebuild). */
function toIfPresent(tl: gsap.core.Timeline, scope: Element, selector: string, vars: gsap.TweenVars, position: number) {
  const targets = scope.querySelectorAll(selector);
  if (targets.length) tl.to(targets, vars, position);
  return tl;
}

// Scene lengths (timeline units) live in heroMeta.ts, so the hero shell can size the
// section without loading this module (and GSAP).
const DUR = SCENE_DURATIONS;
/** Pour: bag in + fill + close; the rest of the scene is a short hold on the labelled bag. */
const POUR_DURATION = 2.2;
const POUR_HOLD = DUR.pour - POUR_DURATION;
const MILL_DURATION = DUR.mill;
/** How far the camera pushes into the huller's roller window for the macro. */
const MILL_ZOOM = 2.4;

const MONSOON_DURATION = DUR.monsoon;
const RIPEN_DURATION = DUR.ripen;
const GLOW_DURATION = DUR.glow;
const HARVEST_DURATION = DUR.harvest;
const JOURNEY_DURATION = DUR.journey;
const HOME_DURATION = DUR.home;

export const SCENES: SceneDef[] = [
  {
    // Macro seed sprouting in wet mud → zoom out to the rainy field → farmer transplants seedlings.
    id: "monsoon",
    stage: "Monsoon",
    season: { to: "monsoon" },
    duration: MONSOON_DURATION,
    layers: ["monsoon", "field"],
    caption: {
      ...SCENE_COPY.monsoon,
      in: 0.15,
    },
    timeline: ({ section }) => {
      const tl = sceneTimeline().add(monsoonTimeline(section, MONSOON_DURATION), 0);
      return toIfPresent(tl, section, ".hero-intro", { autoAlpha: 0, y: -24, duration: 0.25 }, 0.05);
    },
  },
  {
    id: "grow",
    stage: "Kharif",
    season: { to: "clear" },
    // Bright blue sky, a breeze across the field (CSS bands) and a few birds.
    duration: DUR.grow,
    layers: ["field", "birds"],
    caption: { ...SCENE_COPY.grow, in: 0.15, out: 0.9 },
    timeline: ({ section }) => sceneTimeline().add(paddyGrowTimeline(section), 0).add(birdsTimeline(section, 1.6), 0),
  },
  {
    id: "ripen",
    stage: "Kharif",
    season: { to: "golden" },
    // Golden evening light: green → gold, heads bend.
    duration: RIPEN_DURATION,
    layers: ["field"],
    // Stays up through the glow close-up that follows.
    caption: { ...SCENE_COPY.ripen, in: 0.1, out: RIPEN_DURATION + GLOW_DURATION },
    timeline: ({ section }) => sceneTimeline().add(paddyRipenTimeline(section), 0),
  },
  {
    // Macro moment: zoom into one stalk, its golden grains glow, then zoom back out.
    id: "glow",
    stage: "Kharif",
    season: { to: "golden" },
    duration: GLOW_DURATION,
    layers: ["field", "glow"],
    timeline: ({ section }) => sceneTimeline().add(glowTimeline(section, GLOW_DURATION), 0),
  },
  {
    // A combine sweeps across (the field behind it turns to stubble), a tractor reverses a
    // trolley in, and golden paddy blows from the spout into it; the heap grows from the bottom.
    id: "harvest",
    stage: "Harvest",
    season: { to: "dusk" },
    duration: HARVEST_DURATION,
    layers: ["field", "harvest"],
    caption: {
      ...SCENE_COPY.harvest,
      in: 0.15,
      placement: "top",
    },
    timeline: ({ section, spill }) =>
      sceneTimeline()
        .add(harvestTimeline(section, HARVEST_DURATION), 0)
        .add(paddyHarvestTimeline(section, HARVEST_DURATION), 0)
        .add(grainHarvestTimeline(spill, HARVEST_DURATION), 0),
  },
  {
    // Transition: the harvester and field give way to a village road at dusk; the tractor
    // hauls the full trolley past fields and trees (parallax) to the mill with a lit window.
    id: "journey",
    stage: "Mill",
    season: { to: "dusk" },
    duration: JOURNEY_DURATION,
    layers: ["harvest", "journey"],
    caption: {
      ...SCENE_COPY.journey,
      in: 0.1,
      placement: "top",
    },
    timeline: ({ section }) => {
      const tl = sceneTimeline();
      toIfPresent(tl, section, ".hv-harvester", { autoAlpha: 0, duration: 0.2 }, 0);
      toIfPresent(tl, section, ".pf-root", { opacity: 0, duration: 0.2 }, 0);
      return tl
        .add(journeyTimeline(section, JOURNEY_DURATION), 0)
        .add(harvestDriveTimeline(section, JOURNEY_DURATION), 0);
    },
  },
  {
    // Inside the mill, under warm lamps: the tractor leaves, a belt conveyor lifts the paddy
    // from the trolley into the huller; the camera pushes into the roller window for the
    // macro (one husk cracks and peels off white rice), then pulls back as rice pours out
    // of the chute and husks blow from the aspirator.
    id: "mill",
    stage: "Mill",
    season: { to: "indoor", span: 0.3 },
    duration: MILL_DURATION,
    // "harvest" holds the trolley (the heap's container) and the huller.
    layers: ["harvest", "millBg", "millMacro"],
    caption: {
      ...SCENE_COPY.mill,
      in: 0.25,
      placement: "top",
    },
    timeline: ({ section, stage, spill }) => {
      const D = MILL_DURATION;
      const tl = sceneTimeline();
      toIfPresent(tl, section, ".hero-mill-bg", { autoAlpha: 1, duration: 0.4 }, 0);
      toIfPresent(tl, section, ".hv-tractor", { autoAlpha: 0, duration: 0.4 }, 0);
      toIfPresent(tl, section, ".hv-millworks", { autoAlpha: 1, duration: 0.3 }, 0.1);
      tl.add(harvestMillTimeline(section, D), 0).add(grainMillTimeline(spill, D), 0);

      // Camera: the machines and grains zoom together into the roller window, then back out.
      const zoomed = section.querySelectorAll(".hv-back, .hero-grains, .hv-front");
      if (zoomed.length) {
        const o = stageMapping(computeFrame(stage.clientWidth, stage.clientHeight)).toPx(
          MILL_X + MILL.window.x,
          MILL.window.y,
        );
        const transformOrigin = `${Math.round(o.x)}px ${Math.round(o.y)}px`;
        tl.fromTo(
          zoomed,
          { scale: 1, transformOrigin },
          { scale: MILL_ZOOM, duration: (M_ZOOM_IN[1] - M_ZOOM_IN[0]) * D, ease: "power2.in" },
          M_ZOOM_IN[0] * D,
        ).to(
          zoomed,
          { scale: 1, duration: (M_ZOOM_OUT[1] - M_ZOOM_OUT[0]) * D, ease: "power2.out" },
          M_ZOOM_OUT[0] * D,
        );
      }
      // The macro covers the screen while zoomed in.
      return tl.add(millMacroTimeline(section, (M_ZOOM_OUT[1] - M_ZOOM_IN[0]) * D), M_ZOOM_IN[0] * D);
    },
  },
  {
    // The camera pushes in on the chute as the Kisa sack slides under it; the rice stream
    // carries on into the sack (canvas), which bulges as the heap rises in its mouth. When it is
    // full the top is folded and stitched, the label slides in and a QR stamp lands.
    id: "pour",
    stage: "Mill",
    season: { to: "morning", span: 0.5 },
    duration: POUR_DURATION + POUR_HOLD,
    layers: ["harvest", "millBg"],
    caption: {
      ...SCENE_COPY.pour,
      in: POUR_DURATION * 0.72,
      placement: "top",
    },
    timeline: ({ section, spill }) =>
      sceneTimeline()
        .add(harvestPourTimeline(section, POUR_DURATION), 0)
        .add(grainPourTimeline(spill, POUR_DURATION), 0),
  },
  {
    // Morning in a kitchen: the bag on the table beside a bowl of steaming rice, then the CTA.
    id: "home",
    stage: "Your Home",
    season: { to: "morning" },
    duration: HOME_DURATION,
    layers: ["millBg", "home"],
    timeline: ({ section }) => {
      const tl = sceneTimeline().add(homeTimeline(section, HOME_DURATION), 0);
      return toIfPresent(tl, section, ".hero-pour-cta", { autoAlpha: 1, y: 0, duration: 0.3 }, 0.4 * HOME_DURATION);
    },
  },
];

// ---------- Derived values (never hardcode these) ----------

/** Start position of each scene, in timeline units. */
export const SCENE_STARTS = SCENES.reduce<number[]>((starts, _s, i) => {
  starts.push(i === 0 ? 0 : starts[i - 1] + SCENES[i - 1].duration);
  return starts;
}, []);

export const TOTAL_UNITS = SCENE_STARTS[SCENES.length - 1] + SCENES[SCENES.length - 1].duration;

/** Index of the scene playing at timeline time `t`. */
export function sceneIndexAt(t: number) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENE_STARTS[i]) return i;
  return 0;
}

/** Whether a layer should be mounted while scene `active` plays (within ±1 of any scene using it). */
export function isLayerMounted(layer: LayerId, active: number) {
  return SCENES.some((s, i) => s.layers.includes(layer) && Math.abs(i - active) <= 1);
}

/** Scenes with captions, in order (for the stage captions and the reduced-motion strip). */
export const CAPTIONED_SCENES = SCENES.filter((s): s is SceneDef & { caption: SceneCaption } => Boolean(s.caption));

/**
 * Builds the master timeline (paused): every scene at its computed start, plus
 * caption fades. Call inside a gsap.context scoped to the hero section.
 */
export function buildHeroTimeline(ctx: SceneContext) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  SCENES.forEach((scene, i) => {
    const start = SCENE_STARTS[i];
    tl.add(scene.timeline(ctx), start);
    if (scene.caption) {
      const sel = `.hero-caption-${scene.id}`;
      toIfPresent(tl, ctx.section, sel, { autoAlpha: 1, y: 0, duration: 0.15 }, start + scene.caption.in);
      toIfPresent(
        tl,
        ctx.section,
        sel,
        { autoAlpha: 0, y: -12, duration: 0.15 },
        start + (scene.caption.out ?? scene.duration),
      );
    }
  });
  // Season / light: one --season tween per scene, on the sky + tint roots only.
  const seasonTargets = ctx.section.querySelectorAll(".season-root");
  if (seasonTargets.length) {
    SCENES.forEach((scene, i) => {
      const from = i === 0 ? seasonIndex("monsoon") : seasonIndex(SCENES[i - 1].season.to);
      tl.fromTo(
        seasonTargets,
        { "--season": from },
        // Only the first sets its start value at build time; later ones would overwrite it.
        {
          "--season": seasonIndex(scene.season.to),
          duration: scene.duration * (scene.season.span ?? 1),
          immediateRender: i === 0,
        },
        SCENE_STARTS[i],
      );
    });
  }

  // Pin the length to the registry total (the last scene ends in a hold).
  tl.set({}, {}, TOTAL_UNITS);
  return tl;
}
