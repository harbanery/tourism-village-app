"use client";

import { useState } from "react";
import { useMounted } from "@/helpers/useMounted";
import { Col, Row } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages } from "@/models";
import { PackageListSection, type CartItem } from "./section/PackageListSection";
import { CartSection } from "./section/CartSection";

export default function PackagePage() {
  const { t } = useT();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);

  const mounted = useMounted();
  if (!mounted) return null;

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
      <Row gutter={[24, 24]} className="mt-6!">
        <Col xs={24} lg={16}>
          <PackageListSection
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
          />
        </Col>
      </Row>
    </div>
  );
}
