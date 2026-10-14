"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import {
  BagLabel,
  FLAP_PATH,
  FLAP_TOP,
  JutePattern,
  QR_PATH,
  SACK_BODY,
  SACK_SHADE,
  SACK_TOP,
  STITCH_PATH,
  stitchY,
  type BagLabelInfo,
} from "@/components/hero/Sack";
import { renderField } from "@/components/hero/PaddyField";
import {
  AUGER_LEN,
  AUGER_PIVOT,
  augerAngle,
  BAG,
  BAG_LABEL,
  BAG_QR,
  bagX,
  computeFrame,
  CONVEYOR,
  currentFrame,
  harvesterX,
  MILL,
  MILL_X,
  P_PARK,
  phase,
  Q_FOLD,
  Q_LABEL,
  Q_QR,
  Q_STITCH,
  sackFill,
  sackScale,
  setFrameSize,
  stageMapping,
  TRACTOR_OFFSET,
  TROLLEY,
  trolleyX,
} from "@/components/hero/harvest";

// Scene "Harvest": a combine harvester sweeps across the field (the field behind
// it becomes stubble, see PaddyField's cut front), a tractor reverses a trolley in
// behind it, the auger swings out and golden paddy blows into the trolley
// (particles in GrainSpill, between the two layers below).
//
// Two SVG layers with the field's viewBox: HarvestBack (machines + the trolley's
// inside) sits under the grain canvas, HarvestFront (the trolley's slatted side)
// over it, so the heap shows between the planks. A small renderer writes ~12
// transform attributes from the harvest progress, only when they change.
//
// Mill: the same back layer also holds the lamp-lit huller (hopper, roller window,
// aspirator, output chute) and the belt conveyor from the trolley, faded in when
// the Mill scene starts; its rollers, fan and belt run on the mill progress.
//
// Pour: a jute sack slides in under the chute (its open mouth in the back layer,
// its body in the front layer, so the canvas heap shows inside the mouth). It
// bulges as it fills (sackScale, shared with the canvas), then the top folds shut,
// a stitch runs across it, the label (HarvestLabel, HTML) slides in and a QR stamp
// lands. The camera push-in comes from stageMapping(), like everything else here.

const C = {
  body: "#2F5A2E",
  panel: "#3E6B35",
  dark: "#1F2A1A",
  cream: "#F3EAD3",
  gold: "#D4A62A",
  goldDark: "#A67E12",
  tyre: "#2E2219",
  roller: "#6B5A48",
  glass: "#CFE3E6",
  tractor: "#B5562F",
  tractorDark: "#7E3A1F",
  wood: "#8B5E3C",
  woodDark: "#5B3A24",
  woodInside: "#6A4630",
};

const ROLLERS = [
  { x: -108, y: -20, r: 13 },
  { x: -55, y: -15, r: 10 },
  { x: 0, y: -15, r: 10 },
  { x: 58, y: -20, r: 13 },
];
const REEL = { x: 186, y: -92, r: 30 };
const TRACTOR_WHEELS = [
  { x: 40, y: -40, r: 40, hub: 18 },
  { x: -62, y: -22, r: 22, hub: 9 },
];
const TROLLEY_WHEEL = { x: 10, y: -24, r: 24 };
/** Journey: how far the road verge scrolls past (viewBox units; matches .jr-near in globals.css). */
const ROAD_TRAVEL = 900;

const M = {
  body: "#3F6650",
  bodyDark: "#2F4F3E",
  hopper: "#5B7F63",
  steel: "#8C9A86",
  steelDark: "#5E6B5A",
  floor: "#3A2616",
};
const BELT_STEP = 22;
const BELT = (() => {
  const { from: a, to: b } = CONVEYOR;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  return { len, ux: (b.x - a.x) / len, uy: (b.y - a.y) / len };
})();
const LAMPS = [360, 640, 920];

/** A wheel/roller whose spokes turn (the renderer rotates `.hv-spin` around its centre). */
function Wheel({
  x,
  y,
  r,
  hub,
  tread = false,
  i,
}: {
  x: number;
  y: number;
  r: number;
  hub: number;
  tread?: boolean;
  i: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={C.tyre} />
      {tread && <circle r={r - 3} fill="none" stroke="#4A3828" strokeWidth="3" strokeDasharray="5 6" />}
      <g className="hv-spin" data-spin={i}>
        <circle r={hub} fill={C.gold} />
        <path d={`M${-hub},0 L${hub},0 M0,${-hub} L0,${hub}`} stroke={C.goldDark} strokeWidth="2.5" />
      </g>
      <circle r={hub * 0.3} fill={C.goldDark} />
    </g>
  );
}

