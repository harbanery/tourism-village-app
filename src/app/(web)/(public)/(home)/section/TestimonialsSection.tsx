"use client";

import { Card, Empty, Rate } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import type { PublishedReview } from "@/services/reviewService";

const MAX_REVIEWS = 3;

/**
 * Ulasan pengunjung di home — data diterima via props dari server page
 * (SSR) sehingga kartu langsung termuat saat render; tidak ada
 * fetching di section.
 */
export function TestimonialsSection({
  reviews,
}: {
  reviews: PublishedReview[];
}) {
  const { t } = useT();

  const testimonials = reviews.slice(0, MAX_REVIEWS);

  return (
    <section className="flex items-center bg-white dark:bg-[#141416]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("home.testimonials.title")}
          </h2>
          <p className="mt-1 text-foreground/60">
            {t("home.testimonials.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {testimonials.length === 0 ? (
            <div className="md:col-span-3">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("home.testimonials.empty")}
                className="py-10!"
              />
            </div>
          ) : (
            testimonials.map((review) => (
              <Card key={review.id} className="h-full!">
                <Rate disabled defaultValue={review.rating} />
                <p className="mt-3 text-foreground/80">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <p className="mt-4 font-medium">— {review.userName ?? "-"}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
