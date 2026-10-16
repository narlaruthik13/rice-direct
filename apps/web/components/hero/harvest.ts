// Harvest + Mill geometry, shared by the machines SVG (HarvestScene), the grain
// particles (GrainSpill) and the field's stubble front (PaddyField).
//
// Everything is a pure function of scene progress and the "frame": the
// composition (tractor + trolley + harvester, later the mill and the bag) is drawn
// in local units with the ground at y = 0, then scaled by k and centred so it fits
// any screen. Field viewBox x = c + k * localX, y = gy + k * localY.
//
// stageMapping() is the ONE place that turns local units into CSS px (and into the
// SVG frame transform), including the Pour scene's camera push-in. The SVG layers,
// the grain canvas and the HTML bag label all use it, so they never drift apart.

// Same viewBox and "xMidYMax slice" mapping as PaddyField.
const VIEW_W = 1200;
const VIEW_H = 800;

/** Field viewBox y the machines drive on (the foreground soil). */
export const GROUND_Y = 772;

// ---- Timeline (harvest progress p) ----
/** Harvester enters and sweeps across, cutting, until it parks. */
export const P_PARK = 0.48;
/** Tractor reverses the trolley in behind the harvester. */
export const P_RIG = [0.3, 0.58] as const;
/** Unloading auger swings out. */
export const P_AUGER = [0.55, 0.62] as const;
/** Paddy stream from the spout into the trolley. */
export const P_STREAM = [0.62, 0.95] as const;

// ---- Harvester (local units, origin = centre of the tracks on the ground, facing right) ----
export const HARVESTER_PARK_X = 218;
/** Local x (from the harvester origin) of the cutter bar: the field is cut here. */
export const CUTTER_X = 182;
/** Right-most point (reel / cutter tip). */
const HARVESTER_FRONT = 228;
export const AUGER_PIVOT = { x: -110, y: -195 };
export const AUGER_LEN = 130;
/** Auger angle (degrees, SVG rotate): folded forward along the tank → swung out back and up. */
export const AUGER_FOLDED = 0;
export const AUGER_OUT = -160;
/** Spout opening, in the auger's own (unrotated) coordinates. */
const SPOUT_LOCAL = { x: 128, y: -16 };

function rotate(x: number, y: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
}

/** Spout opening when unloading, relative to the harvester origin. */
export const SPOUT = (() => {
  const r = rotate(SPOUT_LOCAL.x, SPOUT_LOCAL.y, AUGER_OUT);
  return { x: AUGER_PIVOT.x + r.x, y: AUGER_PIVOT.y + r.y };
})();

// ---- Trolley (local units, origin = centre of the bed on the ground) ----
export const TROLLEY = {
  halfW: 100,
  /** Inner half-width of the bed (where grains can rest). */
  innerHalfW: 94,
  floorY: -46,
  rimY: -106,
  /** Height of the heap's dome above the rim at the centre. */
  dome: 46,
};
/** The trolley parks with its right rim just under the spout, so every grain flies back and down. */
export const TROLLEY_PARK_X = HARVESTER_PARK_X + SPOUT.x - TROLLEY.innerHalfW - 2;
/** Tractor origin relative to the trolley (drawbar + hitch). */
export const TRACTOR_OFFSET = -230;
const TRACTOR_BACK = -92; // tractor's left-most point, relative to its origin

// ---- Mill (local units, machine origin = centre of its base, where the harvester parked) ----
export const MILL_X = TROLLEY_PARK_X + 300;
/** Points on the huller, relative to MILL_X. */
export const MILL = {
  /** Top of the hopper mouth: grains drop in here. */
  hopper: { x: -20, y: -292 },
  /** Roller window: the camera zooms in here for the macro. */
  window: { x: -20, y: -122 },
  /** Aspirator outlet: husks blow out here. */
  husk: { x: 134, y: -284 },
  /** Output chute mouth (high on the body, so a bag fits under it) and its slope (down per unit right). */
  chute: { x: 174, y: -178 },
  chuteSlope: 0.2,
  /** Rice pile on the floor under the chute (the bag is set down in front of it in Pour). */
  pile: { x: 205, halfW: 40, h: 34 },
};
/** Belt conveyor from the trolley's heap up over the hopper (absolute local coords). */
export const CONVEYOR = {
  from: { x: TROLLEY_PARK_X + 70, y: -112 },
  to: { x: MILL_X + MILL.hopper.x - 4, y: MILL.hopper.y - 26 },
};