export function Harvester() {
  return (
    <g className="hv-harvester">
      <g className="hv-harvester-pos">
        {/* tracks */}
        <rect x="-132" y="-40" width="214" height="40" rx="20" fill={C.tyre} />
        {ROLLERS.map((r, i) => (
          <g key={i} transform={`translate(${r.x} ${r.y})`}>
            <circle r={r.r} fill={C.roller} />
            <path
              className="hv-spin"
              data-spin={`h${i}`}
              d={`M${-r.r + 3},0 L${r.r - 3},0 M0,${-r.r + 3} L0,${r.r - 3}`}
              stroke={C.tyre}
              strokeWidth="2.5"
            />
          </g>
        ))}

        {/* feeder house + cutter bar */}
        <path d="M92,-124 L156,-74 L156,-38 L92,-48 Z" fill={C.panel} />
        <rect x="140" y="-46" width="88" height="15" rx="3" fill={C.gold} />
        <path
          d="M144,-31 l6,7 l6,-7 l6,7 l6,-7 l6,7 l6,-7 l6,7 l6,-7 l6,7 l6,-7 l6,7 l6,-7"
          stroke={C.goldDark}
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
        />

        {/* body */}
        <path d="M-142,-40 L-142,-140 Q-142,-152 -130,-152 L60,-152 L98,-120 L98,-40 Z" fill={C.body} />
        <rect x="-142" y="-96" width="240" height="11" fill={C.cream} />
        <rect x="-130" y="-140" width="70" height="30" rx="4" fill={C.panel} />
        <path d="M-118,-132 h46 M-118,-124 h46 M-118,-116 h46" stroke={C.dark} strokeOpacity="0.45" strokeWidth="2" />
        <circle cx="-20" cy="-118" r="12" fill={C.panel} stroke={C.dark} strokeOpacity="0.4" strokeWidth="2" />

        {/* grain tank */}
        <path d="M-126,-152 L-120,-186 L14,-186 L22,-152 Z" fill={C.panel} />
        <rect x="-122" y="-192" width="132" height="7" rx="3" fill={C.gold} />

        {/* exhaust */}
        <rect x="14" y="-208" width="7" height="56" rx="3" fill={C.dark} />

        {/* cab */}
        <path d="M32,-152 L36,-222 L100,-222 L106,-152 Z" fill={C.body} />
        <path d="M42,-160 L45,-214 L94,-214 L98,-160 Z" fill={C.glass} opacity="0.9" />
        <path d="M58,-160 C58,-176 64,-184 72,-184 C80,-184 84,-176 84,-168 L84,-160 Z" fill={C.dark} opacity="0.75" />
        <circle cx="72" cy="-192" r="7" fill={C.dark} opacity="0.75" />
        <rect x="28" y="-230" width="84" height="9" rx="4" fill={C.cream} />

        {/* reel arm + reel */}
        <path d={`M100,-130 L${REEL.x},${REEL.y}`} stroke={C.panel} strokeWidth="7" strokeLinecap="round" />
        <g transform={`translate(${REEL.x} ${REEL.y})`}>
          <circle r={REEL.r} fill="none" stroke={C.gold} strokeWidth="3" />
          <g className="hv-spin" data-spin="reel">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <line x1="0" y1="0" x2={REEL.r} y2="0" stroke={C.gold} strokeWidth="2.5" />
                <line
                  x1={REEL.r}
                  y1="-7"
                  x2={REEL.r}
                  y2="7"
                  stroke={C.goldDark}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
          <circle r="6" fill={C.goldDark} />
        </g>

        {/* unloading auger: folded forward along the tank, swings out back over the trolley */}
        <g className="hv-auger" transform={`translate(${AUGER_PIVOT.x} ${AUGER_PIVOT.y})`}>
          <g className="hv-auger-rot">
            <rect
              x="0"
              y="-7"
              width={AUGER_LEN}
              height="14"
              rx="7"
              fill={C.panel}
              stroke={C.dark}
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <path
              d={`M${AUGER_LEN - 12},-6 L${AUGER_LEN - 2},-22 L${AUGER_LEN + 8},-16 L${AUGER_LEN + 2},-2 Z`}
              fill={C.gold}
            />
          </g>
          <circle r="10" fill={C.gold} />
        </g>
      </g>
    </g>
  );
}

