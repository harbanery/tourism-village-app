"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Col, Row, App } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, writeCart } from "@/helpers/cart";
import { PackageListSection, type CartItem, type WebPackage } from "./PackageListSection";
import { CartSection } from "./CartSection";

/** Konten halaman paket wisata — data live dari DB (kelola admin). */
export default function PackageClientSection() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { notification } = App.useApp();

  const [fetching, setFetching] = useState(true);
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  /** true setelah keranjang dihidrasi dari sessionStorage — mencegah
      effect persist menimpa keranjang tersimpan dengan array kosong. */
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    try {
      const packagesRes = await fetch("/api/web/packages");
      const packagesJson = await packagesRes.json();
      if (packagesJson.success) {
        const list: WebPackage[] = packagesJson.data;
        setPackages(list);

        // Hidrasi keranjang dari sessionStorage: item yang dipilih sebelum
        // pindah ke checkout tetap ada saat kembali ke halaman ini.
        const byId = new Map(list.map((pkg) => [pkg.id, pkg]));
        setCart(
          readCart()
            .map((row) => {
              const pkg = byId.get(row.packageId);
              return pkg
                ? { packageId: pkg.id, name: pkg.name, price: pkg.price, quantity: row.quantity }
                : null; // paket sudah tidak ada / nonaktif → buang
            })
            .filter(Boolean) as CartItem[],
        );
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setFetching(false);
      setHydrated(true);
    }
  }, [notification, t]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Persist keranjang setiap perubahan (tambah/hapus/kosongkan) sehingga
  // tetap tersimpan saat user berpindah halaman dan kembali lagi.
  useEffect(() => {
    if (!hydrated) return;
    writeCart(cart.map((item) => ({ packageId: item.packageId, quantity: item.quantity })));
  }, [cart, hydrated]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const addToCart = (pkg: WebPackage) => {
    const quantity = quantities[pkg.id] ?? 1;
    setCart((prev) => {
      const existing = prev.find((c) => c.packageId === pkg.id);
      if (existing) {
        return prev.map((c) =>
          c.packageId === pkg.id ? { ...c, quantity: c.quantity + quantity } : c,
        );
      }
      return [
        ...prev,
        { packageId: pkg.id, name: pkg.name, price: pkg.price, quantity },
      ];
    });
  };

  const goCheckout = () => {
    // Pastikan keranjang terbaru tersimpan sebelum pindah ke checkout.
    writeCart(cart.map((item) => ({ packageId: item.packageId, quantity: item.quantity })));
    router.push("/checkout");
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("home.packages.title")}</h1>
      {fetching ? (
        <p className="mt-6 text-foreground/60">{t("common.loading")}</p>
      ) : (
        <Row gutter={[24, 24]} className="mt-6!">
          <Col xs={24} lg={16}>
            <PackageListSection
              packages={packages}
              quantities={quantities}
              setQuantities={setQuantities}
              onAdd={addToCart}
            />
          </Col>
          <Col xs={24} lg={8}>
            <CartSection
              cart={cart}
              total={total}
              onRemove={(packageId) =>
                setCart((prev) => prev.filter((c) => c.packageId !== packageId))
              }
              onClear={() => setCart([])}
              onCheckout={goCheckout}
            />
          </Col>
        </Row>
      )}
    </div>
  );
}
