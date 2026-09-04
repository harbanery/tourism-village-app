"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/helpers/useMounted";
import { App, Button, Card, Empty, List, Tag } from "antd";
import {
  CreditCardOutlined,
  DownloadOutlined,
  FieldTimeOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate, formatRupiah } from "@/utils/format";
import { issuePaymentAccess } from "@/helpers/paymentAccess";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

export interface HistoryOrder {
  id: number;
  /** Opsional — respons /api/web/orders tidak menyertakan userId. */
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string | null;
  dateOrder: string;
  dateSchedule: string;
  homestay: "yes" | "no";
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  /** Batas waktu pembayaran (ISO) — hanya relevan untuk PENDING. */
  paymentExpiresAt?: string | null;
  items: {
    id: number;
    packageName: string;
    quantity: number;
    price: number;
    /** Jadwal per paket — null untuk data lama (fallback agregat order). */
    dateSchedule?: string | null;
    homestay?: boolean;
    homestayTime?: number | null;
  }[];
}

/** Warna tag status pembayaran. */
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

/** Tambah n hari ke tanggal ISO (untuk tanggal pulang menginap). */
function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** true bila tiap paket punya reservasi berbeda (jadwal per item beda). */
function hasDistinctItemSchedules(order: HistoryOrder): boolean {
  const items = order.items;
  if (items.length < 2 || !items.every((item) => item.dateSchedule)) return false;
  const signatures = new Set(
    items.map(
      (item) => `${item.dateSchedule}|${item.homestay}|${item.homestayTime}`,
    ),
  );
  return signatures.size > 1;
}

/** Bentuk order dari GET /api/web/orders (homestay boolean). */
interface ApiOrder {
  id: number;
  dateOrder: string;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  paymentExpiresAt: string | null;
  items: {
    id: number;
    packageName: string;
    quantity: number;
    price: number;
    dateSchedule: string | null;
    homestay: boolean;
    homestayTime: number | null;
  }[];
}

/** Map respons API → HistoryOrder (homestay "yes"|"no"). */
function toHistoryOrder(o: ApiOrder): HistoryOrder {
  return {
    ...o,
    homestay: o.homestay ? "yes" : "no",
    items: o.items,
  };
}

