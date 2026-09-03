"use client";

import { useMounted } from "@/helpers/useMounted";
import { Button, Card, Col, Empty, InputNumber, Row } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatRupiah } from "@/utils/format";

/** Paket aktif dari DB (/api/web/packages, kelola di panel admin). */
export interface WebPackage {
  id: number;
  name: string;
  placeId: number | null;
  placeName: string | null;
  facilities: string[];
  price: number;
}

export interface CartItem {
  packageId: number;
  name: string;
  price: number;
  quantity: number;
}

export function PackageListSection({
  packages,
  quantities,
  setQuantities,
  onAdd,
}: {
  packages: WebPackage[];
  quantities: Record<number, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onAdd: (pkg: WebPackage) => void;
}) {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  if (packages.length === 0) {
    return (
      <Card>
        <Empty description={t("common.dummyDataNote")} className="py-8!" />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {packages.map((pkg) => (
        <Col xs={24} sm={12} key={pkg.id}>
          <Card
            title={pkg.name}
            extra={
              <span className="text-xs text-foreground/50">{pkg.placeName ?? "-"}</span>
            }
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
                onClick={() => onAdd(pkg)}
              >
                {t("cart.order")}
              </Button>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
