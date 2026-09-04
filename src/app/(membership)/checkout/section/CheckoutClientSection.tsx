"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  Radio,
  Steps,
  Tabs,
} from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, clearCart } from "@/helpers/cart";
import { formatRupiah } from "@/utils/format";
import dayjs, { type Dayjs } from "dayjs";
import Image from "next/image";

/** Paket aktif dari /api/web/packages (sesuai data admin). */
interface WebPackage {
  id: number;
  name: string;
  placeId: number | null;
  placeName: string | null;
  price: number;
}

/** Nilai jadwal untuk satu paket (satu tab). */
interface ScheduleValue {
  dateSchedule?: Dayjs;
  homestay?: "yes" | "no";
  homestayTime?: number;
  /** true = jadwal paket ini mengikuti paket pertama (ceklis). */
  sameSchedule?: boolean;
}

type CheckoutFormValues = { schedules?: Record<string, ScheduleValue> };

interface CheckoutUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

/** Tanggal berangkat paling cepat: 2 hari setelah hari ini (H+2). */
function minDepartureDate(): Dayjs {
  return dayjs().add(2, "day").startOf("day");
}

function MidtransLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/partners/Midtrans.png"
      alt="Midtrans"
      width={83}
      height={16}
      className={className}
    />
  );
}

/**
 * Checkout nyata: keranjang (sessionStorage) + harga terbaru dari DB.
 *
 * Flow dua langkah:
 * 1. "Isi Jadwal" — form jadwal per paket berbentuk tab (setiap paket punya
 *    tanggal berangkat, menginap, dan jumlah hari sendiri; ceklis "jadwal
 *    sama" membuat paket mengikuti jadwal paket pertama). Detail informasi
 *    pesanan tampil terpisah di kolom kanan.
 * 2. "Konfirmasi" — data pemesan dan detail pesanan bergabung jadi satu
 *    rangkuman; pemesan masih bisa diubah bila ada perubahan jadwal.
 *
 * Submit → POST /api/web/orders (harga diverifikasi server) lalu lanjut ke
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
  const [step, setStep] = useState<0 | 1>(0);
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

  // Pantau seluruh nilai form (untuk menonaktifkan field + tanggal pulang).
  const schedulesWatch = Form.useWatch("schedules", form);

  /** Jadwal efektif satu paket: milik sendiri, atau ikut paket pertama. */
  const effectiveSchedule = useCallback(
    (index: number): ScheduleValue => {
      const values = schedulesWatch ?? {};
      const own = values[String(items[index]?.packageId)] ?? {};
      if (index > 0 && own.sameSchedule) {
        return values[String(items[0].packageId)] ?? own;
      }
      return own;
    },
    [items, schedulesWatch],
  );

  /** Validasi jadwal semua tab → lanjut ke langkah konfirmasi. */
  const handleConfirm = async () => {
    try {
      await form.validateFields();
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Pesan error per-field sudah ditampilkan antd di tab terkait.
    }
  };

  /** Kirim order (harga diverifikasi server) → arahkan ke pembayaran. */
  const handleProcess = async () => {
    if (items.length === 0) {
      message.warning(t("checkout.emptyCart"));
      return;
    }
    setSubmitting(true);
    try {
      const values = form.getFieldsValue();
      const first = values.schedules?.[String(items[0].packageId)];
      const payloadItems = items.map((item, index) => {
        const own = values.schedules?.[String(item.packageId)] ?? {};
        // Ceklis "jadwal sama" → pakai jadwal paket pertama.
        const schedule = index > 0 && own.sameSchedule ? (first ?? own) : own;
        return {
          packageId: item.packageId,
          quantity: item.quantity,
          dateSchedule: schedule.dateSchedule?.toISOString(),
          homestay: schedule.homestay === "yes",
          homestayTime:
            schedule.homestay === "yes" ? (schedule.homestayTime ?? 1) : null,
        };
      });

      const res = await fetch("/api/web/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
      const json = await res.json();
      if (!json.success) {
        // Error bisnis dari server → pesan spesifik sesuai kode error.
        if (json.error === "ORDER_LIMIT_REACHED") {
          notification.warning({
            title: t("notif.orderLimitTitle"),
            description: t("notif.orderLimitReached"),
            placement: "bottomRight",
          });
        } else if (json.error === "SCHEDULE_TOO_SOON") {
          message.warning(t("checkout.minDateError"));
          setStep(0);
        }
        throw new Error(json.error);
      }

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

  /** Format tanggal sesuai locale aktif. */
  const formatDate = (date: Dayjs) =>
    date
      .locale(locale)
      .format(locale === "id" ? "DD MMMM YYYY" : "MMMM D, YYYY");

  if (!mounted) return null;

  if (fetching) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("checkout.title")}
        </h1>
        <Card className="mt-6!">{t("common.loading")}</Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("checkout.title")}
        </h1>
        <Card className="mt-6!">
          <Empty description={t("checkout.emptyCart")} className="py-8!">
            <Button type="primary" onClick={() => router.push("/package")}>
              {t("home.packages.title")}
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  /** Satu tab jadwal untuk satu paket. */
  const renderScheduleTab = (index: number) => {
    const item = items[index];
    const effective = effectiveSchedule(index);
    const isSame =
      index > 0 &&
      (schedulesWatch?.[String(item.packageId)]?.sameSchedule ?? true);
    const returnDate =
      effective.homestay === "yes" && effective.dateSchedule
        ? effective.dateSchedule.add(effective.homestayTime ?? 1, "day")
        : null;
    return (
      <div className="pt-4">
        {/* Ceklis: paket ini jadwalnya sama dengan paket pertama. */}
        {index > 0 && (
          <Form.Item
            name={["schedules", String(item.packageId), "sameSchedule"]}
            valuePropName="checked"
            initialValue={true}
            className="mb-4!"
            extra={t("checkout.sameScheduleHint")}
          >
            <Checkbox>{t("checkout.sameSchedule")}</Checkbox>
          </Form.Item>
        )}

        <div className={isSame ? "pointer-events-none opacity-50" : ""}>
          <Form.Item
            label={t("checkout.scheduleDate")}
            name={["schedules", String(item.packageId), "dateSchedule"]}
            rules={[
              {
                // Lewati validasi bila jadwal mengikuti paket pertama.
                validator(_, value: Dayjs | undefined) {
                  if (value) return Promise.resolve();
                  if (isSame) return Promise.resolve();
                  return Promise.reject(
                    new Error(
                      t("validation.required", {
                        field: t("checkout.scheduleDate"),
                      }),
                    ),
                  );
                },
              },
              {
                // Minimal H+2: hanya tanggal 2 hari ke depan ke atas yang valid.
                validator(_, value: Dayjs | undefined) {
                  if (!value) return Promise.resolve();
                  if (value.isBefore(minDepartureDate(), "day")) {
                    return Promise.reject(
                      new Error(t("checkout.minDateError")),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              className="w-full!"
              disabledDate={(current) =>
                current.isBefore(minDepartureDate(), "day")
              }
            />
          </Form.Item>

          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item
              label={t("checkout.homestay")}
              name={["schedules", String(item.packageId), "homestay"]}
              initialValue="no"
              className="mb-0!"
            >
              <Radio.Group>
                <Radio.Button value="no">{t("common.no")}</Radio.Button>
                <Radio.Button value="yes">{t("common.yes")}</Radio.Button>
              </Radio.Group>
            </Form.Item>
            {/* Jumlah Hari hanya tampil bila menginap. */}
            {effective.homestay === "yes" && (
              <Form.Item
                label={t("checkout.homestayDays")}
                name={["schedules", String(item.packageId), "homestayTime"]}
                initialValue={1}
                rules={[{ required: true }]}
                className="mb-0!"
              >
                <InputNumber min={1} className="w-full!" />
              </Form.Item>
            )}
          </div>
        </div>

        {/* Keterangan tanggal pulang (berangkat + jumlah hari menginap). */}
        {returnDate && (
          <p className="mt-4 text-sm text-foreground/60">
            {t("checkout.returnDate")}:{" "}
            <span className="font-medium text-primary">
              {formatDate(returnDate)}
            </span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("checkout.title")}</h1>

      {/* Indikator langkah: isi jadwal → konfirmasi. */}
      <div className="mt-4">
        <Steps
          size="small"
          current={step}
          items={[
            { title: t("checkout.step.schedule") },
            { title: t("checkout.step.confirm") },
          ]}
        />
      </div>

      {step === 0 ? (
        // --- Langkah 1: form jadwal (kiri) + detail informasi (kanan) ---
        <Form
          form={form}
          layout="vertical"
          className="mt-6! grid items-start gap-6 lg:grid-cols-[1fr_360px]"
        >
          <Card title={t("checkout.schedulePerPackage")}>
            <Tabs
              items={items.map((item, index) => ({
                key: String(item.packageId),
                label: item.name,
                forceRender: true,
                children: renderScheduleTab(index),
              }))}
            />
            <Button
              type="primary"
              size="large"
              block
              className="mt-6!"
              onClick={handleConfirm}
            >
              {t("checkout.confirm")}
            </Button>
          </Card>

          {/* Detail informasi terpisah dari form. */}
          <Card title={t("checkout.detailInfo")} className="lg:sticky lg:top-0">
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((item) => (
                <div
                  key={item.packageId}
                  className="py-2 flex justify-between gap-3 text-sm"
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
          </Card>
        </Form>
      ) : (
        // --- Langkah 2: data pemesan + detail pesanan bergabung ---
        <Card className="mt-6!">
          <p className="text-sm text-foreground/60">
            {t("checkout.ordererNote")}
          </p>

          <h2 className="mt-4 font-semibold">{t("checkout.orderer")}</h2>
          <div className="mt-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                <p className="text-foreground/60">{t("common.name")}</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                <p className="text-foreground/60">{t("common.email")}</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                <p className="text-foreground/60">{t("common.phone")}</p>
                <p className="font-medium">{user.phone || "-"}</p>
              </div>
            </div>
          </div>

          <h2 className="mt-6 font-semibold">{t("checkout.orders")}</h2>
          <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
            {items.map((item, index) => {
              const schedule = effectiveSchedule(index);
              const returnDate =
                schedule.homestay === "yes" && schedule.dateSchedule
                  ? schedule.dateSchedule.add(schedule.homestayTime ?? 1, "day")
                  : null;
              return (
                <div key={item.packageId} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                  {schedule.dateSchedule && (
                    <p className="mt-1 text-foreground/60">
                      {t("checkout.scheduleDate")}:{" "}
                      <span className="font-medium text-primary">
                        {formatDate(schedule.dateSchedule)}
                      </span>
                      {returnDate && (
                        <>
                          {" — "}
                          {t("checkout.returnDate")}:{" "}
                          <span className="font-medium text-primary">
                            {formatDate(returnDate)}
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="py-2 flex justify-between font-semibold">
              <span>{t("cart.totalPrice")}</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleProcess}
              className="flex-1"
            >
              {t("checkout.process")}
            </Button>
            <Button
              size="large"
              disabled={submitting}
              onClick={() => setStep(0)}
              className="flex-1"
            >
              {t("checkout.editSchedule")}
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-black/5 pt-4 text-xs text-foreground/50 dark:border-white/10">
            <span>{t("payment.supportedBy")}</span>
            <MidtransLogo />
          </div>
        </Card>
      )}
    </div>
  );
}
