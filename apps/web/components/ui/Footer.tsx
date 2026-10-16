import Link from "next/link";
import { Logo } from "@kisa/ui/logo";
import { getProducts, load, pickFeatured } from "@/lib/data";

const columns = (sampleBatch: string | undefined) => [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All rice" },
      { href: "/shop?type=RAW", label: "Raw rice" },
      { href: "/shop?type=STEAM", label: "Steam rice" },
      { href: "/shop?type=BOILED", label: "Boiled rice" },
      { href: "/shop?age=AGED", label: "Aged rice" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      // A real batch from the catalogue, so the link always works.
      ...(sampleBatch ? [{ href: `/trace/${sampleBatch}`, label: "A Quality Passport" }] : []),
    ],
  },
];

export async function Footer() {
  const catalogue = await load(() => getProducts());
  const sampleBatch = catalogue.ok ? pickFeatured(catalogue.data)?.batchId : undefined;

  return (
    <footer className="mt-24 bg-field-dark text-rice/85">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" aria-label="Kisa home" className="inline-flex py-1">
            <Logo variant="full" size={34} scheme="dark" />
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-paddy-light">Kisa — mill-fresh rice</p>
          <p className="mt-2 font-display text-lg text-rice">Mill-fresh rice, honestly priced.</p>
          <p className="mt-3 text-sm leading-relaxed text-rice/70">
            Rice packed fresh by partner mills in Kisa bags, checked by Kisa and delivered to you in Hyderabad. No middlemen:
            from the mill to your plate, with a Quality Passport on every bag.
          </p>
        </div>

        {columns(sampleBatch).map((col) => (
          <div key={col.title}>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-paddy-light">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-rice/75 transition-colors hover:text-rice">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-rice/10">
        <div className="mx-auto flex max-w-site flex-col gap-2 px-4 py-5 text-xs text-rice/55 sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 Kisa — mill-fresh rice. Products and batches shown are sample data.</p>
          <p>Demo store: no real payments are taken.</p>
        </div>
      </div>
    </footer>
  );
}
