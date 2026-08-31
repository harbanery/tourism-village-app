"use client";

import { use } from "react";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Avatar, Button, Card, List } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyOrders, dummyUsers } from "@/models";
import { formatDate, formatRupiah } from "@/utils/format";

export default function ProfilPage({ params }: PageProps<"/profil/[id]">) {
  const { id } = use(params);
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const user = dummyUsers.find((u) => u.id === Number(id));
  const orders = dummyOrders.filter((o) => o.userId === Number(id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[320px_1fr]">
      <Card>
        <div className="flex flex-col items-center text-center">
          <Avatar size={96} src={user?.avatar} icon={<UserOutlined />} />
          <h1 className="mt-4 text-xl font-bold">{user?.name ?? "-"}</h1>
          <p className="text-foreground/60">{user?.email}</p>
        </div>
        <div className="mt-6 divide-y divide-black/5 dark:divide-white/10">
          {[
            [t("common.name"), user?.name],
            [t("common.email"), user?.email],
            [t("common.phone"), user?.phone ?? "-"],
            [t("profile.gender"), user?.gender ? t(`profile.${user.gender}`) : "-"],
            [t("profile.birthDate"), user?.birthDate ? formatDate(user.birthDate, locale) : "-"],
            [t("profile.address"), user?.address ?? "-"],
          ].map(([label, value]) => (
            <div key={String(label)} className="py-3 flex justify-between gap-4 text-sm">
              <span className="text-foreground/60">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold">{t("profile.orderHistory")}</h2>
        {orders.length === 0 ? (
          <Card className="mt-4">
            <p className="text-foreground/60">{t("profile.noOrders")}</p>
          </Card>
        ) : (
          <List
            className="mt-4"
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
            dataSource={orders}
            renderItem={(order) => (
              <List.Item>
                <Card title={`${t("common.total")}: ${formatRupiah(order.totalPrice)}`}>
                  <p className="text-sm text-foreground/70">
                    {t("common.date")}: {formatDate(order.dateOrder, locale, true)}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {t("profile.departureDate")}: {formatDate(order.dateSchedule, locale)}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {t("checkout.homestay")}:{" "}
                    {order.homestay === "yes"
                      ? `${t("common.yes")} (${order.homestayTime} ${t("checkout.homestayDays")})`
                      : t("common.no")}
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.packageName} × {item.quantity} — {formatRupiah(item.price)}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4">{t("profile.downloadReceipt")}</Button>
                </Card>
              </List.Item>
            )}
          />
        )}
        <Link href="/" className="inline-block mt-6">
          <Button>{t("common.backToHome")}</Button>
        </Link>
      </div>
    </div>
  );
}
