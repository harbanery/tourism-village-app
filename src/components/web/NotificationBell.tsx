"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Empty, List, Popover, Spin } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Waktu relatif sederhana (baru saja / menit / jam / hari). */
function relativeTime(iso: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t("notifBell.justNow");
  if (minutes < 60) return t("notifBell.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("notifBell.hoursAgo", { n: hours });
  return t("notifBell.daysAgo", { n: Math.floor(hours / 24) });
}

/**
 * Bell icon notifikasi in-app dengan popover daftar notifikasi.
 * Dipakai navbar web (default) dan header panel admin (endpoint admin).
 * Polling ringan tiap 60 detik — tanpa infra tambahan (pola rekomendasi).
 */
export function NotificationBell({
  endpoint = "/api/web/notifications",
}: {
  endpoint?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Apakah fetch pertama sudah selesai (hindari kedipan spinner).
  const [initialized, setInitialized] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      const result = await res.json();
      if (result.success) {
        setItems(result.data.items ?? []);
        setUnreadCount(result.data.unreadCount ?? 0);
      }
    } catch {
      // Diam — bell adalah fitur pelengkap, jangan ganggu halaman.
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void Promise.resolve().then(fetchNotifications);
    const interval = setInterval(() => {
      void Promise.resolve().then(fetchNotifications);
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /** Tandai satu notifikasi dibaca lalu buka link-nya (bila ada). */
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isRead: true } : row,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
      } catch {
        // Best-effort.
      }
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // Best-effort.
    }
  };

  const content = (
    <div className="w-80 max-w-[85vw]">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="font-semibold">{t("notifBell.title")}</span>
        {unreadCount > 0 && (
          <Button
            size="small"
            type="text"
            icon={<CheckOutlined />}
            onClick={handleMarkAll}
          >
            {t("notifBell.markAllRead")}
          </Button>
        )}
      </div>
      <Spin spinning={loading && !initialized}>
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("notifBell.empty")}
            className="py-6!"
          />
        ) : (
          <List
            className="max-h-80 overflow-y-auto"
            dataSource={items}
            renderItem={(item) => (
              <button
                type="button"
                onClick={() => void handleItemClick(item)}
                className={[
                  "flex w-full cursor-pointer flex-col gap-0.5 border-b border-black/5 px-2 py-2 text-left dark:border-white/10",
                  "transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                  item.isRead ? "opacity-70" : "",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  {!item.isRead && (
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                  <span className={item.isRead ? "text-sm" : "text-sm font-semibold"}>
                    {item.title}
                  </span>
                </span>
                <span className="text-xs text-foreground/70">{item.body}</span>
                <span className="text-xs text-foreground/50">
                  {relativeTime(item.createdAt, t)}
                </span>
              </button>
            )}
          />
        )}
      </Spin>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setLoading(true);
          void Promise.resolve().then(fetchNotifications);
        }
      }}
      placement="bottomRight"
      arrow={false}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          aria-label={t("notifBell.title")}
          icon={<BellOutlined />}
        />
      </Badge>
    </Popover>
  );
}

export default NotificationBell;
