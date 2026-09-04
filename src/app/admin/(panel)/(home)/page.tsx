"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, Col, Row, Segmented, Spin, Statistic, Tag } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CommentOutlined,
  DollarOutlined,
  FileTextOutlined,
  MinusOutlined,
  RiseOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import LoaderPage from "@/components/admin/loader";
import { AdminTable } from "@/components/admin/table";
import { formatDate, formatRupiah } from "@/utils/format";

/** Grafik @ant-design/plots dimuat dinamis (canvas, client-only). */
const loadingChart = () => (
  <div className="flex h-72 items-center justify-center">
    <Spin />
  </div>
);
const AreaChart = dynamic(() => import("@ant-design/plots").then((m) => m.Area), {
  ssr: false,
  loading: loadingChart,
});
const ColumnChart = dynamic(
  () => import("@ant-design/plots").then((m) => m.Column),
  { ssr: false, loading: loadingChart },
);
const PieChart = dynamic(() => import("@ant-design/plots").then((m) => m.Pie), {
  ssr: false,
  loading: loadingChart,
});
const BarChart = dynamic(() => import("@ant-design/plots").then((m) => m.Bar), {
  ssr: false,
  loading: loadingChart,
});

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

/** Warna konsisten per status pembayaran di semua grafik. */
const STATUS_COLORS: Record<PaymentStatus, string> = {
  PAID: "#0d7a5f",
  PENDING: "#faad14",
  FAILED: "#ff4d4f",
  CANCELED: "#8c8c8c",
};

const STATUS_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "gold",
  FAILED: "red",
  CANCELED: "default",
};

interface Analytics {
  period: number;
  kpi: {
    revenueTotal: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueDeltaPct: number | null;
    ordersThisMonth: number;
    ordersLastMonth: number;
    ordersDeltaPct: number | null;
    aov: number;
    paidTotal: number;
    successRate: number;
    pendingActive: number;
    canceledTotal: number;
  };
  timeseries: { day: string; revenue: number; orders: number }[];
  statusSeries: { day: string; status: PaymentStatus; count: number }[];
  statusTotals: { status: PaymentStatus; count: number }[];
  topPackages: { name: string; quantity: number; revenue: number }[];
  homestay: { type: "stay" | "day"; value: number }[];
  buyers: { type: "new" | "returning"; value: number }[];
}

interface DashboardData {
  activePlaces: number;
  totalPlaces: number;
  totalPackages: number;
  totalOrders: number;
  totalTestimonials: number;
  recentOrders: {
    id: number;
    userName: string;
    dateOrder: string;
    dateSchedule: string;
    totalPrice: number;
    paymentStatus: PaymentStatus;
  }[];
  analytics: Analytics;
}

/** Panah persentase perubahan bulan ini vs bulan lalu. */
function Delta({ pct }: { pct: number | null }) {
  const { t } = useT();
  if (pct === null)
    return <MinusOutlined className="text-xs text-foreground/50" />;
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span
      className={[
        "ml-2 text-xs font-medium",
        flat
          ? "text-foreground/50"
          : up
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400",
      ].join(" ")}
    >
      {flat ? (
        "0%"
      ) : (
        <>
          {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(pct)}%
        </>
      )}
      <span className="ml-1 font-normal text-foreground/50">
        {t("admin.dashboard.vsLastMonth")}
      </span>
    </span>
  );
}

