"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Col, Input, Row, Select, App, Button, Tag } from "antd";
import { FireOutlined, SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, writeCart } from "@/helpers/cart";
import { formatRupiah } from "@/utils/format";
import { PackageListSection, type CartItem, type WebPackage } from "./PackageListSection";
import { CartSection } from "./CartSection";

/** Opsi urutan daftar paket. */
type SortKey = "default" | "popular" | "price-asc" | "price-desc";

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
  /** Pencarian & filter daftar paket. */
  const [search, setSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string | undefined>();
  const [sortKey, setSortKey] = useState<SortKey>("default");
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

  /** Daftar tempat unik untuk opsi filter. */
  const placeOptions = useMemo(() => {
    const names = Array.from(
      new Set(packages.map((pkg) => pkg.placeName).filter(Boolean)),
    ) as string[];
    return names.map((name) => ({ value: name, label: name }));
  }, [packages]);

  /** Paket tersaring: pencarian nama/fasilitas + filter tempat + urutan. */
  const filteredPackages = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = packages.filter((pkg) => {
      const matchKeyword =
        !keyword ||
        pkg.name.toLowerCase().includes(keyword) ||
        pkg.placeName?.toLowerCase().includes(keyword) ||
        pkg.facilities.some((f) => f.toLowerCase().includes(keyword));
      const matchPlace = !placeFilter || pkg.placeName === placeFilter;
      return matchKeyword && matchPlace;
    });
    switch (sortKey) {
      case "popular":
        return [...list].sort((a, b) => b.timesPurchased - a.timesPurchased);
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      default:
        return list;
    }
  }, [packages, search, placeFilter, sortKey]);

  /** Paket yang paling sering dibeli user (top 3, berdasarkan order PAID). */
  const popularPackages = useMemo(
    () =>
      [...packages]
        .filter((pkg) => pkg.timesPurchased > 0)
        .sort((a, b) => b.timesPurchased - a.timesPurchased)
        .slice(0, 3),
    [packages],
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

      {/* Pencarian & filter paket. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-foreground/40" />}
          placeholder={t("package.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t("common.search")}
        />
        <Select
          className="sm:w-48!"
          placeholder={t("package.filterPlace")}
          allowClear
          showSearch
          options={placeOptions}
          value={placeFilter}
          onChange={setPlaceFilter}
        />
        <Select
          className="sm:w-44!"
          value={sortKey}
          onChange={setSortKey}
          options={[
            { value: "default", label: t("package.sort.default") },
            { value: "popular", label: t("package.sort.popular") },
            { value: "price-asc", label: t("package.sort.priceAsc") },
            { value: "price-desc", label: t("package.sort.priceDesc") },
          ]}
        />
      </div>

      {fetching ? (
        <p className="mt-6 text-foreground/60">{t("common.loading")}</p>
      ) : (
        <Row gutter={[24, 24]} className="mt-6!">
          <Col xs={24} lg={16}>
            {/* Paket yang sering dibeli user (top 3). */}
            {popularPackages.length > 0 && (
              <Card
                size="small"
                className="mb-6!"
                title={
                  <span className="inline-flex items-center gap-2">
                    <FireOutlined className="text-orange-500" />
                    {t("package.frequentlyBought")}
                  </span>
                }
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {popularPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-lg border border-black/10 p-3 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{pkg.name}</p>
                        <Tag color="orange" className="m-0!">
                          ×{pkg.timesPurchased}
                        </Tag>
                      </div>
                      <p className="mt-1 text-sm text-primary">
                        {formatRupiah(pkg.price)}
                        <span className="text-xs font-normal text-foreground/60">
                          {t("common.perPerson")}
                        </span>
                      </p>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        block
                        className="mt-2!"
                        icon={<ShoppingCartOutlined />}
                        onClick={() => addToCart(pkg)}
                      >
                        {t("cart.order")}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <PackageListSection
              packages={filteredPackages}
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
