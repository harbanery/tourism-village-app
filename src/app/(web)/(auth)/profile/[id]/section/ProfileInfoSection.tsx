"use client";

import { useMounted } from "@/helpers/useMounted";
import { Avatar, Card } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import type { User } from "@/models";
import { formatDate } from "@/utils/format";

export function ProfileInfoSection({ user }: { user: User | null }) {
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
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
  );
}
