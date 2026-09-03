"use client";

import { useMounted } from "@/helpers/useMounted";
import { Button, Card, Popconfirm } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatRupiah } from "@/utils/format";
import type { CartItem } from "./PackageListSection";

export function CartSection({
  cart,
  total,
  onChangeQuantity,
  onClear,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  /** Set kuantitas item; 0 atau kurang → item dihapus dari keranjang. */
  onChangeQuantity: (packageId: number, quantity: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}) {
  const { t } = useT();
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
              <div
                key={item.packageId}
                className="flex items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {formatRupiah(item.price)} × {item.quantity} ={" "}
                    {formatRupiah(item.price * item.quantity)}
                  </p>
                </div>
                {/* Stepper +/-: kurang dari 1 menghapus item dari keranjang. */}
                <div className="flex shrink-0 items-center">
                  <Button
                    size="small"
                    icon={<MinusOutlined />}
                    aria-label={t("cart.decrease")}
                    onClick={() =>
                      onChangeQuantity(item.packageId, item.quantity - 1)
                    }
                  />
                  <span
                    className="w-8 text-center text-sm font-medium"
                    aria-label={t("cart.quantity")}
                  >
                    {item.quantity}
                  </span>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    aria-label={t("cart.increase")}
                    onClick={() =>
                      onChangeQuantity(item.packageId, item.quantity + 1)
                    }
                  />
                </div>
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
            <Button danger block className="mt-4!">
              {t("cart.clearAll")}
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            block
            className="mt-2!"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            {t("cart.checkout")}
          </Button>
        </>
      )}
    </Card>
  );
}
