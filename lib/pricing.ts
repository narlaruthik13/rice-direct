// Model-aware pricing helpers.
// A product's PriceBreakdown is either FARMER_OWNED (farmer share + processing fee
// + platform fee) or PARTNER_SOURCED (paid to farmer + partner margin + platform fee).
// A PriceSplit is the model-neutral view (farmer / partner / platform) that can be
// summed across a cart mixing both models.

import type { PartnerType, PriceBreakdown } from "@/lib/types";
import { PARTNER_TYPES } from "@/lib/categories";

export type PricePart = "farmer" | "partner" | "platform";

export interface PriceSplit {
  farmer: number;
  partner: number;
  platform: number;
}

export interface PriceLine {
  part: PricePart;
  label: string;
  amount: number;
}

export const farmerAmount = (b: PriceBreakdown) => (b.model === "FARMER_OWNED" ? b.farmerShare : b.paidToFarmer);
export const partnerAmount = (b: PriceBreakdown) => (b.model === "FARMER_OWNED" ? b.processingFee : b.partnerMargin);

export const toSplit = (b: PriceBreakdown): PriceSplit => ({
  farmer: farmerAmount(b),
  partner: partnerAmount(b),
  platform: b.platformFee,
});

export const EMPTY_SPLIT: PriceSplit = { farmer: 0, partner: 0, platform: 0 };

export const addSplit = (a: PriceSplit, b: PriceSplit, times = 1): PriceSplit => ({
  farmer: a.farmer + b.farmer * times,
  partner: a.partner + b.partner * times,
  platform: a.platform + b.platform * times,
});

export const splitTotal = (s: PriceSplit) => s.farmer + s.partner + s.platform;
export const priceTotal = (b: PriceBreakdown) => splitTotal(toSplit(b));

/** Labelled lines for one product, worded for its sales model and partner type. */
export function priceLines(b: PriceBreakdown, partnerType?: PartnerType): PriceLine[] {
  const partner = partnerType ? PARTNER_TYPES[partnerType] : undefined;
  if (b.model === "FARMER_OWNED") {
    return [
      { part: "farmer", label: "Farmer's share", amount: b.farmerShare },
      { part: "partner", label: partner?.feeLabel ?? "Processing fee", amount: b.processingFee },
      { part: "platform", label: "Platform fee", amount: b.platformFee },
    ];
  }
  return [
    { part: "farmer", label: "Paid to farmer", amount: b.paidToFarmer },
    { part: "partner", label: partner?.marginLabel ?? "Partner margin", amount: b.partnerMargin },
    { part: "platform", label: "Platform fee", amount: b.platformFee },
  ];
}

/** Labelled lines for a summed split (cart, checkout, order). */
export function splitLines(s: PriceSplit): PriceLine[] {
  return [
    { part: "farmer", label: "To farmers", amount: s.farmer },
    { part: "partner", label: "Processing partners", amount: s.partner },
    { part: "platform", label: "Platform fees", amount: s.platform },
  ];
}
