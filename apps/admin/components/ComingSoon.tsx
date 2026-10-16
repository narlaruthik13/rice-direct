import { Hourglass } from "lucide-react";

/** Placeholder for sections that come in later Phase 2 steps. */
export function ComingSoon({ title, description, step }: { title: string; description: string; step: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-husk">
          <Hourglass className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">Coming soon</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-husk">{step}</p>
      </div>
    </div>
  );
}
