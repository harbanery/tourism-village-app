"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "antd";
import { useT } from "@/components/i18n/LocaleProvider";
import Analytics from "@/components/ui/vercel/analytics";

/** Key penyimpanan persetujuan (localStorage). */
const STORAGE_KEY = "cookie-consent";

type Consent = "accepted" | "essential";

const emptySubscribe = () => () => {};

/** Baca pilihan tersimpan (client); null bila belum/bukan nilai valid. */
function readStoredConsent(): Consent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "accepted" || stored === "essential" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Banner persetujuan cookie (rekomendasi 2.5, UU PDP): analytics hanya
 * dimuat SETELAH user menyetujui. "Hanya Esensial" = tanpa analytics.
 * Pilihan disimpan di localStorage; pembacaan memakai useSyncExternalStore
 * (pola useMounted) agar aman-SSR tanpa setState dalam effect.
 */
export function CookieConsent() {
  const { t } = useT();
  // Override setelah user memilih di sesi ini (localStorage ikut ditulis).
  const [manual, setManual] = useState<Consent | null>(null);

  const stored = useSyncExternalStore(
    emptySubscribe,
    readStoredConsent,
    () => null,
  );
  const consent = manual ?? stored;

  const choose = (value: Consent) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Private mode dsb. — anggap pilihan berlaku untuk sesi ini saja.
    }
    setManual(value);
  };

  return (
    <>
      {/* Analytics (Vercel) hanya aktif setelah disetujui. */}
      {consent === "accepted" && <Analytics />}

      {consent === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
          <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-black/10 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center dark:border-white/10 dark:bg-neutral-900/95">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t("consent.title")}</p>
              <p className="mt-1 text-xs text-foreground/60">
                {t("consent.text")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="small" onClick={() => choose("essential")}>
                {t("consent.essential")}
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => choose("accepted")}
              >
                {t("consent.accept")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
