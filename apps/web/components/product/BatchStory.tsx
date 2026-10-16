import Link from "next/link";
import type { Batch, Farmer, Partner, Product } from "@kisa/shared";
import { buildJourney } from "@/lib/journey";
import { formatDate } from "@/lib/format";

interface BatchStoryProps {
  batch: Batch;
  farmer: Farmer;
  partner: Partner;
  product?: Product;
}

/**
 * The life of one batch, field to pack, as a compact vertical timeline. Steps
 * come from the category config; partner-sourced batches include the purchase.
 * The trace page shows the same journey in full (see lib/journey.ts).
 */
export function BatchStory({ batch, farmer, partner, product }: BatchStoryProps) {
  const stages = buildJourney({ batch, farmer, partner, product });

  return (
    <div>
      <ol className="relative space-y-6 border-l-2 border-paddy/40 pl-6">
        {stages.map((stage) => (
          <li key={stage.key} className="relative">
            <span
              className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-rice bg-paddy ring-2 ring-paddy/40"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-lg font-semibold text-field">{stage.title}</h3>
              {stage.date && (
                <time className="text-sm text-soil/60" dateTime={stage.date}>
                  {formatDate(stage.date)}
                </time>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-soil/80">{stage.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-rice-dim/70 p-4 text-sm">
        <span className="text-soil/70">Batch ID</span>
        <code className="rounded bg-white px-2 py-0.5 font-mono text-xs font-semibold">{batch.id}</code>
        <Link href={`/trace/${batch.id}`} className="ml-auto inline-block py-1.5 font-semibold text-field underline decoration-paddy underline-offset-4">
          Open trace page →
        </Link>
      </div>
    </div>
  );
}