function Tractor() {
  // Faces left (it reverses the trolley in); origin = centre on the ground.
  return (
    <g className="hv-tractor" transform={`translate(${TRACTOR_OFFSET} 0)`}>
      {/* hood + grille */}
      <path d="M-92,-46 L-92,-74 Q-92,-82 -84,-82 L-2,-82 L-2,-46 Z" fill={C.tractor} />
      <rect x="-96" y="-78" width="9" height="30" rx="3" fill={C.tractorDark} />
      <path d="M-80,-74 h60 M-80,-66 h60" stroke={C.tractorDark} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="-44" y="-112" width="6" height="32" rx="3" fill={C.dark} />
      {/* seat, driver (sits above the rear fender), steering */}
      <rect x="-2" y="-62" width="58" height="18" fill={C.tractorDark} />
      <path d="M22,-100 C20,-122 26,-134 36,-134 C46,-134 50,-124 48,-100 Z" fill="#3B2A1E" />
      <circle cx="36" cy="-144" r="8" fill="#3B2A1E" />
      <path d="M12,-148 L28,-158 L50,-146 Z" fill={C.wood} />
      <path d="M2,-82 L2,-106 M-8,-108 L12,-104" stroke={C.dark} strokeWidth="3" strokeLinecap="round" />
      <path d="M24,-118 L4,-106" stroke="#3B2A1E" strokeWidth="5" strokeLinecap="round" />
      {/* rear fender */}
      <path d="M-6,-58 A46,46 0 0 1 86,-58 L86,-50 L-6,-50 Z" fill={C.tractor} />
      {TRACTOR_WHEELS.map((w, i) => (
        <Wheel key={i} {...w} tread i={`t${i}`} />
      ))}
      {/* hitch */}
      <rect x="78" y="-42" width="10" height="8" fill={C.dark} />
    </g>
  );
}

/** Hanging lamps (viewBox coords, from the top edge): warm pools of light in the mill. */
function MillLamps() {
  return (
    <g className="hv-millworks" style={{ opacity: 0, visibility: "hidden" }}>
      <defs>
        <radialGradient id="hv-lamp-glow">
          <stop offset="0" stopColor="#FFD58A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFB75A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-lamp-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD58A" stopOpacity="0.32" />
          <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="hv-cam">
        {LAMPS.map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path d="M-36,150 L36,150 L170,700 L-170,700 Z" fill="url(#hv-lamp-cone)" />
            <circle cy="150" r="150" fill="url(#hv-lamp-glow)" />
            <line x1="0" y1="0" x2="0" y2="128" stroke="#1F160E" strokeWidth="2" />
            <path d="M-34,152 Q-30,126 0,124 Q30,126 34,152 Z" fill="#2F4F3E" />
            <ellipse cy="152" rx="13" ry="7" fill="#FFF1C8" />
          </g>
        ))}
      </g>
    </g>
  );
}

