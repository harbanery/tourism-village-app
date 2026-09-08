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
        Background dua lapis: hero (a/b crossfade, statis) di puncak
        halaman; layer scroll (c/d/e crossfade, parallax) mengambil
        alih setelah hero terlewati — terlihat di section transparan.
      */}
      <HeroBackground />
      <HeroSection />
      <PopularSection />
      <FeatureSection />
      <TestimonialsSection />
      <PackagesSection />
      <SponsorsSection />
      <DocumentationSection />
    </div>
  );
}
