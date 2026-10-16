import type { RiceQuality } from "@kisa/shared";
import { formatDate } from "@/lib/format";
import { qualityChecks } from "@/lib/rice";

/** Grade, grain length and limit meters for moisture, broken grains and foreign matter. */
export function QualityReport({ quality }: { quality: RiceQuality }) {
  const { checks } = qualityChecks(quality);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-sm text-soil/70">Grade</p>
          <p className="font-display text-3xl font-semibold text-field" data-testid="quality-grade">
            {quality.grade}
          </p>
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
        {checks.map((m) => (
          <div key={m.key}>
            <div className="flex items-baseline justify-between text-sm">
              <dt className="text-soil/80">{m.label}</dt>
              <dd className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{m.value}%</span>
                <span className="text-xs text-soil/50">limit {m.limit}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.ok ? "bg-field/10 text-field" : "bg-red-100 text-red-800"}`}>
                  {m.ok ? "✓ Within limit" : "Above limit"}
                </span>
              </dd>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rice-dim" aria-hidden="true">
              <div className={m.ok ? "h-full bg-field-light" : "h-full bg-red-700"} style={{ width: `${Math.min(100, (m.value / m.limit) * 100)}%` }} />
            </div>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-xs text-soil/60">
        Tested by {quality.testedBy} on {formatDate(quality.testedOn)}. Limits shown are typical quality limits for packed rice.
      </p>
    </div>
  );
}
