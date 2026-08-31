"use client";

import { Button, Drawer, Form, Space } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

interface FormDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onFinish?: (values: Record<string, unknown>) => void;
  children: React.ReactNode;
}

/**
 * Drawer generik berisi antd Form untuk form tambah/edit di panel admin.
 * Tombol submit ada di `extra` drawer; memicu submit form di dalamnya.
 */
export function FormDrawer({
  open,
  title,
  onClose,
  onFinish,
  children,
}: FormDrawerProps) {
  const { t } = useT();
  const [form] = Form.useForm();

  return (
    <Drawer
      title={title}
      placement="right"
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
          >
            {t("common.save")}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onFinish?.(values);
          form.resetFields();
          onClose();
        }}
      >
        {children}
      </Form>
    </Drawer>
  );
}
