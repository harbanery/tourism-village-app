import { getPlacesWithPackages } from "@/services/place";
import { getActivePackages } from "@/services/package";
import { getPublishedReviews } from "@/services/review";
import { getActiveSponsors } from "@/services/sponsor";
import { getActiveVideos } from "@/services/video";
import { HeroBackground } from "@/features/web/components/ui/hero-background/HeroBackground";
import { HeroSection } from "./section/HeroSection";
import { PopularSection } from "./section/PopularSection";
import { FeatureSection } from "./section/FeatureSection";
import { PackagesSection } from "./section/PackagesSection";
import { TestimonialsSection } from "./section/TestimonialsSection";
import { SponsorsSection } from "./section/SponsorsSection";
import { DocumentationSection } from "./section/DocumentationSection";

/**
 * ISR: halaman di-prerender di server dan diverifikasi di belakang
 * layar tiap 60 detik (pola portfolio) — data sudah termuat saat HTML
 * dirender, section tidak lagi fetch di client. Invalidasi tetap cepat
 * lewat revalidateTag dari panel admin saat data berubah.
 */
export const revalidate = 60;

export default async function HomePage() {
  const [places, packages, reviews, sponsors, videos] = await Promise.all([
    getPlacesWithPackages(),
    getActivePackages(),
    getPublishedReviews(),
    getActiveSponsors(),
    getActiveVideos(),
  ]);

  return (
    <div className="relative">
      {/*
        Background dua lapis: hero (a/b crossfade, statis) di puncak
        halaman; layer scroll (c/d/e crossfade, parallax) mengambil
        alih setelah hero terlewati — terlihat di section transparan.
      */}
      <HeroBackground />
      <HeroSection />
      <PopularSection places={places} />
      <FeatureSection />
      <PackagesSection packages={packages} />
      <DocumentationSection videos={videos} />
      <TestimonialsSection reviews={reviews} />
      <SponsorsSection sponsors={sponsors} />
    </div>
  );
}
