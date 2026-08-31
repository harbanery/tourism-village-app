"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Avatar, Button, Card } from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyAdmins } from "@/models";

// Slicing: admin yang login masih dummy (admin pertama).
const currentAdmin = dummyAdmins[0];

export default function AdminProfilePage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="inline-block mb-4">
        <Button icon={<ArrowLeftOutlined />}>{t("admin.dashboard")}</Button>
      </Link>
      <Card>
        <div className="flex flex-col items-center text-center">
          <Avatar
            size={96}
            src={currentAdmin?.avatar}
            icon={<UserOutlined />}
          />
          <h1 className="mt-4 text-xl font-bold">
            {currentAdmin?.name ?? "-"}
          </h1>
          <p className="text-foreground/60">@{currentAdmin?.username}</p>
        </div>
        <div className="mt-6 divide-y divide-black/5 dark:divide-white/10">
          {[
            [t("common.name"), currentAdmin?.name ?? "-"],
            [t("admin.accounts.username"), currentAdmin?.username ?? "-"],
            [t("common.email"), currentAdmin?.email ?? "-"],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="py-3 flex justify-between gap-4 text-sm"
            >
              <span className="text-foreground/60">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
        <Button className="mt-4" block>
          {t("profile.editProfile")}
        </Button>
        <Button className="mt-2" block danger>
          {t("nav.logout")}
        </Button>
      </Card>
    </div>
  );
}
