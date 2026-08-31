"use client";

import Link from "next/link";
import { Button, Card, Col, Row } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages } from "@/models";
import { formatRupiah } from "@/utils/format";

export function PackagesSection() {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-bold">{t("home.packages.title")}</h2>
      <p className="mt-1 text-foreground/60">{t("home.packages.subtitle")}</p>
      <Row gutter={[16, 16]} className="mt-6">
        {dummyPackages.map((pkg) => (
          <Col xs={24} sm={12} md={8} key={pkg.id}>
            <Card
              title={pkg.name}
              extra={<span className="text-foreground/60 text-sm">{pkg.placeName}</span>}
            >
              <div className="text-3xl font-bold text-[#0d7a5f]">
                {formatRupiah(pkg.price)}
                <span className="text-sm font-normal text-foreground/60">
                  {t("common.perPerson")}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {pkg.facilities.filter(Boolean).map((f) => (
                  <li key={f} className="text-sm text-foreground/80">
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <Link href="/package-detail">
                <Button type="primary" block className="mt-6">
                  {t("home.packages.cta")}
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  );
}
