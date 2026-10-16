import type { Batch } from "@kisa/shared";
import { qualityChecks } from "@/lib/categories";
import { formatDate } from "@/lib/format";

/**
 * Grade, headline measures and limit meters for any category. Which measures
 * appear, and their typical limits, come from the category's quality config.
 */
export function QualityReport({ batch }: { batch: Batch }) {
  const { quality } = batch;
  const { checks, highlights } = qualityChecks(batch.categoryId, quality);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-sm text-soil/70">Grade</p>
          <p className="font-display text-3xl font-semibold text-field">{quality.grade}</p>
        </div>
        {highlights.map((h) => (
          <div key={h.key} className="text-right">
            <p className="text-sm text-soil/70">{h.label}</p>
            <p className="font-display text-3xl font-semibold text-field">
              {h.unit ? (
                <>
                  {String((quality as unknown as Record<string, unknown>)[h.key])}
                  <span className="ml-1 text-base font-normal text-soil/60">{h.unit}</span>
                </>
              ) : (
                h.display
              )}
            </p>
          </div>
        ))}
      </div>

      <dl className="mt-6 space-y-4">
        {checks.map((m) => (
          <div key={m.key}>
            <div className="flex items-baseline justify-between text-sm">
              <dt className="text-soil/80">{m.label}</dt>
              <dd className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{m.display}</span>
                {m.limit !== undefined && (
                  <span className="text-xs text-soil/50">
                    limit {m.limit}
                    {m.unit}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    m.ok ? "bg-field/10 text-field" : "bg-red-100 text-red-800"
                  }`}
                >
                  {m.ok ? "✓ Within limit" : "Above limit"}
                </span>
              </dd>
            </div>
            {m.limit !== undefined && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rice-dim" aria-hidden="true">
                <div
                  className={m.ok ? "h-full bg-field-light" : "h-full bg-red-700"}
                  style={{ width: `${Math.min(100, (m.value / m.limit) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </dl>

      {batch.categoryId === "onions" && (
        <p className="mt-5 text-sm text-soil/75">
          <span className="font-semibold">Skin:</span> {batch.quality.skin}
        </p>
      )}

      <p className="mt-6 text-xs text-soil/60">
        Tested by {quality.testedBy} on {formatDate(quality.testedOn)}. Limits shown are typical quality limits for packed
        produce.
      </p>
    </div>
  );
}