// ---- Mill timeline (mill progress m) ----
/** Heap grains leave the trolley (top of the heap first) over this window. */
export const M_FEED = [0.12, 0.25] as const;
/** Per grain: hop onto the belt, ride it, drop into the hopper (mill progress). */
export const M_HOP = 0.025;
export const M_BELT = 0.07;
export const M_DROP = 0.015;
/** Camera zooms into the roller window, holds on the macro, zooms back out. */
export const M_ZOOM_IN = [0.3, 0.38] as const;
export const M_ZOOM_OUT = [0.6, 0.7] as const;
/** White rice leaves the chute (and husks the aspirator) over this window. */
export const M_OUT = [0.64, 0.97] as const;

// ---- Pour (local units; bag origin = centre of its base, at full size) ----
export const BAG = { x: MILL_X + 200, h: 96, mouthHalfW: 46, baseHalfW: 62 };
/** Label and QR stamp on the full bag, relative to the bag origin. */
export const BAG_LABEL = { x: -40, y: -82, w: 66, h: 62 };
export const BAG_QR = { x: 31, y: -40, size: 15 };
/** Pour timeline (pour progress q): bag slides in + camera pushes in, rice streams, then the bag is closed. */
export const Q_ENTER = [0, 0.16] as const;
export const Q_CAM = [0, 0.2] as const;
export const Q_STREAM = [0.16, 0.62] as const;
export const Q_FILL = [0.18, 0.66] as const;
export const Q_FOLD = [0.7, 0.76] as const;
export const Q_STITCH = [0.76, 0.86] as const;
export const Q_LABEL = [0.84, 0.92] as const;
export const Q_QR = [0.9, 0.97] as const;
/** What the Pour camera frames: the chute mouth down to the bag's base. */
const CAM_FOCUS = { x: MILL_X + 172, y: -91 };
const CAM_SPAN = { w: 180, h: 182 };

/** Local x span of the parked composition (Harvest) and the mill floor (Mill). */
const SPAN_L = TROLLEY_PARK_X + TRACTOR_OFFSET + TRACTOR_BACK;
const SPAN_R = Math.max(HARVESTER_PARK_X + HARVESTER_FRONT, MILL_X + MILL.pile.x + MILL.pile.halfW);

// ---- Frame ----
export interface HarvestFrame {
  k: number;
  c: number;
  /** Stage size (CSS px), field viewBox → px scale and the viewBox origin in px ("xMidYMax slice"). */
  w: number;
  h: number;
  scale: number;
  ox: number;
  oy: number;
  /** Ground line (viewBox y); raised on phones so the season pills don't cover the wheels. */
  gy: number;
  /** Visible viewBox x range on this screen. */
  visL: number;
  visR: number;
}

/** Frame for a stage of w × h CSS px: fit the parked composition into the visible field width. */
export function computeFrame(w: number, h: number): HarvestFrame {
  const scale = w && h ? Math.max(w / VIEW_W, h / VIEW_H) : 1;
  const visW = w && h ? w / scale : VIEW_W;
  const visL = (VIEW_W - visW) / 2;
  const visR = visL + visW;
  const k = Math.min(1, (visW * 0.94) / (SPAN_R - SPAN_L));
  // Centred, nudged right when there is room (the bottom-left caption card sits there).
  const slack = (visW - k * (SPAN_R - SPAN_L)) / 2;
  const c = VIEW_W / 2 - k * ((SPAN_L + SPAN_R) / 2) + Math.min(60, slack * 0.8);
  const gy = w && w < 640 ? GROUND_Y - 46 / scale : GROUND_Y;
  const W = w || VIEW_W;
  const H = h || VIEW_H;
  return { k, c, gy, visL, visR, w: W, h: H, scale, ox: (W - VIEW_W * scale) / 2, oy: H - VIEW_H * scale };
}

/**
 * Pour camera layout: bag on the left with the CTA card on the right, or bag on top, card below.
 * Same rule as Tailwind's `wide` screen (viewport = stage + the 64px navbar).
 */
export const pourSideLayout = (f: HarvestFrame) => f.w >= 1024 || (f.w >= 640 && f.w / (f.h + 64) >= 1.6);

export interface StageMapping {
  /** CSS px per local unit, and the CSS px of local (0, 0). */
  s: number;
  x0: number;
  y0: number;
  /** Camera zoom relative to the plain frame (1 outside Pour). */
  zoom: number;
  toPx: (lx: number, ly: number) => { x: number; y: number };
  /** The same mapping as a transform for a group inside a field-viewBox SVG. */
  svgTransform: string;
  /** Only the camera move, for viewBox-space art outside the frame (e.g. the mill's ceiling lamps). */
  cameraTransform: string;
}

/**
 * Local units → stage CSS px for frame `f` at pour progress `pour` (0 = no camera move).
 * The camera pushes in on the chute + bag and glides them to where the layout wants them.
 */
