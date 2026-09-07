"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Col, Rate, Row, Segmented, Statistic } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  DollarOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingOutlined,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import LoaderPage from "@/components/admin/loader";
import RevenueTrendChart from "@/components/admin/chart/RevenueTrendChart";
import OrdersStatusChart from "@/components/admin/chart/OrdersStatusChart";
import StatusDoughnutChart from "@/components/admin/chart/StatusDoughnutChart";
import TopPackagesChart from "@/components/admin/chart/TopPackagesChart";
import RatioDoughnutChart from "@/components/admin/chart/RatioDoughnutChart";
import { formatRupiah } from "@/utils/format";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

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
    paidBuyersTotal: number;
  };
  timeseries: { day: string; revenue: number; orders: number }[];
  statusSeries: { day: string; status: PaymentStatus; count: number }[];
  statusTotals: { status: PaymentStatus; count: number }[];
  topPackages: { name: string; quantity: number; revenue: number }[];
  homestay: { type: "stay" | "day"; value: number }[];
  topBuyers: { name: string; email: string; orders: number; spent: number }[];
}

interface DashboardData {
  activePlaces: number;
  totalPlaces: number;
  /** Tempat wisata yang sudah punya minimal satu paket. */
  placesWithPackages: number;
  totalPackages: number;
  totalOrders: number;
  /** Rata-rata rating ulasan aktif (null bila belum ada ulasan). */
  ratingAvg: number | null;
  totalTestimonials: number;
  analytics: Analytics;
}

/** Panah persentase perubahan bulan ini vs bulan lalu. */
function Delta({ pct }: { pct: number | null }) {
  const { t } = useT();
  if (pct === null) return null;
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
  const { t } = useT();
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

  const statusLabels: Record<string, string> = {
    PAID: t("payment.status.PAID"),
    PENDING: t("payment.status.PENDING"),
    FAILED: t("payment.status.FAILED"),
    CANCELED: t("payment.status.CANCELED"),
  };

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

      {/* Ringkasan konten di paling atas: tempat wisata berpaket,
          pendapatan total, total pembeli, dan rating ulasan. */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.tourism.places")}
              value={data?.placesWithPackages ?? 0}
              prefix={<ShopOutlined className="text-primary!" />}
              suffix={`/ ${data?.totalPlaces ?? 0}`}
            />
            <div className="mt-1 text-xs text-foreground/50">
              {t("admin.dashboard.placesWithPackages")}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.ordersMonth")}
              value={kpi?.ordersThisMonth ?? 0}
              prefix={<ShoppingOutlined className="text-primary!" />}
            />
            <Delta pct={kpi?.ordersDeltaPct ?? null} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.buyersTotal")}
              value={kpi?.paidBuyersTotal ?? 0}
              prefix={<TeamOutlined className="text-primary!" />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.ratingSummary")}
              value={data?.ratingAvg ?? 0}
              suffix="/ 5"
              prefix={<StarOutlined className="text-primary!" />}
            />
            <div className="mt-1 flex items-center gap-2">
              <Rate
                disabled
                allowHalf
                value={data?.ratingAvg ?? 0}
                className="text-sm!"
              />
              <span className="text-xs text-foreground/50">
                {t("admin.dashboard.ratingReviews", {
                  n: data?.totalTestimonials ?? 0,
                })}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* KPI transaksi: fokus pemesanan (pendapatan, order, AOV, sukses bayar) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.revenueMonth")}
              value={kpi?.revenueThisMonth ?? 0}
              formatter={(value) => formatRupiah(Number(value))}
              prefix={<DollarOutlined className="text-primary!" />}
            />
            <Delta pct={kpi?.revenueDeltaPct ?? null} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.revenueTotal")}
              value={kpi?.revenueTotal ?? 0}
              formatter={(value) => formatRupiah(Number(value))}
              prefix={<BankOutlined className="text-primary!" />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.aov")}
              value={kpi?.aov ?? 0}
              formatter={(value) => formatRupiah(Number(value))}
              prefix={<RiseOutlined className="text-primary!" />}
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
              prefix={<ArrowUpOutlined className="text-primary!" />}
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
        <RevenueTrendChart data={analytics?.timeseries ?? []} />
      </Card>

      {/* Order per hari dipecah per status (kesehatan funnel dari waktu ke waktu) */}
      <Card title={t("admin.dashboard.ordersTrend")}>
        <OrdersStatusChart
          data={analytics?.statusSeries ?? []}
          statusLabels={statusLabels}
        />
      </Card>

      <Row gutter={[16, 16]}>
        {/* Komposisi status pembayaran periode */}
        <Col xs={24} lg={8}>
          <Card title={t("admin.dashboard.statusComposition")}>
            <StatusDoughnutChart
              data={analytics?.statusTotals ?? []}
              statusLabels={statusLabels}
            />
          </Card>
        </Col>

        {/* Paket terlaris (PAID) — dasar keputusan promo */}
        <Col xs={24} lg={16}>
          <Card title={t("admin.dashboard.topPackages")}>
            <TopPackagesChart data={analytics?.topPackages ?? []} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Pengguna yang sering membeli (top 5) — indikator loyalitas */}
        <Col xs={24} lg={12}>
          <Card title={t("admin.dashboard.buyers")}>
            {(analytics?.topBuyers ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-foreground/50">
                {t("admin.dashboard.noBuyers")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(analytics?.topBuyers ?? []).map((buyer, index) => (
                  <div key={buyer.email} className="flex items-center gap-3">
                    {/* Peringkat — juara 1 di-highlight emas. */}
                    <span
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        index === 0
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400"
                          : "bg-primary/10 text-primary",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {buyer.name}
                      </div>
                      <div className="truncate text-xs text-foreground/50">
                        {buyer.email}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-medium">
                        {formatRupiah(buyer.spent)}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {t("admin.dashboard.buyerOrders", { n: buyer.orders })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Rasio item menginap vs tidak (PAID) */}
        <Col xs={24} lg={12}>
          <Card title={t("admin.dashboard.homestayRatio")}>
            <RatioDoughnutChart
              segments={(analytics?.homestay ?? []).map((row) => ({
                label: t(
                  row.type === "stay"
                    ? "admin.dashboard.stayItem"
                    : "admin.dashboard.dayItem",
                ),
                value: row.value,
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
