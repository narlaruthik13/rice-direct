// Hero timing and copy shared by the hero shell, the static poster frames and the
// scroll story. Deliberately free of GSAP and scene code: the shell imports this to
// size the section before the story chunk (GSAP + ScrollTrigger) is loaded.

/** Scroll distance per timeline unit. Section height = 100vh stage + total units × this. */
export const VH_PER_UNIT = 40;

/** Scene lengths in timeline units, in story order (scenes.ts uses these). */
export const SCENE_DURATIONS = {
  monsoon: 1.5,
  grow: 1,
  ripen: 1.2,
  glow: 1.1,
  harvest: 2,
  /** A short transition: 0.8 of a normal (1-unit) scene. */
  journey: 0.8,
  mill: 2.5,
  pour: 2.4,
  home: 1,
} as const;

export const TOTAL_UNITS = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);

/** Section height (vh): one viewport for the sticky stage + the scroll distance for the whole story (640vh). */
export const HERO_SECTION_VH = Math.round((100 + TOTAL_UNITS * VH_PER_UNIT) * 100) / 100;

export interface SceneCopy {
  step: string;
  title: string;
  text: string;
}

/** Caption copy per scene (story captions and the reduced-motion poster frames). */
export const SCENE_COPY = {
  monsoon: {
    step: "01",
    title: "Monsoon",
    text: "The first rains soften the soil. A seed splits and sends up a shoot, then the farmer transplants the seedlings by hand, row by row.",
  },
  grow: {
    step: "02",
    title: "Grow",
    text: "Seedlings rise from Godavari delta soil, tended by the farmer for four months.",
  },
  ripen: {
    step: "03",
    title: "Ripen",
    text: "Green turns to gold. Heavy grain heads bow. Harvest is close.",
  },
  harvest: {
    step: "04",
    title: "Harvest",
    text: "A combine cuts and threshes the ripe crop in one pass, then blows golden paddy, still in its husk, into the farmer's trolley.",
  },
  journey: {
    step: "05",
    title: "Journey",
    text: "At dusk the farmer hauls the paddy down the village road to the partner mill. No traders, no warehouses in between.",
  },
  mill: {
    step: "06",
    title: "Mill",
    text: "Under warm lamps at the partner mill, rubber rollers crack each husk in two. Out comes white rice, and it is still the farmer's own.",
  },
  pour: {
    step: "07",
    title: "Packed in the farmer's name",
    text: "Stitched shut and labelled with the farmer's name, plus a QR code that traces this batch back to the field.",
  },
} satisfies Record<string, SceneCopy>;
