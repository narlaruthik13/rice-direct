import Link from "next/link";
import { GrainMark } from "@/components/ui/GrainMark";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "Shop all" },
      { href: "/shop/rice", label: "Rice" },
      { href: "/shop/rice?age=aged", label: "Aged rice" },
      { href: "/shop/onions", label: "Onions" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#farmers", label: "Our farmers" },
      { href: "/trace/VD-2026-0412-SM", label: "Trace a pack" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-field-dark text-rice/85">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2 text-rice">
            <GrainMark />
            <span className="font-display text-xl font-semibold">Vari Direct</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-rice/70">
            Rice and onions from the farmers who grew them, processed by trusted local mills and
            packhouses, delivered to you. No middlemen. Every pack
            traceable, every rupee shown.
          </p>
        </div>

        {columns.map((col) => (
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
          <p>© 2026 Vari Direct. All farmers and mills shown are sample data.</p>
          <p>Demo store: no real payments are taken.</p>
        </div>
      </div>
    </footer>
  );
}
