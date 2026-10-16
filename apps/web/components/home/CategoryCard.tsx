"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { Product } from "@kisa/shared";
import { formatINR } from "@/lib/format";
import { ProducePack } from "@/components/product/ProducePack";

export interface CategoryCardData {
  href: string;
  name: string;
  tagline: string;
  theme: { bg: string; accent: string };
  particle: { shape: "grain" | "bulb"; colors: string[] };
  count: number;
  models: string[]; // e.g. ["6 Farmer-Owned", "3 Mill-Direct"]
  varieties: readonly string[];
  minPrice: number;
  hero: Product;
  heroFarmer: string;
}

const card: Variants = {
  rest: { y: 0 },
  hover: { y: -8 },
};
const pack: Variants = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: -4, scale: 1.04 },
};

// Six particles dropping into the pack's mouth on a loop, staggered.
const DROPS = [-28, -12, 4, 18, -4, 26];

export function CategoryCard({ data, index }: { data: CategoryCardData; index: number }) {
  const bulb = data.particle.shape === "bulb";
  // Loops are client-only (markup is identical), so skipping them never causes a hydration mismatch.
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={card}
      initial="rest"
      animate="rest"
      whileHover={reduce ? undefined : "hover"}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="h-full"
    >
      <Link
        href={data.href}
        className="group grid h-full overflow-hidden rounded-3xl shadow-card ring-1 ring-husk/10 transition-shadow hover:shadow-xl sm:grid-cols-[1.1fr_1fr]"
        style={{ backgroundColor: data.theme.bg }}
      >
        <div className="order-2 flex flex-col p-6 sm:order-1 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: data.theme.accent }}>
            {data.count} packs · {data.models.join(" · ")}
          </p>
          <h3 className="mt-2 text-4xl font-semibold text-field sm:text-5xl">{data.name}</h3>
          <p className="mt-2 text-soil/80">{data.tagline}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {data.varieties.slice(0, 4).map((v) => (
              <li key={v} className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-soil/80">
                {v}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <p className="text-sm text-soil/70">
              From <span className="font-display text-2xl font-semibold text-soil">{formatINR(data.minPrice)}</span>
            </p>
            <span
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-rice transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
              style={{ backgroundColor: data.theme.accent }}
            >
              Shop {data.name.toLowerCase()} <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>

        {/* Illustration: floating pack with produce dropping in */}
        <div className="relative order-1 grid min-h-56 place-items-center overflow-hidden sm:order-2" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-1/2 motion-reduce:hidden">
            {DROPS.map((dx, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-0"
                style={{
                  marginLeft: dx,
                  width: bulb ? 12 : 10,
                  height: bulb ? 12 : 5,
                  borderRadius: bulb ? "50% 50% 46% 46% / 58% 58% 42% 42%" : 9999,
                  backgroundColor: data.particle.colors[i % data.particle.colors.length],
                  boxShadow: "0 0 0 1px rgba(46,34,25,0.15)",
                }}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={reduce ? undefined : { y: [-20, 70], opacity: [0, 1, 1, 0], rotate: bulb ? 0 : [0, 160] }}
                transition={{
                  duration: 1.6,
                  times: [0, 0.2, 0.75, 1],
                  repeat: Infinity,
                  repeatDelay: 0.6,
                  delay: index * 0.3 + i * 0.35,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>
          <motion.div
            variants={pack}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative h-52 pt-6 sm:h-64"
          >
            <motion.div
              className="h-full"
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.8 }}
            >
              <ProducePack product={data.hero} farmerName={data.heroFarmer} className="h-full w-auto drop-shadow-xl" />
            </motion.div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}
