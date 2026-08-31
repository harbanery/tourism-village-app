"use client";

import { Card, Col, Row } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPlaces } from "@/models";

export function PopularSection() {
  const { t } = useT();
  const activePlaces = dummyPlaces.filter((p) => p.active === "yes");

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold">{t("home.popular.title")}</h2>
      <p className="mt-1 text-foreground/60">{t("home.popular.subtitle")}</p>
      <Row gutter={[16, 16]} className="mt-6">
        {activePlaces.map((place) => (
          <Col xs={24} sm={12} md={8} key={place.id}>
            <Card
              hoverable
              cover={
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={place.name}
                  src={place.photo ?? ""}
                  className="h-48 w-full object-cover"
                />
              }
            >
              <Card.Meta
                avatar={<EnvironmentOutlined className="text-xl text-[#0d7a5f]" />}
                title={place.name}
                description="Bogor, Jawa Barat"
              />
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
}
