import { HeroBackground } from "@/features/web/components/ui/hero-background/HeroBackground";
import { AboutSection } from "./section/AboutSection";

/**
 * Halaman tentang memakai hero background yang sama dengan home (fixed
 * di viewport + gradient gelap) — teks section disesuaikan putih agar
 * tetap terbaca.
 */
export default function AboutPage() {
  return (
    <div className="relative">
      <HeroBackground />
      <AboutSection />
    </div>
  );
}
