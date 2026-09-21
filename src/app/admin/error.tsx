"use client";

import { Button, Result } from "antd";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Error boundary khusus segmen admin — background sama dengan konten
 * panel (antd colorBgLayout: #f5f5f5 light / #000000 dark), bukan
 * palet web (pola error root).
 */
export default function AdminError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 dark:bg-[#000000]">
      <Result
        status="error"
        title={t("error.title")}
        subTitle={error.message || t("error.subtitle")}
        extra={
          <Button type="primary" onClick={reset}>
            {t("error.retry")}
          </Button>
        }
      />
    </div>
  );
}
