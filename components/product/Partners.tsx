import type { ReactNode } from "react";
import type { FarmingMethod, Farmer, Mill } from "@/lib/types";

export const methodLabel: Record<FarmingMethod, string> = {
  natural: "Natural farming",
  "low-chemical": "Low-chemical",
  conventional: "Conventional",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

function Card({ children }: { children: ReactNode }) {
  return <article className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">{children}</article>;
}

function Badge({ children, tone }: { children: ReactNode; tone: "field" | "paddy" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        tone === "field" ? "bg-field text-rice" : "bg-paddy/25 text-husk-dark"
      }`}
    >
      {children}
    </span>
  );
}

export function FarmerCard({ farmer }: { farmer: Farmer }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-field font-display text-lg font-semibold text-rice"
            aria-hidden="true"
          >
            {initials(farmer.name)}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-husk">Farmer</p>
            <h3 className="text-xl font-semibold text-field">{farmer.name}</h3>
            <p className="text-sm text-soil/70">
              {farmer.village}, {farmer.district}, {farmer.state}
            </p>
          </div>
        </div>
        <Badge tone="field">Owns this rice</Badge>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-rice-dim/70 p-3 text-center text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Acres</dt>
          <dd className="font-semibold">{farmer.acres}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Years</dt>
          <dd className="font-semibold">{farmer.yearsFarming}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-soil/60">Method</dt>
          <dd className="font-semibold">{methodLabel[farmer.method]}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-soil/80">{farmer.story}</p>
    </Card>
  );
}

export function MillCard({ mill }: { mill: Mill }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-husk text-rice" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="8" cy="13" r="4" />
              <circle cx="16" cy="13" r="4" />
              <path d="M9 3h6l-2 4h-2L9 3Z" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-husk">Partner mill</p>
            <h3 className="text-xl font-semibold text-field">{mill.name}</h3>
            <p className="text-sm text-soil/70">
              {mill.town}, {mill.district}, {mill.state} · since {mill.established}
            </p>
          </div>
        </div>
        <Badge tone="paddy">Service partner</Badge>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-rice-dim/70 p-3 text-sm">
        <span className="text-soil/70">Milling fee charged to the farmer</span>
        <span className="font-semibold">₹{mill.millingFeePerKg}/kg</span>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {mill.certifications.map((c) => (
          <li key={c} className="rounded-full border border-husk/30 px-3 py-1 text-xs font-medium">
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-soil/80">
        The mill hulls, polishes and tests the farmer&apos;s paddy for a fixed fee. It never buys or resells the rice.
      </p>
    </Card>
  );
}