export default function DashboardPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const [period, setPeriod] = useState<number>(30);
  const [fetching, setFetching] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async (days: number) => {
    try {
      const res = await fetch(`/api/admin/dashboard?period=${days}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchDashboard(period));
  }, [fetchDashboard, period]);

  if (!mounted || fetching) return <LoaderPage />;

  const analytics = data?.analytics;
  const kpi = analytics?.kpi;

  const statusLabel = (status: PaymentStatus) => t(`payment.status.${status}`);
  const statusPalette =
    analytics?.statusTotals.map((row) => statusLabel(row.status)) ?? [];
  const statusColorRange =
    analytics?.statusTotals.map((row) => STATUS_COLORS[row.status]) ?? [];

  const columns = [
    {
      title: t("common.date"),
      dataIndex: "dateOrder",
      key: "dateOrder",
      render: (v: string) => formatDate(v, locale, true),
    },
    { title: t("common.name"), dataIndex: "userName", key: "userName" },
    {
      title: t("admin.orders.departureDate"),
      dataIndex: "dateSchedule",
      key: "dateSchedule",
      render: (v: string) => formatDate(v, locale),
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
      title: t("common.status"),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (v: PaymentStatus) => (
        <Tag color={STATUS_TAG_COLORS[v]}>{statusLabel(v)}</Tag>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0! text-2xl font-bold">{t("admin.dashboard")}</h1>
        <Segmented
          value={period}
          onChange={(value) => setPeriod(value as number)}
          options={[
            { label: t("admin.dashboard.period7"), value: 7 },
            { label: t("admin.dashboard.period30"), value: 30 },
            { label: t("admin.dashboard.period90"), value: 90 },
          ]}
        />
      </div>

      {/* KPI transaksi: fokus pemesanan (pendapatan, order, AOV, sukses bayar) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.revenueMonth")}
              value={kpi?.revenueThisMonth ?? 0}
              formatter={(value) => formatRupiah(Number(value))}
              prefix={<DollarOutlined className="text-primary" />}
            />
            <Delta pct={kpi?.revenueDeltaPct ?? null} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.ordersMonth")}
              value={kpi?.ordersThisMonth ?? 0}
              prefix={<ShoppingOutlined className="text-primary" />}
            />
            <Delta pct={kpi?.ordersDeltaPct ?? null} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.aov")}
              value={kpi?.aov ?? 0}
              formatter={(value) => formatRupiah(Number(value))}
              prefix={<RiseOutlined className="text-primary" />}
            />
            <div className="mt-1 text-xs text-foreground/50">
              {t("admin.dashboard.paidTotal", { n: kpi?.paidTotal ?? 0 })}
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.successRate")}
              value={kpi?.successRate ?? 0}
              suffix="%"
              prefix={<ArrowUpOutlined className="text-primary" />}
            />
            <div className="mt-1 text-xs text-foreground/50">
              {t("admin.dashboard.pendingActive", {
                n: kpi?.pendingActive ?? 0,
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tren pendapatan (uang diterima per hari) */}
      <Card title={t("admin.dashboard.revenueTrend")}>
        <div className="h-72">
          <AreaChart
            data={analytics?.timeseries ?? []}
            xField="day"
            yField="revenue"
          />
        </div>
      </Card>

      {/* Order per hari dipecah per status (kesehatan funnel dari waktu ke waktu) */}
      <Card title={t("admin.dashboard.ordersTrend")}>
        <div className="h-72">
          <ColumnChart
            data={(analytics?.statusSeries ?? []).map((row) => ({
              ...row,
              status: statusLabel(row.status),
            }))}
            xField="day"
            yField="count"
            colorField="status"
            stack
            scale={{
              color: {
                domain: statusPalette,
                range: statusColorRange,
              },
            }}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Komposisi status pembayaran periode */}
        <Col xs={24} lg={8}>
          <Card title={t("admin.dashboard.statusComposition")}>
            <div className="h-64">
              <PieChart
                data={(analytics?.statusTotals ?? []).map((row) => ({
                  ...row,
                  status: statusLabel(row.status),
                }))}
                angleField="count"
                colorField="status"
                innerRadius={0.6}
                scale={{
                  color: {
                    domain: statusPalette,
                    range: statusColorRange,
                  },
                }}
              />
            </div>
          </Card>
        </Col>

        {/* Paket terlaris (PAID) — dasar keputusan promo */}
        <Col xs={24} lg={16}>
          <Card title={t("admin.dashboard.topPackages")}>
            <div className="h-64">
              <BarChart
                data={[...(analytics?.topPackages ?? [])].reverse()}
                xField="revenue"
                yField="name"
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Rasio item menginap vs tidak (PAID) */}
        <Col xs={24} lg={12}>
          <Card title={t("admin.dashboard.homestayRatio")}>
            <div className="h-64">
              <PieChart
                data={(analytics?.homestay ?? []).map((row) => ({
                  type: t(
                    row.type === "stay"
                      ? "admin.dashboard.stayItem"
                      : "admin.dashboard.dayItem",
                  ),
                  value: row.value,
                }))}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
              />
            </div>
          </Card>
        </Col>

        {/* Pembeli baru vs kembali — indikator kepuasan */}
        <Col xs={24} lg={12}>
          <Card title={t("admin.dashboard.buyers")}>
            <div className="h-64">
              <PieChart
                data={(analytics?.buyers ?? []).map((row) => ({
                  type: t(
                    row.type === "new"
                      ? "admin.dashboard.newBuyer"
                      : "admin.dashboard.returningBuyer",
                  ),
                  value: row.value,
                }))}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Ringkasan konten + order terbaru */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.tourism.places")}
              value={data?.activePlaces ?? 0}
              prefix={<BankOutlined className="text-primary" />}
              suffix={`/ ${data?.totalPlaces ?? 0}`}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.tourism.packages")}
              value={data?.totalPackages ?? 0}
              prefix={<FileTextOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.orders.title")}
              value={data?.totalOrders ?? 0}
              prefix={<ShoppingOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.reviews.title")}
              value={data?.totalTestimonials ?? 0}
              prefix={<CommentOutlined className="text-primary" />}
            />
          </Card>
        </Col>
      </Row>

      <Card title={t("admin.dashboard.recentOrders")}>
        <AdminTable
          dataSource={data?.recentOrders ?? []}
          columns={columns}
          pagination={false}
        />
      </Card>
    </div>
  );
}