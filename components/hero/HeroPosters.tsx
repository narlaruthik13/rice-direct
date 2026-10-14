import type { ReactNode } from "react";
import { PaddyField } from "@/components/hero/PaddyField";
import { SeasonSky, SeasonTint } from "@/components/hero/SeasonSky";
import { MonsoonScene } from "@/components/hero/MonsoonScene";
import { MillMacro } from "@/components/hero/MillMacro";
import { Harvester } from "@/components/hero/HarvestScene";
import { CUTTER_X, GROUND_Y } from "@/components/hero/harvest";
import { FinalFrame } from "@/components/hero/HeroCta";
import { SCENE_COPY, type SceneCopy } from "@/components/hero/heroMeta";

// Reduced-motion hero: the story as five still "poster frames" with captions. They
// reuse the scene art pinned to one moment each (no GSAP, no ScrollTrigger, no canvas,
// no scroll scenes). Loaded only for visitors who prefer reduced motion.

/** Harvester poster: where the combine stands (field viewBox x of its origin) and the stubble line it has cut. */
const HARVESTER_X = 560;

function Poster({ copy, children }: { copy: SceneCopy; children: ReactNode }) {
  return (
    <li className="overflow-hidden rounded-2xl bg-rice shadow-card">
      <div className="relative aspect-[16/10] overflow-hidden" aria-hidden="true">
        {children}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold tracking-widest text-paddy-dark">{copy.step}</p>
        <h3 className="mt-1 text-xl font-semibold text-field">{copy.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-soil/80">{copy.text}</p>
      </div>
    </li>
  );
}

export function HeroPosters() {
  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-site text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Kisa — farmer-owned food</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight text-field-dark sm:text-5xl">
          From paddy field to your plate
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-soil/85">Straight from the farmer. Traceable to the field.</p>
      </div>

      <ol className="mx-auto mt-10 grid max-w-site gap-6 sm:grid-cols-2">
        {/* 1. Monsoon: rain on the wet field, the farmer transplanting seedlings row by row */}
        <Poster copy={SCENE_COPY.monsoon}>
          <SeasonSky season={0.2} className="absolute inset-0 h-full w-full" />
          <PaddyField sky={false} state={{ plant: 0.66 }} className="absolute inset-0 h-full w-full" />
          <MonsoonScene progress={0.78} className="absolute inset-0" />
        </Poster>

        {/* 2. Golden field: ripe heads bowing in evening light */}
        <Poster copy={SCENE_COPY.ripen}>
          <SeasonSky season={2} className="absolute inset-0 h-full w-full" />
          <PaddyField sky={false} state={{ grow: 1, bend: 1 }} className="absolute inset-0 h-full w-full" />
          <SeasonTint season={2} className="absolute inset-0" />
        </Poster>

        {/* 3. Harvester cutting the ripe field; stubble behind it */}
        <Poster copy={SCENE_COPY.harvest}>
          <SeasonSky season={2.6} className="absolute inset-0 h-full w-full" />
          <PaddyField sky={false} state={{ grow: 1, bend: 1 }} cutX={HARVESTER_X + CUTTER_X} className="absolute inset-0 h-full w-full" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice">
            <g transform={`translate(${HARVESTER_X} ${GROUND_Y})`}>
              <Harvester />
            </g>
          </svg>
          <SeasonTint season={2.6} className="absolute inset-0" />
        </Poster>

        {/* 4. Mill close-up: the husk peels away from one grain, revealing white rice */}
        <Poster copy={SCENE_COPY.mill}>
          <MillMacro progress={0.66} className="absolute inset-0 h-full w-full" />
        </Poster>
      </ol>

      {/* 5. The filled bag on the kitchen table, with the call to action */}
      <FinalFrame className="mx-auto mt-6 h-[min(85svh,680px)] min-h-[520px] max-w-site rounded-2xl shadow-card" />
    </div>
  );
}
