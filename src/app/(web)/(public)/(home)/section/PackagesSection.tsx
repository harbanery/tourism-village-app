"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Col, Row } from "antd";
import { ArrowRightOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { readCart, writeCart } from "@/features/web/utils/cart";
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
    <section
      id="packages"
      className="flex min-h-screen items-center bg-white dark:bg-[#141416]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("home.packages.title")}
          </h2>
          <p className="mt-1 text-foreground/60">
            {t("home.packages.subtitle")}
          </p>
        </div>

        <Row gutter={[16, 16]} className="mt-8!">
          {packages.slice(0, 3).map((pkg) => (
            <Col xs={24} sm={12} md={8} key={pkg.id} className="h-full!">
              {/* Kartu flex-col: daftar fasilitas yang beda jumlah tetap
                menghasilkan tinggi kartu sama, dengan CTA terpacu di dasar. */}
              <Card
                title={pkg.name}
                extra={
                  <span className="text-foreground/60 text-sm">
                    {pkg.placeName ?? "-"}
                  </span>
                }
                className="flex! h-full! flex-col!"
                styles={{
                  body: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
              >
                <div className="text-3xl font-bold text-primary">
                  {formatRupiah(pkg.price)}
                  <span className="text-sm font-normal text-foreground/60">
                    {t("common.perPerson")}
                  </span>
                </div>
                {/* Maksimal 4 fasilitas: tiap item min-height satu baris
                  sehingga tinggi daftar seragam antar card. */}
                <ul className="mt-4 flex-1 space-y-2">
                  {pkg.facilities
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((f) => (
                      <li
                        key={f}
                        className="flex min-h-6 items-start gap-2 text-sm text-foreground/80"
                      >
                        <CheckCircleFilled className="mt-0.5 text-primary" />
                        {f}
                      </li>
                    ))}
                </ul>
                <Button
                  type="primary"
                  block
                  className="mt-6!"
                  onClick={() => handleOrder(pkg)}
                >
                  {t("home.packages.cta")}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Lihat lainnya → halaman lengkap paket (icon di sebelah kanan). */}
        <div className="mt-8 text-center">
          <Button
            size="large"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            onClick={() => router.push("/package")}
          >
            {t("home.packages.viewMore")}
          </Button>
        </div>
      </div>
    </section>
  );
}
