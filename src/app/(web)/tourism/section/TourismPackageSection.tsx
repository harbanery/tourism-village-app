"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Col, Empty, Row, Skeleton, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Tempat wisata + paketnya dari /api/web/places (kelola admin). */
interface WebPlace {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  totalPurchased: number;
  packages: {
    id: string;
    name: string;
    facilities: string[];
    price: number;
  }[];
}

/**
 * Halaman wisata: penjelasan tiap tempat wisata (foto + deskripsi dari
 * admin) diikuti paket-paketnya — bukan sekadar daftar paket.
 */
export function TourismPackageSection() {
  const { t } = useT();
  const [places, setPlaces] = useState<WebPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await fetch("/api/web/places");
      const json = await res.json();
      if (json.success) setPlaces(json.data);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPlaces);
  }, [fetchPlaces]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">{t("tourism.title")}</h1>
      <p className="mt-1 text-foreground/60">{t("tourism.subtitle")}</p>

      <div className="mt-8 space-y-12">
        {loading ? (
          [1, 2].map((key) => (
            <div key={key} className="space-y-4">
              <Skeleton.Avatar active size={64} />
              <Skeleton active paragraph={{ rows: 2 }} />
              <Card loading />
            </div>
          ))
        ) : places.length === 0 ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("tourism.noPlaces")}
              className="py-10!"
            />
          </Card>
        ) : (
          places.map((place) => (
            <section key={place.id} className="scroll-mt-24">
              {/* Kepala tempat wisata: foto + nama + deskripsi admin. */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {place.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={place.name}
                    src={place.photo}
                    className="h-24 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
                  />
                ) : (
                  <div className="grid h-24 w-full shrink-0 place-items-center rounded-xl bg-black/5 dark:bg-white/10 sm:h-20 sm:w-32">
                    <EnvironmentOutlined className="text-2xl! text-primary!" />
                  </div>
                )}
                <div>
                  <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
                    {place.name}
                    {place.packages.length > 0 && (
                      <Tag className="m-0!">
                        {t("tourism.packageCountInline", {
                          n: place.packages.length,
                        })}
                      </Tag>
                    )}
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                    {place.description || t("tourism.noDescription")}
                  </p>
                </div>
              </div>

              {/* Paket-paket tempat ini. */}
              {place.packages.length > 0 && (
                <Row gutter={[16, 16]} className="mt-5!">
                  {place.packages.map((pkg) => (
                    <Col xs={24} md={12} key={pkg.id} className="h-full!">
                      <Card title={pkg.name} className="h-full!">
                        <ol className="list-decimal space-y-1 pl-5 text-foreground/80">
                          {pkg.facilities.filter(Boolean).map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ol>
                        <p className="mt-4 font-semibold text-primary">
                          {t("tourism.pricePerPerson", {
                            price: pkg.price.toLocaleString("id-ID"),
                          })}
                        </p>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
