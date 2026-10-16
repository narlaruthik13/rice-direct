import { Hero } from "@/components/hero/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedProducts />
    </>
  );
}
