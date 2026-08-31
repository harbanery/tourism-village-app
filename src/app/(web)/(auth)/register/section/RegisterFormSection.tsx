"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card, Form, Input } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

export function RegisterFormSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold text-center">{t("auth.register.title")}</h1>
        <p className="mt-1 text-center text-foreground/60">{t("auth.register.subtitle")}</p>
        <Form layout="vertical" className="mt-6">
          <Form.Item name="name" label={t("auth.register.name")}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="email" label={t("common.email")}>
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="password" label={t("auth.register.password")}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="retypePassword" label={t("auth.register.retypePassword")}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t("auth.register.button")}
            </Button>
          </Form.Item>
        </Form>
        <p className="text-center text-sm text-foreground/60">
          {t("auth.register.haveAccount")}{" "}
          <Link href="/login" className="text-[#0d7a5f] hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