/** The huller and the belt conveyor from the trolley (frame-local, drawn behind the trolley). */
function MillWorks() {
  const { from: a, to: b } = CONVEYOR;
  const cleats = Array.from({ length: Math.floor(BELT.len / BELT_STEP) }, (_, i) => i * BELT_STEP);
  const nx = -BELT.uy * 7; // cleats stand out from the belt
  const ny = BELT.ux * 7;
  const at = (t: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const legs = [0.35, 0.78].map(at);
  const w = MILL.window;
  return (
    <g className="hv-millworks" style={{ opacity: 0, visibility: "hidden" }}>
      {/* plank floor */}
      <rect x="-2000" y="0" width="4000" height="120" fill={M.floor} />
      <path d="M-2000,14 H2000 M-2000,40 H2000" stroke="#2A1C10" strokeWidth="2" />

      {/* belt conveyor: frame, legs, belt and moving cleats */}
      {legs.map((l, i) => (
        <path
          key={i}
          d={`M${l.x},${l.y} L${l.x - 14},0 M${l.x},${l.y} L${l.x + 14},0`}
          stroke={M.steelDark}
          strokeWidth="5"
        />
      ))}
      <path d={`M${a.x},${a.y} L${b.x},${b.y}`} stroke="#2A1C10" strokeWidth="14" strokeLinecap="round" />
      <path d={`M${a.x},${a.y} L${b.x},${b.y}`} stroke={M.steelDark} strokeWidth="8" strokeLinecap="round" />
      <g className="hv-cleats">
        <path
          d={cleats
            .map(
              (d) =>
                `M${(a.x + BELT.ux * d).toFixed(1)},${(a.y + BELT.uy * d).toFixed(1)} l${nx.toFixed(1)},${ny.toFixed(1)}`,
            )
            .join(" ")}
          stroke="#C8B48A"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <circle cx={a.x} cy={a.y} r="8" fill={M.steel} />
      <circle cx={b.x} cy={b.y} r="8" fill={M.steel} />

      <g transform={`translate(${MILL_X} 0)`}>
        {/* motor and drive belt */}
        <rect x="-152" y="-38" width="40" height="38" rx="4" fill={M.bodyDark} />
        <path d="M-132,-34 L-70,-84 M-126,-20 L-62,-56" stroke="#1F160E" strokeWidth="3" />
        <g transform="translate(-132 -27)">
          <circle r="9" fill={M.steel} />
          <path className="hv-spin" data-spin="mp" d="M-6,0 L6,0 M0,-6 L0,6" stroke={M.steelDark} strokeWidth="2" />
        </g>

        {/* hopper */}
        <path d={`M-80,${MILL.hopper.y} L40,${MILL.hopper.y} L4,-206 L-44,-206 Z`} fill={M.hopper} />
        <rect x="-86" y={MILL.hopper.y - 6} width="132" height="8" rx="3" fill="#D4A62A" />

        {/* body */}
        <rect x="-92" y="-208" width="184" height="196" rx="10" fill={M.body} />
        <rect x="-92" y="-44" width="184" height="10" fill="#F3EAD3" />
        <rect x="-104" y="-14" width="208" height="14" fill="#2A1C10" />
        <rect x="30" y="-196" width="50" height="16" rx="3" fill="#F3EAD3" opacity="0.85" />
        <path d="M36,-188 h38" stroke={M.bodyDark} strokeWidth="2" />
        <g transform="translate(-66 -70)">
          <circle r="16" fill={M.steel} />
          <path
            className="hv-spin"
            data-spin="mp2"
            d="M-11,0 L11,0 M0,-11 L0,11"
            stroke={M.steelDark}
            strokeWidth="3"
          />
        </g>

        {/* roller window: two rubber rollers crack the husks (the macro zooms in here) */}
        <circle cx={w.x} cy={w.y} r="46" fill="#1F160E" stroke="#D4A62A" strokeWidth="5" />
        {[-18, 18].map((dx, i) => (
          <g key={dx} transform={`translate(${w.x + dx} ${w.y})`}>
            <circle r="17" fill="#6B4A2E" />
            <path
              className="hv-spin"
              data-spin={`m${i}`}
              d="M-14,0 L14,0 M0,-14 L0,14 M-10,-10 L10,10"
              stroke="#2E2219"
              strokeWidth="2.5"
            />
            <circle r="4" fill="#D4A62A" />
          </g>
        ))}
        <circle cx={w.x - 16} cy={w.y - 20} r="12" fill="#FFFFFF" opacity="0.08" />

        {/* aspirator fan + duct: husks blow out of the outlet */}
        <path
          d={`M56,-226 L56,${MILL.husk.y} L${MILL.husk.x - 6},${MILL.husk.y}`}
          fill="none"
          stroke={M.bodyDark}
          strokeWidth="18"
        />
        <path
          d={`M${MILL.husk.x - 10},${MILL.husk.y - 14} L${MILL.husk.x + 4},${MILL.husk.y - 18} L${MILL.husk.x + 4},${MILL.husk.y + 18} L${MILL.husk.x - 10},${MILL.husk.y + 14} Z`}
          fill="#D4A62A"
        />
        <g transform="translate(56 -232)">
          <circle r="25" fill={M.bodyDark} />
          <g className="hv-spin" data-spin="mf">
            {[0, 90, 180, 270].map((a2) => (
              <path key={a2} transform={`rotate(${a2})`} d="M0,0 Q10,-6 18,-2 Q10,4 0,0 Z" fill={M.steel} />
            ))}
          </g>
          <circle r="5" fill="#D4A62A" />
        </g>

        {/* output chute (high on the body so a sack fits under it): white rice comes out here */}
        <path
          d={`M84,-206 L${MILL.chute.x + 6},${MILL.chute.y - 12} L${MILL.chute.x},${MILL.chute.y + 6} L84,-186 Z`}
          fill={M.steel}
          stroke={M.steelDark}
          strokeWidth="2"
        />
      </g>
    </g>
  );
}

/** The sack's open mouth (inside is dark), drawn under the grain canvas. */
function SackBack() {
  return (
    <g className="ps-sack">
      <ellipse cx="0" cy={SACK_TOP} rx={BAG.mouthHalfW} ry="9" fill="#3A2616" />
      <ellipse cx="0" cy={SACK_TOP - 1} rx={BAG.mouthHalfW - 3} ry="7" fill="#2A1C10" />
    </g>
  );
}

/** The sack's body, folded top, stitch and QR stamp, drawn over the grain canvas. */
function SackFront() {
  return (
    <g className="ps-sack">
      <defs>
        <JutePattern id="ps-jute" />
        <clipPath id="ps-stitch-clip">
          <rect className="ps-stitch-clip" x="-50" y={FLAP_TOP - 10} width="0" height="40" />
        </clipPath>
      </defs>
      <path d={SACK_BODY} fill="url(#ps-jute)" stroke="#8A6638" strokeWidth="2" />
      {/* hem along the open mouth */}
      <path
        d={`M${-BAG.mouthHalfW},${SACK_TOP} Q0,${SACK_TOP + 18} ${BAG.mouthHalfW},${SACK_TOP}`}
        fill="none"
        stroke="#8A6638"
        strokeWidth="3"
      />
      {/* soft side shading */}
      <path d={SACK_SHADE} fill="#000" opacity="0.08" />

      {/* folded top: closes over the mouth when the bag is full, then gets stitched */}
      <g className="ps-flap" transform={`translate(0 ${FLAP_TOP}) scale(1 0) translate(0 ${-FLAP_TOP})`}>
        <path
          d={FLAP_PATH}
          fill="#B48D58"
          stroke="#8A6638"
          strokeWidth="1.5"
        />
        <g clipPath="url(#ps-stitch-clip)">
          <path
            d={STITCH_PATH}
            fill="none"
            stroke="#5B3A24"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
        </g>
      </g>
      {/* needle running ahead of the stitch */}
      <g className="ps-needle" opacity="0">
        <path d="M0,0 L10,-6" stroke="#D9D4C7" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="-6" r="1.4" fill="none" stroke="#D9D4C7" strokeWidth="0.8" />
      </g>

      {/* QR stamp (links to the trace page in real life) */}
      <g className="ps-qr" opacity="0" transform={`translate(${BAG_QR.x} ${BAG_QR.y})`}>
        <rect x="-2" y="-2" width={BAG_QR.size + 4} height={BAG_QR.size + 4} rx="1.5" fill="#FBF6EA" opacity="0.9" />
        <path d={QR_PATH} fill="#2F4A2A" />
      </g>
    </g>
  );
}

/** Label printed with the farmer's name, as HTML over the bag (positioned by the renderer). */
export function HarvestLabel({ className = "", ...info }: BagLabelInfo & { className?: string }) {
  // Authored at LABEL_PX px per local unit; the renderer scales it to the bag.
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="ps-label-anchor absolute left-0 top-0 origin-top-left"
        style={{
          width: BAG_LABEL.w * LABEL_PX,
          height: BAG_LABEL.h * LABEL_PX,
          opacity: 0,
          "--u": `${LABEL_PX}px`,
        } as CSSProperties}
      >
        <BagLabel {...info} />
      </div>
    </div>
  );
}

