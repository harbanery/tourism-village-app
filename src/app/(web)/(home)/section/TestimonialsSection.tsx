"use client";

import { Card, Rate } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyTestimonials } from "@/models";

const MAX_REVIEWS = 3;

export function TestimonialsSection() {
  const { t } = useT();
  const testimonials = dummyTestimonials
    .filter((r) => r.active === "yes")
    .slice(0, MAX_REVIEWS);

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
          {testimonials.map((review) => (
            <Card key={review.id} className="h-full!">
              <Rate disabled defaultValue={review.rating} />
              <p className="mt-3 text-foreground/80">
                &ldquo;{review.comment}&rdquo;
              </p>
              <p className="mt-4 font-medium">— {review.userName}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
