"use client";

import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { Button, Card, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatRupiah } from "@/utils/format";
import type { CartItem } from "./PackageListSection";

export function CartSection({
  cart,
  total,
  onRemove,
  onClear,
}: {
  cart: CartItem[];
  total: number;
  onRemove: (packageId: number) => void;
  onClear: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
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
                  onClick={() => onRemove(item.packageId)}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between font-semibold">
            <span>{t("cart.totalPrice")}</span>
            <span className="text-primary">{formatRupiah(total)}</span>
          </div>
          <Popconfirm
            title={t("cart.clearAll")}
            onConfirm={onClear}
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
            onClick={() => router.push("/checkout/1")}
          >
            {t("cart.checkout")}
          </Button>
        </>
      )}
    </Card>
  );
}
