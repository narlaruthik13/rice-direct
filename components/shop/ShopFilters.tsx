"use client";

import type { ReactNode } from "react";
import type { Farmer, RiceVariety } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { PRICE_STEP, type ShopFilters as Filters } from "@/lib/shop";

interface ShopFiltersProps {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  onClear: () => void;
  varieties: RiceVariety[];
  farmers: Farmer[];
  bounds: { min: number; max: number };
}

const ageOptions = [
  { value: "all", label: "All" },
  { value: "new", label: "New crop" },
  { value: "aged", label: "Aged" },
] as const;

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-husk/15 pt-5">
      <legend className="float-left mb-3 w-full text-xs font-semibold uppercase tracking-wider text-husk">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

export function ShopFilters({ filters, update, onClear, varieties, farmers, bounds }: ShopFiltersProps) {
  const priceValue = filters.maxPrice ?? bounds.max;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-sm font-semibold">Filters</h2>
        <button type="button" onClick={onClear} className="text-sm font-medium text-field underline-offset-4 hover:underline">
          Clear all
        </button>
      </div>

      <Group title="Rice age">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-rice-dim p-1" role="radiogroup" aria-label="Rice age">
          {ageOptions.map((opt) => {
            const active = filters.age === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ age: opt.value })}
                className={`rounded-full px-2 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-field text-rice shadow-sm" : "text-soil/70 hover:text-field"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Variety">
        <ul className="space-y-2">
          {varieties.map((v) => (
            <li key={v}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-field"
                  checked={filters.varieties.includes(v)}
                  onChange={() => update({ varieties: toggle(filters.varieties, v) })}
                />
                {v}
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Farm">
        <ul className="space-y-2">
          {farmers.map((f) => (
            <li key={f.id}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-field"
                  checked={filters.farms.includes(f.id)}
                  onChange={() => update({ farms: toggle(filters.farms, f.id) })}
                />
                <span>
                  {f.name}
                  <span className="block text-xs text-soil/60">
                    {f.village}, {f.district}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Price per bag">
        <label htmlFor="max-price" className="mb-2 flex justify-between text-sm">
          <span>Up to</span>
          <span className="font-semibold">{filters.maxPrice === null ? "Any price" : formatINR(priceValue)}</span>
        </label>
        <input
          id="max-price"
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={priceValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            update({ maxPrice: v >= bounds.max ? null : v });
          }}
          className="w-full accent-field"
        />
        <div className="mt-1 flex justify-between text-xs text-soil/50">
          <span>{formatINR(bounds.min)}</span>
          <span>{formatINR(bounds.max)}</span>
        </div>
      </Group>
    </div>
  );
}
