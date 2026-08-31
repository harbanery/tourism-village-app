"use client";

import Link from "next/link";
import { Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function SuccessConfirmationSection() {
  const { t } = useT();

  return (
    <div className="text-center">
      <CheckCircleFilled className="text-5xl text-[#0d7a5f]" />
      <h1 className="mt-4 text-2xl font-bold">{t("success.title")}</h1>
      <p className="mt-2 text-foreground/70">{t("success.message")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/profile/1">
          <Button>{t("success.goToProfile")}</Button>
        </Link>
        <Link href="/">
          <Button type="primary">{t("common.backToHome")}</Button>
        </Link>
      </div>
    </div>
  );
}
