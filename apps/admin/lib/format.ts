import { RICE_AGE_LABEL, RICE_TYPE_LABEL } from "@kisa/shared";

export const rupees = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Kisa margin as a share of the customer price, e.g. "12.3%". */
export const marginPct = (kisaMargin: number, price: number) => (price > 0 ? `${Math.round((kisaMargin / price) * 1000) / 10}%` : "–");

export const typeLabel = (t: string | null | undefined) => (t ? (RICE_TYPE_LABEL as Record<string, string>)[t] ?? t : "–");
export const ageLabel = (a: string | null | undefined) => (a ? (RICE_AGE_LABEL as Record<string, string>)[a] ?? a : "–");
export const REASON_LABEL: Record<string, string> = { DAMAGED: "Damaged", RECOUNT: "Recount", RETURNED: "Returned", OTHER: "Other" };
