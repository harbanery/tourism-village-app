"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Input, Rate, Spin } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Durasi idle di halaman sebelum dialihkan ke beranda (1 menit). */
const IDLE_TIMEOUT_MS = 60 * 1000;

/**
 * Ulasan setelah pembayaran — POST /api/web/testimonials
 * (status awal NONACTIVE, dimoderasi admin di menu Ulasan).
 *
 * Rate limit 24 jam (server):
 * - Sukses → tampilkan ucapan terima kasih (form tidak lagi tersedia).
 * - Cooldown (pernah mengirim < 24 jam) → form dinonaktifkan + countdown.
 * Idle 1 menit tanpa aktivitas → kembali ke beranda.
 */
export function ReviewSection() {
  const { t } = useT();
  const router = useRouter();
  const { message, notification } = App.useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /** null = sedang cek status; true = sudah terkirim; string = cooldown s/d waktu ini. */
  const [reviewState, setReviewState] = useState<
    "checking" | "idle" | "submitted" | "cooldown"
  >("checking");
  const [cooldownEnd, setCooldownEnd] = useState<string | null>(null);
  // Diisi saat mount (effect) — Date.now() tidak boleh dipanggil saat render.
  const [nowTs, setNowTs] = useState<number | null>(null);

  // Cek status ulasan user (sudah mengirim dalam 24 jam terakhir?).
  useEffect(() => {
    let active = true;
    fetch("/api/web/testimonials")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.data?.canReview === false) {
          setCooldownEnd(json.data.cooldownEnd ?? null);
          setReviewState("cooldown");
        } else {
          setReviewState("idle");
        }
      })
      .catch(() => {
        if (active) setReviewState("idle");
      });
    return () => {
      active = false;
    };
  }, []);

  // Countdown cooldown: perbarui "sekarang" tiap detik via interval (tanpa
  // setState sinkron di body effect — tick pertama ditangani interval 0ms).
  useEffect(() => {
    if (reviewState !== "cooldown") return;
    const tick = () => setNowTs(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [reviewState]);

  // Idle 1 menit → langsung replace ke beranda.
  // Aktivitas apa pun (mouse/keyboard/scroll) mereset timer.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      router.replace("/");
    }, IDLE_TIMEOUT_MS);
  }, [router]);

  useEffect(() => {
    resetIdleTimer();
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer),
      );
    };
  }, [resetIdleTimer]);

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
      if (!json.success) {
        if (json.error === "REVIEW_COOLDOWN") {
          notification.warning({
            title: t("notif.reviewCooldownTitle"),
            description: t("notif.reviewCooldown"),
            placement: "bottomRight",
          });
          setReviewState("cooldown");
          setCooldownEnd(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
          return;
        }
        throw new Error(json.error);
      }
      // Sukses → ucapan terima kasih; tidak bisa mengisi ulasan lagi.
      setReviewState("submitted");
    } catch {
      message.error(t("notif.error"));
    } finally {
      setSubmitting(false);
    }
  };

  /** Sisa cooldown dalam format --:--:-- (jam:menit:detik). */
  const cooldownText = (() => {
    if (!cooldownEnd || nowTs === null) return "--:--:--";
    const diff = Math.max(0, new Date(cooldownEnd).getTime() - nowTs);
    const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60_000) / 1000)).padStart(2, "0");
    return `${h}:${m}:${s}`;
  })();

  if (reviewState === "checking") {
    return (
      <div className="mt-10 flex justify-center border-t border-black/5 pt-6 dark:border-white/10">
        <Spin />
      </div>
    );
  }

  // Sudah mengirim ulasan → terima kasih (tidak bisa isi lagi).
  if (reviewState === "submitted") {
    return (
      <div className="mt-10 border-t border-black/5 pt-6 text-center dark:border-white/10">
        <CheckCircleFilled className="text-4xl text-primary" />
        <h2 className="mt-3 font-semibold">{t("success.review.thanks.title")}</h2>
        <p className="mt-1 text-sm text-foreground/60">
          {t("success.review.thanks.message")}
        </p>
      </div>
    );
  }

  // Cooldown 24 jam → form dikunci, tampilkan sisa waktu.
  if (reviewState === "cooldown") {
    return (
      <div className="mt-10 border-t border-black/5 pt-6 text-center dark:border-white/10">
        <h2 className="font-semibold">{t("success.review.cooldownTitle")}</h2>
        <p className="mt-1 text-sm text-foreground/60">
          {t("success.review.cooldownMessage")}
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-primary">
          {cooldownText}
        </p>
      </div>
    );
  }

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
