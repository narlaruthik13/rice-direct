// Rice copy and rules for the website: type and age labels, cooking notes and the
// quality checks shown on product pages and the Quality Passport.
// Types only from @kisa/shared: its runtime entry also loads zod and every schema,
// which would add ~80 kB to every page that shows a product.
import type { RiceAge, RiceQuality, RiceType } from "@kisa/shared";

export const RICE_TYPES: RiceType[] = ["RAW", "STEAM", "BOILED"];
const RICE_TYPE_LABEL: Record<RiceType, string> = { RAW: "Raw", STEAM: "Steam", BOILED: "Boiled" };
const RICE_AGE_LABEL: Record<RiceAge, string> = { NEW: "New crop", AGED: "Aged" };
export const typeLabel = (t: RiceType) => RICE_TYPE_LABEL[t];
export const ageLabel = (a: RiceAge) => RICE_AGE_LABEL[a];

/** One line per type for the shop's type tabs. */
export const TYPE_INTRO: Record<RiceType, string> = {
  RAW: "Milled straight from dried paddy. Soft and light: the everyday rice of South Indian kitchens.",
  STEAM: "Paddy steamed before milling. Firmer grains that stay separate: good for biryani and fried rice.",
  BOILED: "Parboiled: soaked, steamed and dried before milling. Holds its shape and keeps well after cooking.",
};

export interface CookingNotes {
  water: string;
  time: string;
  tips: string[];
  bestFor: string;
}

const NOTES: Record<RiceType, CookingNotes> = {
  RAW: {
    water: "1 cup rice : 2 cups water",
    time: "15–18 min covered, then rest 5 min",
    tips: ["Rinse twice in cool water.", "Fluff gently with a fork after resting."],
    bestFor: "Everyday meals, curd rice, pulihora and lemon rice",
  },
  STEAM: {
    water: "1 cup rice : 2¼ cups water",
    time: "18–20 min covered, then rest 5 min",
    tips: ["Rinse once; no need to soak.", "Grains stay separate, so it holds up well in a pan."],
    bestFor: "Biryani, fried rice and pulao",
  },
  BOILED: {
    water: "1 cup rice : 3 cups water, or plenty of water and drain",
    time: "Soak 20–30 min, then cook 20–25 min",
    tips: ["Soaking first gives a softer, even cook.", "Keeps well and reheats without going mushy."],
    bestFor: "Daily meals with sambar and rasam, and idli or dosa batter",
  },
};

const AGED_TIP = "Aged rice drinks a little more water: add about ¼ cup extra per cup. It cooks fluffier and less sticky.";

export function cookingNotes(type: RiceType, age: RiceAge): CookingNotes {
  const notes = NOTES[type];
  return age === "AGED" ? { ...notes, tips: [...notes.tips, AGED_TIP] } : notes;
}

/** Typical upper limits for packed rice (lower is better). */
const LIMITS = [
  { key: "moisturePct", label: "Moisture", limit: 14 },
  { key: "brokenPct", label: "Broken grains", limit: 5 },
  { key: "foreignMatterPct", label: "Foreign matter", limit: 0.25 },
] as const;

export interface QualityCheck {
  key: string;
  label: string;
  value: number;
  limit: number;
  ok: boolean;
}

export function qualityChecks(q: RiceQuality): { checks: QualityCheck[]; allOk: boolean } {
  const checks = LIMITS.map((l) => ({ key: l.key, label: l.label, value: q[l.key], limit: l.limit, ok: q[l.key] <= l.limit }));
  return { checks, allOk: checks.every((c) => c.ok) };
}
