"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

/** Sponsor aktif dari /api/web/sponsors (kelola admin — hanya gambar). */
interface WebSponsor {
  id: string;
  name: string;
  filename: string;
}

/** Batas jumlah sponsor statis — lebih dari ini memakai marquee. */
const STATIC_LIMIT = 5;

/** Logo sponsor (gambar saja, tinggi seragam, rasio asli dipertahankan). */
function SponsorLogo({ sponsor }: { sponsor: WebSponsor }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sponsor.filename}
      alt={sponsor.name}
      title={sponsor.name}
      className="h-10 w-auto shrink-0 cursor-pointer object-contain opacity-60 transition-opacity duration-500 hover:opacity-100 md:h-12"
    />
  );
}

/**
 * Sponsor dari DB (gambarnya saja): ≤ 5 logo ditampilkan statis sejajar
 * (items-center); lebih dari 5 memakai marquee (pola skills-marquee
 * portfolio — track diduplikasi lalu discroll linear terus-menerus,
 * berhenti saat hover, gradient tepi memudar ke background section).
 */
export function SponsorsSection() {
  const { t } = useT();
  const [sponsors, setSponsors] = useState<WebSponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSponsors = useCallback(async () => {
    try {
      const res = await fetch("/api/web/sponsors");
      const json = await res.json();
      if (json.success) setSponsors(json.data);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchSponsors);
  }, [fetchSponsors]);

  // Tanpa data sponsor, section disembunyikan total.
  if (!loading && sponsors.length === 0) return null;

  const useMarquee = sponsors.length > STATIC_LIMIT;

  return (
    <section className="flex max-h-screen flex-col items-center justify-center bg-white py-14 dark:bg-[#141416]">
      <div className="w-full">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-foreground/50">
          {t("home.sponsors.label")}
        </p>

        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-12">
            {[1, 2, 3].map((key) => (
              <Skeleton.Image key={key} active className="h-10! w-24!" />
            ))}
          </div>
        ) : useMarquee ? (
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
