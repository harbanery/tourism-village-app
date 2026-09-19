"use client";

import { Button } from "antd";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { GoogleOutlined } from "@ant-design/icons";

/**
 * Tombol Google SSO — **Button antd murni** (bukan tombol hasil render
 * Google Identity Services). Alurnya OAuth redirect penuh: klik →
 * /api/web/auth/google/start → consent Google di tab yang sama → balik ke
 * callback. Tanpa popup GIS sehingga tidak kena blokir popup/otorisasi
 * ("flowName=GeneralOAuthFlow") dan tanpa script pihak ketiga.
 *
 * - mode="login": tombol di /login & /register (`redirect` = tujuan
 *   setelah sukses).
 * - mode="link": tombol di settings — menautkan Google ke akun aktif.
 */
export function GoogleButton({
  enabled,
  redirectTo = "/profile",
  mode = "login",
}: {
  /** Google SSO aktif (server: GOOGLE_CLIENT_ID + SECRET terisi). */
  enabled: boolean;
  /** Path internal tujuan setelah login sukses (mode login). */
  redirectTo?: string;
  /** "login" (form auth) atau "link" (settings → tautkan akun). */
  mode?: "login" | "link";
}) {
  const { t } = useT();
  const mounted = useMounted();

  if (!mounted) return null;

  const href =
    mode === "link"
      ? "/api/web/auth/google/start?mode=link"
      : `/api/web/auth/google/start?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <Button
        block
        disabled={!enabled}
        title={enabled ? undefined : t("auth.google.notConfigured")}
        onClick={() => window.location.assign(href)}
        icon={<GoogleOutlined />}
      >
        {mode === "link" ? t("settings.linked.link") : t("auth.google.button")}
      </Button>
      {!enabled && (
        <p className="text-xs text-foreground/50">
          {t("auth.google.notConfigured")}
        </p>
      )}
    </div>
  );
}