export function OrderHistorySection({ orders }: { orders: HistoryOrder[] }) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();

  // Salinan lokal — bisa disegarkan tanpa menunggu render server ulang.
  const [list, setList] = useState<HistoryOrder[]>(orders);

  // Segarkan riwayat saat halaman profil dibuka kembali (router cache bisa
  // menyajikan data lama saat back-navigation) dan saat tab kembali aktif.
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch("/api/web/orders");
        const json = await res.json();
        if (!active || !json.success) return;
        setList((json.data as ApiOrder[]).map(toHistoryOrder));
      } catch {
        // Gagal refresh senyap — data lama tetap tampil.
      }
    };
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  if (!mounted) return null;

  /** Unduh bukti pembayaran (invoice Midtrans + data order) sebagai PDF. */
  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const res = await fetch(`/api/web/orders/${orderId}/invoice`);
      const result = await res.json();
      if (!result.success) {
        message.error(t("notif.fetchFailed"));
        return;
      }
      const data = result.data;

      // jsPDF di-import dinamis agar tidak membebani bundle utama.
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Kop invoice.
      doc.setFontSize(16);
      doc.setTextColor(13, 122, 95);
      doc.text("Desaku Wisataku", 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(90);
      doc.text(
        locale === "id"
          ? "Bukti Pembayaran (Invoice Midtrans)"
          : "Payment Receipt (Midtrans Invoice)",
        14,
        24,
      );
      doc.setDrawColor(13, 122, 95);
      doc.line(14, 27, 196, 27);

      // Meta pesanan.
      doc.setFontSize(10);
      doc.setTextColor(30);
      let y = 34;
      const metaLines: string[] = [
        `Order: #${data.orderId}  |  Midtrans: ${data.midtransOrderId}`,
        `Status: ${data.paymentStatus}${
          data.midtrans
            ? `  |  ${String(data.midtrans.paymentType ?? "qris").toUpperCase()} (Midtrans: ${data.midtrans.transactionStatus})`
            : ""
        }`,
        `${locale === "id" ? "Pemesan" : "Customer"}: ${data.customer.name} (${data.customer.email})`,
        `${t("profile.orderDate")}: ${formatDate(data.dateOrder, locale, true)}`,
        `${t("profile.departureDate")}: ${formatDate(data.dateSchedule, locale)}`,
      ];
      if (data.homestay) {
        metaLines.push(
          `${t("checkout.homestay")}: ${t("common.yes")} (${data.homestayTime} ${t("checkout.homestayDays")})`,
        );
        metaLines.push(
          `${t("checkout.returnDate")}: ${formatDate(
            addDays(data.dateSchedule, data.homestayTime ?? 1),
            locale,
          )}`,
        );
      }
      if (data.paidAt) {
        metaLines.push(
          `${t("profile.paidAt")}: ${formatDate(data.paidAt, locale, true)}`,
        );
      }
      for (const line of metaLines) {
        doc.text(line, 14, y);
        y += 6;
      }

      // Tabel item.
      y += 4;
      doc.setFillColor(240, 250, 247);
      doc.rect(14, y - 4, 182, 8, "F");
      doc.setFontSize(9);
      doc.text(t("cart.package"), 16, y + 1.5);
      doc.text(t("cart.qty"), 130, y + 1.5, { align: "center" });
      doc.text(t("cart.price"), 194, y + 1.5, { align: "right" });
      y += 10;
      for (const item of data.items as {
        id: number;
        packageName: string;
        quantity: number;
        price: number;
        dateSchedule?: string | null;
        homestay?: boolean;
        homestayTime?: number | null;
      }[]) {
        doc.text(String(item.packageName), 16, y);
        doc.text(String(item.quantity), 130, y, { align: "center" });
        doc.text(formatRupiah(item.price), 194, y, { align: "right" });
        y += 5;
        // Jadwal per paket (fallback agregat order untuk data lama).
        const scheduleIso = item.dateSchedule ?? data.dateSchedule;
        doc.setFontSize(8);
        doc.setTextColor(110);
        doc.text(
          `${t("profile.departureDate")}: ${formatDate(scheduleIso, locale)}${
            item.homestay
              ? ` | ${t("checkout.homestay")}: ${item.homestayTime} ${t("checkout.homestayDays")}`
              : ""
          }`,
          16,
          y,
        );
        doc.setFontSize(9);
        doc.setTextColor(30);
        y += 6;
      }
      doc.setDrawColor(13, 122, 95);
      doc.line(14, y - 2, 196, y - 2);
      doc.setFontSize(11);
      doc.text(t("cart.totalPrice"), 16, y + 4);
      doc.setTextColor(13, 122, 95);
      doc.text(formatRupiah(data.totalPrice), 194, y + 4, { align: "right" });

      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text("Powered by Midtrans QRIS", 14, 285);

      doc.save(`invoice-${data.midtransOrderId}.pdf`);
    } catch {
      message.error(t("notif.error"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {list.length === 0 ? (
        <Card className="mt-6!">
          <Empty description={t("profile.noOrders")} className="py-8!">
            {/* Belum punya pesanan → ajak memesan paket wisata. */}
            <Button
              type="primary"
              onClick={() => router.push("/package")}
            >
              {t("profile.orderPackage")}
            </Button>
          </Empty>
        </Card>
      ) : (
        <List
          className="mt-6"
          grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
          dataSource={list}
          renderItem={(order) => (
            <List.Item>
              <Card
                title={`${t("common.total")}: ${formatRupiah(order.totalPrice)}`}
                extra={
                  <Tag color={PAYMENT_TAG_COLORS[order.paymentStatus]}>
                    {t(`payment.status.${order.paymentStatus}`)}
                  </Tag>
                }
              >
                {/* Ringkasan tanggal-tanggal penting pesanan. */}
                <div className="flex flex-col gap-2 text-sm">
                  {/* Baris 1: tanggal pemesanan (kiri) + batas pembayaran (kanan). */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-foreground/70">
                      <CalendarOutlined className="text-foreground/40" />
                      <span>
                        <span className="text-foreground/50">
                          {t("profile.orderDate")}:
                        </span>{" "}
                        {formatDate(order.dateOrder, locale, true)}
                      </span>
                    </p>
                    {order.paymentStatus === "PENDING" &&
                    order.paymentExpiresAt ? (
                      <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <FieldTimeOutlined />
                        <span>
                          {t("payment.deadline")}:{" "}
                          {formatDate(order.paymentExpiresAt, locale, true)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  {/* Baris 2: tanggal reservasi — per paket bila jadwalnya
                      berbeda-beda, atau satu baris rangkuman bila sama. */}
                  {hasDistinctItemSchedules(order) ? (
                    <div className="flex flex-col gap-1">
                      <p className="flex items-center gap-2 text-foreground/70">
                        <CalendarOutlined className="text-foreground/40" />
                        <span className="text-foreground/50">
                          {t("profile.reservationDate")}:
                        </span>
                      </p>
                      {order.items.map((item) => (
                        <p
                          key={item.id}
                          className="ml-6 flex flex-wrap items-center gap-2 text-sm text-foreground/70"
                        >
                          <span className="font-medium">{item.packageName}:</span>
                          {formatDate(item.dateSchedule!, locale)}
                          {item.homestay && (
                            <>
                              {" "}
                              {t("common.until")}{" "}
                              {formatDate(
                                addDays(item.dateSchedule!, item.homestayTime ?? 1),
                                locale,
                              )}
                              <Tag
                                color="green"
                                icon={<HomeOutlined />}
                                className="m-0!"
                              >
                                {item.homestayTime} {t("checkout.homestayDays")}
                              </Tag>
                            </>
                          )}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="flex flex-wrap items-center gap-2 text-foreground/70">
                      <CalendarOutlined className="text-foreground/40" />
                      <span>
                        <span className="text-foreground/50">
                          {t("profile.reservationDate")}:
                        </span>{" "}
                        {formatDate(order.dateSchedule, locale)}
                        {order.homestay === "yes" && (
                          <>
                            {" "}
                            {t("common.until")}{" "}
                            {formatDate(
                              addDays(
                                order.dateSchedule,
                                order.homestayTime ?? 1,
                              ),
                              locale,
                            )}
                          </>
                        )}
                      </span>
                      {order.homestay === "yes" && (
                        <Tag
                          color="green"
                          icon={<HomeOutlined />}
                          className="m-0!"
                        >
                          {t("checkout.homestay")} {order.homestayTime}{" "}
                          {t("checkout.homestayDays")}
                        </Tag>
                      )}
                    </p>
                  )}
                </div>

                {/* List wisata: paket, kuantitas, harga — rapi per baris. */}
                <div className="mt-4 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-black/[0.03] dark:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-foreground/60">
                    <span>{t("cart.package")}</span>
                    <span className="w-14 text-center">{t("cart.qty")}</span>
                    <span className="w-24 text-right">{t("cart.price")}</span>
                  </div>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 text-sm border-t border-black/5 dark:border-white/5"
                    >
                      <span className="font-medium">{item.packageName}</span>
                      <span className="w-14 text-center">
                        × {item.quantity}
                      </span>
                      <span className="w-24 text-right">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-2.5 text-sm border-t border-black/10 dark:border-white/10 font-semibold">
                    <span>{t("cart.totalPrice")}</span>
                    <span className="text-primary">
                      {formatRupiah(order.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.paymentStatus === "PENDING" ? (
                    <Button
                      type="primary"
                      icon={<CreditCardOutlined />}
                      onClick={() => {
                        // Tiket sekali masuk halaman pembayaran (halaman
                        // payment berlaku sekali per tiket).
                        issuePaymentAccess(order.id);
                        router.push(`/payment/${order.id}`);
                      }}
                    >
                      {t("payment.pay")}
                    </Button>
                  ) : order.paymentStatus === "PAID" ? (
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      {t("profile.downloadReceipt")}
                    </Button>
                  ) : null}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
