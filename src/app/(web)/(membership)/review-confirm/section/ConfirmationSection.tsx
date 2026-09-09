"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { peekReviewAccess, consumeReviewAccess } from "@/helpers/reviewAccess";

/**
 * Konfirmasi pesanan sukses — halaman berlaku SEKALI: hanya bisa diakses
 * dengan tiket dari pembayaran berhasil (link profil mengikuti sesi login).
 * Kunjungan ulang tanpa tiket (back/refresh/URL langsung) → beranda.
 */
export function ConfirmationSection() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  // Peek tanpa menghapus (aman StrictMode); konsumsi di effect.
  const [allowed] = useState(() => peekReviewAccess());
  useEffect(() => {
    if (!allowed) {
      router.replace("/");
      return;
    }
    consumeReviewAccess();
  }, [allowed, router]);
  if (!mounted || !allowed) return null;

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
