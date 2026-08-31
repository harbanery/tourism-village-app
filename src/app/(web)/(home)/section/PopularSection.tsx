"use client";

import { Card, Carousel, Col, Empty, Row } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPlaces, type Place } from "@/models";

const PLACES_PER_SLIDE = 3;

function PlaceCard({ place }: { place: Place }) {
  return (
    <Col xs={24} sm={12} md={8} key={place.id} className="h-full">
      <Card
        hoverable
        className="h-full"
        cover={
          place.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={place.name}
              src={place.photo}
              className="h-48 w-full object-cover"
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} className="grid h-48 place-items-center" />
          )
        }
      >
        <Card.Meta
          avatar={<EnvironmentOutlined className="text-xl text-primary" />}
          title={place.name}
          description="Indonesia"
        />
      </Card>
    </Col>
  );
}

export function PopularSection() {
  const { t } = useT();
  const activePlaces = dummyPlaces.filter((p) => p.active === "yes");

  const slides =
    activePlaces.length > PLACES_PER_SLIDE
      ? Array.from(
          { length: Math.ceil(activePlaces.length / PLACES_PER_SLIDE) },
          (_, i) =>
            activePlaces.slice(i * PLACES_PER_SLIDE, (i + 1) * PLACES_PER_SLIDE),
        )
      : [activePlaces];

  return (
    <section className="flex min-h-screen items-center bg-white dark:bg-[#141416]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("home.popular.title")}
          </h2>
          <p className="mt-1 text-foreground/60">
            {t("home.popular.subtitle")}
          </p>
        </div>

        {activePlaces.length > PLACES_PER_SLIDE ? (
          <Carousel autoplay dots className="mt-8">
            {slides.map((slide, slideIndex) => (
              <div key={slideIndex} className="pb-2">
                <Row gutter={[16, 16]}>
                  {slide.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </Row>
              </div>
            ))}
          </Carousel>
        ) : (
          <Row gutter={[16, 16]} className="mt-8">
            {activePlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </Row>
        )}
      </div>
    </section>
  );
}
