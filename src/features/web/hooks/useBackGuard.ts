"use client";

import { useEffect, useRef } from "react";
import { App } from "antd";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Guard tombol back browser (dipakai halaman checkout & payment):
 * saat user menekan back, sebuah state dummy terdorong lebih dulu sehingga
 * halaman TIDAK langsung tinggal — malah memunculkan modal konfirmasi.
 * - "Ya, kembali"  → history.back() kedua kali = benar-benar pergi.
 * - "Tetap di sini" → state dummy didorong kembali, halaman tetap aman.
 *
 * Catatan: guard ini menangani back dalam-aplikasi (popstate). Refresh/
 * tutup tab ditangani terpisah oleh beforeunload bila diperlukan.
 */
export function useBackGuard(active = true): void {
  const { t } = useT();
  const { modal } = App.useApp();
  const deciding = useRef(false);

  useEffect(() => {
    if (!active) return;

    // State penanda — keberadaannya membuat back pertama memicu popstate
    // (event ini) alih-alih navigasi meninggalkan halaman.
    const pushGuardState = () => {
      window.history.pushState({ __backGuard: true }, "");
    };
    pushGuardState();

    const onPopState = () => {
      if (deciding.current) return; // Modal sudah terbuka — abaikan.
      deciding.current = true;
      modal.confirm({
        title: t("guard.backTitle"),
        content: t("guard.backContent"),
        okText: t("guard.backConfirm"),
        cancelText: t("guard.cancel"),
        okButtonProps: { danger: true },
        onOk: () => {
          deciding.current = false;
          // Pop kedua: user diizinkan pergi ke halaman sebelumnya.
          window.history.back();
        },
        onCancel: () => {
          deciding.current = false;
          // Tetap di halaman — dorong ulang state penanda.
          pushGuardState();
        },
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
