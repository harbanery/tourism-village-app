"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { CheckOutlined, PlusOutlined, StopOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import { modalBodyProps } from "@/helpers/modal";
import { asAppError } from "@/helpers/error";
import { adminRoleOptions } from "@/helpers/menu";
import { adminFormLayout } from "../config";
import { Form } from "antd";
import { formatDate } from "@/utils/format";

interface AdminRow {
  id: number;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  role: "MASTER" | "VIEWER" | "AUTHOR";
  status: "ACTIVE" | "NONACTIVE";
}

interface UserRow {
  id: number;
  email: string;
  phone: string | null;
  name: string;
  gender: "MALE" | "FEMALE" | null;
  birthDate: string | null;
  address: string | null;
  avatar: string | null;
  status: "ACTIVE" | "NONACTIVE";
}

const AccountDecorator = () => {
  const { t } = useT();
  const mounted = useMounted();
  const { notification, modal } = App.useApp();
  const [form] = Form.useForm();

  const [fetching, setFetching] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [adminQuery, setAdminQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/admins"),
      ]);
      const usersJson = await usersRes.json();
      const adminsJson = await adminsRes.json();
      if (usersJson.success) setUsers(usersJson.data);
      if (adminsJson.success) setAdmins(adminsJson.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setFetching(false);
    }
  }, [notification, t]);

  useEffect(() => {
    void Promise.resolve().then(fetchAccounts);
  }, [fetchAccounts]);

  const handleToggleUserStatus = async (record: UserRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchAccounts();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: record.name,
          status: next === "ACTIVE" ? t("common.active") : t("common.inactive"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description: err.message || t("notif.toggleFailed"),
        placement: "bottomRight",
      });
    }
  };

  const handleToggleAdminStatus = async (record: AdminRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/admins/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchAccounts();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: record.username,
          status: next === "ACTIVE" ? t("common.active") : t("common.inactive"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description: err.message || t("notif.toggleFailed"),
        placement: "bottomRight",
      });
    }
  };

  const handleAddAdmin = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setIsAddOpen(false);
      form.resetFields();
      fetchAccounts();

      // Tampilkan username + password admin baru (sekali saja).
      modal.info({
        title: t("admin.accounts.credentialsTitle"),
        width: 480,
        content: (
          <div className="flex flex-col gap-2">
            <Typography.Paragraph>
              {t("admin.accounts.credentialsNote")}
            </Typography.Paragraph>
            <Typography.Paragraph copyable={{ text: `${result.data.username} / ${result.data.password}` }}>
              <strong>{t("admin.accounts.username")}:</strong> {result.data.username}
            </Typography.Paragraph>
            <Typography.Paragraph copyable={{ text: result.data.password }}>
              <strong>{t("auth.register.password")}:</strong> {result.data.password}
            </Typography.Paragraph>
          </div>
        ),
        okText: t("common.close"),
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : { description: err.message || t("notif.saveFailed"), placement: "bottomRight" as const }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    [u.name, u.email, u.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(userQuery.toLowerCase()),
  );

  const filteredAdmins = admins.filter((a) =>
    [a.username, a.name, a.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(adminQuery.toLowerCase()),
  );

  const userColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("common.name"),
      dataIndex: "name",
      key: "name",
      render: (_: unknown, record: UserRow) => (
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
      render: (gender: UserRow["gender"]) =>
        gender ? (
          <Tag>{gender === "MALE" ? t("profile.male") : t("profile.female")}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: t("admin.accounts.birthDate"),
      dataIndex: "birthDate",
      key: "birthDate",
      render: (value: UserRow["birthDate"]) =>
        value ? formatDate(value) : "-",
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
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: UserRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: UserRow) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={record.status === "ACTIVE" ? <StopOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleUserStatus(record)}
          >
            {record.status === "ACTIVE"
              ? t("common.deactivate")
              : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  const adminColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("admin.accounts.username"),
      dataIndex: "username",
      key: "username",
      render: (_: unknown, record: AdminRow) => (
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
    {
      title: t("admin.accounts.role"),
      dataIndex: "role",
      key: "role",
      render: (role: AdminRow["role"]) => (
        <Tag color={role === "MASTER" ? "green" : role === "AUTHOR" ? "blue" : "default"}>
          {t(`admin.role.${role}`)}
        </Tag>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: AdminRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: AdminRow) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={record.status === "ACTIVE" ? <StopOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleAdminStatus(record)}
          >
            {record.status === "ACTIVE"
              ? t("common.deactivate")
              : t("common.activate")}
          </Button>
        </div>
      ),
    },
  ];

  if (!mounted || fetching) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.accounts.title")}</h1>
      <Card
        title={t("admin.accounts.users")}
        extra={
          <Input.Search
            allowClear
            className="w-full! sm:w-44!"
            placeholder={t("common.search")}
            onChange={(e) => setUserQuery(e.target.value)}
          />
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddOpen(true)}
            >
              {t("common.add")}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredAdmins}
          columns={adminColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      <Modal
        title={`${t("common.add")} ${t("admin.accounts.admins")}`}
        open={isAddOpen}
        onOk={handleAddAdmin}
        onCancel={() => {
          form.resetFields();
          setIsAddOpen(false);
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        confirmLoading={saving}
        width={560}
        {...modalBodyProps()}
      >
        <FormAdmin
          formProps={{ form, initialValues: { role: "VIEWER" } }}
          layout={adminFormLayout}
          optionList={{
            role: adminRoleOptions.map((r) => ({
              label: t(`admin.role.${r.value}`),
              value: r.value,
            })),
          }}
        />
      </Modal>
    </div>
  );
};

export default AccountDecorator;
