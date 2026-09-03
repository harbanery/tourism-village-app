"use client";

import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, Tag } from "antd";
import {
  CheckCircleOutlined,
  LeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import type { User } from "@/models";
import { formatDate } from "@/utils/format";
import type { ProfileSettings } from "../page";

export function ProfileInfoSection({
  user,
  settings,
}: {
  user: User | null;
  settings: ProfileSettings;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <Card className="flex flex-col!">
      {/* Kembali ke beranda — di bagian atas kartu kiri. */}
      <Button
        size="small"
        type="text"
        icon={<LeftOutlined />}
        onClick={() => router.push("/")}
        className="mb-4! self-start! px-1! -ml-1!"
      >
        {t("common.backToHome")}
      </Button>

      <div className="flex flex-col items-center text-center">
        <Badge
          dot
          color={settings.emailVerified ? "#52c41a" : "#faad14"}
          offset={[-8, 84]}
          title={
            settings.emailVerified
              ? t("profile.emailVerified")
              : t("profile.emailNotVerified")
          }
        >
          <Avatar size={96} src={user?.avatar} icon={<UserOutlined />} />
        </Badge>
        <h1 className="mt-4 text-xl font-bold">{user?.name ?? "-"}</h1>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-foreground/60">{user?.email}</p>
          {settings.emailVerified ? (
            <Tag
              color="success"
              icon={<CheckCircleOutlined />}
              className="m-0!"
            >
              {t("profile.verified")}
            </Tag>
          ) : (
            <Tag color="warning" className="m-0!">
              {t("profile.emailNotVerified")}
            </Tag>
          )}
        </div>
        {settings.pendingEmail && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {t("profile.pendingEmail", { email: settings.pendingEmail })}
          </p>
        )}
      </div>

      <div className="mt-6 flex-1 divide-y divide-black/5 overflow-y-auto dark:divide-white/10">
        {[
          [t("common.name"), user?.name],
          [t("common.email"), user?.email],
          [t("common.phone"), user?.phone ?? "-"],
          [
            t("profile.gender"),
            user?.gender ? t(`profile.${user.gender}`) : "-",
          ],
          [
            t("profile.birthDate"),
            user?.birthDate ? formatDate(user.birthDate, locale) : "-",
          ],
          [t("profile.address"), user?.address ?? "-"],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="py-3 flex justify-between gap-4 text-sm"
          >
            <span className="shrink-0 text-foreground/60">{label}</span>
            <span className="min-w-0 break-words text-right font-medium">
              {value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
