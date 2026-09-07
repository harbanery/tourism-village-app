"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Empty, Rate, Skeleton } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

const MAX_REVIEWS = 3;

/** Ulasan publik aktif dari /api/web/reviews (dimoderasi admin). */
interface WebReview {
  id: string;
  rating: number;
  comment: string;
  userName: string | null;
}

export function TestimonialsSection() {
  const { t } = useT();
  const [reviews, setReviews] = useState<WebReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/web/reviews");
      const json = await res.json();
      if (json.success) setReviews(json.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchReviews);
  }, [fetchReviews]);

  const testimonials = reviews.slice(0, MAX_REVIEWS);

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {t("home.testimonials.title")}
          </h2>
          <p className="mt-1 text-white/80 drop-shadow">
            {t("home.testimonials.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {loading ? (
            [1, 2, 3].map((key) => (
              <Card key={key} className="h-full!">
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ))
          ) : testimonials.length === 0 ? (
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
