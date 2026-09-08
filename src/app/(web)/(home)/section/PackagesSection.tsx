"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Col, Row } from "antd";
import { ArrowRightOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { readCart, writeCart } from "@/helpers/cart";
import { formatRupiah } from "@/utils/format";

/** Paket live dari /api/web/packages (kelola admin). */
interface WebPackage {
  id: string;
  name: string;
  placeName: string | null;
  facilities: string[];
  price: number;
}

export function PackagesSection() {
  const { t } = useT();
  const router = useRouter();
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/web/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPackages);
  }, [fetchPackages]);

  /**
   * "Pesan Sekarang": paket langsung masuk keranjang lalu dibawa ke
   * halaman paket — keranjang di sidebar sudah berisi paket ini (bukan
   * langsung ke checkout). Belum login → proxy mengarahkan ke login
   * lebih dahulu; keranjang tersimpan di sessionStorage tetap ada
   * setelah login kembali.
   */
  const handleOrder = (pkg: WebPackage) => {
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
          {loading
            ? [1, 2, 3].map((key) => (
                <Col xs={24} sm={12} md={8} key={key} className="h-full!">
                  <Card loading className="h-full!" />
                </Col>
              ))
            : packages.slice(0, 3).map((pkg) => (
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
