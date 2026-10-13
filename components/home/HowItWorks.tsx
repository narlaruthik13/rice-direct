import { Reveal } from "@/components/ui/Reveal";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";
import { getFarmer, products } from "@/data/mock";

const steps = [
  {
    title: "Farmer",
    text: "Grows the paddy and owns it, all the way to your kitchen. The farmer sets the price and receives the largest share.",
    icon: (
      <path
        d="M12 21v-8m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0 0C12 9 9 7 5 7c0 4 3 6 7 6ZM4 21h16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Mill",
    text: "A local partner mill hulls, polishes and quality-tests the farmer's paddy for a fixed fee per kg. It never buys or resells the rice.",
    icon: (
      <>
        <circle cx="8" cy="13" r="4" />
        <circle cx="16" cy="13" r="4" />
        <path d="M9 3h6l-2 4h-2L9 3Z" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "You",
    text: "Buy direct, at a price that shows where every rupee goes. Scan the bag's QR code to trace it back to the field.",
    icon: (
      <path d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function HowItWorks() {
  const example = products.find((p) => p.featured) ?? products[0];
  const farmer = getFarmer(example.farmerId);

  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">Farmer → Mill → You. No middlemen.</h2>
          <p className="mt-4 text-soil/75">
            The mill is a service partner, not a trader. The rice stays the farmer&apos;s from field to bag, so the money does
            too.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal delay={i * 0.1} className="h-full rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-field text-rice">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      {step.icon}
                    </svg>
                  </span>
                  <span className="text-xs font-bold tracking-widest text-paddy-dark">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-field">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soil/75">{step.text}</p>
              </Reveal>
              {i < steps.length - 1 && (
                <span
                  className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-2xl text-paddy md:block"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>

        <Reveal className="mt-10 grid items-center gap-8 rounded-2xl bg-field-dark p-6 text-rice sm:p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paddy-light">Price transparency</p>
            <h3 className="mt-2 text-2xl font-semibold">Where your money goes</h3>
            <p className="mt-2 text-sm text-rice/70">
              Example: {example.name}, {example.bagSizeKg} kg from {farmer?.name}. Every product page shows this split.
            </p>
          </div>
          <div className="rounded-xl bg-rice p-5 text-soil">
            <PriceBreakdown breakdown={example.priceBreakdown} price={example.price} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
