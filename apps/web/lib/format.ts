const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** 690 → "₹690" */
export const formatINR = (amount: number) => inr.format(amount);

// UTC so an ISO date like "2026-04-12" never shifts a day between server and browser.
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-04-12" → "12 Apr 2026" */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
