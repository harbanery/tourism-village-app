"use client";

import { useEffect, useRef, useState } from "react";

/** Arah masuk animasi (posisi awal elemen sebelum terlihat). */
export type RevealDirection = "up" | "down" | "left" | "right" | "zoom";

/** Posisi awal per arah — elemen bergeser masuk ke tempatnya. */
const HIDDEN_OFFSET: Record<RevealDirection, string> = {
  up: "translate-y-10",
  down: "-translate-y-10",
  left: "-translate-x-10",
  right: "translate-x-10",
  zoom: "scale-95",
};

/**
 * Reveal — animasi muncul saat elemen masuk viewport (pola AOS via
 * IntersectionObserver, tanpa library). Selalu merender elemen `div`
 * sebagai parent: konten apa pun (termasuk komponen antd seperti Card)
 * dibungkus div ini sehingga transisi tidak bentrok dengan style antd.
 *
 * - `direction`: arah masuk (default "up" — muncul dari bawah saat
 *   scroll ke bawah, sesuai permintaan).
 * - `delay`: jeda stagger antar elemen (ms) via transition-delay.
 * - `once`: animasi sekali saja (default); false = mengulang saat
 *   elemen keluar-masuk viewport.
 * Hormat `prefers-reduced-motion`: tanpa animasi, langsung tampil.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  once = true,
  className = "",
}: {
  children: React.ReactNode;
  /** Arah animasi masuk. */
  direction?: RevealDirection;
  /** Jeda sebelum transisi dimulai (ms) — untuk efek stagger. */
  delay?: number;
  /** Sekali tampil saja (default) atau berulang tiap masuk viewport. */
  once?: boolean;
  /** Class tambahan untuk div pembungkus (mis. tinggi grid). */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion / browser tanpa IO → tampil langsung tanpa animasi
    // (lewat rAF — tanpa setState sinkron di body effect).
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={[
        "transition-[opacity,transform] duration-700 ease-out will-change-transform",
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : `opacity-0 ${HIDDEN_OFFSET[direction]}`,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
