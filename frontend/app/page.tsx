import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  FeaturesSection,
  PricingSection,
  FAQSection,
} from "@/components/marketing";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
