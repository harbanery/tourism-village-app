"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { App, Button, Card, Space, Tag, Tooltip } from "antd";
import {
  BellOutlined,
  ExperimentOutlined,
  MailOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { NODE_ENV } from "@/config/variables";

/**
 * Panel development untuk menjalankan endpoint cron manual (pola
 * NotificationTest progress-self): floating card di pojok kanan bawah
 * area admin. Hanya tampil saat NODE_ENV === "development".
 *
 * Tombol memanggil POST dev-only (tanpa CRON_SECRET):
 * - "Expire Order"     → POST /api/cron/expire-orders (expired count)
 * - "Pengingat H-1"    → POST /api/cron/trip-reminder (notified count)
 * - "Ringkasan Harian" → POST /api/cron/daily-summary (email + in-app)
 */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const IS_DEV = typeof process !== "undefined" && NODE_ENV === "development";

type LoadingKey = "expire" | "reminder" | "summary";

export default function NotificationTest() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { t } = useT();
  const { message } = App.useApp();

  const [loading, setLoading] = useState<Record<LoadingKey, boolean>>({
    expire: false,
    reminder: false,
    summary: false,
  });
  const [visible, setVisible] = useState(true);

  const isDev = IS_DEV && isClient;

  /** POST endpoint cron dev; pesan sukses dibangun dari data respons. */
  const callDev = useCallback(
    async (
      key: LoadingKey,
      url: string,
      buildSuccess: (data: Record<string, unknown>) => string,
    ) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      try {
        const res = await fetch(url, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          message.success(buildSuccess(data));
        } else {
          message.error(data.error ?? t("admin.dev.failed"));
        }
      } catch {
        message.error(t("admin.dev.failed"));
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [t, message],
  );

  if (!isDev || !visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <Card
        size="small"
        className="pointer-events-auto w-full max-w-xs shadow-lg"
        styles={{ body: { padding: 12 } }}
        title={
          <div className="flex items-center gap-2">
            <ExperimentOutlined className="text-primary!" />
            <span className="text-xs font-semibold">
              {t("admin.dev.title")}
            </span>
            <Tag color="orange" className="ml-auto! mr-0!">
              DEV
            </Tag>
          </div>
        }
      >
        <Space direction="vertical" size={8} className="w-full">
          <Tooltip title={t("admin.dev.expireTooltip")}>
            <Button
              size="small"
              icon={<SendOutlined />}
              loading={loading.expire}
              block
              onClick={() =>
                callDev("expire", "/api/cron/expire-orders", (data) =>
                  t("admin.dev.expireSuccess", {
                    val: String(data.expired ?? 0),
                  }),
                )
              }
            >
              {t("admin.dev.expireBtn")}
            </Button>
          </Tooltip>
          <Tooltip title={t("admin.dev.reminderTooltip")}>
            <Button
              size="small"
              icon={<BellOutlined />}
              loading={loading.reminder}
              block
              onClick={() =>
                callDev("reminder", "/api/cron/trip-reminder", (data) =>
                  t("admin.dev.reminderSuccess", {
                    val: String(data.notified ?? 0),
                  }),
                )
              }
            >
              {t("admin.dev.reminderBtn")}
            </Button>
          </Tooltip>
          <Tooltip title={t("admin.dev.summaryTooltip")}>
            <Button
              size="small"
              icon={<MailOutlined />}
              loading={loading.summary}
              block
              onClick={() =>
                callDev("summary", "/api/cron/daily-summary", () =>
                  t("admin.dev.summarySuccess"),
                )
              }
            >
              {t("admin.dev.summaryBtn")}
            </Button>
          </Tooltip>
        </Space>
        <div className="mt-2 flex justify-end">
          <Button
            type="text"
            size="small"
            onClick={() => setVisible(false)}
            className="text-xs! opacity-50"
          >
            {t("common.close")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
