"use client";

import { Card, Carousel, Col, Rate, Row } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyTestimonials, type Testimonial } from "@/models";

const REVIEWS_PER_SLIDE = 3;

function ReviewCard({ review }: { review: Testimonial }) {
  return (
    <Col xs={24} md={8} className="h-full">
      <Card className="h-full">
        <Rate disabled defaultValue={review.rating} />
        <p className="mt-3 text-foreground/80">&ldquo;{review.comment}&rdquo;</p>
        <p className="mt-4 font-medium">— {review.userName}</p>
      </Card>
    </Col>
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
          <Carousel autoplay dots className="mt-8">
            {slides.map((slide, slideIndex) => (
              <div key={slideIndex} className="pb-2">
                <Row gutter={[16, 16]}>
                  {slide.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </Row>
              </div>
            ))}
          </Carousel>
        ) : (
          <Row gutter={[16, 16]} className="mt-8">
            {activeTestimonials.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </Row>
        )}
      </div>
    </section>
  );
}
