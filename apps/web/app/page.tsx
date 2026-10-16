import { Hero } from "@/components/hero/Hero";
import { CategorySwitcher } from "@/components/home/CategorySwitcher";
import { OnionTeaser } from "@/components/home/OnionTeaser";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FarmerStories } from "@/components/home/FarmerStories";

export default function Home() {
  return (
    <>
      <Hero />
      <CategorySwitcher />
      <OnionTeaser />
      <HowItWorks />
      <FeaturedProducts />
      <FarmerStories />
    </>
  );
}
