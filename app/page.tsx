import { Hero } from "@/components/hero/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedRice } from "@/components/home/FeaturedRice";
import { FarmerStories } from "@/components/home/FarmerStories";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedRice />
      <FarmerStories />
    </>
  );
}
