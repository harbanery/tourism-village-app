import { HeroSection } from "./section/HeroSection";
import { PopularSection } from "./section/PopularSection";
import { WhySection } from "./section/WhySection";
import { PackagesSection } from "./section/PackagesSection";
import { TestimonialsSection } from "./section/TestimonialsSection";
import { SponsorsSection } from "./section/SponsorsSection";
import { VideoSection } from "./section/VideoSection";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <PopularSection />
      <WhySection />
      <PackagesSection />
      <TestimonialsSection />
      <SponsorsSection />
      <VideoSection />
    </div>
  );
}
