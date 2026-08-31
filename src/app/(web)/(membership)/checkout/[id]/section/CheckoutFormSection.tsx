"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, DatePicker, Form, InputNumber, Radio } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import type { User } from "@/models";
import { formatRupiah } from "@/utils/format";

export interface CheckoutItem {
  packageId: number;
  quantity: number;
  name: string;
  price: number;
}

export function CheckoutFormSection({
  user,
  items,
  total,
}: {
  user: User | null;
  items: CheckoutItem[];
  total: number;
}) {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("checkout.title")}</h1>
      <Card className="mt-6">
        <Form layout="vertical">
          <Form.Item label={t("checkout.scheduleDate")} name="dateSchedule" required>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label={t("checkout.homestay")} name="homestay">
            <Radio.Group defaultValue="no">
              <Radio.Button value="no">{t("common.no")}</Radio.Button>
              <Radio.Button value="yes">{t("common.yes")}</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={t("checkout.homestayDays")} name="homestayTime">
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <h2 className="font-semibold mt-4">{t("checkout.orderer")}</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
              <p className="text-foreground/60">{t("common.name")}</p>
              <p className="font-medium">{user?.name ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
              <p className="text-foreground/60">{t("common.email")}</p>
              <p className="font-medium">{user?.email ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
              <p className="text-foreground/60">{t("common.phone")}</p>
              <p className="font-medium">{user?.phone ?? "-"}</p>
            </div>
          </div>

          <h2 className="font-semibold mt-6">{t("checkout.orders")}</h2>
          <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
            {items.map((item) => (
              <div key={item.packageId} className="py-2 flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatRupiah(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="py-2 flex justify-between font-semibold">
              <span>{t("cart.totalPrice")}</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button type="primary" size="large" block htmlType="submit" className="mt-6">
            {t("checkout.process")}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
