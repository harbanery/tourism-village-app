"use client";

import { useState } from "react";
import { Button, Input, Rate } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export function SuccessReviewSection() {
  const { t } = useT();
  const [rating, setRating] = useState(5);

  return (
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
  );
}
