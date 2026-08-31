"use client";

import { Card, Col, Row } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export function WhySection() {
  const { t } = useT();

  return (
    <section className="bg-white dark:bg-[#141416] py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl md:text-3xl font-bold">{t("home.why.title")}</h2>
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} md={12}>
            <Card>
              <h3 className="font-semibold text-lg">{t("home.why.facility.title")}</h3>
              <p className="mt-2 text-foreground/70">{t("home.why.facility.desc")}</p>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <h3 className="font-semibold text-lg">{t("home.why.service.title")}</h3>
              <p className="mt-2 text-foreground/70">{t("home.why.service.desc")}</p>
            </Card>
          </Col>
        </Row>
      </div>
    </section>
  );
}