/** Back half: machines and the trolley's inside wall (under the grain canvas). */
export function HarvestBack({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  // Keep the frame in step with the stage size; the field's cut front uses it too.
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const scope = svg.closest("section") ?? svg.parentElement ?? svg;
    const update = () => {
      setFrameSize(svg.clientWidth, svg.clientHeight);
      renderHarvest(scope);
      renderField(scope);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className={`hv-back hero-harvest pointer-events-none ${className}`}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <MillLamps />
      <g className="hv-frame" transform={stageMapping(computeFrame(1200, 800)).svgTransform}>
        <MillWorks />
        <g className="hv-rig">
          <Tractor />
          {/* drawbar */}
          <path
            className="hv-tractor"
            d={`M${-TROLLEY.halfW},-44 L${TRACTOR_OFFSET + 84},-38`}
            stroke={C.dark}
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* inside of the bed (seen between the front planks) */}
          <rect
            x={-TROLLEY.halfW}
            y={TROLLEY.rimY}
            width={TROLLEY.halfW * 2}
            height={TROLLEY.floorY - TROLLEY.rimY}
            fill={C.woodInside}
          />
          <rect
            x={-TROLLEY.halfW - 4}
            y={TROLLEY.floorY - 4}
            width={TROLLEY.halfW * 2 + 8}
            height="12"
            fill={C.woodDark}
          />
          <Wheel {...TROLLEY_WHEEL} hub={11} tread i="trolley" />
        </g>
        <Harvester />
        <g className="ps-pos" transform={`translate(${BAG.x + 2000} 0)`}>
          <SackBack />
        </g>
      </g>
    </svg>
  );
}

