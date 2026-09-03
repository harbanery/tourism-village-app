"use client";

import { useRouter } from "next/navigation";
import { Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

/** Konfirmasi pesanan sukses — link profil mengikuti sesi login. */
export function ConfirmationSection() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="text-center">
      <CheckCircleFilled className="text-5xl text-primary" />
      <h1 className="mt-4 text-2xl font-bold">{t("success.title")}</h1>
      <p className="mt-2 text-foreground/70">{t("success.message")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={() => router.push("/profile")}>
          {t("success.goToProfile")}
        </Button>
        <Button type="primary" onClick={() => router.push("/")}>
          {t("common.backToHome")}
        </Button>
      </div>
    </div>
  );
}
