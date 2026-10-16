"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import {
  BAG,
  bagX,
  clamp01,
  computeFrame,
  CONVEYOR,
  HARVESTER_PARK_X,
  M_BELT,
  M_DROP,
  M_FEED,
  M_HOP,
  M_OUT,
  MILL,
  MILL_X,
  P_STREAM,
  Q_STREAM,
  sackFill,
  sackScale,
  SPOUT,
  stageMapping,
  TROLLEY,
  TROLLEY_PARK_X,
  type HarvestFrame,
} from "@/components/hero/harvest";
import { mulberry32 } from "@/lib/random";

// Canvas grain particles for the Harvest, Mill and Pour scenes.
//
// harvest 0→1: golden paddy blows from the harvester's spout along a ballistic
//              arc into the trolley, and the heap there grows from the bottom.
// mill    0→1: the same grains ride a belt conveyor from the top of the heap into the
//              huller's hopper; after the macro, each comes out of the output chute as
//              white rice (arcing onto a growing pile) while its two husk halves blow
//              out of the aspirator.
// pour    0→1: the stream from the chute carries on into the Kisa sack: rice of
//              varied size and rotation, a slightly widening stream, a heap rising in
//              the sack's mouth (in step with the sack's bulge), a few grains bouncing.
//
// Every grain's position is a pure function of (harvest, mill, pour), with no physics
// simulation, so scrubbing the scroll backwards rewinds it exactly. The canvas
// only redraws when the timeline updates; there is no idle animation loop.
// Positions are in the harvest frame's local units; stageMapping() (harvest.ts)
// turns them into px, including the Pour camera, exactly as for the SVG layers.

export interface GrainSpillHandle {
  state: { harvest: number; mill: number; pour: number };
  render: () => void;
}

interface Particle {
  sx: number; // launch point (the spout), local units
  sy: number;
  tx: number; // resting spot in the trolley heap
  ty: number;
  h: number; // arc bulge: y(l) = sy + (ty - sy)l - 4h l(1 - l)
  t0: number; // harvest progress when it leaves the spout
  dur: number; // harvest progress it spends in the air
  angle: number; // resting rotation
  spin: number;
  feedAt: number; // mill progress when it leaves the heap for the conveyor
  outAt: number; // mill progress when it leaves the chute as white rice
  rx: number; // rice: resting spot on the pile, arc bulge, flight time, rotation
  ry: number;
  rh: number;
  rdur: number;
  rAngle: number;
  husk: [number, number, number, number]; // husk halves' launch speeds (x, up) × 2
  pAt: number; // pour: when it leaves the chute, flight time, landing spot in the sack
  pdur: number; //       (u across the mouth, height above the heap base), arc launch slope
  pu: number;
  pht: number;
  pslope: number;
  bounce: number; // pour: 0, or how far (in u) it bounces from where it first hits the heap
  size: number; // sprite size factor (rice varies a little)
}

interface Layout {
  w: number;
  h: number;
  dpr: number;
  frame: HarvestFrame;
  /** CSS px per local unit without the Pour camera (sprites are drawn at this size × zoom). */
  s0: number;
}

const HUSK_SPAN = 0.06; // mill progress over which husk halves fly and fade
/** Gravity in local units per (harvest progress)^2: sets every grain's flight time from its arc height. */
const GRAVITY = 190000;

// Heap height above the trolley floor at u in [-1, 1] across the bed: full bed, then a dome.
const BED_H = TROLLEY.floorY - TROLLEY.rimY;
const heapHeight = (u: number) => BED_H + TROLLEY.dome * (1 - u * u);
const HEAP_PEAK = BED_H + TROLLEY.dome;
// Unit normal pointing up off the conveyor belt.
const BELT_N = (() => {
  const dx = CONVEYOR.to.x - CONVEYOR.from.x;
  const dy = CONVEYOR.to.y - CONVEYOR.from.y;
  const len = Math.hypot(dx, dy);
  return { x: dy / len, y: -dx / len };
})();
// Rice pile under the chute: a dome.
const pileHeight = (u: number) => MILL.pile.h * (1 - u * u);

// Heap in the sack: its base sits just below the mouth's rim; the dome rises above it.
const SACK_HEAP_BASE = 8;
const sackHeapHeight = (u: number) => 30 - 14 * u * u;
const SACK_HEAP_U = 0.88;
const BOUNCE_SPAN = 0.025;
/** Gravity for the short pour drop (local units per pour progress^2). */
const POUR_GRAVITY = 570000;
/** Local y of the sack's heap base for a fill level (moves up as the sack bulges). */
const sackHeapBase = (fill: number) => -BAG.h * sackScale(fill).sy + SACK_HEAP_BASE;

