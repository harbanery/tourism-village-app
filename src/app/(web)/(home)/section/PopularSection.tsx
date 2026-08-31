"use client";

import { Card, Empty } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPlaces, type Place } from "@/models";

const MAX_PLACES = 3;

function PlaceCard({ place }: { place: Place }) {
  return (
    <Card
      hoverable
      className="h-full!"
      cover={
        place.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={place.name}
            src={place.photo}
            className="h-48 w-full object-cover"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={false}
            className="grid! h-48! place-items-center!"
          />
        )
      }
    >
      <Card.Meta
        avatar={<EnvironmentOutlined className="text-xl text-primary" />}
        title={place.name}
        description="Indonesia"
      />
    </Card>
  );
}

export function PopularSection() {
  const { t } = useT();
  const places = dummyPlaces.filter((p) => p.active === "yes").slice(0, MAX_PLACES);

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

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
