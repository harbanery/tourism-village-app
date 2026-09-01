"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Input, Rate } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

/**
 * Ulasan setelah pembayaran — POST /api/web/testimonials
 * (status awal NONACTIVE, dimoderasi admin di menu Ulasan).
 */
export function ReviewSection() {
  const { t } = useT();
  const router = useRouter();
  const { message } = App.useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      message.warning(t("notif.validationError"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/web/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      message.success(t("notif.reviewSubmitted"));
      setComment("");
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 border-t border-black/5 pt-6 dark:border-white/10">
      <h2 className="font-semibold">{t("success.review.title")}</h2>
      <div className="mt-3!">
        <Rate value={rating} onChange={setRating} />
      </div>
      <Input.TextArea
        className="mt-3!"
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("success.review.comment")}
      />
      <Button
        type="primary"
        className="mt-3!"
        loading={submitting}
        onClick={handleSubmit}
      >
        {t("success.review.submit")}
      </Button>
    </div>
  );
}
