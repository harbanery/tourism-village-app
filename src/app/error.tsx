"use client";

import { Button, Result } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export default function RootError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
