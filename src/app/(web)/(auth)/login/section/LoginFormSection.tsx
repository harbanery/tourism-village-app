"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function LoginFormSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold text-center">{t("auth.login.title")}</h1>
        <p className="mt-1 text-center text-foreground/60">{t("auth.login.subtitle")}</p>
        <Form layout="vertical" className="mt-6!">
          <Form.Item name="email" label={t("common.email")}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="password" label={t("auth.register.password")}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t("auth.login.button")}
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center space-y-2 text-sm">
          <p>
            <Link href="#" className="text-primary hover:underline">
              {t("auth.login.forgot")}
            </Link>
          </p>
          <p className="text-foreground/60">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">
              {t("nav.register")}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
