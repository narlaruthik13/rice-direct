// Builds a batch's journey (farm → harvest → [purchase] → category steps →
// quality → packing → you) from lib/categories.ts. BatchStory (product page) and
// TraceTimeline (trace page) both render this, so they always tell the same story.
//
// Model-aware: PARTNER_SOURCED batches add a "Bought from the farmer" stage with
// the date and published price, and ownership wording changes accordingly.

import type { Batch, Farmer, Partner, ProcessStep, Product } from "@kisa/shared";
import { categories, PARTNER_TYPES, qualityChecks, STEP_LABELS } from "@/lib/categories";
import { farmerAmount, partnerAmount } from "@/lib/pricing";
import { formatDate, formatINR } from "@/lib/format";
import { methodLabel } from "@/lib/farmers";

export type JourneyKey = "farm" | "purchase" | ProcessStep | "quality" | "you";

export interface JourneyStage {
  key: JourneyKey;
  title: string;
  date?: string; // ISO
  /** e.g. "143 days after harvest" */
  gap?: string;
  body: string;
  facts: { label: string; value: string }[];
  link?: { href: string; label: string };
}

interface JourneyInput {
  batch: Batch;
  farmer: Farmer;
  partner: Partner;
  product?: Product;
  /** Trace page: include the farm intro and "your kitchen" stages. */
  full?: boolean;
}

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const kg = (n: number) => `${n.toLocaleString("en-IN")} kg`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** How each stage is referred to in "N days after …". */
const GAP_NOUNS: Record<JourneyKey, string> = {
  farm: "planting",
  harvest: "harvest",
  purchase: "purchase",
  milling: "milling",
  curing: "curing",
  grading: "grading",
  quality: "testing",
  packing: "packing",
  you: "delivery",
};

/** The date a processing step finished, read generically from the batch. */
export function stepDate(batch: Batch, step: ProcessStep): string | undefined {
  switch (step) {
    case "harvest":
      return batch.harvestDate;
    case "packing":
      return batch.packedDate;
    case "milling":
      return batch.categoryId === "rice" ? batch.millingDate : undefined;
    case "curing":
      return batch.categoryId === "onions" ? addDays(batch.harvestDate, batch.curingDays) : undefined;
    case "grading":
      return batch.categoryId === "onions" ? batch.gradingDate : undefined;
  }
}

