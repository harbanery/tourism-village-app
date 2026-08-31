import { HeroSection } from "./section/HeroSection";
import { PopularSection } from "./section/PopularSection";
import { WhySection } from "./section/WhySection";
import { PackagesSection } from "./section/PackagesSection";
import { TestimonialsSection } from "./section/TestimonialsSection";
import { SponsorsSection } from "./section/SponsorsSection";
import { VideoSection } from "./section/VideoSection";

export default function HomePage() {
  return (
    <div className="relative">
      {/*
        Parallax background: fixed di viewport sehingga "bergerak" mengikuti
        scroll dan tetap terlihat di belakang section transparan. Section dengan
        latar solid (bg-white dark:bg-[#141416]) menutupinya.
      */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/hero.png)" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-black/45 dark:bg-black/60"
      />
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
