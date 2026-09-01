import { Button, Result } from "antd";
import Link from "next/link";
import { translations, DEFAULT_LOCALE, translate } from "@/components/locale/translations";

/** 404 global — statis, terjemahan diambil dari locale default. */
export default function NotFound() {
  const dict = translations[DEFAULT_LOCALE];
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Result
        status="404"
        title="404"
        subTitle={translate(dict, "notFound.subtitle")}
        extra={
          <Button type="primary">
            <Link href="/">{translate(dict, "notFound.back")}</Link>
          </Button>
        }
      />
    </div>
  );
}
