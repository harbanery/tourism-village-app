"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, Card, Col, Row } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  EnvironmentFilled,
  StarFilled,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { readCart, writeCart } from "@/features/web/utils/cart";
import { Reveal } from "@/features/web/components/ui/reveal";
import { formatRupiah } from "@/utils/helpers";
import type { ActivePackage } from "@/services/package";

/**
 * "Pesan Sekarang": paket langsung masuk keranjang lalu dibawa ke
 * halaman paket — keranjang di sidebar sudah berisi paket ini (bukan
 * langsung ke checkout). Belum login → proxy mengarahkan ke login
 * lebih dahulu; keranjang tersimpan di sessionStorage tetap ada
 * setelah login kembali.
 */
function useOrderPackage() {
  const router = useRouter();

  return (pkg: ActivePackage) => {
    const cart = readCart();
    const existing = cart.find((item) => item.packageId === pkg.id);
    writeCart(
      existing
        ? cart.map((item) =>
            item.packageId === pkg.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...cart, { packageId: pkg.id, quantity: 1 }],
    );
    router.push("/package");
  };
}

/**
 * Paket unggulan di home — data diterima via props dari server page
 * (SSR) sehingga kartu langsung termuat saat render; interaksi pesan
 * tetap client-side (keranjang sessionStorage + navigasi router).
 */
export function PackagesSection({ packages }: { packages: ActivePackage[] }) {
  const { t } = useT();
  const router = useRouter();
  const handleOrder = useOrderPackage();

  return (
    <section id="packages" className="bg-white dark:bg-[#1a1831] rounded-t-4xl">
      <div className="flex min-h-screen items-center bg-primary rounded-4xl">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {t("home.packages.title")}
            </h2>
            <p className="mt-1 text-white/70">{t("home.packages.subtitle")}</p>
          </Reveal>

          <Reveal delay={150} className="mt-8!">
            <Row gutter={[16, 16]}>
              {packages.slice(0, 3).map((pkg) => {
                // Kartu flex-col: daftar fasilitas yang beda jumlah tetap
                // menghasilkan tinggi kartu sama, dengan CTA terpacu di dasar.
                const card = (
                  <Card
                    title={
                      <span className="font-semibold! text-white!">
                        {pkg.name}
                      </span>
                    }
                    className="flex! h-full! flex-col! border-white! bg-primary!"
                    styles={{
                      header: {
                        borderBottomColor: "rgba(255,255,255,0.25)",
                      },
                      body: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      },
                    }}
                  >
                    {/* Urutan body: lokasi (kiri + icon) → fasilitas → harga (tengah). */}
                    {pkg.placeName && (
                      <div className="flex items-center justify-start gap-2 text-white/85">
                        <EnvironmentFilled className="text-sm!" />
                        <span>{pkg.placeName}</span>
                      </div>
                    )}
                    {/* Maksimal 4 fasilitas: tiap item min-height satu baris
                  sehingga tinggi daftar seragam antar card. */}
                    <ul className="mt-4 flex-1 space-y-2">
                      {pkg.facilities
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((f) => (
                          <li
                            key={f}
                            className="flex min-h-6 items-start gap-2 text-sm text-white/85"
                          >
                            <CheckCircleFilled className="mt-0.5 text-white" />
                            {f}
                          </li>
                        ))}
                    </ul>
                    <div className="mt-4 text-center text-3xl font-bold text-white">
                      {formatRupiah(pkg.price)}
                      <span className="text-sm font-normal text-white/70">
                        {t("common.perPerson")}
                      </span>
                    </div>
                    {/* CTA: bg primary (menyatu dengan card) + border putih;
                    hover/focus sedikit lebih gelap dari primary (bukan
                    secondary). */}
                    <Button
                      type="primary"
                      block
                      className="mt-6! border-white! hover:border-white! focus:border-white!"
                      onClick={() => handleOrder(pkg)}
                    >
                      {t("home.packages.cta")}
                    </Button>
                  </Card>
                );

                return (
                  <Col xs={24} sm={12} md={8} key={pkg.id} className="h-full!">
                    {/* Badge ribbon "Populer" (gold + icon bintang, dari
                    timesPurchased > 0) menempel di pojok kanan atas kartu;
                    tidak populer → kartu polos tanpa ribbon. */}
                    {pkg.timesPurchased > 0 ? (
                      <Badge.Ribbon
                        text={
                          <span className="inline-flex items-center gap-1">
                            <StarFilled />
                            {t("package.popularTag")}
                          </span>
                        }
                        color="gold"
                      >
                        {card}
                      </Badge.Ribbon>
                    ) : (
                      card
                    )}
                  </Col>
                );
              })}
            </Row>
          </Reveal>

          {/* Lihat lainnya → halaman lengkap paket (icon di sebelah kanan);
            tombol primary + border putih; hover/focus lebih gelap
            (selaras dengan CTA "Pesan Sekarang"). */}
          <Reveal delay={300} className="mt-8 text-center">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              className="border-white! hover:border-white! focus:border-white!"
              onClick={() => router.push("/package")}
            >
              {t("home.packages.viewMore")}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
