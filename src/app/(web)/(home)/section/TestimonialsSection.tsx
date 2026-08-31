"use client";

import { Card, Carousel, Rate } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyTestimonials, type Testimonial } from "@/models";

const REVIEWS_PER_SLIDE = 3;

function ReviewCard({ review }: { review: Testimonial }) {
  return (
    <Card className="h-full">
      <Rate disabled defaultValue={review.rating} />
      <p className="mt-3 text-foreground/80">&ldquo;{review.comment}&rdquo;</p>
      <p className="mt-4 font-medium">— {review.userName}</p>
    </Card>
  );
}

export function TestimonialsSection() {
  const { t } = useT();
  const activeTestimonials = dummyTestimonials.filter((r) => r.active === "yes");

  const slides =
    activeTestimonials.length > REVIEWS_PER_SLIDE
      ? Array.from(
          { length: Math.ceil(activeTestimonials.length / REVIEWS_PER_SLIDE) },
          (_, i) =>
            activeTestimonials.slice(
              i * REVIEWS_PER_SLIDE,
              (i + 1) * REVIEWS_PER_SLIDE,
            ),
        )
      : [activeTestimonials];

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

        {activeTestimonials.length > REVIEWS_PER_SLIDE ? (
          /* CSS grid di dalam slide (bukan Row/Col) agar tidak ada margin
             negatif gutter yang bocor keluar container slick. */
          <Carousel autoplay dots className="mt-8">
            {slides.map((slide, slideIndex) => (
              <div key={slideIndex} className="pb-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {slide.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            ))}
          </Carousel>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {activeTestimonials.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
