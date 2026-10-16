export const rupees = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso));

export const METHOD_LABEL: Record<string, string> = { conventional: "Conventional", "low-chemical": "Low-chemical", natural: "Natural" };
export const MODEL_LABEL: Record<string, string> = { FARMER_OWNED: "Farmer-owned", PARTNER_SOURCED: "Partner-sourced" };
export const PARTNER_TYPE_LABEL: Record<string, string> = { MILL: "Rice mill", PACKHOUSE: "Onion packhouse" };
export const CATEGORY_LABEL: Record<string, string> = { rice: "Rice", onions: "Onions" };
export const REASON_LABEL: Record<string, string> = { DAMAGED: "Damaged", RECOUNT: "Recount", RETURNED: "Returned", OTHER: "Other" };
