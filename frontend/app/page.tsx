import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
  FeaturedArticlesSection,
} from "@/components/marketing";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FeaturedArticlesSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
