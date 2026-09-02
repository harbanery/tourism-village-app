"use client";

import { useRouter } from "next/navigation";
import { Button, Result } from "antd";
import { translations, DEFAULT_LOCALE, translate } from "@/components/locale/translations";

/** 404 global — navigasi kembali ke home via useRouter (locale default). */
export default function NotFound() {
  const router = useRouter();
  const dict = translations[DEFAULT_LOCALE];
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Result
        status="404"
        title="404"
        subTitle={translate(dict, "notFound.subtitle")}
        extra={
          <Button type="primary" onClick={() => router.push("/")}>
            {translate(dict, "notFound.back")}
          </Button>
        }
      />
    </div>
  );
}
