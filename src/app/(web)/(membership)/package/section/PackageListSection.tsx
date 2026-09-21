"use client";

import { useMounted } from "@/hooks/useMounted";
import { Badge, Button, Card, Col, Empty, Row } from "antd";
import {
  CheckCircleFilled,
  EnvironmentFilled,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatRupiah } from "@/utils/helpers";

/** Paket aktif dari DB (/api/web/packages, kelola di panel admin). */
export interface WebPackage {
  id: string;
  name: string;
  placeId: string | null;
  placeName: string | null;
  facilities: string[];
  price: number;
  /** Berapa kali paket ini berhasil dibayar semua user (tag "Populer"). */
  timesPurchased: number;
  /** Berapa kali paket ini dibayar user ini (section sering dibeli pribadi). */
  userTimesPurchased: number;
}

export interface CartItem {
  packageId: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Kartu paket — satu gaya untuk semua daftar (paket utama maupun
 * "sering dibeli"). Judul dan lokasi dipotong (truncate) agar nama
 * panjang tidak merusak tata letak kartu. Icon ceklis fasilitas
 * mengikuti section packages di home (CheckCircleFilled). Paket populer
 * (pernah dibayar) ditandai Badge.Ribbon antd bintang di pojok kanan
 * atas kartu (pola section packages home). Kuantitas TIDAK diatur di
 * kartu — cukup lewat stepper di keranjang.
 */
export function PackageCard({
  pkg,
  onAdd,
}: {
  pkg: WebPackage;
  onAdd: () => void;
}) {
  const { t } = useT();

  const card = (
    <Card
      title={
        <span
          className="block w-full min-w-0 truncate font-medium"
          title={pkg.name}
        >
          {pkg.name}
        </span>
      }
    >
      {/* Lokasi tepat di bawah judul (ribbon populer di pojok kartu). */}
      <div
        className="flex items-center justify-start gap-2 truncate text-xs text-foreground/50"
        title={pkg.placeName ?? undefined}
      >
        <EnvironmentFilled className="text-xs!" />

        <span>{pkg.placeName ?? "-"}</span>
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
      <div className="mt-4 flex justify-between items-end gap-2">
        <Button type="primary" icon={<ShoppingCartOutlined />} onClick={onAdd}>
          {t("cart.order")}
        </Button>
        <div className="mt-2 text-2xl font-bold text-primary">
          {formatRupiah(pkg.price)}
          <span className="text-sm font-normal text-foreground/60">
            {" "}
            {t("common.perPerson")}
          </span>
        </div>
      </div>
    </Card>
  );

  // Populer (pernah dibayar user mana pun) → ribbon bintang (antd
  // Badge.Ribbon) menempel di pojok kanan atas kartu.
  return pkg.timesPurchased > 0 ? (
    <Badge.Ribbon
      text={
        <span className="inline-flex items-center gap-1">
          <StarFilled />
          {t("package.popularTag")}
        </span>
      }
      color="orange"
    >
      {card}
    </Badge.Ribbon>
  ) : (
    card
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
