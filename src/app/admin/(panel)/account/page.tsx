"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { Avatar, Card, Input, Space, Table, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyAdmins, dummyUsers, type Admin, type User } from "@/models";
import { formatDate } from "@/utils/format";

export default function AccountPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const [userQuery, setUserQuery] = useState("");
  const [adminQuery, setAdminQuery] = useState("");

  const filteredUsers = useMemo(
    () =>
      dummyUsers.filter((u) =>
        [u.name, u.email, u.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(userQuery.toLowerCase()),
      ),
    [userQuery],
  );

  const filteredAdmins = useMemo(
    () =>
      dummyAdmins.filter((a) =>
        [a.username, a.name, a.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(adminQuery.toLowerCase()),
      ),
    [adminQuery],
  );

  if (!mounted) return null;

  const userColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: t("common.email"), dataIndex: "email", key: "email" },
    {
      title: t("admin.accounts.gender"),
      dataIndex: "gender",
      key: "gender",
      render: (gender: User["gender"]) =>
        gender ? (
          <Tag>
            {gender === "male" ? t("profile.male") : t("profile.female")}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: t("admin.accounts.birthDate"),
      dataIndex: "birthDate",
      key: "birthDate",
      render: (value: User["birthDate"]) =>
        value ? formatDate(value, locale) : "-",
    },
    {
      title: t("admin.accounts.address"),
      dataIndex: "address",
      key: "address",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: t("common.phone"),
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v ?? "-",
    },
  ];

  const adminColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("admin.accounts.username"),
      dataIndex: "username",
      key: "username",
      render: (_: unknown, record: Admin) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <span>{record.username}</span>
        </div>
      ),
    },
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
      render: (v: string | null) => v ?? "-",
    },
    { title: t("common.email"), dataIndex: "email", key: "email" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.accounts.title")}</h1>
      <Card
        title={t("admin.accounts.users")}
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setUserQuery(e.target.value)}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredUsers}
          columns={userColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>
      <Card
        title={t("admin.accounts.admins")}
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setAdminQuery(e.target.value)}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredAdmins}
          columns={adminColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Card>
    </div>
  );
}
