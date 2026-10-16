import type { QualityPassport } from "@kisa/shared";
import { formatDate } from "@/lib/format";

/** Milled → packed and quality-checked → best before, as a vertical timeline. */
export function PassportTimeline({ passport }: { passport: QualityPassport }) {
  const steps = [
    { label: "Milled", date: passport.millingDate, text: "Paddy milled into fresh rice." },
    { label: "Quality checked", date: passport.quality.testedOn, text: `Tested by ${passport.quality.testedBy}: grade ${passport.quality.grade}.` },
    { label: "Packed", date: passport.packedDate, text: `Packed in Kisa bags as batch ${passport.batchId}.` },
    { label: "Best before", date: passport.bestBefore, text: "Enjoy it before this date for the best cook." },
  ];
  return (
    <ol className="relative space-y-6 border-l-2 border-paddy/40 pl-6">
      {steps.map((s) => (
        <li key={s.label} className="relative">
          <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-rice bg-field" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-husk">{s.label}</p>
          <p className="font-display text-lg font-semibold text-field">{formatDate(s.date)}</p>
          <p className="text-sm text-soil/75">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
