"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Konfirmasi pesanan sukses — link profil mengikuti sesi login. */
export function ConfirmationSection() {
  const { t } = useT();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/web/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success) setUserId(json.data.id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="text-center">
      <CheckCircleFilled className="text-5xl text-primary" />
      <h1 className="mt-4 text-2xl font-bold">{t("success.title")}</h1>
      <p className="mt-2 text-foreground/70">{t("success.message")}</p>
      <div className="mt-6 flex justify-center gap-3">
        {userId !== null && (
          <Link href={`/profile/${userId}`}>
            <Button>{t("success.goToProfile")}</Button>
          </Link>
        )}
        <Link href="/">
          <Button type="primary">{t("common.backToHome")}</Button>
        </Link>
      </div>
    </div>
  );
}