/** Front half: the trolley's slatted side, over the grain canvas so the heap shows between the planks. */
export function HarvestFront({ className = "" }: { className?: string }) {
  const { halfW, rimY, floorY } = TROLLEY;
  const planks = [rimY - 2, rimY + 26, floorY - 12];
  return (
    <svg
      className={`hv-front hero-harvest pointer-events-none ${className}`}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <g className="hv-frame" transform={stageMapping(computeFrame(1200, 800)).svgTransform}>
        <g className="hv-rig">
          {planks.map((y) => (
            <g key={y}>
              <rect x={-halfW} y={y} width={halfW * 2} height="12" rx="2" fill={C.wood} />
              <rect x={-halfW} y={y} width={halfW * 2} height="3" rx="1.5" fill="#B07A4C" />
            </g>
          ))}
          {[-halfW, 0, halfW].map((x) => (
            <rect key={x} x={x - 4} y={rimY - 4} width="8" height={floorY - rimY + 6} rx="2" fill={C.woodDark} />
          ))}
        </g>
        <g className="ps-pos" transform={`translate(${BAG.x + 2000} 0)`}>
          <SackFront />
        </g>
      </g>
    </svg>
  );
}

// ---------- Renderer ----------

const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
/** HarvestLabel is authored at this many CSS px per local unit (large, so text never hits a minimum font size). */
const LABEL_PX = 4;

interface HarvestEngine {
  /** p: harvest; drive: Journey along the road; mill: the huller runs; pour: the bag fills and closes (all 0 → 1). */
  state: { p: number; drive: number; mill: number; pour: number };
  render: () => void;
}

const engines = new WeakMap<Element, HarvestEngine>();

