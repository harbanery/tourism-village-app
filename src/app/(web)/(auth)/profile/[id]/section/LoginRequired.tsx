"use client";

import Link from "next/link";
import { Card, Button } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";

export function LoginRequired() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-xl font-bold text-center">
          {t("auth.login.requiredTitle")}
        </h1>
        <p className="mt-2 text-center text-foreground/60">
          {t("auth.login.requiredDesc")}
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/login">
            <Button type="primary" icon={<LoginOutlined />}>
              {t("nav.login")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
