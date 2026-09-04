"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Col, Input, Row, Select } from "antd";
import { FireOutlined, SearchOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, writeCart } from "@/helpers/cart";
import {
  PackageCard,
  PackageListSection,
  type CartItem,
  type WebPackage,
} from "./PackageListSection";
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
                ? {
                    packageId: pkg.id,
                    name: pkg.name,
                    price: pkg.price,
                    quantity: row.quantity,
                  }
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
    writeCart(
      cart.map((item) => ({
        packageId: item.packageId,
        quantity: item.quantity,
      })),
    );
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

  /**
   * Paket yang paling sering dibeli USER INI sendiri (maks 2, order PAID).
   * Section hanya tampil bila user punya riwayat pembelian — user yang
   * belum pernah memesan tidak melihat "sering dibeli" sama sekali.
   */
  const popularPackages = useMemo(
    () =>
      [...packages]
        .filter((pkg) => pkg.userTimesPurchased > 0)
        .sort((a, b) => b.userTimesPurchased - a.userTimesPurchased)
        .slice(0, 2),
    [packages],
  );

  /**
   * Bagian "sering dibeli" hanya relevan saat menjelajah tanpa filter —
   * saat mencari/menyaring, user fokus pada hasilnya.
   */
  const showPopular =
    popularPackages.length > 0 && !search.trim() && !placeFilter;

  /** ID paket populer — dikeluarkan dari daftar "paket lainnya". */
  const popularIds = useMemo(
    () => new Set(popularPackages.map((pkg) => pkg.id)),
    [popularPackages],
  );

  /** Daftar paket lainnya: hasil filter dikurangi bagian populer. */
  const otherPackages = useMemo(
    () =>
      showPopular
        ? filteredPackages.filter((pkg) => !popularIds.has(pkg.id))
        : filteredPackages,
    [filteredPackages, popularIds, showPopular],
  );

  /** Tambah 1 paket ke keranjang (kuantitas diatur lewat stepper keranjang). */
  const addToCart = (pkg: WebPackage) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.packageId === pkg.id);
      if (existing) {
        return prev.map((c) =>
          c.packageId === pkg.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        { packageId: pkg.id, name: pkg.name, price: pkg.price, quantity: 1 },
      ];
    });
  };

  const goCheckout = () => {
    // Pastikan keranjang terbaru tersimpan sebelum pindah ke checkout.
    writeCart(
      cart.map((item) => ({
        packageId: item.packageId,
        quantity: item.quantity,
      })),
    );
    router.push("/checkout");
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">
        {t("home.packages.title")}
      </h1>

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
          className="sm:w-44!"
          placeholder={t("package.filterPlace")}
          allowClear
          showSearch
          options={placeOptions}
          value={placeFilter}
          onChange={setPlaceFilter}
        />
        <Select
          className="sm:w-42!"
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
            {/* Paket sering dibeli — kartu bergaya sama dengan daftar utama. */}
            {showPopular && (
              <section className="mb-8!">
                <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold">
                  <FireOutlined className="text-orange-500" />
                  {t("package.frequentlyBought")}
                </h2>
                <Row gutter={[16, 16]}>
                  {popularPackages.map((pkg) => (
                    <Col xs={24} sm={12} key={pkg.id}>
                      <PackageCard pkg={pkg} onAdd={() => addToCart(pkg)} />
                    </Col>
                  ))}
                </Row>
              </section>
            )}
            {/* Paket lainnya: di luar daftar sering dibeli. */}
            {(!showPopular || otherPackages.length > 0) && (
              <>
                {showPopular && (
                  <h2 className="mb-3 text-lg font-semibold">
                    {t("package.otherPackages")}
                  </h2>
                )}
                <PackageListSection
                  packages={otherPackages}
                  onAdd={addToCart}
                />
              </>
            )}
          </Col>
          <Col xs={24} lg={8}>
            <CartSection
              cart={cart}
              total={total}
              onChangeQuantity={(packageId, quantity) =>
                setCart((prev) =>
                  quantity <= 0
                    ? prev.filter((c) => c.packageId !== packageId)
                    : prev.map((c) =>
                        c.packageId === packageId ? { ...c, quantity } : c,
                      ),
                )
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
