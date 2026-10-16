import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    step: "01",
    title: "Mill",
    text: "Our partner mills turn paddy into fresh rice and pack it straight into Kisa bags. No traders, no warehouses in between.",
  },
  {
    step: "02",
    title: "Kisa quality check",
    text: "Every batch is tested for moisture, broken grains and foreign matter before it goes on sale. The results go on its Quality Passport.",
  },
  {
    step: "03",
    title: "Your home",
    text: "Delivered to your door in Hyderabad. Scan the QR code on the bag to see when it was milled, packed and how it tested.",
  },
];

/** Mill → Kisa quality check → Your home. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">From the mill to your plate</h2>
          <p className="mt-4 text-soil/75">Mill-fresh rice, honestly priced: one price, no middlemen, and a Quality Passport on every bag.</p>
        </Reveal>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.08} className="flex">
              <li className="relative flex w-full flex-col rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10">
                <span className="font-display text-4xl font-semibold text-paddy">{s.step}</span>
                <h3 className="mt-2 text-xl font-semibold text-field">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soil/80">{s.text}</p>
                {i < STEPS.length - 1 && (
                  <span className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-2xl text-paddy-dark md:block" aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
