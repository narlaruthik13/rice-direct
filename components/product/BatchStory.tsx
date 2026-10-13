import Link from "next/link";
import type { Batch, Farmer, Mill } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface BatchStoryProps {
  batch: Batch;
  farmer: Farmer;
  mill: Mill;
}

const kg = (n: number) => `${n.toLocaleString("en-IN")} kg`;

/** The life of one batch, field to bag, as a vertical timeline. */
export function BatchStory({ batch, farmer, mill }: BatchStoryProps) {
  const yieldPct = Math.round((batch.riceKg / batch.paddyKg) * 100);

  const events = [
    {
      title: "Harvested",
      date: batch.harvestDate,
      text: `${farmer.name} harvested ${kg(batch.paddyKg)} of ${batch.variety} paddy in ${farmer.village}, ${farmer.district}.`,
    },
    {
      title: "Milled",
      date: batch.millingDate,
      text: `${mill.name}, ${mill.town} milled the paddy for a fee of ₹${mill.millingFeePerKg}/kg: ${kg(batch.paddyKg)} paddy → ${kg(batch.riceKg)} rice (${yieldPct}% yield). The rice stayed ${farmer.name}'s.`,
    },
    {
      title: "Quality tested",
      date: batch.quality.testedOn,
      text: `Graded ${batch.quality.grade} by ${batch.quality.testedBy}.`,
    },
    {
      title: batch.age === "aged" ? "Aged and packed" : "Packed fresh",
      date: null,
      text:
        batch.age === "aged"
          ? "Stored for months before packing, so the grains cook fluffier and more separate."
          : "Packed soon after milling for the soft texture of new-crop rice.",
    },
  ];

  return (
    <div>
      <ol className="relative space-y-6 border-l-2 border-paddy/40 pl-6">
        {events.map((e) => (
          <li key={e.title} className="relative">
            <span
              className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-rice bg-paddy ring-2 ring-paddy/40"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-lg font-semibold text-field">{e.title}</h3>
              {e.date && <time className="text-sm text-soil/60" dateTime={e.date}>{formatDate(e.date)}</time>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-soil/80">{e.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-rice-dim/70 p-4 text-sm">
        <span className="text-soil/70">Batch ID</span>
        <code className="rounded bg-white px-2 py-0.5 font-mono text-xs font-semibold">{batch.id}</code>
        <Link href={`/trace/${batch.id}`} className="ml-auto font-semibold text-field underline decoration-paddy underline-offset-4">
          Open trace page →
        </Link>
      </div>
    </div>
  );
}
