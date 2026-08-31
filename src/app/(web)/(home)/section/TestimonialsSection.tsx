"use client";

import { Card, Col, Rate, Row } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyTestimonials } from "@/models";

export function TestimonialsSection() {
  const { t } = useT();
  const activeTestimonials = dummyTestimonials.filter((r) => r.active === "yes");

  return (
    <section className="bg-white dark:bg-[#141416] py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.testimonials.title")}</h2>
        <p className="mt-1 text-foreground/60">{t("home.testimonials.subtitle")}</p>
        <Row gutter={[16, 16]} className="mt-6">
          {activeTestimonials.map((review) => (
            <Col xs={24} md={8} key={review.id}>
              <Card>
                <Rate disabled defaultValue={review.rating} />
                <p className="mt-3 text-foreground/80">&ldquo;{review.comment}&rdquo;</p>
                <p className="mt-4 font-medium">— {review.userName}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
