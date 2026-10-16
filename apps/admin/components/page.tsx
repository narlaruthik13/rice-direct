import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";

/** Page title, optional back link and actions. */
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Shown to STAFF on pages only ADMIN can use (the API blocks the change too). */
export function NoPermission({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-husk">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold">Admins only</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">Only admins can {what}. Ask an admin if something needs changing.</p>
    </div>
  );
}

/** Small read-only label/value pair. */
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
