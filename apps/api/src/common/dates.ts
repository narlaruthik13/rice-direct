// Calendar dates in India. Expiry and "today" are dates, not moments.

const DAY_MS = 86_400_000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Today's date in India as YYYY-MM-DD. */
export const todayInIndiaIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

/** Today's date in India as a DATE value (midnight UTC), for comparing with @db.Date columns. */
export const todayInIndia = () => new Date(`${todayInIndiaIso()}T00:00:00.000Z`);

/** The moment today started in India, for comparing with timestamps (e.g. orders placed today). */
export const startOfTodayInIndia = () => new Date(todayInIndia().getTime() - IST_OFFSET_MS);

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY_MS);

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
