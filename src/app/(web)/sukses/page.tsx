"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card, Input, Rate } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export default function SuksesPage() {
  const { t } = useT();
  const [rating, setRating] = useState(5);
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <div className="text-center">
          <CheckCircleFilled className="text-5xl text-[#0d7a5f]" />
          <h1 className="mt-4 text-2xl font-bold">{t("success.title")}</h1>
          <p className="mt-2 text-foreground/70">{t("success.message")}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/profil/1">
              <Button>{t("success.goToProfile")}</Button>
            </Link>
            <Link href="/">
              <Button type="primary">{t("common.backToHome")}</Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-black/5 dark:border-white/10 pt-6">
          <h2 className="font-semibold">{t("success.review.title")}</h2>
          <div className="mt-3">
            <Rate value={rating} onChange={setRating} />
          </div>
          <Input.TextArea
            className="mt-3"
            rows={4}
            placeholder={t("success.review.comment")}
          />
          <Button type="primary" className="mt-3">
            {t("success.review.submit")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
