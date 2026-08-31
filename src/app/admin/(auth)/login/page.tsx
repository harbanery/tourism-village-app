"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";

export default function AdminLoginPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full! max-w-md!">
        <h1 className="text-2xl font-bold text-center">
          {t("admin.login.title")}
        </h1>
        <p className="mt-1 text-center text-foreground/60">
          {t("admin.title")}
        </p>
        <Form layout="vertical" className="mt-6!">
          <Form.Item name="username" label={t("admin.accounts.username")}>
            <Input prefix={<UserOutlined />} placeholder="adminku" />
          </Form.Item>
          <Form.Item name="password" label={t("auth.register.password")}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Link href="/admin">
              <Button type="primary" htmlType="submit" block>
                {t("auth.login.button")}
              </Button>
            </Link>
          </Form.Item>
        </Form>
        <p className="text-center text-sm text-foreground/60">
          {t("auth.login.noAccount")}{" "}
          <Link
            href="/admin/register"
            className="text-primary! hover:underline!"
          >
            {t("nav.register")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
