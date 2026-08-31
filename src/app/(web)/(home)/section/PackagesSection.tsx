"use client";

import Link from "next/link";
import { Button, Card, Col, Row } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages } from "@/models";
import { formatRupiah } from "@/utils/format";

export function PackagesSection() {
  const { t } = useT();

  return (
    <section className="flex min-h-screen items-center bg-white dark:bg-[#141416]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("home.packages.title")}
          </h2>
          <p className="mt-1 text-foreground/60">
            {t("home.packages.subtitle")}
          </p>
        </div>

        <Row gutter={[16, 16]} className="mt-8">
          {dummyPackages.map((pkg) => (
            <Col xs={24} sm={12} md={8} key={pkg.id} className="h-full">
              {/* Kartu flex-col: daftar fasilitas yang beda jumlah tetap
                  menghasilkan tinggi kartu sama, dengan CTA terpacu di dasar. */}
              <Card
                title={pkg.name}
                extra={
                  <span className="text-foreground/60 text-sm">
                    {pkg.placeName}
                  </span>
                }
                className="flex! h-full! flex-col!"
                styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
              >
                <div className="text-3xl font-bold text-primary">
                  {formatRupiah(pkg.price)}
                  <span className="text-sm font-normal text-foreground/60">
                    {t("common.perPerson")}
                  </span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {pkg.facilities.filter(Boolean).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                      <CheckCircleFilled className="mt-0.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/package" className="mt-6 block">
                  <Button type="primary" block>
                    {t("home.packages.cta")}
                  </Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
