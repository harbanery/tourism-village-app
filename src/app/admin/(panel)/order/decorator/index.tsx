"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Card, Input, Space, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { AdminTable } from "@/components/admin/table";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import LoaderPage from "@/components/admin/loader";
import { formatDate, formatRupiah } from "@/utils/format";
import OrderDetailDrawer from "./OrderDetailDrawer";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

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
 * QRIS, invoice) ada di drawer yang terbuka saat row diklik. */
const OrderDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { notification } = App.useApp();
  const [fetching, setFetching] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  /** Row yang drawer detailnya sedang terbuka (null = tertutup). */
  const [active, setActive] = useState<OrderRow | null>(null);

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

  const columns = [
    {
      // Order ID Midtrans (TOURISM-{uuid}{YYYYMMDD}) — identitas pesanan
      // menggantikan id internal (rekomendasi 2.3: pakai orderId).
      title: t("admin.orders.orderId"),
      dataIndex: "orderId",
      key: "orderId",
      render: (v: string) => (
        <Typography.Text copyable className="font-mono text-xs!">
          {v}
        </Typography.Text>
      ),
    },
    {
      title: t("common.date"),
      dataIndex: "dateOrder",
      key: "dateOrder",
      render: (v: string) => formatDate(v, locale, true),
    },
    {
      title: t("admin.orders.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (v: number) => (
        <span className="font-medium">{formatRupiah(v)}</span>
      ),
    },
    {
      // Judul kolom cukup "Status" (menutupi status pembayaran order).
      title: t("common.status"),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (v: PaymentStatus) => (
        <Tag color={PAYMENT_TAG_COLORS[v] ?? "default"}>
          {t(`payment.status.${v}`)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
      <Card
        extra={
          <Space wrap>
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
          columns={columns}
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: () => setActive(record),
          })}
        />
      </Card>

      {/* Detail lengkap pesanan terpilih (order, pemesan, log, QRIS, invoice). */}
      <OrderDetailDrawer
        order={active}
        open={!!active}
        onClose={() => setActive(null)}
      />
    </div>
  );
};

export default OrderDecorator;
