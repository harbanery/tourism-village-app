"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const HERO_IMAGES = ["/images/hero-a.png", "/images/hero-b.png"];
const INTERVAL_MS = 7000;

/**
 * Background parallax global (dipakai home dan halaman auth): fixed di
 * viewport sehingga terlihat "bergerak" mengikuti scroll, dengan
 * crossfade halus antara hero-a dan hero-b serta gradient gelap agar
 * konten tetap terbaca.
 *
 * Rekomendasi 1.2: hero dirender lewat `next/image` (fill) — optimizer
 * Next menyajikan WebP/AVIF responsif menggantikan PNG asli multi-MB,
 * dan frame pertama diberi `priority` agar tetap menjadi preload LCP.
 */
export function HeroBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % HERO_IMAGES.length),
      INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          aria-hidden
          className={`fixed inset-0 -z-10 transition-opacity duration-[1500ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            quality={80}
            className="object-cover"
          />
        </div>
      ))}
      {/* Gradient gelap di atas gambar */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-linear-to-b from-black/60 via-black/45 to-black/65 dark:from-black/70 dark:via-black/55 dark:to-black/75"
      />
    </>
  );
}
