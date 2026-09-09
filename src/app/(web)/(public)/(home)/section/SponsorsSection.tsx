"use client";

import Image from "next/image";
import { useT } from "@/components/locale/LocaleProvider";
import { displayImage } from "@/utils/image";
import type { ActiveSponsor } from "@/services/sponsorService";

/** Batas jumlah sponsor statis — lebih dari ini memakai marquee. */
const STATIC_LIMIT = 5;

/**
 * Logo sponsor (gambar saja, tinggi seragam, rasio asli dipertahankan).
 * Logo bertanda invertDark (logo gelap seperti The North Face) dibalik
 * warnanya HANYA di dark mode via filter invert — di light mode tampil
 * apa adanya sehingga logo berwarna tidak rusak. Logo Cloudinary sudah
 * bertransformasi (f_auto,q_auto,w_320) — dimensi atribut hanya hint
 * rasio; CSS max-w/max-h + object-contain menjaga tampilan logo.
 */
function SponsorLogo({ sponsor }: { sponsor: ActiveSponsor }) {
  const { src, unoptimized } = displayImage(sponsor.filename, 320);

  return (
    <Image
      src={src}
      alt={sponsor.name}
      width={320}
      height={256}
      unoptimized={unoptimized}
      title={sponsor.name}
      className={[
        "max-w-40 max-h-32 shrink-0! cursor-pointer object-contain opacity-60",
        "transition-opacity duration-500 hover:opacity-100",
        sponsor.invertDark ? "dark:invert" : "",
      ].join(" ")}
    />
  );
}

/**
 * Sponsor dari DB (gambarnya saja): ≤ 5 logo ditampilkan statis sejajar
 * (items-center); lebih dari 5 memakai marquee (pola skills-marquee
 * portfolio — track diduplikasi lalu discroll linear terus-menerus,
 * berhenti saat hover, gradient tepi memudar ke background section).
 * Data diterima via props dari server page (SSR) — tanpa fetching.
 */
export function SponsorsSection({ sponsors }: { sponsors: ActiveSponsor[] }) {
  const { t } = useT();

  // Tanpa data sponsor, section disembunyikan total.
  if (sponsors.length === 0) return null;

  const useMarquee = sponsors.length > STATIC_LIMIT;

  return (
    <section className="flex max-h-screen flex-col items-center justify-center bg-white py-14 dark:bg-[#141416]">
      <div className="w-full">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-foreground/50">
          {t("home.sponsors.label")}
        </p>

        {useMarquee ? (
          <div className="group relative mt-12 overflow-hidden">
            <div className="pointer-events-none absolute left-0 z-10 h-full w-3/12 bg-linear-to-r from-white to-transparent dark:from-[#141416]" />
            <div className="pointer-events-none absolute right-0 z-10 h-full w-3/12 bg-linear-to-l from-white to-transparent dark:from-[#141416]" />
            <div className="flex w-max animate-scroll items-center gap-16 pr-16 group-hover:[animation-play-state:paused] md:gap-24 md:pr-24">
              {[...sponsors, ...sponsors].map((sponsor, index) => (
                <SponsorLogo
                  key={`sponsor-${sponsor.id}-${index + 1}`}
                  sponsor={sponsor}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-12 md:gap-16">
            {sponsors.map((sponsor) => (
              <SponsorLogo key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
