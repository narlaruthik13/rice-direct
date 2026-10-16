import gsap from "gsap";
import { getFieldEngine } from "@/components/hero/PaddyField";
import { getHarvestEngine } from "@/components/hero/HarvestScene";
import type { GrainSpillHandle } from "@/components/hero/GrainSpill";

// Every scene's GSAP timeline factory, in one place. The art components (PaddyField,
// HarvestScene, MonsoonScene, …) never import GSAP, so the static poster frames and
// the no-JS final frame can reuse them; GSAP and ScrollTrigger load only with the
// scroll story (HeroStory, lazy-loaded when the hero nears the viewport).

// ---------- Paddy field (engine state) ----------

/** Grow scene (duration 1): stalks rise. */
export function paddyGrowTimeline(scope: Element) {
  const tl = gsap.timeline();
  const engine = getFieldEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { grow: 0 }, { grow: 1, duration: 1, ease: "none" });
}

/** Ripen scene (duration 1): green → gold, heads bend. */
export function paddyRipenTimeline(scope: Element) {
  const tl = gsap.timeline();
  const engine = getFieldEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { bend: 0 }, { bend: 1, duration: 1, ease: "power1.inOut" });
}

/** Monsoon transplanting: the planting front sweeps across the rows. */
export function paddyPlantTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const engine = getFieldEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { plant: 0 }, { plant: 1, duration, ease: "none" });
}

/** Harvest: the cut front follows the harvester's cutter bar (see harvest.ts). */
export function paddyHarvestTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const engine = getFieldEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { harvest: 0 }, { harvest: 1, duration, ease: "none" });
}

// ---------- CSS-variable scenes ----------

/**
 * Monsoon scene timeline (duration D): --mn 0→1 on the layer, the field zooms in
 * (wrapper transform only), and the field's planting front follows the farmer.
 */
export function monsoonTimeline(scope: Element, D: number) {
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const root = scope.querySelector(".mn-root");
  const field = scope.querySelector(".hero-field");
  if (root) tl.fromTo(root, { "--mn": 0 }, { "--mn": 1, duration: D }, 0);
  if (field)
    tl.fromTo(
      field,
      { autoAlpha: 0, scale: 1.6 },
      { autoAlpha: 1, scale: 1, duration: 0.25 * D, ease: "power1.out" },
      0.3 * D,
    );
  tl.add(paddyPlantTimeline(scope, 0.5 * D), 0.45 * D);
  return tl;
}

/** Birds fly across over `duration` (starting with the Grow scene). */
export function birdsTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const root = scope.querySelector(".bd-root");
  if (!root) return tl;
  return tl.fromTo(root, { "--bd": 0 }, { "--bd": 1, duration, ease: "none" });
}

/**
 * Glow moment (duration D): zoom the field into one stalk, fade the close-up in
 * with glowing grains, hold, then zoom back out.
 */
export function glowTimeline(scope: Element, D: number) {
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const zoom = scope.querySelector(".hero-field-zoom");
  const root = scope.querySelector(".gl-root");
  if (zoom) {
    tl.fromTo(zoom, { scale: 1 }, { scale: 2.4, duration: 0.45 * D, ease: "power2.in" }, 0).to(
      zoom,
      { scale: 1, duration: 0.38 * D, ease: "power2.out" },
      0.62 * D,
    );
  }
  if (root) tl.fromTo(root, { "--gl": 0 }, { "--gl": 1, duration: D }, 0);
  return tl;
}

/** Journey (duration D): the layer fades in over the field, then the world scrolls past the rig. */
export function journeyTimeline(scope: Element, D: number) {
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const root = scope.querySelector(".jr-root");
  if (!root) return tl;
  return tl
    .fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 * D }, 0)
    .fromTo(root, { "--jr": 0 }, { "--jr": 1, duration: D, ease: "power1.inOut" }, 0);
}

/** Mill macro (duration D): --mm 0 → 1. */
export function millMacroTimeline(scope: Element, D: number) {
  const tl = gsap.timeline();
  const root = scope.querySelector(".mm-root");
  if (!root) return tl;
  return tl.fromTo(root, { "--mm": 0 }, { "--mm": 1, duration: D, ease: "none" });
}

/** Your Home (duration D): the kitchen fades in over the mill, the light swells, bag and bowl settle. */
export function homeTimeline(scope: Element, D: number) {
  const tl = gsap.timeline({ defaults: { ease: "none" } });
  const root = scope.querySelector(".hm-root");
  if (!root) return tl;
  tl.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 * D }, 0);
  const props = root.querySelector(".hm-props");
  if (props)
    tl.fromTo(props, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3 * D, ease: "power2.out" }, 0.15 * D);
  const sun = root.querySelectorAll(".hm-sun");
  if (sun.length) tl.fromTo(sun, { opacity: 0 }, { opacity: 1, duration: 0.5 * D }, 0.1 * D);
  return tl;
}

// ---------- Machines (harvest engine state) ----------

/** Harvest scene (duration D): harvest progress 0 → 1 drives the machines. */
export function harvestTimeline(scope: Element, D: number) {
  const tl = gsap.timeline();
  const engine = getHarvestEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { p: 0 }, { p: 1, duration: D, ease: "none" });
}

/** Journey: the rig's wheels turn as the road scrolls past (same ease as --jr). */
export function harvestDriveTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const engine = getHarvestEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { drive: 0 }, { drive: 1, duration, ease: "power1.inOut" });
}

/** Mill (duration D): the huller's rollers, fan and conveyor run. */
export function harvestMillTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const engine = getHarvestEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { mill: 0 }, { mill: 1, duration, ease: "none" });
}

/** Pour (duration D): the bag slides in, fills and is closed; the camera pushes in. */
export function harvestPourTimeline(scope: Element, duration: number) {
  const tl = gsap.timeline();
  const engine = getHarvestEngine(scope);
  if (!engine) return tl;
  return tl.fromTo(engine.state, { pour: 0 }, { pour: 1, duration, ease: "none" });
}

// ---------- Grain particles (canvas handle) ----------

/** Harvest (duration D): paddy blows from the spout into the trolley. */
export function grainHarvestTimeline(handle: GrainSpillHandle, duration: number) {
  return gsap
    .timeline()
    .fromTo(handle.state, { harvest: 0 }, { harvest: 1, duration, ease: "none", onUpdate: () => handle.render() });
}

/** Mill (duration D): heap → conveyor → hopper; then rice out of the chute, husks out of the aspirator. */
export function grainMillTimeline(handle: GrainSpillHandle, duration: number) {
  return gsap
    .timeline()
    .fromTo(handle.state, { mill: 0 }, { mill: 1, duration, ease: "none", onUpdate: () => handle.render() });
}

/** Pour (duration D): rice from the chute into the Kisa sack. */
export function grainPourTimeline(handle: GrainSpillHandle, duration: number) {
  return gsap
    .timeline()
    .fromTo(handle.state, { pour: 0 }, { pour: 1, duration, ease: "none", onUpdate: () => handle.render() });
}
