import type { CSSProperties } from "react";
import { BAG_LABEL } from "@/components/hero/harvest";
import { BagLabel, ClosedSack, type BagLabelInfo } from "@/components/hero/Sack";

// Final scene "Your Home": soft morning light in a kitchen, the Kisa bag on the
// table beside a bowl of steaming rice. The CTA card (Hero's PourCta) sits beside it.
//
// The bag and bowl are one SVG in a fixed-aspect box sitting on the table, so the
// HTML label can be placed on the bag in % of that box and sized in cqw (the box is a
// size container): it scales with the art at every screen size. Steam is a gentle
// CSS loop; reduced motion hides the whole hero story, as for the other scenes.

const BOX = { w: 560, h: 360 };
/** Where the sack stands in the box and how big it is (local bag units → box units). */
const SACK = { x: 160, y: 340, k: 2.3 };
const pct = (n: number, of: number) => `${Math.round((n / of) * 10000) / 100}%`;

const LABEL_STYLE = {
  left: pct(SACK.x + BAG_LABEL.x * SACK.k, BOX.w),
  top: pct(SACK.y + BAG_LABEL.y * SACK.k, BOX.h),
  width: pct(BAG_LABEL.w * SACK.k, BOX.w),
  height: pct(BAG_LABEL.h * SACK.k, BOX.h),
  // One bag unit in cqw of the box.
  "--u": `${Math.round((SACK.k / BOX.w) * 100 * 10000) / 10000}cqw`,
} as CSSProperties;

// Rice grains on top of the bowl's mound.
const GRAINS = [
  [392, 262, -20],
  [412, 252, 15],
  [432, 248, -35],
  [452, 254, 25],
  [470, 262, -10],
  [402, 272, 40],
  [424, 266, -5],
  [446, 268, 30],
  [462, 274, -40],
  [384, 276, 10],
  [436, 258, 60],
  [418, 278, -25],
  [478, 276, 20],
];

const STEAM = [
  "M408,232 C396,210 420,196 408,172 C396,150 418,136 410,112",
  "M432,226 C444,204 420,190 434,166 C446,144 424,130 434,104",
  "M456,232 C446,212 468,198 456,176 C446,156 466,142 458,120",
];

function Bowl() {
  return (
    <g>
      {/* rice mound */}
      <path d="M342,284 C350,232 400,226 432,226 C466,226 516,232 522,284 Z" fill="#FBF7EE" />
      <path
        d="M362,262 C392,240 470,238 504,262"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <g fill="#E2D6BE">
        {GRAINS.map(([x, y, r]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="6" ry="2.4" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
      {/* soft shadow where the rice meets the rim */}
      <ellipse cx="432" cy="284" rx="96" ry="7" fill="#3A2616" opacity="0.18" />
      {/* bowl: glazed field green with a gold band, so the white rice stands out in the bright room */}
      <path d="M332,282 Q432,300 532,282 C524,326 486,344 432,344 C378,344 340,326 332,282 Z" fill="#3E6B35" />
      <path d="M338,300 Q432,318 526,300" stroke="#D4A62A" strokeWidth="5" fill="none" />
      <path
        d="M346,292 C352,318 380,334 410,338"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
      <ellipse cx="432" cy="282" rx="100" ry="10" fill="none" stroke="#F3EAD3" strokeWidth="4" />
      <rect x="404" y="342" width="56" height="8" rx="3" fill="#2F5A2E" />
      {/* steam */}
      <g className="hm-steam" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round">
        {STEAM.map((d, i) => (
          <path key={d} d={d} style={{ animationDelay: `${-i * 1.1}s` }} />
        ))}
      </g>
    </g>
  );
}

export function HomeScene({ label, className = "" }: { label: BagLabelInfo; className?: string }) {
  return (
    <div className={`hm-root pointer-events-none overflow-hidden bg-[#F4E4CB] ${className}`} aria-hidden="true">
      {/* wall + window with morning light (anchored left, so phones still see the window) */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMinYMid slice">
        <defs>
          <linearGradient id="hm-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F7EBD7" />
            <stop offset="1" stopColor="#EED9BB" />
          </linearGradient>
          <linearGradient id="hm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF4DA" />
            <stop offset="1" stopColor="#FCDDA8" />
          </linearGradient>
          <linearGradient id="hm-shaft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#hm-wall)" />
        <g transform="translate(120 90)">
          <rect x="-10" y="-10" width="300" height="290" rx="6" fill="#C9A47A" />
          <rect width="280" height="270" fill="url(#hm-sky)" />
          <circle cx="210" cy="70" r="34" fill="#FFE9B0" />
          <path
            d="M0,200 C60,180 120,196 180,182 C220,174 250,184 280,178 L280,270 L0,270 Z"
            fill="#B9C98F"
            opacity="0.6"
          />
          <path d="M140,0 V270 M0,135 H280" stroke="#C9A47A" strokeWidth="10" />
          <rect x="-24" y="276" width="328" height="14" rx="4" fill="#B88E62" />
        </g>
        {/* light falling from the window across the wall and table */}
        <path className="hm-sun" d="M130,100 L400,100 L1100,800 L330,800 Z" fill="url(#hm-shaft)" />
        {/* a shelf with a few jars */}
        <g transform="translate(820 170)">
          <rect x="0" y="80" width="260" height="10" rx="3" fill="#B88E62" />
          <rect x="24" y="30" width="40" height="50" rx="6" fill="#E9D9BC" />
          <rect x="24" y="22" width="40" height="10" rx="3" fill="#8B5E3C" />
          <rect x="86" y="42" width="34" height="38" rx="6" fill="#D9B98A" />
          <rect x="86" y="35" width="34" height="9" rx="3" fill="#2F5A2E" />
          <path d="M160,80 C160,40 214,40 214,80 Z" fill="#7E9A5A" />
          <path
            d="M187,40 C180,20 192,8 200,0 M187,40 C196,24 210,22 222,18"
            stroke="#5E7A40"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* table */}
      <div className="absolute inset-x-0 bottom-0 top-[52%] border-t-[6px] border-[#C99B6B] bg-[linear-gradient(180deg,#B5875A_0%,#9C6F47_45%,#835B3B_100%)] wide:top-[64%]">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_2px,transparent_2px,transparent_46px)]" />
        <div className="hm-sun absolute inset-0 bg-[radial-gradient(ellipse_45%_60%_at_40%_10%,rgba(255,240,205,0.45),transparent_70%)]" />
      </div>

      {/* bag + bowl standing on the table; the label is HTML placed on the bag.
          Outer box: position + size container; inner: what the timeline animates. */}
      <div className="absolute bottom-[45%] left-1/2 w-[min(88vw,400px)] -translate-x-1/2 [container-type:inline-size] wide:bottom-[33%] wide:left-[31%] wide:w-[min(44vw,540px)] short:bottom-[30%] short:w-[min(40vw,300px)]">
        <div className="hm-props relative">
          <svg className="block h-auto w-full overflow-visible" viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
            <ellipse cx="160" cy="344" rx="150" ry="12" fill="#3A2616" opacity="0.18" />
            <ellipse cx="432" cy="348" rx="110" ry="10" fill="#3A2616" opacity="0.18" />
            <g transform={`translate(${SACK.x} ${SACK.y}) scale(${SACK.k})`}>
              <ClosedSack />
            </g>
            <Bowl />
          </svg>
          <div className="absolute" style={LABEL_STYLE}>
            <BagLabel {...label} />
          </div>
        </div>
      </div>
    </div>
  );
}
