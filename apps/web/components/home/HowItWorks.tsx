import type { SalesModel } from "@kisa/shared";
import { Reveal } from "@/components/ui/Reveal";
import { ModelExplainer, type ModelExample } from "@/components/home/ModelExplainer";
import { getBatch, getFarmer, getPartner, riceProducts } from "@/data/mock";

function exampleFor(model: SalesModel): ModelExample {
  const product =
    riceProducts.find((p) => p.featured && p.salesModel === model) ??
    riceProducts.find((p) => p.salesModel === model) ??
    riceProducts[0];
  return {
    product,
    farmerName: getFarmer(product.farmerId)?.name ?? "",
    partnerName: getPartner(product.partnerId)?.name ?? "",
    purchase: getBatch(product.batchId)?.purchase,
  };
}

export function HowItWorks() {
  const examples = { FARMER_OWNED: exampleFor("FARMER_OWNED"), PARTNER_SOURCED: exampleFor("PARTNER_SOURCED") };

  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-husk">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-field sm:text-4xl">Farmer → Partner → You. No middlemen.</h2>
          <p className="mt-4 text-soil/75">
            Every pack is sold one of two ways. Either way the farmer is named on the pack, and every rupee is shown.
          </p>
        </Reveal>

        <ModelExplainer examples={examples} />
      </div>
    </section>
  );
}
