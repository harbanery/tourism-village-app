"use client";

import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";

export default function AdminRegisterPage() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full! max-w-md!">
        <h1 className="text-2xl font-bold text-center">{t("auth.register.title")}</h1>
        <p className="mt-1 text-center text-foreground/60">{t("admin.title")}</p>
        <Form layout="vertical" className="mt-6!">
          <Form.Item name="name" label={t("auth.register.name")}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="username" label={t("admin.accounts.username")}>
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
          <Button
            type="link"
            className="text-primary! hover:underline!"
            onClick={() => router.push("/admin/login")}
          >
            {t("nav.login")}
          </Button>
        </p>
      </Card>
    </div>
  );
}
