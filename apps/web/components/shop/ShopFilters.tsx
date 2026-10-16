"use client";

import type { ReactNode } from "react";
import type { RiceAge, Variety } from "@kisa/shared";
import type { ShopFilters as Filters } from "@/lib/shop";
import { ageLabel } from "@/lib/rice";

interface ShopFiltersProps {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  onClear: () => void;
  varieties: Variety[];
  packSizes: number[];
}

/** A row of mutually exclusive pill buttons (radio group). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-full bg-rice-dim p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-2 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-field text-rice shadow-sm" : "text-soil/70 hover:text-field"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-husk/15 pt-5">
      <legend className="float-left mb-3 w-full text-xs font-semibold uppercase tracking-wider text-husk">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

const AGE_OPTIONS: { value: RiceAge | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "NEW", label: ageLabel("NEW") },
  { value: "AGED", label: ageLabel("AGED") },
];

export function ShopFilters({ filters, update, onClear, varieties, packSizes }: ShopFiltersProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold">Filters</h2>
        <button type="button" onClick={onClear} className="text-sm font-medium text-field underline-offset-4 hover:underline">
          Clear all
        </button>
      </div>

      <Group title="Variety">
        <ul className="space-y-2">
          {varieties.map((v) => (
            <li key={v.slug}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-field"
                  checked={filters.varieties.includes(v.slug)}
                  onChange={() => update({ varieties: toggle(filters.varieties, v.slug) })}
                />
                {v.name}
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Age">
        <Segmented label="Age" options={AGE_OPTIONS} value={filters.age ?? "all"} onChange={(age) => update({ age: age === "all" ? null : age })} />
        <p className="mt-2 text-xs leading-relaxed text-soil/70">Aged rice is stored 6+ months, so it cooks fluffier and less sticky.</p>
      </Group>

      <Group title="Pack size">
        <ul className="flex flex-wrap gap-2">
          {packSizes.map((kg) => {
            const active = filters.packs.includes(kg);
            return (
              <li key={kg}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ packs: toggle(filters.packs, kg) })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    active ? "border-field bg-field text-rice" : "border-husk/25 bg-white/80 text-soil/80 hover:border-field"
                  }`}
                >
                  {kg} kg
                </button>
              </li>
            );
          })}
        </ul>
      </Group>
    </div>
  );
}