// Solid shapes underneath the grains (paddy heap, rice pile).
const MOUND_PADDY = "rgb(185,140,31)";
const MOUND_RICE = "rgb(236,229,213)";

function buildParticles(count: number): Particle[] {
  const rand = mulberry32(5204);
  const spoutX = HARVESTER_PARK_X + SPOUT.x;

  // Resting spots inside the bed + dome, lowest first, so the heap builds up from the bottom.
  const spots = Array.from({ length: count }, () => {
    const u = rand() * 2 - 1;
    const height = heapHeight(u) * Math.sqrt(rand()) * 0.95;
    return { x: TROLLEY_PARK_X + u * TROLLEY.innerHalfW * 0.95, y: TROLLEY.floorY - 3 - height, height };
  }).sort((a, b) => a.height - b.height);

  const particles: Particle[] = spots.map((spot) => {
    const sx = spoutX + (rand() - 0.5) * 6;
    const sy = SPOUT.y + (rand() - 0.5) * 6;
    // Launch along the auger (back and slightly up): pick the initial slope, then the
    // arc bulge that gives it, then the flight time gravity needs for that arc.
    const launch = -(0.2 + rand() * 0.35) * Math.abs(spot.x - sx);
    const h = Math.max(1, (spot.y - sy - launch) / 4);
    return {
      sx,
      sy,
      tx: spot.x,
      ty: spot.y,
      h,
      t0: 0,
      dur: Math.sqrt((8 * h) / GRAVITY),
      angle: rand() * Math.PI,
      spin: (rand() - 0.5) * 14,
      feedAt: 0,
      outAt: 0,
      rx: 0,
      ry: 0,
      rh: 0,
      rdur: 0,
      rAngle: (rand() - 0.5) * 0.8,
      husk: [90 + rand() * 70, 50 + rand() * 40, 60 + rand() * 60, 20 + rand() * 40] as Particle["husk"],
      pAt: 0,
      pdur: 0,
      pu: 0,
      pht: 0,
      pslope: 0,
      bounce: 0,
      size: 0.85 + rand() * 0.3,
    };
  });

  // Landing order follows the spots (lowest first): grain i lands at an even share of the stream.
  const [s0, s1] = P_STREAM;
  particles.forEach((p, i) => {
    const land = s0 + (s1 - s0) * ((i + 0.5) / count);
    p.t0 = Math.max(s0, land - p.dur);
  });

  // Mill: the heap drains from the top (last to land, first to leave), first in first out
  // through the huller, so rice spots on the pile are also filled lowest first.
  const pile = Array.from({ length: count }, () => {
    const u = rand() * 2 - 1;
    const height = pileHeight(u) * Math.sqrt(rand()) * 0.95;
    return { x: MILL_X + MILL.pile.x + u * MILL.pile.halfW, y: -3 - height, height };
  }).sort((a, b) => a.height - b.height);
  const chuteX = MILL_X + MILL.chute.x;
  const [f0, f1] = M_FEED;
  const [o0, o1] = M_OUT;
  particles.forEach((p, i) => {
    const rank = count - 1 - i;
    p.feedAt = f0 + (f1 - f0) * ((rank + 0.5) / count);
    p.outAt = o0 + (o1 - o0 - 0.03) * ((rank + 0.5) / count);
    const spot = pile[rank];
    p.rx = spot.x;
    p.ry = spot.y;
    // Leaves the chute along its slope, then falls: same arc model as the spout.
    const slope = MILL.chuteSlope * (0.8 + 0.4 * ((rank * 7919) % 100) / 100);
    p.rh = Math.max(0, (spot.y - MILL.chute.y - slope * (spot.x - chuteX)) / 4);
    p.rdur = 0.012 + Math.sqrt((8 * Math.max(p.rh, 1)) / GRAVITY);
  });

  // Pour: rice streams from the chute into the sack. Heap spots are filled lowest first;
  // every 11th grain bounces off the top of the heap before settling.
  const sackSpots = Array.from({ length: count }, () => {
    const u = (rand() * 2 - 1) * SACK_HEAP_U;
    return { u, ht: sackHeapHeight(u) * Math.sqrt(rand()) * 0.95 };
  }).sort((a, b) => a.ht - b.ht);
  const [q0, q1] = Q_STREAM;
  particles.forEach((p, k) => {
    const spot = sackSpots[k];
    p.pu = spot.u;
    p.pht = spot.ht;
    p.pslope = MILL.chuteSlope * (0.6 + rand() * 0.8);
    if (k % 11 === 5) p.bounce = (spot.u > 0 ? -1 : 1) * (0.25 + rand() * 0.2);
    const land = q0 + (q1 - q0) * ((k + 0.5) / count) + 0.02;
    const fill = sackFill(land);
    const { sx } = sackScale(fill);
    const tx = BAG.x + (spot.u + p.bounce) * BAG.mouthHalfW * sx;
    const ty = sackHeapBase(fill) - spot.ht;
    const ox = MILL_X + MILL.chute.x;
    const h = Math.max(0, (ty - MILL.chute.y - p.pslope * (tx - ox)) / 4);
    p.pdur = 0.012 + Math.sqrt((8 * Math.max(h, 1)) / POUR_GRAVITY);
    p.pAt = land - p.pdur - (p.bounce ? BOUNCE_SPAN : 0);
  });
  return particles;
}

