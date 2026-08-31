"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Col, InputNumber, Row } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages, dummyPlaces } from "@/models";
import { formatRupiah } from "@/utils/format";

export interface CartItem {
  packageId: number;
  name: string;
  price: number;
  quantity: number;
}

export function PackageListSection({
  quantities,
  setQuantities,
  onAdd,
}: {
  quantities: Record<number, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onAdd: (pkg: (typeof dummyPackages)[number]) => void;
}) {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const activePlaceIds = new Set(dummyPlaces.filter((p) => p.active === "yes").map((p) => p.id));

  return (
    <Row gutter={[16, 16]}>
      {dummyPackages.map((pkg) => {
        const disabled = pkg.placeId != null && !activePlaceIds.has(pkg.placeId);
        return (
          <Col xs={24} sm={12} key={pkg.id}>
            <Card
              title={pkg.name}
              extra={<span className="text-xs text-foreground/50">{pkg.placeName}</span>}
            >
              <div className="text-2xl font-bold text-primary">
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
                  onClick={() => onAdd(pkg)}
                >
                  {t("cart.order")}
                </Button>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
