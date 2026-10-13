import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { methodLabel } from "@/components/product/Partners";
import { farmers, products } from "@/data/mock";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

export function FarmerStories() {
  return (
    <section id="farmers" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Our farmers</p>
          <h2 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">The people behind every bag</h2>
          <p className="mt-4 text-soil/75">Each bag carries the name of the farmer who grew it. Meet them.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {farmers.map((farmer, i) => {
            const theirRice = products.filter((p) => p.farmerId === farmer.id);
            return (
              <Reveal key={farmer.id} delay={i * 0.1} className="flex">
                <article className="flex w-full flex-col rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">
                  <div className="flex items-center gap-4">
                    <span
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-field font-display text-lg font-semibold text-rice"
                      aria-hidden="true"
                    >
                      {initials(farmer.name)}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-field">{farmer.name}</h3>
                      <p className="text-sm text-soil/70">
                        {farmer.village}, {farmer.district}, {farmer.state}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-rice-dim/70 p-3 text-center">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-soil/60">Acres</dt>
                      <dd className="font-semibold">{farmer.acres}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-soil/60">Years</dt>
                      <dd className="font-semibold">{farmer.yearsFarming}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-soil/60">Method</dt>
                      <dd className="text-sm font-semibold leading-6">{methodLabel[farmer.method]}</dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-sm leading-relaxed text-soil/80">{farmer.story}</p>

                  <div className="mt-auto pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-husk">Rice from this farm</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {theirRice.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/product/${p.id}`}
                            className="inline-block rounded-full border border-field/30 px-3 py-1 text-xs font-medium text-field transition-colors hover:bg-field hover:text-rice"
                          >
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
