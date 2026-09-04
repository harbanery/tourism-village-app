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
  Input,
  InputNumber,
  Radio,
  Steps,
  Tabs,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { readCart, clearCart } from "@/helpers/cart";
import { issuePaymentAccess } from "@/helpers/paymentAccess";
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

/**
 * Pengali harga per paket: bila menginap, harga dikalikan jumlah hari
 * (1 hari = tetap ×1). Paket tanpa menginap tidak dikalikan.
 */
function stayMultiplier(schedule: ScheduleValue | undefined): number {
  if (!schedule || schedule.homestay !== "yes") return 1;
  return Math.max(1, schedule.homestayTime ?? 1);
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
  /**
   * Snapshot jadwal saat tombol "Konfirmasi" ditekan. Form di-unmount saat
   * pindah langkah, jadi getFieldsValue() tanpa argumen (hanya field yang
   * ter-register) akan kosong — snapshot ini menjaga tampilan & payload
   * langkah konfirmasi tetap utuh.
   */
  const [confirmedSchedules, setConfirmedSchedules] = useState<
    Record<string, ScheduleValue>
  >({});
  /** Data pemesan lokal — bisa diedit di langkah konfirmasi. */
  const [orderer, setOrderer] = useState({
    name: user.name,
    phone: user.phone ?? "",
  });
  /** Telepon belum ada → form edit pemesan terbuka otomatis (wajib diisi). */
  const [editingOrderer, setEditingOrderer] = useState(!user.phone);
  const [savingOrderer, setSavingOrderer] = useState(false);

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
  // Pantau seluruh nilai form (untuk menonaktifkan field + tanggal pulang).
  // Fallback ke snapshot konfirmasi saat Form sudah di-unmount (langkah 2).
  const schedulesWatch =
    Form.useWatch("schedules", form) ?? confirmedSchedules;

  /**
   * Jadwal efektif satu paket. Ceklis "jadwal sama" hanya menyamakan
   * TANGGAL berangkat dengan paket pertama — menginap & jumlah hari tetap
   * diatur per paket masing-masing.
   */
  const effectiveSchedule = useCallback(
    (index: number): ScheduleValue => {
      const values = schedulesWatch ?? {};
      const own = values[String(items[index]?.packageId)] ?? {};
      const first = values[String(items[0]?.packageId)] ?? {};
      if (index > 0 && own.sameSchedule) {
        return { ...own, dateSchedule: first.dateSchedule ?? own.dateSchedule };
      }
      return own;
    },
    [items, schedulesWatch],
  );

  /**
   * Total dinamis mengikuti jadwal: harga × qty × hari menginap per paket.
   * (Harga final tetap dihitung server — ini hanya ringkasan tampilan.)
   */
  const total = items.reduce(
    (sum, item, index) =>
      sum + item.price * item.quantity * stayMultiplier(effectiveSchedule(index)),
    0,
  );

  /** Validasi jadwal semua tab → simpan snapshot → langkah konfirmasi. */
  const handleConfirm = async () => {
    try {
      await form.validateFields();
      // Snapshot penuh (getFieldsValue(true) = seluruh store, termasuk field
      // yang hanya punya initialValue) — dipakai setelah Form di-unmount.
      const values = form.getFieldsValue(true) as CheckoutFormValues;
      setConfirmedSchedules(values.schedules ?? {});
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Pesan error per-field sudah ditampilkan antd di tab terkait.
    }
  };

  /** Simpan perubahan data pemesan (nama/telepon) via PATCH profile.
      Telepon wajib — bila belum ada, validasi menuntut diisi. */
  const handleSaveOrderer = async (values: { name: string; phone?: string }) => {
    setSavingOrderer(true);
    try {
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, phone: values.phone ?? "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOrderer({ name: json.data.name, phone: json.data.phone ?? "" });
      setEditingOrderer(false);
      message.success(t("notif.ordererUpdated"));
    } catch (error) {
      console.error("Error updating orderer:", error);
      message.error(t("notif.ordererUpdateFailed"));
    } finally {
      setSavingOrderer(false);
    }
  };

  /** Kirim order (harga diverifikasi server) → arahkan ke pembayaran. */
  const handleProcess = async () => {
    if (items.length === 0) {
      message.warning(t("checkout.emptyCart"));
      return;
    }
    // Telepon wajib sebelum order diproses (kontak darurat perubahan jadwal).
    if (!orderer.phone.trim()) {
      setEditingOrderer(true);
      message.warning(t("checkout.phoneRequired"));
      return;
    }
    setSubmitting(true);
    try {
      // true = seluruh store form (bukan hanya field yang sedang ter-register
      // — Form sudah di-unmount di langkah konfirmasi), + snapshot sebagai
      // cadangan. Tanpa ini payload kehilangan dateSchedule → INVALID_SCHEDULE.
      const values =
        (form.getFieldsValue(true) as CheckoutFormValues).schedules ??
        confirmedSchedules;
      const payloadItems = items.map((item, index) => {
        const own = values[String(item.packageId)] ?? {};
        const firstSchedule = values[String(items[0].packageId)] ?? {};
        // Ceklis "tanggal sama" → HANYA tanggal berangkat yang mengikuti
        // paket pertama; menginap & jumlah hari tetap milik paket ini.
        const sameDate = index > 0 && own.sameSchedule;
        const date = sameDate
          ? (firstSchedule.dateSchedule ?? own.dateSchedule)
          : own.dateSchedule;
        const homestay = own.homestay === "yes";
        return {
          packageId: item.packageId,
          quantity: item.quantity,
          dateSchedule: date?.toISOString(),
          homestay,
          homestayTime: homestay ? (own.homestayTime ?? 1) : null,
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
      // Tiket sekali masuk halaman pembayaran (dikonsumsi saat dibuka —
      // kunjungan ulang tanpa tiket dialihkan ke profil).
      issuePaymentAccess(json.data.orderId);
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
        {/* Ceklis: tanggal berangkat paket ini sama dengan paket pertama
            (menginap & jumlah hari tetap diatur per paket). */}
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

        <Form.Item
          label={t("checkout.scheduleDate")}
          name={["schedules", String(item.packageId), "dateSchedule"]}
          rules={[
            {
              // Lewati validasi bila tanggal mengikuti paket pertama.
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
            // Tanggal sama → terkunci, mengikuti paket pertama.
            disabled={isSame}
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
          {/* Jumlah Hari hanya tampil bila menginap (selalu per paket). */}
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
            {/* Paket tunggal → tanpa tab; tiga paket atau lebih → tab per paket. */}
            {items.length === 1 ? (
              renderScheduleTab(0)
            ) : (
              <Tabs
                items={items.map((item, index) => ({
                  key: String(item.packageId),
                  label: item.name,
                  forceRender: true,
                  children: renderScheduleTab(index),
                }))}
              />
            )}
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
              {items.map((item, index) => {
                const days = stayMultiplier(effectiveSchedule(index));
                return (
                  <div
                    key={item.packageId}
                    className="py-2 flex justify-between gap-3 text-sm"
                  >
                    <span>
                      {item.name} × {item.quantity}
                      {days > 1 && (
                        <span className="text-foreground/50">
                          {" "}
                          · {days} {t("checkout.homestayDays")}
                        </span>
                      )}
                    </span>
                    <span>
                      {formatRupiah(item.price * item.quantity * days)}
                    </span>
                  </div>
                );
              })}
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
          {editingOrderer ? (
            <Form
              layout="vertical"
              className="mt-2 max-w-md"
              initialValues={{ name: orderer.name, phone: orderer.phone }}
              onFinish={(values) => void handleSaveOrderer(values)}
            >
              <Form.Item
                label={t("common.name")}
                name="name"
                rules={[
                  { required: true },
                  { min: 2, max: 60, message: t("auth.register.nameMin") },
                ]}
              >
                <Input placeholder={t("auth.register.namePlaceholder")} />
              </Form.Item>
              {/* Telepon wajib diisi (validasi) bila belum ada / diubah. */}
              <Form.Item
                label={t("common.phone")}
                name="phone"
                rules={[
                  { required: true },
                  {
                    pattern: /^[+()\-\s\d]{6,20}$/,
                    message: t("auth.register.phonePattern"),
                  },
                ]}
              >
                <Input placeholder="08..." />
              </Form.Item>
              <div className="flex gap-2">
                <Button htmlType="submit" loading={savingOrderer} type="primary">
                  {t("common.save")}
                </Button>
                {/* Batal hanya boleh bila telepon sudah terisi. */}
                {orderer.phone.trim() && (
                  <Button onClick={() => setEditingOrderer(false)}>
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
              <p className="mt-2 text-xs text-foreground/50">
                {t("checkout.ordererEditNote")}
              </p>
            </Form>
          ) : (
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="min-w-40 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                  <p className="text-foreground/60">{t("common.name")}</p>
                  <p className="font-medium">{orderer.name}</p>
                </div>
                <div className="min-w-52 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                  <p className="text-foreground/60">{t("common.email")}</p>
                  <p className="font-medium break-all">{user.email}</p>
                </div>
                <div className="min-w-40 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                  <p className="text-foreground/60">{t("common.phone")}</p>
                  <p className="font-medium">{orderer.phone || "-"}</p>
                </div>
              </div>
              {/* Tombol ubah hanya tampil bila data pemesan belum lengkap
                  (telepon kosong) — data sudah terisi semua → tanpa tombol. */}
              {!orderer.phone.trim() && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditingOrderer(true)}
                >
                  {t("checkout.editOrderer")}
                </Button>
              )}
            </div>
          )}

          <h2 className="mt-6 font-semibold">{t("checkout.orders")}</h2>
          <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
            {items.map((item, index) => {
              const schedule = effectiveSchedule(index);
              const days = stayMultiplier(schedule);
              const returnDate =
                schedule.homestay === "yes" && schedule.dateSchedule
                  ? schedule.dateSchedule.add(schedule.homestayTime ?? 1, "day")
                  : null;
              return (
                <div key={item.packageId} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>
                      {item.name} × {item.quantity}
                      {days > 1 && (
                        <span className="text-foreground/50">
                          {" "}
                          · {days} {t("checkout.homestayDays")}
                        </span>
                      )}
                    </span>
                    <span>{formatRupiah(item.price * item.quantity * days)}</span>
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
