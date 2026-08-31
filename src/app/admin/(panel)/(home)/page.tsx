"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Card, Col, Row, Statistic, Table, Tag } from "antd";
import {
  BankOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs, dummyOrders, dummyPackages, dummyPlaces, dummyTestimonials } from "@/models";
import { formatDate, formatRupiah } from "@/utils/format";

export default function DashboardPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const activePlaces = dummyPlaces.filter((p) => p.active === "yes").length;

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
      render: (v: number) => <span className="font-medium">{formatRupiah(v)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.dashboard")}</h1>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.tourism.places")}
              value={activePlaces}
              prefix={<BankOutlined className="text-primary" />}
              suffix={`/ ${dummyPlaces.length}`}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.tourism.packages")}
              value={dummyPackages.length}
              prefix={<FileTextOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.orders.title")}
              value={dummyOrders.length}
              prefix={<ShoppingOutlined className="text-primary" />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={t("admin.reviews.title")}
              value={dummyTestimonials.filter((r) => r.active === "yes").length}
              prefix={<StarOutlined className="text-primary" />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t("admin.orders.title")}
        extra={
          <Link href="/admin/order" className="text-primary hover:underline">
            {t("common.viewAll")}
          </Link>
        }
      >
        <Table
          dataSource={dummyOrders}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/70">
          <Tag color="green">{t("common.dummyDataNote")}</Tag>
          {dummyBlogs.length} {t("admin.blog.title").toLowerCase()} ·{" "}
          {t("footer.hoursValue")}
        </div>
      </Card>
    </div>
  );
}
