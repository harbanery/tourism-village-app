"use client";

import { Button, Drawer, Form, Space } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

interface FormDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onFinish?: (values: Record<string, unknown>) => void;
  /** Nilai awal untuk mode edit; ganti `key` komponen per record. */
  initialValues?: Record<string, unknown>;
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
  initialValues,
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
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {t("common.save")}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => {
          onFinish?.(values);
          onClose();
        }}
      >
        {children}
      </Form>
    </Drawer>
  );
}
