import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/data/mock";

/** Featured packs, in-stock first. */
export function FeaturedProducts() {
  const featured = products.filter((p) => p.featured).sort((a, b) => Number(b.inStock) - Number(a.inStock));

  return (
    <section id="featured" className="scroll-mt-20 bg-rice-dim/60 py-20 sm:py-28">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">Featured</p>
            <h2 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">Fresh from this season&apos;s milling</h2>
          </div>
          <Link
            href="/shop"
            className="inline-block py-2 text-sm font-semibold text-field underline decoration-paddy decoration-2 underline-offset-4"
          >
            Shop all →
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={(i % 3) * 0.08} className="flex">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
