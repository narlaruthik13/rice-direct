import type { QualityReport as Report } from "@/lib/types";
import { formatDate } from "@/lib/format";

// Typical upper limits for packaged rice; used to draw each meter and the "within limit" tick.
const metrics = [
  { key: "moisturePct", label: "Moisture", unit: "%", limit: 14 },
  { key: "brokenPct", label: "Broken grains", unit: "%", limit: 5 },
  { key: "foreignMatterPct", label: "Foreign matter", unit: "%", limit: 0.25 },
] as const;

export function QualityReport({ quality }: { quality: Report }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-soil/70">Grade</p>
          <p className="font-display text-3xl font-semibold text-field">{quality.grade}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-soil/70">Avg. grain length</p>
          <p className="font-display text-3xl font-semibold text-field">
            {quality.grainLengthMm}
            <span className="ml-1 text-base font-normal text-soil/60">mm</span>
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-4">
        {metrics.map((m) => {
          const value = quality[m.key];
          const ok = value <= m.limit;
          return (
            <div key={m.key}>
              <div className="flex items-baseline justify-between text-sm">
                <dt className="text-soil/80">{m.label}</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">
                    {value}
                    {m.unit}
                  </span>
                  <span className="text-xs text-soil/50">
                    limit {m.limit}
                    {m.unit}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      ok ? "bg-field/10 text-field" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ok ? "✓ Within limit" : "Above limit"}
                  </span>
                </dd>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rice-dim" aria-hidden="true">
                <div
                  className={ok ? "h-full bg-field-light" : "h-full bg-red-700"}
                  style={{ width: `${Math.min(100, (value / m.limit) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>

      <p className="mt-6 text-xs text-soil/60">
        Tested by {quality.testedBy} on {formatDate(quality.testedOn)}. Limits shown are typical quality limits for packaged
        rice.
      </p>
    </div>
  );
}
