"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/helpers/useMounted";
import { App, Button, Card, Collapse, Empty, Spin, Tag } from "antd";
import {
  CreditCardOutlined,
  DownOutlined,
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

/**
 * Ukuran halaman riwayat pesanan (infinite scroll): data awal yang muncul
 * adalah 3 pesanan teratas; halaman berikutnya dimuat saat mendekati dasar
 * daftar.
 */
const PAGE_SIZE = 3;

/** Tambah n hari ke tanggal ISO (untuk tanggal pulang menginap). */
function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** true bila tiap paket punya reservasi berbeda (jadwal per item beda). */
function hasDistinctItemSchedules(order: HistoryOrder): boolean {
  const items = order.items;
  if (items.length < 2 || !items.every((item) => item.dateSchedule))
    return false;
  const signatures = new Set(
    items.map(
      (item) => `${item.dateSchedule}|${item.homestay}|${item.homestayTime}`,
    ),
  );
  return signatures.size > 1;
}

/**
 * Akhir masa reservasi pesanan ( tanggal pulang untuk menginap) dalam
 * waktu lokal: item terakhir dipakai bila jadwal per paket berbeda,
 * fallback ke agregat order. Selesai hari itu dianggap lewat.
 */
function reservationEndTime(order: HistoryOrder): number {
  const ends = order.items
    .filter((item) => item.dateSchedule)
    .map((item) =>
      item.homestay
        ? addDays(item.dateSchedule!, item.homestayTime ?? 1)
        : item.dateSchedule!,
    );
  const base = ends.length > 0 ? ends : [order.dateSchedule];
  const latest = base.reduce((a, b) =>
    new Date(a).getTime() >= new Date(b).getTime() ? a : b,
  );
  const end = new Date(latest);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

/** true bila tanggal reservasi pesanan sudah terlewat (hari pulang lewat). */
function isReservationPassed(order: HistoryOrder): boolean {
  return Date.now() > reservationEndTime(order);
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

export function OrderHistorySection({
  orders,
  hasMore: initialHasMore = false,
  total: initialTotal = 0,
}: {
  orders: HistoryOrder[];
  /** Masih ada pesanan berikutnya (dimuat saat scroll). */
  hasMore?: boolean;
  /** Total seluruh pesanan user. */
  total?: number;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();

  // Salinan lokal — bisa disegarkan tanpa menunggu render server ulang.
  const [list, setList] = useState<HistoryOrder[]>(orders);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [totalOrders, setTotalOrders] = useState<number>(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);

  // Jumlah baris yang sudah dimuat — dipakai refresh tanpa re-subscribe
  // (nilai terkini dibaca via ref, bukan dependency effect).
  const loadedCountRef = useRef(orders.length);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /** Ambil satu halaman riwayat dari API (pola infinite scroll). */
  const fetchPage = useCallback(async (take: number, skip: number) => {
    const res = await fetch(`/api/web/orders?take=${take}&skip=${skip}`);
    const json = await res.json();
    if (!json.success) throw new Error("fetch failed");
    return {
      items: (json.data.items as ApiOrder[]).map(toHistoryOrder),
      total: json.data.total as number,
      hasMore: json.data.hasMore as boolean,
    };
  }, []);

  // Segarkan jendela data yang sudah dimuat saat halaman profil dibuka
  // kembali (router cache bisa menyajikan data lama saat back-navigation)
  // dan saat tab kembali aktif — tidak menambah jumlah, hanya menyegarkan.
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const take = Math.max(loadedCountRef.current, PAGE_SIZE);
        const page = await fetchPage(take, 0);
        if (!active) return;
        setList(page.items);
        setHasMore(page.hasMore);
        setTotalOrders(page.total);
        loadedCountRef.current = page.items.length;
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
  }, [fetchPage]);

  // Infinite scroll: saat sentinel terlihat (mendekati dasar daftar) dan
  // masih ada data, muat halaman berikutnya (dedupe by id).
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(PAGE_SIZE, loadedCountRef.current);
      setList((prev) => {
        const seen = new Set(prev.map((row) => row.id));
        const next = [...prev];
        for (const row of page.items) {
          if (!seen.has(row.id)) next.push(row);
        }
        loadedCountRef.current = next.length;
        return next;
      });
      setHasMore(page.hasMore);
      setTotalOrders(page.total);
    } catch {
      // Gagal memuat halaman — biarkan user mencoba scroll lagi.
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      // Pre-load sebelum sentinel benar-benar terlihat di layar.
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

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
        <Card>
          <Empty description={t("profile.noOrders")} className="py-8!">
            {/* Belum punya pesanan → ajak memesan paket wisata. */}
            <Button type="primary" onClick={() => router.push("/package")}>
              {t("profile.orderPackage")}
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="flex flex-col gap-6!">
          {list.map((order) => (
            <Card
              key={order.id}
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
                    <CalendarOutlined className="text-foreground/40!" />
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
                      <CalendarOutlined className="text-foreground/40!" />
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
                              addDays(
                                item.dateSchedule!,
                                item.homestayTime ?? 1,
                              ),
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
                    <CalendarOutlined className="text-foreground/40!" />
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

              {/* Detail item pesanan di-collapse (default tertutup) —
                  ringkasan jadwal tetap terlihat di atas. */}
              <Collapse
                ghost
                size="small"
                className="mt-2! -mx-2!"
                expandIcon={({ isActive }) => (
                  <DownOutlined rotate={isActive ? 180 : 0} />
                )}
                items={[
                  {
                    key: "detail",
                    label: (
                      <span className="text-sm! font-medium!">
                        {t("profile.orderDetailCount")}
                      </span>
                    ),
                    children: (
                      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-black/[0.03] dark:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-foreground/60">
                          <span>{t("cart.package")}</span>
                          <span className="w-14 text-center">
                            {t("cart.qty")}
                          </span>
                          <span className="w-24 text-right">
                            {t("cart.price")}
                          </span>
                        </div>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 text-sm border-t border-black/5 dark:border-white/5"
                          >
                            <span className="font-medium">
                              {item.packageName}
                            </span>
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
                    ),
                  },
                ]}
              />

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
                ) : order.paymentStatus === "PAID" &&
                  !isReservationPassed(order) ? (
                  // Bukti pembayaran hanya tersedia selama reservasi belum
                  // dilewati — setelah hari pulang, unduhan disembunyikan.
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadInvoice(order.id)}
                  >
                    {t("profile.downloadReceipt")}
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sentinel infinite scroll + status pemuatan. */}
      {list.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {loadingMore && <Spin size="small" />}
          <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
          {!hasMore && (
            <p className="text-xs text-foreground/50">
              {t("profile.allLoaded", { n: totalOrders })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
