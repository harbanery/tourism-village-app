import { HeroBackground } from "./section/HeroBackground";
import { HeroSection } from "./section/HeroSection";
import { PopularSection } from "./section/PopularSection";
import { FeatureSection } from "./section/FeatureSection";
import { PackagesSection } from "./section/PackagesSection";
import { TestimonialsSection } from "./section/TestimonialsSection";
import { SponsorsSection } from "./section/SponsorsSection";
import { DocumentationSection } from "./section/DocumentationSection";

export default function HomePage() {
  return (
    <div className="relative">
      {/*
        Background parallax + crossfade hero-a/hero-b: fixed di viewport
        sehingga "bergerak" mengikuti scroll dan tetap terlihat di belakang
        section transparan. Section berlatar solid menutupinya.
      */}
      <HeroBackground />
      <HeroSection />
      <PopularSection />
      <FeatureSection />
      <PackagesSection />
      <TestimonialsSection />
      <SponsorsSection />
      <DocumentationSection />
    </div>
  );
}
