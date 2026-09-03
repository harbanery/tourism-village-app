"use client";

import { useMounted } from "@/helpers/useMounted";
import { Button, Card, Col, Empty, Row, Tag } from "antd";
import {
  CheckCircleFilled,
  FireOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
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
  /** Berapa kali paket ini berhasil dibayar (PAID). */
  timesPurchased: number;
}

export interface CartItem {
  packageId: number;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Kartu paket — satu gaya untuk semua daftar (paket utama maupun
 * "sering dibeli"). Judul, badge, dan lokasi dipotong (truncate) agar
 * nama panjang tidak merusak tata letak kartu. Icon ceklis fasilitas
 * mengikuti section packages di home (CheckCircleFilled).
 * Kuantitas TIDAK diatur di kartu — cukup lewat stepper di keranjang.
 */
export function PackageCard({
  pkg,
  onAdd,
}: {
  pkg: WebPackage;
  onAdd: () => void;
}) {
  const { t } = useT();

  return (
    <Card
      title={
        <span className="flex w-full min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-medium" title={pkg.name}>
            {pkg.name}
          </span>
          {pkg.timesPurchased > 0 && (
            <Tag
              color="orange"
              icon={<FireOutlined />}
              className="m-0! shrink-0!"
            >
              {t("package.popularTag")}
            </Tag>
          )}
        </span>
      }
    >
      {/* Lokasi tepat di bawah judul (badge popular di kanan judul). */}
      <p
        className="truncate text-xs text-foreground/50"
        title={pkg.placeName ?? undefined}
      >
        📍 {pkg.placeName ?? "-"}
      </p>
      <div className="mt-2 text-2xl font-bold text-primary">
        {formatRupiah(pkg.price)}
        <span className="text-sm font-normal text-foreground/60">
          {" "}
          {t("common.perPerson")}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {pkg.facilities.filter(Boolean).map((f) => (
          <li
            key={f}
            className="flex min-h-6 items-start gap-2 truncate text-sm text-foreground/80"
            title={f}
          >
            <CheckCircleFilled className="mt-0.5 shrink-0 text-primary" />
            <span className="min-w-0 truncate">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <Button type="primary" icon={<ShoppingCartOutlined />} onClick={onAdd}>
          {t("cart.order")}
        </Button>
      </div>
    </Card>
  );
}

export function PackageListSection({
  packages,
  onAdd,
}: {
  packages: WebPackage[];
  onAdd: (pkg: WebPackage) => void;
}) {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  if (packages.length === 0) {
    return (
      <Card>
        <Empty description={t("package.noResults")} className="py-8!" />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {packages.map((pkg) => (
        <Col xs={24} sm={12} key={pkg.id}>
          <PackageCard pkg={pkg} onAdd={() => onAdd(pkg)} />
        </Col>
      ))}
    </Row>
  );
}