type Sprites = Record<"paddy" | "rice" | "chip", { img: HTMLCanvasElement; w: number; h: number }>;

function makeSprite(w: number, h: number, dpr: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * dpr));
  c.height = Math.max(1, Math.ceil(h * dpr));
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);
  draw(ctx);
  return c;
}

function createEngine(canvas: HTMLCanvasElement, state: GrainSpillHandle["state"]) {
  const ctx = canvas.getContext("2d")!;
  let layout: Layout | null = null;
  let particles: Particle[] = [];
  let sprites: Sprites | null = null;
  let spritesZoom: Sprites | null = null;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    // Phones (portrait, or landscape and short) get fewer grains and a lower canvas resolution.
    const mobile = w < 640 || h < 500;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const frame = computeFrame(w, h);
    const s0 = stageMapping(frame).s;
    const lay: Layout = { w, h, dpr, frame, s0 };
    layout = lay;
    // Fewer grains on small screens; the solid mound underneath keeps the heap looking full.
    particles = buildParticles(mobile ? 260 : 600);

    // Two sprite sets: one at the plain frame size, one at the Pour camera's full zoom, so
    // zoomed-in rice is drawn from a sharp bitmap (never scaled up).
    const zoomMax = stageMapping(frame, 1).zoom;
    sprites = makeSprites(Math.max(6, 11 * s0), dpr);
    spritesZoom = zoomMax > 1.3 ? makeSprites(Math.max(6, 11 * s0) * zoomMax, dpr) : sprites;
    render();
  }

  function makeSprites(len: number, dpr: number): Sprites {
    const wid = len * 0.42;
    return {
      paddy: {
        w: len,
        h: wid,
        img: makeSprite(len, wid, dpr, (c) => {
          const g = c.createLinearGradient(0, 0, 0, wid);
          g.addColorStop(0, "#E9C04A");
          g.addColorStop(1, "#B0821A");
          c.fillStyle = g;
          c.beginPath();
          c.ellipse(len / 2, wid / 2, len / 2 - 0.5, wid / 2 - 0.5, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "rgba(110,72,10,0.55)";
          c.lineWidth = 0.6;
          c.beginPath();
          c.moveTo(1.5, wid / 2);
          c.lineTo(len - 1.5, wid / 2);
          c.stroke();
        }),
      },
      rice: {
        w: len * 0.82,
        h: wid * 0.9,
        img: makeSprite(len * 0.82, wid * 0.9, dpr, (c) => {
          const rw = len * 0.82;
          const rh = wid * 0.9;
          const g = c.createRadialGradient(rw * 0.4, rh * 0.35, 0, rw / 2, rh / 2, rw / 2);
          g.addColorStop(0, "#FFFFFF");
          g.addColorStop(0.65, "#F8F2E6");
          g.addColorStop(1, "#E4D8C0");
          c.fillStyle = g;
          c.strokeStyle = "rgba(190,172,140,0.7)";
          c.lineWidth = Math.max(0.5, rh * 0.06);
          c.beginPath();
          c.ellipse(rw / 2, rh / 2, rw / 2 - 0.5, rh / 2 - 0.5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          // soft highlight along the top
          c.fillStyle = "rgba(255,255,255,0.85)";
          c.beginPath();
          c.ellipse(rw * 0.42, rh * 0.32, rw * 0.26, rh * 0.11, 0, 0, Math.PI * 2);
          c.fill();
        }),
      },
      chip: {
        w: len * 0.55,
        h: len * 0.22,
        img: makeSprite(len * 0.55, len * 0.22, dpr, (c) => {
          const cw = len * 0.55;
          const ch = len * 0.22;
          c.fillStyle = "#B8892E";
          c.beginPath();
          c.ellipse(cw / 2, ch, cw / 2, ch, 0, Math.PI, Math.PI * 2);
          c.fill();
        }),
      },
    };
  }

  function draw(img: HTMLCanvasElement, w: number, h: number, x: number, y: number, angle: number, dpr: number) {
    const cos = Math.cos(angle) * dpr;
    const sin = Math.sin(angle) * dpr;
    ctx.setTransform(cos, sin, -sin, cos, x * dpr, y * dpr);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }

  function render() {
    if (!layout || !sprites) return;
    const { w, h, dpr, frame, s0 } = layout;
    const { harvest, mill, pour } = state;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (harvest <= P_STREAM[0]) return;

    // The one shared mapping (same as the SVG layers), with the Pour camera.
    const map = stageMapping(frame, pour);
    const { s, x0, y0 } = map;
    const X = (x: number) => x0 + x * s;
    const Y = (y: number) => y0 + y * s;
    const zoom = s / s0;
    const sp = zoom > 1.3 && spritesZoom ? spritesZoom : sprites;
    const k = sp === sprites ? zoom : zoom / (spritesZoom!.paddy.w / sprites.paddy.w);
    const paddy = { img: sp.paddy.img, w: sp.paddy.w * k, h: sp.paddy.h * k };
    const rice = { img: sp.rice.img, w: sp.rice.w * k, h: sp.rice.h * k };
    const chip = { img: sp.chip.img, w: sp.chip.w * k, h: sp.chip.h * k };
    const mound = (cx: number, halfW: number, baseY: number, height: (u: number) => number, level: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(X(cx - halfW), Y(baseY));
      for (let k = 0; k <= 24; k++) {
        const u = -1 + k / 12;
        ctx.lineTo(X(cx + u * halfW), Y(baseY - Math.min(height(u) * 0.92, level)));
      }
      ctx.closePath();
      ctx.fill();
    };

    // Trolley heap: rises from the floor as grains land, drains from the top as the conveyor takes them.
    const fill = clamp01((harvest - P_STREAM[0] - 0.03) / (P_STREAM[1] - P_STREAM[0]));
    const drained = clamp01((mill - M_FEED[0] - 0.01) / (M_FEED[1] - M_FEED[0]));
    const heap = HEAP_PEAK * 0.9 * fill * (1 - drained);
    if (heap > 0) mound(TROLLEY_PARK_X, TROLLEY.innerHalfW, TROLLEY.floorY, heapHeight, heap, MOUND_PADDY);

    // Rice pile under the chute grows as rice lands.
    const landed = clamp01((mill - M_OUT[0] - 0.02) / (M_OUT[1] - M_OUT[0]));
    if (landed > 0) mound(MILL_X + MILL.pile.x, MILL.pile.halfW, 0, pileHeight, MILL.pile.h * 0.9 * landed, MOUND_RICE);

    // Pour: the heap in the sack's mouth rises with the same fill that bulges the SVG sack.
    const sackFull = sackFill(pour);
    const { sx } = sackScale(sackFull);
    const bx = bagX(pour, frame);
    const sackBase = sackHeapBase(sackFull);
    const mouthW = BAG.mouthHalfW * sx;
    if (sackFull > 0) mound(bx, SACK_HEAP_U * mouthW, sackBase, (u) => sackHeapHeight(u * SACK_HEAP_U), 30 * sackFull, MOUND_RICE);

    const { from: c0, to: c1 } = CONVEYOR;
    const hopX = MILL_X + MILL.hopper.x;
    const chuteX = MILL_X + MILL.chute.x;
    const huskX = MILL_X + MILL.husk.x;

    for (const p of particles) {
      const l = (harvest - p.t0) / p.dur;
      if (l <= 0) continue;

      if (l < 1) {
        // In the air from the spout: constant horizontal speed, parabolic height (gravity).
        const x = X(p.sx + (p.tx - p.sx) * l);
        const y = Y(p.sy + (p.ty - p.sy) * l - 4 * p.h * l * (1 - l));
        draw(paddy.img, paddy.w, paddy.h, x, y, p.angle + p.spin * (1 - l), dpr);
        continue;
      }

      const f = mill - p.feedAt;
      if (f <= 0) {
        // Resting in the trolley.
        draw(paddy.img, paddy.w, paddy.h, X(p.tx), Y(p.ty), p.angle, dpr);
        continue;
      }
      if (f < M_HOP) {
        // Scooped onto the belt: a short hop.
        const a = f / M_HOP;
        const x = p.tx + (c0.x - p.tx) * a;
        const y = p.ty + (c0.y - p.ty) * a - 80 * a * (1 - a);
        draw(paddy.img, paddy.w, paddy.h, X(x), Y(y), p.angle + a * 2, dpr);
        continue;
      }
      if (f < M_HOP + M_BELT) {
        // Riding the belt up to the hopper, scattered just above its surface.
        const b = (f - M_HOP) / M_BELT;
        const lift = 5 + Math.abs(p.spin) * 0.8;
        const x = c0.x + (c1.x - c0.x) * b + BELT_N.x * lift;
        const y = c0.y + (c1.y - c0.y) * b + BELT_N.y * lift;
        draw(paddy.img, paddy.w, paddy.h, X(x), Y(y), p.angle, dpr);
        continue;
      }
      if (f < M_HOP + M_BELT + M_DROP) {
        // Falling off the belt's end into the hopper mouth.
        const d = (f - M_HOP - M_BELT) / M_DROP;
        const x = c1.x + (hopX - c1.x) * d;
        const y = c1.y + (MILL.hopper.y - c1.y) * d * d;
        draw(paddy.img, paddy.w, paddy.h, X(x), Y(y), p.angle, dpr);
        continue;
      }

      // Inside the huller until it comes out.
      const o = mill - p.outAt;

      // Its two husk halves blow out of the aspirator just before, arc down and fade.
      const hk = (o + 0.01) / HUSK_SPAN;
      if (hk > 0 && hk < 1) {
        ctx.globalAlpha = 1 - hk;
        for (const side of [0, 1]) {
          const vx = p.husk[side * 2];
          const vy = p.husk[side * 2 + 1];
          const x = huskX + vx * hk;
          const y = MILL.husk.y - vy * hk + 220 * hk * hk;
          draw(chip.img, chip.w, chip.h, X(x), Y(y), p.angle + (side ? 1 : -1) * hk * 4, dpr);
        }
        ctx.globalAlpha = 1;
      }
      if (o <= 0) continue;

      // Pour: from the chute into the sack (the grain's mill pile spot is hidden behind the sack by now).
      const pq = pour - p.pAt;
      if (pour > 0 && pq > 0) {
        const settleX = bx + p.pu * mouthW;
        const settleY = sackBase - p.pht;
        const hitX = settleX + p.bounce * mouthW;
        const fl = pq / p.pdur;
        if (fl < 1) {
          // Leaves the chute along its slope, then falls; the stream widens as grains spread to their spots.
          const ox = MILL_X + MILL.chute.x;
          const hh = Math.max(0, (settleY - MILL.chute.y - p.pslope * (hitX - ox)) / 4);
          const x = ox + (hitX - ox) * fl;
          const y = MILL.chute.y + (settleY - MILL.chute.y) * fl - 4 * hh * fl * (1 - fl);
          draw(rice.img, rice.w * p.size, rice.h * p.size, X(x), Y(y), 0.3 + p.spin * 0.12 * fl, dpr);
          continue;
        }
        const bk = p.bounce ? (pq - p.pdur) / BOUNCE_SPAN : 1;
        if (bk < 1) {
          // Bounces off the top of the heap, then settles.
          const x = hitX + (settleX - hitX) * bk;
          const y = settleY - 14 * 4 * bk * (1 - bk);
          draw(rice.img, rice.w * p.size, rice.h * p.size, X(x), Y(y), p.rAngle + p.spin * 0.2 * bk, dpr);
          continue;
        }
        draw(rice.img, rice.w * p.size, rice.h * p.size, X(settleX), Y(settleY), p.rAngle, dpr);
        continue;
      }

      // White rice: leaves the chute along its slope, then falls onto the pile.
      const r = o / p.rdur;
      if (r < 1) {
        const x = chuteX + (p.rx - chuteX) * r;
        const y = MILL.chute.y + (p.ry - MILL.chute.y) * r - 4 * p.rh * r * (1 - r);
        draw(rice.img, rice.w * p.size, rice.h * p.size, X(x), Y(y), 0.46 + p.spin * 0.05 * r, dpr);
      } else {
        draw(rice.img, rice.w * p.size, rice.h * p.size, X(p.rx), Y(p.ry), p.rAngle, dpr);
      }
    }
  }

  return { render, resize };
}

export const GrainSpill = forwardRef<GrainSpillHandle, { className?: string }>(function GrainSpill(
  { className = "" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ harvest: 0, mill: 0, pour: 0 });
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);

  // Stable handle sharing one state object with the engine. The engine is attached
  // in the layout effect below, which runs before the parent Hero builds its timeline.
  useImperativeHandle(ref, () => ({ state: stateRef.current, render: () => engineRef.current?.render() }), []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createEngine(canvas, stateRef.current);
    engineRef.current = engine;
    engine.resize();
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      engineRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
});
