"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Card,
  Input,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { SearchOutlined, StopOutlined, SyncOutlined } from "@ant-design/icons";
import {
  AdminTable,
  FIXED_COLUMN_WIDTH,
  RowActions,
  dateSorter,
  numberSorter,
  textSorter,
} from "@/features/admin/components/ui/table";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { useAdminSession } from "@/features/admin/hooks/session";
import LoaderPage from "@/features/admin/components/ui/loader";
import { formatDate, formatRupiah } from "@/utils/helpers";
import OrderDetailDrawer from "./OrderDetailDrawer";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

/** Interval auto refresh data order (ms). */
const AUTO_REFRESH_MS = 5 * 60 * 1000;

/** Persistensi switch auto refresh (localStorage) — pilihan admin
 *  bertahan antar kunjungan: jika sebelumnya menyala, tidak perlu
 *  menyalakan ulang. */
const AUTO_REFRESH_KEY = "tourism-village:adminOrderAutoRefresh";

/** Tahun (YYYY) dari tanggal ISO. */
function yearKey(iso: string): string {
  return iso.slice(0, 4);
}

/** Warna tag status pembayaran. */
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

export interface OrderRow {
  id: string;
  /** order_id Midtrans (TOURISM-{uuid}{YYYYMMDD}) — identitas order. */
  orderId: string;
  /** transaction_id Midtrans (audit, rekomendasi 2.3). */
  transactionId: string | null;
  /** URL gambar QR dari Core API (ditampilkan di drawer detail). */
  qrisImageUrl: string | null;
  dateOrder: string;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  status: "ACTIVE" | "NONACTIVE";
  user: { id: string; name: string; email: string; phone: string | null };
  items: {
    id: string;
    quantity: number;
    price: number;
    /** Jadwal per paket (null untuk data lama — fallback agregat order). */
    dateSchedule?: string | null;
    homestay?: boolean;
    homestayTime?: number | null;
    package: { name: string };
  }[];
  /** Log transisi status pembayaran (kronologis). */
  logs: {
    id: string;
    fromStatus: PaymentStatus;
    toStatus: PaymentStatus;
    createdAt: string;
  }[];
}

/** Menu pemesanan — tabel ringkas; detail lengkap (pemesan, item, log,
 * QRIS, invoice) ada di drawer yang terbuka saat row diklik. Kolom
 * opsi (khusus MASTER — role selain master tidak melihat kolomnya dan
 * API menolak aksinya 403) memuat batalkan order (hanya PENDING) dan
 * sinkronkan status Midtrans (tersembunyi saat refresh otomatis aktif
 * karena data sudah dimuat ulang berkala). */
const OrderDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { notification, modal } = App.useApp();
  const { session } = useAdminSession();
  const [fetching, setFetching] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  /** Id row yang drawer detailnya sedang terbuka (null = tertutup). */
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Auto refresh data order tiap 5 menit — state tersimpan di
   *  localStorage sehingga tetap aktif pada kunjungan berikutnya. */
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTO_REFRESH_KEY) === "1";
  });
  /** Id row yang sedang disinkronkan ke Midtrans (disable item menunya). */
  const [syncingId, setSyncingId] = useState<string | null>(null);

  /** Kolom opsi hanya untuk MASTER (selain master: tidak muncul/akses). */
  const isMaster = session?.role === "MASTER";

  /**
   * Row aktif di-derive dari data terbaru — setelah aksi kolom opsi
   * (cancel/sinkron Midtrans) memuat ulang tabel, tag status + log di
   * drawer langsung memakai versi terbaru tanpa sinkronisasi manual.
   */
  const active = useMemo(
    () => orders.find((order) => order.id === activeId) ?? null,
    [orders, activeId],
  );

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
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
    void Promise.resolve().then(fetchOrders);
  }, [fetchOrders]);

  // Auto refresh: selama aktif, data order dimuat ulang tiap 5 menit.
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      void fetchOrders();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchOrders]);

  /** Pesan error standar untuk aksi kolom opsi (kode error API → locale). */
  const actionError = (error: unknown): string => {
    switch (error) {
      case "NOT_PENDING":
        return t("admin.orders.cancelNotPending");
      case "ALREADY_PAID":
        return t("admin.orders.cancelAlreadyPaid");
      case "Forbidden":
        return t("admin.orders.masterOnly");
      case "MIDTRANS_UNAVAILABLE":
        return t("admin.orders.midtransUnavailable");
      default:
        return t("notif.fetchFailed");
    }
  };

  const notifyError = (description: string) =>
    notification.error({
      title: t("notif.error"),
      description,
      placement: "bottomRight",
    });

  /** Batalkan order manual (MASTER + PENDING) — konfirmasi modal dulu. */
  const confirmCancel = (order: OrderRow) => {
    modal.confirm({
      title: t("admin.orders.cancelConfirmTitle"),
      content: t("admin.orders.cancelConfirmContent", {
        orderId: order.orderId,
      }),
      okButtonProps: { danger: true },
      okText: t("admin.orders.cancelOrder"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          const res = await fetch(`/api/admin/orders/${order.id}/cancel`, {
            method: "POST",
          });
          const result = await res.json();
          if (!result.success) {
            notifyError(actionError(result.error));
            // Status sudah bergeser di Midtrans → muat data terbaru.
            if (result.error === "ALREADY_PAID") void fetchOrders();
            return;
          }
          notification.success({
            title: t("notif.success"),
            description: t("admin.orders.cancelSuccess"),
            placement: "bottomRight",
          });
          void fetchOrders();
        } catch {
          notifyError(t("admin.orders.cancelFailed"));
        }
      },
    });
  };

  /** Sinkronkan status pembayaran row dengan status transaksi Midtrans. */
  const handleSync = async (order: OrderRow) => {
    setSyncingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/sync`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) {
        notifyError(actionError(result.error));
        return;
      }
      if (result.data.changed) {
        notification.success({
          title: t("notif.success"),
          description: t("admin.orders.syncSuccess"),
          placement: "bottomRight",
        });
        void fetchOrders();
      } else {
        notification.info({
          title: t("notif.success"),
          description: t("admin.orders.syncNoChange"),
          placement: "bottomRight",
        });
      }
    } catch {
      notifyError(t("admin.orders.syncFailed"));
    } finally {
      setSyncingId(null);
    }
  };

  // Pencarian tetap menyertakan email/no. telepon & kode order meskipun
  // kolomnya tidak ditampilkan semua (takeout kolom, bukan fitur cari).
  const filtered = useMemo(
    () =>
      orders.filter((order) =>
        [order.user?.name, order.user?.email, order.user?.phone, order.orderId]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [orders, query],
  );

  if (!mounted || fetching) return <LoaderPage />;

  // Opsi filter tahun pemesanan dari data yang ada (terbaru dulu).
  const yearOptions = [...new Set(orders.map((o) => yearKey(o.dateOrder)))]
    .sort()
    .reverse()
    .map((year) => ({ text: year, value: year }));

  const columns = [
    {
      // Order ID Midtrans (TOURISM-{uuid}{YYYYMMDD}) — identitas pesanan
      // menggantikan id internal (rekomendasi 2.3: pakai orderId).
      title: t("admin.orders.orderId"),
      dataIndex: "orderId",
      key: "orderId",
      sorter: textSorter<OrderRow>((row) => row.orderId),
      render: (v: string) => (
        <Typography.Text copyable className="font-mono!">
          {v}
        </Typography.Text>
      ),
    },
    {
      title: t("common.date"),
      dataIndex: "dateOrder",
      key: "dateOrder",
      sorter: dateSorter<OrderRow>((row) => row.dateOrder),
      // Filter berdasarkan tahun pemesanan saja.
      filters: yearOptions,
      onFilter: (
        value: string | number | bigint | symbol | boolean,
        record: OrderRow,
      ) => yearKey(record.dateOrder) === value,
      render: (v: string) => formatDate(v, locale, true),
    },
    {
      title: t("admin.orders.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      sorter: numberSorter<OrderRow>((row) => row.totalPrice),
      render: (v: number) => (
        <span className="font-medium">{formatRupiah(v)}</span>
      ),
    },
    {
      // Judul kolom cukup "Status" (menutupi status pembayaran order).
      title: t("common.status"),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      sorter: textSorter<OrderRow>((row) => row.paymentStatus),
      filters: (
        ["PENDING", "PAID", "FAILED", "CANCELED"] as PaymentStatus[]
      ).map((status) => ({
        text: t(`payment.status.${status}`),
        value: status,
      })),
      onFilter: (
        value: string | number | bigint | symbol | boolean,
        record: OrderRow,
      ) => record.paymentStatus === value,
      render: (v: PaymentStatus) => (
        <Tag color={PAYMENT_TAG_COLORS[v] ?? "default"}>
          {t(`payment.status.${v}`)}
        </Tag>
      ),
    },
  ];

  /** Item menu kolom opsi per row (MASTER saja): batalkan order hanya
   *  untuk PENDING; sinkronkan status Midtrans hanya saat refresh
   *  otomatis mati (aktif = data sudah dimuat ulang berkala). */
  const actionItems = (record: OrderRow): MenuProps["items"] => {
    const items: NonNullable<MenuProps["items"]> = [];
    if (record.paymentStatus === "PENDING") {
      items.push({
        key: "cancel",
        icon: <StopOutlined />,
        danger: true,
        label: t("admin.orders.cancelOrder"),
        onClick: () => confirmCancel(record),
      });
    }
    if (!autoRefresh) {
      items.push({
        key: "sync",
        icon: <SyncOutlined />,
        disabled: syncingId === record.id,
        label: t("admin.orders.syncStatus"),
        onClick: () => void handleSync(record),
      });
    }
    return items;
  };

  // Kolom opsi hanya untuk MASTER — role selain master tidak melihat
  // kolom maupun aksinya (API memblokir aksi tulis dengan 403).
  const tableColumns = isMaster
    ? [
        ...columns,
        {
          title: t("common.actions"),
          key: "actions",
          width: FIXED_COLUMN_WIDTH.actions,
          align: "center" as const,
          fixed: "right" as const,
          render: (_: unknown, record: OrderRow) => (
            // Stop propagation agar klik tombol opsi tidak membuka drawer.
            <span
              className="inline-flex"
              onClick={(e) => e.stopPropagation()}
            >
              <RowActions items={actionItems(record)} />
            </span>
          ),
        },
      ]
    : columns;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
      <Card
        extra={
          <Space wrap>
            {/* Auto refresh: data order dimuat ulang tiap 5 menit;
                pilihan disimpan agar tetap aktif di kunjungan
                berikutnya. */}
            <Tooltip title={t("admin.orders.autoRefreshHint")}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                {t("admin.orders.autoRefresh")}
                <Switch
                  size="small"
                  checked={autoRefresh}
                  onChange={(checked) => {
                    setAutoRefresh(checked);
                    window.localStorage.setItem(
                      AUTO_REFRESH_KEY,
                      checked ? "1" : "0",
                    );
                  }}
                />
              </label>
            </Tooltip>

            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Space>
        }
      >
        {/* Klik row mana pun membuka drawer detail pemesanan. */}
        <AdminTable
          dataSource={filtered}
          columns={tableColumns}
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: () => setActiveId(record.id),
          })}
        />
      </Card>

      {/* Detail lengkap pesanan terpilih (order, pemesan, log, QRIS,
          kirim ulang email, unduh invoice). Status di drawer di-derive
          dari data terbaru — aksi kolom opsi (cancel/sinkron) yang
          memuat ulang tabel otomatis menyegarkan drawer yang terbuka. */}
      <OrderDetailDrawer
        order={active}
        open={!!active}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
};

export default OrderDecorator;
