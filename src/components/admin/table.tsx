"use client";

import { Button, Dropdown, Table, Tag } from "antd";
import type { MenuProps, TableProps } from "antd";
import type { ColumnType, ColumnsType } from "antd/es/table";
import { MoreOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

/** Warna tag status (aktif = hijau). */
export const STATUS_TAG_COLORS: Record<string, string> = {
  ACTIVE: "green",
  NONACTIVE: "red",
};

/** Warna tag role — dibedakan dari status (MASTER tidak hijau). */
export const ROLE_TAG_COLORS: Record<string, string> = {
  MASTER: "gold",
  AUTHOR: "geekblue",
  VIEWER: "magenta",
};

/** Lebar statis kolom id + kolom fixed kanan (status & opsi). */
export const FIXED_COLUMN_WIDTH = {
  id: 60,
  status: 100,
  actions: 80,
} as const;

type AdminRow = { id: number };
type StatusValue = "ACTIVE" | "NONACTIVE";

/**
 * Dropdown tiga-titik untuk kolom opsi — menggabungkan beberapa button
 * menjadi satu menu. Merender null bila tidak ada item.
 */
export function RowActions({ items }: { items: MenuProps["items"] }) {
  const { t } = useT();
  if (!items || items.length === 0) return null;
  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button
        type="text"
        icon={<MoreOutlined />}
        aria-label={t("common.actions")}
      />
    </Dropdown>
  );
}

/** Hook kolom global (id, status, opsi) untuk tabel admin. */
export function useAdminColumns<T extends AdminRow>() {
  const { t } = useT();

  const id: ColumnType<T> = {
    title: "Id",
    dataIndex: "id",
    key: "id",
    width: FIXED_COLUMN_WIDTH.id,
  };

  const status: ColumnType<T> = {
    title: t("common.status"),
    dataIndex: "status",
    key: "status",
    width: FIXED_COLUMN_WIDTH.status,
    align: "center",
    fixed: "right",
    render: (status: StatusValue) => (
      <Tag color={STATUS_TAG_COLORS[status] ?? "default"}>
        {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
      </Tag>
    ),
  };

  /** Kolom opsi (fixed kanan) — isi berupa komponen per baris. */
  const actions = (render: (record: T) => React.ReactNode): ColumnType<T> => ({
    title: t("common.actions"),
    key: "actions",
    width: FIXED_COLUMN_WIDTH.actions,
    align: "center",
    fixed: "right",
    render: (_: unknown, record: T) => render(record),
  });

  return { id, status, actions };
}

/** Tabel global admin — konfigurasi standar (rowKey, pagination, scroll). */
export function AdminTable<T extends AdminRow>({
  dataSource,
  columns,
  ...rest
}: TableProps<T>) {
  return (
    <Table<T>
      dataSource={dataSource}
      columns={columns as ColumnsType<T>}
      rowKey="id"
      pagination={{ pageSize: 5, showSizeChanger: false }}
      scroll={{ x: "max-content" }}
      {...rest}
    />
  );
}
