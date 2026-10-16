import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo } from "@kisa/ui/logo";

// Internal brand sheet: every logo variant, scheme and size in one place.
export const metadata: Metadata = {
  title: "Brand",
  robots: { index: false },
};

const SIZES = [16, 24, 32, 48, 72];

function Row({ title, dark = false, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <section className={`rounded-2xl p-6 ring-1 ring-husk/10 ${dark ? "bg-field-dark text-rice" : "bg-white/70"}`}>
      <h2 className={`font-sans text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-paddy-light" : "text-husk"}`}>{title}</h2>
      <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-6">{children}</div>
    </section>
  );
}

function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-start gap-2">
      {children}
      <figcaption className="text-xs opacity-60">{label}</figcaption>
    </figure>
  );
}

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-site space-y-6 px-4 py-12 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Brand</p>
        <h1 className="mt-2 text-3xl font-semibold text-field sm:text-4xl">Kisa — farmer-owned food</h1>
        <p className="mt-2 text-soil/75">Straight from the farmer. Traceable to the field.</p>
      </div>

      <Row title="Full · light">
        {SIZES.map((s) => (
          <Sample key={s} label={`${s}px`}>
            <Logo variant="full" size={s} />
          </Sample>
        ))}
      </Row>
      <Row title="Full · dark" dark>
        {SIZES.map((s) => (
          <Sample key={s} label={`${s}px`}>
            <Logo variant="full" size={s} scheme="dark" />
          </Sample>
        ))}
      </Row>
      <Row title="Wordmark · light and dark">
        {[20, 32, 56].map((s) => (
          <Sample key={s} label={`${s}px`}>
            <Logo variant="wordmark" size={s} />
          </Sample>
        ))}
        <div className="rounded-xl bg-field-dark p-4">
          <Logo variant="wordmark" size={40} scheme="dark" />
        </div>
      </Row>
      <Row title="Mark · light, dark and tile (favicon)">
        {SIZES.map((s) => (
          <Sample key={s} label={`${s}px`}>
            <Logo variant="mark" size={s} />
          </Sample>
        ))}
        <div className="rounded-xl bg-field-dark p-3">
          <Logo variant="mark" size={40} scheme="dark" />
        </div>
        {[16, 32, 64].map((s) => (
          <Sample key={`t${s}`} label={`tile ${s}px`}>
            <Logo variant="mark" size={s} tile />
          </Sample>
        ))}
      </Row>
      <Row title="Animated (reload to replay the grain drop)">
        <Logo variant="full" size={56} animated />
      </Row>
    </div>
  );
}
