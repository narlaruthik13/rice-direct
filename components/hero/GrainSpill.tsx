"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { HEAD_POINTS, VIEW_H, VIEW_W } from "@/components/hero/PaddyField";
import { mulberry32 } from "@/lib/random";

// Scene 3 (and the heap half of scene 4): canvas grain particles.
//
// spill 0→1: paddy grains fall from the ripe heads into a heap.
// mill  0→1: each heap grain loses its husk (two chips fly off) and becomes white rice.
//
// Every grain's position is a pure function of (spill, mill), with no physics
// simulation, so scrubbing the scroll backwards rewinds it exactly. The canvas
// only redraws when the timeline updates; there is no idle animation loop.

export interface GrainSpillHandle {
  state: { spill: number; mill: number };
  render: () => void;
}

interface Particle {
  sx: number; // start (a grain head), viewBox units
  sy: number;
  tx: number; // resting spot in the heap
  ty: number;
  t0: number; // spill progress when it drops
  dur: number; // spill progress it takes to land
  angle: number; // resting rotation
  spin: number;
  millAt: number; // mill progress when its husk cracks
  chipAngle: number;
}

interface Layout {
  w: number;
  h: number;
  dpr: number;
  scale: number; // viewBox unit → CSS px (matches the SVG's "xMidYMax slice")
  ox: number;
  oy: number;
  halfW: number; // heap half-width, viewBox units
  heapH: number;
}

const HEAP_X = VIEW_W / 2;
const HEAP_BASE = 752;
const CHIP_SPAN = 0.12; // mill progress over which husk chips fly and fade

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

// Paddy gold → rice white for the solid heap shape underneath the grains.
const MOUND_PADDY = [185, 140, 31];
const MOUND_RICE = [236, 229, 213];
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

function buildParticles(count: number, halfW: number, heapH: number): Particle[] {
  const rand = mulberry32(5204);
  const heads = HEAD_POINTS.filter((p) => Math.abs(p.x - HEAP_X) < 420);

  const particles: Particle[] = Array.from({ length: count }, () => {
    const head = heads[Math.floor(rand() * heads.length)];
    return {
      sx: head.x + (rand() - 0.5) * 20,
      sy: head.y + (rand() - 0.5) * 14,
      tx: 0,
      ty: 0,
      t0: rand() * 0.6,
      dur: 0.25 + rand() * 0.15,
      angle: rand() * Math.PI,
      spin: (rand() - 0.5) * 10,
      millAt: 0.06 + rand() * 0.8,
      chipAngle: rand() * Math.PI * 2,
    };
  });

  // Resting spots inside a parabolic mound, lowest first, so the heap builds up
  // from the bottom: the earliest grains to land take the lowest spots.
  const spots = Array.from({ length: count }, () => {
    const u = rand() * 2 - 1;
    const height = heapH * (1 - u * u) * Math.sqrt(rand()) * 0.95;
    return { x: HEAP_X + u * halfW, y: HEAP_BASE - height, height };
  }).sort((a, b) => a.height - b.height);

  particles
    .slice()
    .sort((a, b) => a.t0 + a.dur - (b.t0 + b.dur))
    .forEach((p, i) => {
      p.tx = spots[i].x;
      p.ty = spots[i].y;
    });

  return particles;
}

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
  let sprites: Record<"paddy" | "rice" | "chip", { img: HTMLCanvasElement; w: number; h: number }> | null = null;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const mobile = w < 640;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const scale = Math.max(w / VIEW_W, h / VIEW_H);
    const visibleW = w / scale;
    const halfW = Math.min(200, visibleW * 0.4);
    layout = {
      w,
      h,
      dpr,
      scale,
      ox: (w - VIEW_W * scale) / 2,
      oy: h - VIEW_H * scale,
      halfW,
      heapH: halfW * 0.6,
    };
    // Fewer grains on small screens; the solid mound underneath keeps the heap looking full.
    particles = buildParticles(mobile ? 260 : 600, halfW, layout.heapH);

    const len = Math.max(7, 12 * scale);
    const wid = len * 0.42;
    sprites = {
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
          c.fillStyle = "#FBF7EE";
          c.strokeStyle = "#DCCFB4";
          c.lineWidth = 0.5;
          c.beginPath();
          c.ellipse(rw / 2, rh / 2, rw / 2 - 0.5, rh / 2 - 0.5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
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
    render();
  }

  function draw(img: HTMLCanvasElement, w: number, h: number, x: number, y: number, angle: number, dpr: number) {
    const cos = Math.cos(angle) * dpr;
    const sin = Math.sin(angle) * dpr;
    ctx.setTransform(cos, sin, -sin, cos, x * dpr, y * dpr);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }

  function render() {
    if (!layout || !sprites) return;
    const { w, h, dpr, scale, ox, oy, halfW, heapH } = layout;
    const { spill, mill } = state;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (spill <= 0) return;

    const X = (x: number) => ox + x * scale;
    const Y = (y: number) => oy + y * scale;

    // Solid mound grows once the first grains have landed.
    const fill = clamp01((spill - 0.3) / 0.7);
    if (fill > 0) {
      const peak = heapH * 0.85 * fill;
      ctx.fillStyle = mix(MOUND_PADDY, MOUND_RICE, mill);
      ctx.beginPath();
      ctx.moveTo(X(HEAP_X - halfW * 0.98), Y(HEAP_BASE));
      ctx.quadraticCurveTo(X(HEAP_X), Y(HEAP_BASE - peak * 2), X(HEAP_X + halfW * 0.98), Y(HEAP_BASE));
      ctx.closePath();
      ctx.fill();
    }

    for (const p of particles) {
      const l = clamp01((spill - p.t0) / p.dur);
      if (l <= 0) continue;

      // Linear drift sideways, quadratic fall (gravity), spin settles on landing.
      const x = X(p.sx + (p.tx - p.sx) * l);
      const y = Y(p.sy + (p.ty - p.sy) * l * l);
      const angle = p.angle + p.spin * (1 - l);

      if (mill < p.millAt) {
        draw(sprites.paddy.img, sprites.paddy.w, sprites.paddy.h, x, y, angle, dpr);
        continue;
      }

      draw(sprites.rice.img, sprites.rice.w, sprites.rice.h, x, y, angle, dpr);

      // Husk chips: two halves burst sideways, arc down and fade.
      const k = (mill - p.millAt) / CHIP_SPAN;
      if (k < 1) {
        ctx.globalAlpha = 1 - k;
        for (const side of [-1, 1]) {
          const cx = x + Math.cos(p.chipAngle) * side * k * 18 * scale;
          const cy = y + (Math.sin(p.chipAngle) * side * 10 * k + 36 * k * k) * scale;
          draw(sprites.chip.img, sprites.chip.w, sprites.chip.h, cx, cy, p.chipAngle + side * k * 3, dpr);
        }
        ctx.globalAlpha = 1;
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
  const stateRef = useRef({ spill: 0, mill: 0 });
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

/** Spill: grains fall into the heap (duration 1.2). */
export function grainSpillTimeline(handle: GrainSpillHandle) {
  return gsap.timeline().fromTo(
    handle.state,
    { spill: 0 },
    { spill: 1, duration: 1.2, ease: "none", onUpdate: () => handle.render() },
  );
}

/** Mill: heap grains lose their husks and turn white. */
export function grainMillTimeline(handle: GrainSpillHandle, duration: number) {
  return gsap.timeline().fromTo(
    handle.state,
    { mill: 0 },
    { mill: 1, duration, ease: "none", onUpdate: () => handle.render() },
  );
}
