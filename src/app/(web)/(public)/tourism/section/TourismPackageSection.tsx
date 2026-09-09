"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { Anchor, Card, Col, Empty, Row, Tag } from "antd";
import {
  CheckCircleFilled,
  EnvironmentOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { displayImage } from "@/utils/image";
import type { PlaceWithPackages } from "@/services/placeService";

/**
 * Halaman wisata: penjelasan tiap tempat wisata (foto + deskripsi dari
 * admin) diikuti paket-paketnya. Setiap tempat punya anchor
 * (#place-{id}) — navigasi Anchor kanan memantau tempat aktif saat
 * scroll, dan kartu wisata populer di home langsung membuka anchor
 * tempat terpilih. Data diterima via props dari server page (SSR),
 * sehingga konten sudah termuat saat render — scroll ke hash cukup
 * dijalankan sekali saat mount + saat hash berubah.
 */
export function TourismPackageSection({
  places,
}: {
  places: PlaceWithPackages[];
}) {
  const { t } = useT();

  /**
   * Kartu popular di home membuka /tourism#place-{id}. Karena konten
   * sudah dirender server-side, elemen anchor pasti ada saat halaman
   * ini dimuat — cukup scroll saat mount dan saat hash berubah
   * (menutupi navigasi client maupun load langsung).
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
    scrollToHash();
  }, [scrollToHash]);

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
          {places.length === 0 ? (
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
                    (() => {
                      // Cover Cloudinary dioptimasi CDN (f_auto,q_auto,w_1000).
                      const { src, unoptimized } = displayImage(
                        place.photo,
                        1000,
                      );
                      return (
                        <Image
                          src={src}
                          alt={place.name}
                          width={1000}
                          height={600}
                          unoptimized={unoptimized}
                          sizes="(max-width: 1024px) 100vw, 70vw"
                          className="h-52 w-full object-cover md:h-64"
                        />
                      );
                    })()
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
