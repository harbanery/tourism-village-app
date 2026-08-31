"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { Button, Card, Col, InputNumber, Popconfirm, Row } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages, dummyPlaces } from "@/models";
import { formatRupiah } from "@/utils/format";

interface CartItem {
  packageId: number;
  name: string;
  price: number;
  quantity: number;
}

export default function PaketDetailPage() {
  const { t } = useT();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);

  const mounted = useMounted();
  if (!mounted) return null;

  const activePlaceIds = new Set(dummyPlaces.filter((p) => p.active === "yes").map((p) => p.id));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (pkg: (typeof dummyPackages)[number]) => {
    const quantity = quantities[pkg.id] ?? 1;
    setCart((prev) => {
      const existing = prev.find((c) => c.packageId === pkg.id);
      if (existing) {
        return prev.map((c) =>
          c.packageId === pkg.id ? { ...c, quantity: c.quantity + quantity } : c,
        );
      }
      return [...prev, { packageId: pkg.id, name: pkg.name, price: pkg.price, quantity }];
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("home.packages.title")}</h1>
      <Row gutter={[24, 24]} className="mt-6">
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {dummyPackages.map((pkg) => {
              const disabled = pkg.placeId != null && !activePlaceIds.has(pkg.placeId);
              return (
                <Col xs={24} sm={12} key={pkg.id}>
                  <Card
                    title={pkg.name}
                    extra={<span className="text-xs text-foreground/50">{pkg.placeName}</span>}
                  >
                    <div className="text-2xl font-bold text-[#0d7a5f]">
                      {formatRupiah(pkg.price)}
                      <span className="text-sm font-normal text-foreground/60">
                        {t("common.perPerson")}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {pkg.facilities.filter(Boolean).map((f) => (
                        <li key={f} className="text-sm text-foreground/80">✓ {f}</li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center gap-2">
                      <InputNumber
                        min={1}
                        value={quantities[pkg.id] ?? 1}
                        onChange={(value) =>
                          setQuantities((prev) => ({ ...prev, [pkg.id]: value ?? 1 }))
                        }
                        aria-label={t("cart.quantity")}
                      />
                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        disabled={disabled}
                        onClick={() => addToCart(pkg)}
                      >
                        {t("cart.order")}
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t("cart.title")}>
            {cart.length === 0 ? (
              <p className="text-foreground/60">{t("cart.empty")}</p>
            ) : (
              <>
                <div className="divide-y divide-black/5 dark:divide-white/10">
                  {cart.map((item) => (
                    <div key={item.packageId} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-foreground/60">
                          {formatRupiah(item.price)} × {item.quantity} ={" "}
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                      </div>
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        aria-label={t("common.delete")}
                        onClick={() =>
                          setCart((prev) => prev.filter((c) => c.packageId !== item.packageId))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between font-semibold">
                  <span>{t("cart.totalPrice")}</span>
                  <span className="text-[#0d7a5f]">{formatRupiah(total)}</span>
                </div>
                <Popconfirm
                  title={t("cart.clearAll")}
                  onConfirm={() => setCart([])}
                  okText={t("common.yes")}
                  cancelText={t("common.no")}
                >
                  <Button danger block className="mt-4">
                    {t("cart.clearAll")}
                  </Button>
                </Popconfirm>
                <Button
                  type="primary"
                  block
                  className="mt-2"
                  disabled={cart.length === 0}
                  onClick={() => router.push("/check-out/1")}
                >
                  {t("cart.checkout")}
                </Button>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
