"use client";

import { useRouter } from "next/navigation";
import { Button, Result } from "antd";
import {
  translations,
  DEFAULT_LOCALE,
  translate,
} from "@/components/i18n/translations";

/**
 * 404 khusus segmen admin — background sama dengan konten panel (antd
 * colorBgLayout: #f5f5f5 light / #000000 dark), bukan palet web.
 * Navigasi kembali ke dashboard via useRouter (pola not-found root).
 */
export default function AdminNotFound() {
  const router = useRouter();
  const dict = translations[DEFAULT_LOCALE];
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 dark:bg-[#000000]">
      <Result
        status="404"
        title="404"
        subTitle={translate(dict, "notFound.subtitle")}
        extra={
          <Button type="primary" onClick={() => router.push("/admin")}>
            {translate(dict, "notFound.backAdmin")}
          </Button>
        }
      />
    </div>
  );
}