/** The harvest renderer for the layers inside `scope` (created on first use). */
export function getHarvestEngine(scope: Element): HarvestEngine | null {
  const back = scope.querySelector(".hv-back");
  if (!back) return null;
  const cached = engines.get(back);
  if (cached) return cached;

  const roots = Array.from(scope.querySelectorAll(".hv-back, .hv-front"));
  const frames = roots.map((r) => r.querySelector(".hv-frame"));
  const rigs = roots.map((r) => r.querySelector(".hv-rig"));
  const harvester = back.querySelector(".hv-harvester-pos");
  const auger = back.querySelector(".hv-auger-rot");
  const spins = Array.from(back.querySelectorAll<SVGElement>(".hv-spin"));
  const cleats = back.querySelector(".hv-cleats");
  const cam = back.querySelector(".hv-cam");
  const bagPos = roots.map((r) => r.querySelector(".ps-pos"));
  const sacks = Array.from(scope.querySelectorAll(".ps-sack"));
  const flap = scope.querySelector(".ps-flap");
  const stitchClip = scope.querySelector(".ps-stitch-clip");
  const needle = scope.querySelector(".ps-needle");
  const qr = scope.querySelector(".ps-qr");
  const labelAnchor = scope.querySelector<HTMLElement>(".ps-label-anchor");
  const lastAttr = new Map<Element, Record<string, string>>();
  const attr = (el: Element | null, name: string, value: string) => {
    if (!el) return;
    const seen = lastAttr.get(el) ?? {};
    if (seen[name] !== value) {
      el.setAttribute(name, value);
      seen[name] = value;
      lastAttr.set(el, seen);
    }
  };
  const last = new Map<Element, string>();
  const set = (el: Element | null, value: string) => {
    if (el && last.get(el) !== value) {
      el.setAttribute("transform", value);
      last.set(el, value);
    }
  };

  const state = { p: 0, drive: 0, mill: 0, pour: 0 };
  const render = () => {
    const f = currentFrame;
    const p = state.p;
    const hx = harvesterX(p, f);
    const tx = trolleyX(p, f);
    const map = stageMapping(f, state.pour);
    frames.forEach((g) => set(g, map.svgTransform));
    set(cam, map.cameraTransform);

    // Pour: bag position + bulge, folded top, stitch + needle, QR stamp, label.
    const q = state.pour;
    const bx = bagX(q, f);
    const { sx, sy } = sackScale(sackFill(q));
    bagPos.forEach((g) => set(g, `translate(${r2(bx)} 0)`));
    sacks.forEach((g) => set(g, `scale(${r3(sx)} ${r3(sy)})`));
    const fold = phase(q, Q_FOLD);
    set(flap, `translate(0 ${FLAP_TOP}) scale(1 ${r3(fold)}) translate(0 ${-FLAP_TOP})`);
    const st = phase(q, Q_STITCH);
    attr(stitchClip, "width", String(r2(st * 100)));
    const nx = -44 + st * 88;
    set(needle, `translate(${r2(nx)} ${r2(stitchY(nx))})`);
    attr(needle, "opacity", st > 0 && st < 1 ? "1" : "0");
    const qk = phase(q, Q_QR);
    set(
      qr,
      `translate(${BAG_QR.x} ${BAG_QR.y}) rotate(-8 ${BAG_QR.size / 2} ${BAG_QR.size / 2}) translate(${BAG_QR.size / 2} ${BAG_QR.size / 2}) scale(${r3(1.6 - 0.6 * qk)}) translate(${-BAG_QR.size / 2} ${-BAG_QR.size / 2})`,
    );
    attr(qr, "opacity", String(r3(qk)));
    if (labelAnchor) {
      const lk = phase(q, Q_LABEL);
      const at = map.toPx(bx + BAG_LABEL.x * sx, BAG_LABEL.y * sy + (1 - lk) * 14);
      const k = (map.s * sx) / LABEL_PX;
      const t = `translate(${r2(at.x)}px, ${r2(at.y)}px) scale(${r3(k)}, ${r3((map.s * sy) / LABEL_PX)})`;
      if (labelAnchor.style.transform !== t) labelAnchor.style.transform = t;
      const o = String(r3(lk));
      if (labelAnchor.style.opacity !== o) labelAnchor.style.opacity = o;
    }
    rigs.forEach((g) => set(g, `translate(${r2(tx)} 0)`));
    set(harvester, `translate(${r2(hx)} 0)`);
    set(auger, `rotate(${r2(augerAngle(p))})`);
    // Wheels turn with the distance travelled (the tractor reverses, so its wheels turn backwards).
    const hDist = hx - harvesterX(0, f);
    // On the Journey the rig holds still while the road scrolls right, so it drives left.
    const tDist = tx - trolleyX(0, f) - (state.drive * ROAD_TRAVEL) / f.k;
    const reel = Math.min(p, P_PARK) * 2600;
    // Mill: rollers counter-rotate, the fan and pulleys spin, the belt's cleats creep up.
    const m = state.mill;
    const d = (m * 1400) % BELT_STEP;
    set(cleats, `translate(${r2(d * BELT.ux)} ${r2(d * BELT.uy)})`);
    for (const el of spins) {
      const id = el.dataset.spin ?? "";
      let deg: number;
      if (id === "m0") deg = m * 4000;
      else if (id === "m1") deg = -m * 4000;
      else if (id === "mf") deg = m * 6000;
      else if (id.startsWith("mp")) deg = m * 3000;
      else if (id === "reel") deg = reel;
      else if (id.startsWith("h")) deg = (hDist / 12) * (180 / Math.PI);
      else if (id === "t0") deg = (tDist / 40) * (180 / Math.PI);
      else if (id === "t1") deg = (tDist / 22) * (180 / Math.PI);
      else deg = (tDist / 24) * (180 / Math.PI);
      set(el, `rotate(${Math.round(deg) % 360})`);
    }
  };
  const engine = { state, render };
  engines.set(back, engine);
  return engine;
}

/** Re-render the harvest layers from their state (call after the timeline moves). */
export function renderHarvest(scope: Element) {
  getHarvestEngine(scope)?.render();
}
