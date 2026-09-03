"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dayjs } from "dayjs";
import {
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  Radio,
} from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, clearCart } from "@/helpers/cart";
import { formatRupiah } from "@/utils/format";

/** Paket aktif dari /api/web/packages (sesuai data admin). */
interface WebPackage {
  id: number;
  name: string;
  placeId: number | null;
  placeName: string | null;
  price: number;
}

interface CheckoutFormValues {
  dateSchedule: string;
  homestay: "yes" | "no";
  homestayTime?: number;
}

interface CheckoutUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

/**
 * Checkout nyata: keranjang (sessionStorage) + harga terbaru dari DB,
 * lalu POST /api/web/orders (harga diverifikasi server) dan lanjut ke
 * pembayaran QRIS (Midtrans Core API).
 */
export default function CheckoutClientSection({
  user,
}: {
  user: CheckoutUser;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { notification, message } = App.useApp();
  const [form] = Form.useForm<CheckoutFormValues>();

  const [fetching, setFetching] = useState(true);
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [cart, setCart] = useState<{ packageId: number; quantity: number }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);

  // Muat keranjang + harga paket terbaru.
  const load = useCallback(async () => {
    const stored = readCart();
    setCart(stored);
    try {
      const res = await fetch("/api/web/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setFetching(false);
    }
  }, [notification, t]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // Item checkout = keranjang × harga DB terbaru.
  const items = useMemo(
    () =>
      cart
        .map((row) => {
          const pkg = packages.find((p) => p.id === row.packageId);
          return pkg
            ? {
                packageId: pkg.id,
                name: pkg.name,
                price: pkg.price,
                quantity: row.quantity,
              }
            : null;
        })
        .filter(Boolean) as {
        packageId: number;
        name: string;
        price: number;
        quantity: number;
      }[],
    [cart, packages],
  );
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleProcess = async (values: CheckoutFormValues) => {
    if (items.length === 0) {
      message.warning(t("checkout.emptyCart"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/web/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          dateSchedule: values.dateSchedule,
          homestay: values.homestay === "yes",
          homestayTime:
            values.homestay === "yes" ? (values.homestayTime ?? 1) : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      notification.success({
        title: t("notif.success"),
        description: t("notif.orderCreated"),
        placement: "bottomRight",
      });
      clearCart();
      setCart([]);
      // Arahkan ke halaman transaksi pembayaran (bukan diam di checkout).
      router.replace(`/payment/${json.data.orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.orderFailed"),
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("checkout.title")}</h1>

      {fetching ? (
        <Card className="mt-6!">{t("common.loading")}</Card>
      ) : items.length === 0 ? (
        <Card className="mt-6!">
          <Empty description={t("checkout.emptyCart")} className="py-8!">
            <Button type="primary" onClick={() => router.push("/package")}>
              {t("home.packages.title")}
            </Button>
          </Empty>
        </Card>
      ) : (
        <Card className="mt-6!">
          <Form
            form={form}
            layout="vertical"
            initialValues={{ homestay: "no" }}
            onFinish={handleProcess}
          >
            <Form.Item
              label={t("checkout.scheduleDate")}
              name="dateSchedule"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full!" />
            </Form.Item>
            {/* Menginap dan Jumlah Hari tampil bersebelahan. */}
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) =>
                prev.homestay !== cur.homestay ||
                prev.homestayTime !== cur.homestayTime ||
                prev.dateSchedule !== cur.dateSchedule
              }
            >
              {({ getFieldValue }) => {
                const homestay = getFieldValue("homestay") as string;
                const homestayTime = (getFieldValue("homestayTime") ??
                  1) as number;
                const dateSchedule = getFieldValue("dateSchedule") as
                  | Dayjs
                  | undefined;
                // Keterangan tanggal pulang (berangkat + jumlah hari menginap).
                const returnDate =
                  homestay === "yes" && dateSchedule
                    ? dateSchedule.add(homestayTime, "day")
                    : null;
                return (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Form.Item
                      label={t("checkout.homestay")}
                      name="homestay"
                      className="mb-0!"
                    >
                      <Radio.Group>
                        <Radio.Button value="no">{t("common.no")}</Radio.Button>
                        <Radio.Button value="yes">{t("common.yes")}</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    {/* Jumlah Hari hanya tampil bila menginap. */}
                    {homestay === "yes" && (
                      <Form.Item
                        label={t("checkout.homestayDays")}
                        name="homestayTime"
                        initialValue={1}
                        rules={[{ required: true }]}
                        className="mb-0!"
                      >
                        <InputNumber min={1} className="w-full!" />
                      </Form.Item>
                    )}
                    {returnDate && (
                      <p className="sm:col-span-2 text-sm text-foreground/60">
                        {t("checkout.returnDate")}:{" "}
                        <span className="font-medium text-primary">
                          {returnDate.format(
                            locale === "id" ? "DD MMMM YYYY" : "MMMM D, YYYY",
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                );
              }}
            </Form.Item>

            <h2 className="font-semibold mt-4">{t("checkout.orderer")}</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <p className="text-foreground/60">{t("common.name")}</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <p className="text-foreground/60">{t("common.email")}</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
                <p className="text-foreground/60">{t("common.phone")}</p>
                <p className="font-medium">{user.phone ?? "-"}</p>
              </div>
            </div>

            <h2 className="font-semibold mt-6">{t("checkout.orders")}</h2>
            <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
              {items.map((item) => (
                <div
                  key={item.packageId}
                  className="py-2 flex justify-between text-sm"
                >
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

            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              loading={submitting}
              className="mt-6!"
            >
              {t("checkout.process")}
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
}
