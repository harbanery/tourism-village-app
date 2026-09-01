"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Drawer,
  Input,
  Space,
  Tag,
  Typography,
  Form,
} from "antd";
import {
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import {
  AdminTable,
  ROLE_TAG_COLORS,
  RowActions,
  useAdminColumns,
} from "@/components/admin/table";
import { drawerBodyProps } from "@/helpers/drawer";
import { asAppError } from "@/helpers/error";
import { adminRoleOptions } from "@/helpers/menu";
import { adminFormLayout, adminRoleFormLayout } from "../config";
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
  avatar: string | null;
  status: "ACTIVE" | "NONACTIVE";
}

const AccountDecorator = () => {
  const { t } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal } = App.useApp();
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm<{ role: AdminRow["role"] }>();

  // Aturan role: MASTER bisa akses opsi + tambah; VIEWER hidden.
  const isMaster = session?.role === "MASTER";

  // Kolom global (id, status, opsi) untuk kedua tabel.
  const userCols = useAdminColumns<UserRow>();
  const adminCols = useAdminColumns<AdminRow>();

  const [fetching, setFetching] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [adminQuery, setAdminQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRow | null>(null);
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
            <Typography.Paragraph
              copyable={{
                text: `${result.data.username} / ${result.data.password}`,
              }}
            >
              <strong>{t("admin.accounts.username")}:</strong>{" "}
              {result.data.username}
            </Typography.Paragraph>
            <Typography.Paragraph copyable={{ text: result.data.password }}>
              <strong>{t("auth.register.password")}:</strong>{" "}
              {result.data.password}
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
          : {
              description: err.message || t("notif.saveFailed"),
              placement: "bottomRight" as const,
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Buka modal ubah role — hanya role yang bisa diubah. */
  const showRoleForm = (record: AdminRow) => {
    setEditingRole(record);
    roleForm.setFieldsValue({ role: record.role });
  };

  const handleSaveRole = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      const values = await roleForm.validateFields();
      const res = await fetch(`/api/admin/admins/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: values.role }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      notification.success({
        title: t("notif.success"),
        description: t("notif.roleUpdated", { entity: editingRole.username }),
        placement: "bottomRight",
      });
      setEditingRole(null);
      roleForm.resetFields();
      fetchAccounts();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description: err.message || t("notif.saveFailed"),
              placement: "bottomRight" as const,
            }),
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
    userCols.id,
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
          <Tag>
            {gender === "MALE" ? t("profile.male") : t("profile.female")}
          </Tag>
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
      title: t("common.phone"),
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v ?? "-",
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    userCols.status,
    // Opsi (toggle) hanya untuk MASTER — viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          userCols.actions((record) => (
            <RowActions
              items={[
                {
                  key: "toggle",
                  icon:
                    record.status === "ACTIVE" ? (
                      <StopOutlined />
                    ) : (
                      <CheckOutlined />
                    ),
                  label:
                    record.status === "ACTIVE"
                      ? t("common.deactivate")
                      : t("common.activate"),
                  onClick: () =>
                    modal.confirm({
                      title: t("notif.confirmToggle", {
                        action:
                          record.status === "ACTIVE"
                            ? t("common.deactivate")
                            : t("common.activate"),
                        entity: record.name,
                      }),
                      okText: t("common.yes"),
                      cancelText: t("common.no"),
                      onOk: () => handleToggleUserStatus(record),
                    }),
                },
              ]}
            />
          )),
        ]
      : []),
  ];

  const adminColumns = [
    adminCols.id,
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
      // Tag role (align tengah) dibedakan dari tag status (MASTER tidak hijau).
      title: t("admin.accounts.role"),
      dataIndex: "role",
      key: "role",
      align: "center" as const,
      render: (role: AdminRow["role"]) => (
        <Tag color={ROLE_TAG_COLORS[role] ?? "default"}>
          {t(`admin.role.${role}`)}
        </Tag>
      ),
    },
    adminCols.status,
    // Opsi digabung dropdown three-dots; hanya untuk MASTER.
    // Akun sendiri: opsi profil; akun lain: ubah + toggle.
    ...(isMaster
      ? [
          adminCols.actions((record) => {
            const isSelf = session?.id === record.id;
            const items = isSelf
              ? []
              : [
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: t("common.edit"),
                    onClick: () => showRoleForm(record),
                  },
                  {
                    key: "toggle",
                    icon:
                      record.status === "ACTIVE" ? (
                        <StopOutlined />
                      ) : (
                        <CheckOutlined />
                      ),
                    label:
                      record.status === "ACTIVE"
                        ? t("common.deactivate")
                        : t("common.activate"),
                    onClick: () =>
                      modal.confirm({
                        title: t("notif.confirmToggle", {
                          action:
                            record.status === "ACTIVE"
                              ? t("common.deactivate")
                              : t("common.activate"),
                          entity: record.username,
                        }),
                        okText: t("common.yes"),
                        cancelText: t("common.no"),
                        onOk: () => handleToggleAdminStatus(record),
                      }),
                  },
                ];
            return <RowActions items={items} />;
          }),
        ]
      : []),
  ];

  if (!mounted || fetching || sessionLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.accounts.title")}</h1>
      <Card
        title={t("admin.accounts.users")}
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            className="w-full! sm:w-44!"
            placeholder={t("common.search")}
            onChange={(e) => setUserQuery(e.target.value)}
          />
        }
      >
        <AdminTable dataSource={filteredUsers} columns={userColumns} />
      </Card>
      <Card
        title={t("admin.accounts.admins")}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setAdminQuery(e.target.value)}
            />
            {/* Tombol tambah hanya untuk MASTER — viewer hidden. */}
            {isMaster && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddOpen(true)}
              >
                {t("common.add")}
              </Button>
            )}
          </Space>
        }
      >
        <AdminTable dataSource={filteredAdmins} columns={adminColumns} />
      </Card>

      {/* Drawer tambah admin */}
      <Drawer
        title={`${t("common.add")} ${t("admin.accounts.admins")}`}
        open={isAddOpen}
        onClose={() => {
          form.resetFields();
          setIsAddOpen(false);
        }}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                form.resetFields();
                setIsAddOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="primary" loading={saving} onClick={handleAddAdmin}>
              {t("common.save")}
            </Button>
          </div>
        }
        {...drawerBodyProps()}
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
      </Drawer>

      {/* Drawer ubah role admin — hanya role yang bisa diubah. */}
      <Drawer
        title={`${t("common.edit")} — ${editingRole?.username ?? ""}`}
        open={editingRole !== null}
        onClose={() => {
          roleForm.resetFields();
          setEditingRole(null);
        }}
        width={480}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                roleForm.resetFields();
                setEditingRole(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="primary" loading={saving} onClick={handleSaveRole}>
              {t("common.save")}
            </Button>
          </div>
        }
        {...drawerBodyProps()}
      >
        <Typography.Paragraph type="secondary" className="mb-4!">
          {t("admin.accounts.changeRoleNote")}
        </Typography.Paragraph>
        <FormAdmin
          formProps={{ form: roleForm }}
          layout={adminRoleFormLayout}
          optionList={{
            role: adminRoleOptions.map((r) => ({
              label: t(`admin.role.${r.value}`),
              value: r.value,
            })),
          }}
        />
      </Drawer>
    </div>
  );
};

export default AccountDecorator;
