import type { FarmingMethod } from "@kisa/shared";

export const methodLabel: Record<FarmingMethod, string> = {
  natural: "Natural farming",
  "low-chemical": "Low-chemical",
  conventional: "Conventional",
};

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