export function stageMapping(f: HarvestFrame, pour = 0): StageMapping {
  const s0 = f.k * f.scale;
  const bx = f.ox + f.c * f.scale;
  const by = f.oy + f.gy * f.scale;
  let s = s0;
  let x0 = bx;
  let y0 = by;
  let zoom = 1;
  const e = smooth(phase(pour, Q_CAM));
  if (e > 0) {
    const side = pourSideLayout(f);
    const availW = side ? f.w * 0.58 : f.w;
    const availH = side ? f.h * 0.9 : f.h * 0.58;
    const Z = Math.max(1, Math.min((availH * 0.8) / (CAM_SPAN.h * s0), (availW * 0.8) / (CAM_SPAN.w * s0)));
    zoom = 1 + (Z - 1) * e;
    const fx = bx + CAM_FOCUS.x * s0;
    const fy = by + CAM_FOCUS.y * s0;
    const tx = fx + ((side ? 0.31 : 0.5) * f.w - fx) * e;
    const ty = fy + ((side ? 0.5 : 0.31) * f.h - fy) * e;
    s = s0 * zoom;
    x0 = tx + (bx - fx) * zoom;
    y0 = ty + (by - fy) * zoom;
  }
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    s,
    x0,
    y0,
    zoom,
    toPx: (lx, ly) => ({ x: x0 + lx * s, y: y0 + ly * s }),
    svgTransform: `translate(${r((x0 - f.ox) / f.scale)} ${r((y0 - f.oy) / f.scale)}) scale(${r(s / f.scale)})`,
    // px' = x0 + zoom · (px − bx): the same push-in applied to field-viewBox coordinates.
    cameraTransform: `translate(${r((x0 - f.ox - zoom * (bx - f.ox)) / f.scale)} ${r((y0 - f.oy - zoom * (by - f.oy)) / f.scale)}) scale(${r(zoom)})`,
  };
}

/** Last frame measured for the hero stage (read by the field renderer for its cut front). */
export const currentFrame: HarvestFrame = computeFrame(VIEW_W, VIEW_H);

export function setFrameSize(w: number, h: number) {
  const f = computeFrame(w, h);
  const changed = f.w !== currentFrame.w || f.h !== currentFrame.h;
  Object.assign(currentFrame, f);
  return changed;
}

// ---- Motion (pure functions of p) ----
export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (q: number) => Math.sin((clamp01(q) * Math.PI) / 2);
const smooth = (q: number) => {
  const t = clamp01(q);
  return t * t * (3 - 2 * t);
};
/** 0 → 1 progress of `q` through the window [a, b]. */
export const phase = (q: number, [a, b]: readonly [number, number]) => clamp01((q - a) / (b - a));

/** Local x where something must start to be fully off-screen left (given its right-most extent). */
const offLeft = (f: HarvestFrame, rightExtent: number) => (f.visL - 20 - f.c) / f.k - rightExtent;

export function harvesterX(p: number, f: HarvestFrame) {
  const x0 = offLeft(f, HARVESTER_FRONT);
  return x0 + (HARVESTER_PARK_X - x0) * easeOut(p / P_PARK);
}

/** Trolley origin x; the tractor is fixed to it at TRACTOR_OFFSET. */
export function trolleyX(p: number, f: HarvestFrame) {
  const x0 = offLeft(f, TROLLEY.halfW);
  return x0 + (TROLLEY_PARK_X - x0) * easeOut((p - P_RIG[0]) / (P_RIG[1] - P_RIG[0]));
}

export function augerAngle(p: number) {
  const q = clamp01((p - P_AUGER[0]) / (P_AUGER[1] - P_AUGER[0]));
  return AUGER_FOLDED + (AUGER_OUT - AUGER_FOLDED) * (q * q * (3 - 2 * q));
}

/** Field viewBox x of the cut front (stalks left of it are stubble); -Infinity before the harvest. */
export function cutFrontX(p: number, f: HarvestFrame = currentFrame) {
  if (p <= 0) return -Infinity;
  return f.c + f.k * (harvesterX(p, f) + CUTTER_X);
}

/** Bag origin x: slides in along the floor from off-screen right, under the chute. */
export function bagX(q: number, f: HarvestFrame) {
  const x0 = (f.visR + 20 - f.c) / f.k + BAG.baseHalfW;
  return x0 + (BAG.x - x0) * easeOut(phase(q, Q_ENTER));
}

/** 0 → 1 how full the bag is. The SVG sack and the canvas heap both read this. */
export const sackFill = (q: number) => smooth(phase(q, Q_FILL));

/** The sack's bulge for a fill level: slumped and narrow when empty, full and round when full. */
export const sackScale = (fill: number) => ({ sx: 0.9 + 0.1 * fill, sy: 0.8 + 0.2 * fill });
