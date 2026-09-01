"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table } from "antd";
import {
  BankOutlined,
  CommentOutlined,
  FileTextOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import LoaderPage from "@/components/admin/loader";
import { formatDate, formatRupiah } from "@/utils/format";

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
  }[];
}

export default function DashboardPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const [fetching, setFetching] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchDashboard);
  }, [fetchDashboard]);

  if (!mounted || fetching) return <LoaderPage />;

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
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>

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
        <Table
          dataSource={data?.recentOrders ?? []}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}
