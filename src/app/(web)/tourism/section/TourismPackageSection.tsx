"use client";

import { useCallback, useEffect, useState } from "react";
import { Anchor, Card, Col, Empty, Row, Tag } from "antd";
import {
  CheckCircleFilled,
  EnvironmentOutlined,
  ShopOutlined,
} from "@ant-design/icons";
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
 * admin) diikuti paket-paketnya. Setiap tempat punya anchor
 * (#place-{id}) — navigasi Anchor kanan memantau tempat aktif saat
 * scroll, dan kartu wisata populer di home langsung membuka anchor
 * tempat terpilih (scroll dijalankan ulang setelah data termuat
 * karena konten dirender client-side).
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

  /**
   * Kartu popular di home membuka /tourism#place-{id}. Elemen anchor
   * baru ada setelah fetch selesai, jadi scroll ke hash dijalankan
   * ulang di sini (menutupi navigasi client maupun load langsung).
   */
  const scrollToHash = useCallback(() => {
    const { hash } = window.location;
    if (!hash.startsWith("#place-")) return;
    requestAnimationFrame(() => {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    scrollToHash();
  }, [loading, places, scrollToHash]);

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [scrollToHash]);

  /** Item navigasi Anchor — satu per tempat wisata (nama tempat). */
  const anchorItems = places.map((place) => ({
    key: place.id,
    href: `#place-${place.id}`,
    title: place.name,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_180px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("tourism.title")}</h1>
        <p className="mt-1 text-foreground/60">{t("tourism.subtitle")}</p>

        <div className="mt-8 space-y-10">
          {loading ? (
            [1, 2].map((key) => (
              <Card key={key} loading className="min-h-64!">
                <span className="sr-only">{t("common.loading")}</span>
              </Card>
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
              <section
                key={place.id}
                id={`place-${place.id}`}
                className="scroll-mt-24"
              >
                {/* Kartu tempat wisata: foto cover lebar penuh, lalu
                    nama + jumlah paket + deskripsi admin di body. */}
                <Card
                  className="overflow-hidden!"
                  styles={{ body: { padding: 0 } }}
                >
                  {place.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={place.name}
                      src={place.photo}
                      className="h-52 w-full object-cover md:h-64"
                    />
                  ) : (
                    <div className="grid h-52 w-full place-items-center bg-black/5 dark:bg-white/10 md:h-64">
                      <EnvironmentOutlined className="text-4xl! text-primary!" />
                    </div>
                  )}
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xl font-semibold">{place.name}</h2>
                      {place.packages.length > 0 && (
                        <Tag className="m-0!">
                          {t("tourism.packageCountInline", {
                            n: place.packages.length,
                          })}
                        </Tag>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                      {place.description || t("tourism.noDescription")}
                    </p>

                    {/* Paket-paket tempat ini: kartu border ringan,
                        nama + harga di kepala, fasilitas checklist. */}
                    {place.packages.length > 0 && (
                      <Row gutter={[16, 16]} className="mt-5!">
                        {place.packages.map((pkg) => (
                          <Col xs={24} md={12} key={pkg.id}>
                            <div className="flex h-full flex-col gap-4 rounded-xl border border-black/10 p-5 dark:border-white/15">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="flex items-center gap-2 font-semibold">
                                  <ShopOutlined className="text-primary!" />
                                  {pkg.name}
                                </span>
                                <span className="font-semibold text-primary">
                                  {t("tourism.pricePerPerson", {
                                    price: pkg.price.toLocaleString("id-ID"),
                                  })}
                                </span>
                              </div>
                              {pkg.facilities.filter(Boolean).length > 0 && (
                                <ul className="space-y-1.5">
                                  {pkg.facilities
                                    .filter(Boolean)
                                    .map((facility) => (
                                      <li
                                        key={facility}
                                        className="flex items-start gap-2 text-sm text-foreground/80"
                                      >
                                        <CheckCircleFilled className="mt-0.5 text-primary" />
                                        {facility}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                </Card>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Navigasi anchor nama tempat — sticky, ikut menandai tempat
          aktif saat halaman di-scroll. */}
      {anchorItems.length > 0 && (
        <aside className="hidden lg:block">
          <Anchor offsetTop={88} items={anchorItems} />
        </aside>
      )}
    </div>
  );
}
