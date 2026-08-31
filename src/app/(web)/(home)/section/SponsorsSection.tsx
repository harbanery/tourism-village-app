"use client";

import { useT } from "@/components/locale/LocaleProvider";
import { dummySponsors } from "@/models";

export function SponsorsSection() {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
        {t("home.sponsors.title")}
      </h2>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
        {dummySponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#141416] p-4 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sponsor.filename}
              alt={sponsor.name}
              className="mx-auto h-10 object-contain grayscale opacity-70"
            />
            <p className="mt-2 text-xs font-medium">{sponsor.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