export function buildJourney({ batch, farmer, partner, product, full = false }: JourneyInput): JourneyStage[] {
  const category = categories[batch.categoryId];
  const { raw, product: produce } = category.nouns;
  const partnerWords = PARTNER_TYPES[partner.type];
  const farmerOwned = batch.salesModel === "FARMER_OWNED";
  const processing = category.steps.filter((s) => s !== "harvest" && s !== "packing");
  const lastProcessing = processing[processing.length - 1];
  const quality = qualityChecks(batch.categoryId, batch.quality);
  const stages: JourneyStage[] = [];

  if (full) {
    stages.push({
      key: "farm",
      title: `${farmer.name}'s farm`,
      body: farmer.story,
      facts: [
        { label: "Village", value: `${farmer.village}, ${farmer.district}` },
        { label: "Farm size", value: `${farmer.acres} acres` },
        { label: "Method", value: methodLabel[farmer.method] },
        { label: "Farming for", value: plural(farmer.yearsFarming, "year") },
      ],
    });
  }

  // Harvest
  const ownership =
    raw === produce
      ? `The ${produce} belong to the farmer all the way to your kitchen.`
      : `The ${raw}, and the ${produce} it becomes, belongs to the farmer.`;
  stages.push({
    key: "harvest",
    title: STEP_LABELS.harvest,
    date: batch.harvestDate,
    body: `${farmer.name} harvested ${kg(batch.inputKg)} of ${batch.variety} ${raw} in ${farmer.village}.${
      farmerOwned ? ` ${ownership}` : ""
    }`,
    facts: [
      { label: "Variety", value: batch.variety },
      { label: "Harvested", value: kg(batch.inputKg) },
    ],
  });

  // Model A: the partner buys the lot at a published price.
  if (!farmerOwned && batch.purchase) {
    const { date, pricePerKg } = batch.purchase;
    stages.push({
      key: "purchase",
      title: "Bought from the farmer",
      date,
      body: `${partner.name} bought from ${farmer.name} on ${formatDate(date)} at ₹${pricePerKg}/kg, the published price for ${batch.variety} ${raw}. From here the ${partnerWords.noun} owns the lot.`,
      facts: [
        { label: "Price paid", value: `₹${pricePerKg}/kg ${raw}` },
        { label: "Quantity", value: kg(batch.inputKg) },
        { label: "Total to farmer", value: formatINR(pricePerKg * batch.inputKg) },
      ],
    });
  }

  // Category processing steps (milling / curing / grading ...)
  for (const step of processing) {
    const facts: JourneyStage["facts"] = [];
    let body = "";
    if (step === "milling") {
      body = `${partner.name} in ${partner.town} hulled and polished the ${raw}`;
    } else if (step === "curing" && batch.categoryId === "onions") {
      body = `The bulbs were cured for ${plural(batch.curingDays, "day")} to dry the necks and toughen the skins, so they keep longer`;
      facts.push({ label: "Curing", value: plural(batch.curingDays, "day") });
    } else if (step === "grading" && batch.categoryId === "onions") {
      body = `${partner.name} in ${partner.town} sorted the bulbs by size and removed damaged ones`;
      const size = category.attributes.find((a) => a.key === "sizeGrade")?.values?.[batch.sizeGrade];
      facts.push({ label: "Size grade", value: size ?? batch.sizeGrade });
    } else {
      body = `${partner.name} handled ${STEP_LABELS[step].toLowerCase()}`;
    }
    body += farmerOwned
      ? step === lastProcessing
        ? `, as a paid service charging the farmer ₹${partner.processingFeePerKg}/kg. The ${partnerWords.noun} never owned the ${produce}.`
        : "."
      : ".";

    if (step === lastProcessing) {
      facts.push(
        { label: category.nouns.inLabel, value: kg(batch.inputKg) },
        { label: category.nouns.outLabel, value: kg(batch.outputKg) },
        { label: category.nouns.yieldLabel, value: `${Math.round((batch.outputKg / batch.inputKg) * 100)}%` },
      );
      if (farmerOwned) facts.push({ label: partnerWords.feeLabel, value: `₹${partner.processingFeePerKg}/kg` });
    }
    stages.push({ key: step, title: STEP_LABELS[step], date: stepDate(batch, step), body, facts });
  }

  // Quality
  stages.push({
    key: "quality",
    title: "Quality check",
    date: batch.quality.testedOn,
    body: `Tested by ${batch.quality.testedBy} and graded ${batch.quality.grade}. ${
      quality.allOk
        ? `Every measure is within typical limits for packed ${produce}.`
        : "See the product page for the full report."
    }`,
    facts: [...quality.checks, ...quality.highlights].slice(0, 4).map((m) => ({ label: m.label, value: m.display })),
  });

  // Packing
  const container = `${category.pack.noun}s`;
  let packTitle = "Packed";
  let packBody = `Packed into ${container} printed with batch ${batch.id}.`;
  if (batch.categoryId === "rice") {
    const agedTag = product?.tags.find((t) => t.startsWith("Aged "));
    packTitle = batch.age === "aged" ? "Aged and packed" : "Packed fresh";
    packBody =
      batch.age === "aged"
        ? `Stored to age${agedTag ? ` (${agedTag.toLowerCase()})` : ""} so the grains cook fluffier and more separate, then packed into ${container} printed with batch ${batch.id}.`
        : `Packed soon after milling into ${container} printed with batch ${batch.id}, for the soft texture of new-crop rice.`;
  } else if (category.perishable && batch.categoryId === "onions") {
    packBody = `Packed into breathable ${container} printed with batch ${batch.id}. Best used within ${plural(batch.shelfLifeDays, "day")} of packing; store somewhere cool, dry and airy.`;
  }
  const packFacts: JourneyStage["facts"] = [];
  if (product) {
    packFacts.push(
      { label: "Pack size", value: `${product.bagSizeKg} kg` },
      { label: `${cap(container)} in batch`, value: `~${Math.floor(batch.outputKg / product.bagSizeKg).toLocaleString("en-IN")}` },
    );
  }
  if (batch.categoryId === "onions") packFacts.push({ label: "Best within", value: plural(batch.shelfLifeDays, "day") });
  stages.push({
    key: "packing",
    title: packTitle,
    date: batch.packedDate,
    body: packBody,
    facts: packFacts,
    link: full && product ? { href: `/product/${product.id}`, label: "See this in the shop" } : undefined,
  });

  if (full) {
    const b = product?.priceBreakdown;
    stages.push({
      key: "you",
      title: "Your kitchen",
      body: !product || !b
        ? `This ${category.pack.noun} travelled from ${farmer.village} to you with no middlemen.`
        : farmerOwned
          ? `Of the ${formatINR(product.price)} you paid, ${formatINR(farmerAmount(b))} went to ${farmer.name}, ${formatINR(partnerAmount(b))} to the ${partnerWords.noun} for its work, and ${formatINR(b.platformFee)} to Kisa.`
          : `Of the ${formatINR(product.price)} you paid, ${formatINR(farmerAmount(b))} was paid to ${farmer.name} for the ${raw}, ${formatINR(partnerAmount(b))} is the ${partnerWords.noun}'s margin, and ${formatINR(b.platformFee)} went to Kisa.`,
      facts: [],
    });
  }

  // "N days after <previous dated stage>"
  let prev: JourneyStage | undefined;
  for (const stage of stages) {
    if (!stage.date) continue;
    if (prev?.date) {
      const n = days(prev.date, stage.date);
      if (n > 0) stage.gap = `${plural(n, "day")} after ${GAP_NOUNS[prev.key]}`;
    }
    prev = stage;
  }

  return stages;
}
