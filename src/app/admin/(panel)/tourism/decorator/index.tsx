"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tag,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import { modalBodyProps } from "@/helpers/modal";
import { asAppError } from "@/helpers/error";
import { facilityOptions } from "@/helpers/menu";
import { getImageString } from "@/helpers/image";
import { formatRupiah } from "@/utils/format";
import { placeFormLayout, packageFormLayout } from "../config";

interface PlaceRow {
  id: number;
  name: string;
  status: "ACTIVE" | "NONACTIVE";
  photo: string | null;
}

interface PackageRow {
  id: number;
  name: string;
  placeId: number | null;
  place: { id: number; name: string } | null;
  facilities: string[];
  price: number;
  status: "ACTIVE" | "NONACTIVE";
}

interface PlaceFormValues {
  name: string;
  photo?: unknown;
}

interface PackageFormValues {
  name: string;
  placeId?: number;
  facilities?: string[];
  price?: number;
}

const TourismDecorator = () => {
  const { t } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal } = App.useApp();

  // Aturan role: MASTER bisa akses opsi + tambah; VIEWER hidden.
  const isMaster = session?.role === "MASTER";

  const [placeForm] = Form.useForm<PlaceFormValues>();
  const [packageForm] = Form.useForm<PackageFormValues>();

  const [fetching, setFetching] = useState(true);
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceRow | null>(null);
  const [viewPlace, setViewPlace] = useState<PlaceRow | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageRow | null>(null);

  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [placesRes, packagesRes] = await Promise.all([
        fetch("/api/admin/places"),
        fetch("/api/admin/packages"),
      ]);
      const placesJson = await placesRes.json();
      const packagesJson = await packagesRes.json();
      if (placesJson.success) setPlaces(placesJson.data);
      if (packagesJson.success) setPackages(packagesJson.data);
    } catch (error) {
      console.error("Error fetching tourism data:", error);
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
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  // ------------------------------------------------------------------
  // Places
  // ------------------------------------------------------------------

  const showPlaceForm = (record?: PlaceRow) => {
    setEditingPlace(record ?? null);
    if (record) {
      placeForm.setFieldsValue({
        name: record.name,
        photo: record.photo
          ? [{ url: record.photo, thumbUrl: record.photo, status: "done" }]
          : undefined,
      });
    } else {
      placeForm.resetFields();
    }
    setIsPlaceModalOpen(true);
  };

  const handleSavePlace = async () => {
    setSaving(true);
    try {
      const values = await placeForm.validateFields();
      const photo = await getImageString(values.photo);
      const payload = { name: values.name, photo };
      const res = editingPlace
        ? await fetch(`/api/admin/places/${editingPlace.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      notification.success({
        title: t("notif.success"),
        // Data baru dibuat nonaktif dulu; aktifkan lewat opsi.
        description: editingPlace
          ? t("notif.saveSuccess", { entity: t("admin.tourism.places") })
          : t("notif.createSuccess", { entity: t("admin.tourism.places") }),
        placement: "bottomRight",
      });
      setIsPlaceModalOpen(false);
      placeForm.resetFields();
      fetchData();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description:
                err.message ||
                t("notif.saveFailed", { entity: t("admin.tourism.places") }),
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlaceStatus = async (record: PlaceRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/places/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchData();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: t("admin.tourism.places"),
          status: next === "ACTIVE" ? t("common.active") : t("common.inactive"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message || t("notif.toggleFailed", { entity: t("admin.tourism.places") }),
        placement: "bottomRight",
      });
    }
  };

  const handleDeletePlace = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/places/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchData();
      notification.success({
        title: t("notif.success"),
        description: t("notif.deleteSuccess", {
          entity: t("admin.tourism.places"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.deleteFailed", { entity: t("admin.tourism.places") }),
        placement: "bottomRight",
      });
    }
  };

  
  // ------------------------------------------------------------------
  // Packages
  // ------------------------------------------------------------------

  const showPackageForm = (record?: PackageRow) => {
    setEditingPackage(record ?? null);
    if (record) {
      packageForm.setFieldsValue({
        name: record.name,
        placeId: record.placeId ?? undefined,
        facilities: record.facilities,
        price: record.price,
      });
    } else {
      packageForm.resetFields();
    }
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async () => {
    setSaving(true);
    try {
      const values = await packageForm.validateFields();
      const payload = {
        name: values.name,
        placeId: values.placeId ?? null,
        facilities: values.facilities ?? [],
        price: values.price ?? 0,
      };
      const res = editingPackage
        ? await fetch(`/api/admin/packages/${editingPackage.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      notification.success({
        title: t("notif.success"),
        // Data baru dibuat nonaktif dulu; aktifkan lewat opsi.
        description: editingPackage
          ? t("notif.saveSuccess", { entity: t("admin.tourism.packages") })
          : t("notif.createSuccess", { entity: t("admin.tourism.packages") }),
        placement: "bottomRight",
      });
      setIsPackageModalOpen(false);
      packageForm.resetFields();
      fetchData();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description:
                err.message ||
                t("notif.saveFailed", { entity: t("admin.tourism.packages") }),
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePackageStatus = async (record: PackageRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/packages/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchData();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: t("admin.tourism.packages"),
          status: next === "ACTIVE" ? t("common.active") : t("common.inactive"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.toggleFailed", { entity: t("admin.tourism.packages") }),
        placement: "bottomRight",
      });
    }
  };

  const handleDeletePackage = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchData();
      notification.success({
        title: t("notif.success"),
        description: t("notif.deleteSuccess", {
          entity: t("admin.tourism.packages"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.deleteFailed", { entity: t("admin.tourism.packages") }),
        placement: "bottomRight",
      });
    }
  };

    // ------------------------------------------------------------------
  // Columns
  // ------------------------------------------------------------------

  const placeColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("admin.tourism.places"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: PlaceRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    // Opsi hanya untuk MASTER — viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          {
            title: t("common.actions"),
            key: "actions",
            fixed: "right" as const,
            width: 260,
            render: (_: unknown, record: PlaceRow) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => showPlaceForm(record)}
                >
                  {t("common.edit")}
                </Button>
                <Button
                  size="small"
                  icon={
                    record.status === "ACTIVE" ? (
                      <StopOutlined />
                    ) : (
                      <CheckOutlined />
                    )
                  }
                  onClick={() =>
                    modal.confirm({
                      title: t("notif.confirmToggle", {
                        action:
                          record.status === "ACTIVE"
                            ? t("common.deactivate")
                            : t("common.activate"),
                        entity: t("admin.tourism.places"),
                      }),
                      okText: t("common.yes"),
                      cancelText: t("common.no"),
                      onOk: () => handleTogglePlaceStatus(record),
                    })
                  }
                >
                  {record.status === "ACTIVE"
                    ? t("common.deactivate")
                    : t("common.activate")}
                </Button>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setViewPlace(record)}
                >
                  {t("common.viewPhoto")}
                </Button>
                {record.status !== "ACTIVE" && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      modal.confirm({
                        title: `${t("common.delete")} "${record.name}"?`,
                        content: t("admin.deleteConfirm"),
                        okText: t("common.delete"),
                        okButtonProps: { danger: true },
                        cancelText: t("common.cancel"),
                        onOk: () => handleDeletePlace(record.id),
                      })
                    }
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const packageColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("admin.tourism.packages"), dataIndex: "name", key: "name" },
    {
      title: t("admin.tourism.place"),
      dataIndex: ["place", "name"],
      key: "placeName",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: t("admin.tourism.facilities"),
      dataIndex: "facilities",
      key: "facilities",
      render: (facilities: string[]) => (
        <span>{facilities.join(", ")}</span>
      ),
    },
    {
      title: t("common.price"),
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="font-medium">{formatRupiah(price)}</span>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: PackageRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    // Opsi hanya untuk MASTER — viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          {
            title: t("common.actions"),
            key: "actions",
            fixed: "right" as const,
            width: 220,
            render: (_: unknown, record: PackageRow) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => showPackageForm(record)}
                >
                  {t("common.edit")}
                </Button>
                <Button
                  size="small"
                  icon={
                    record.status === "ACTIVE" ? (
                      <StopOutlined />
                    ) : (
                      <CheckOutlined />
                    )
                  }
                  onClick={() =>
                    modal.confirm({
                      title: t("notif.confirmToggle", {
                        action:
                          record.status === "ACTIVE"
                            ? t("common.deactivate")
                            : t("common.activate"),
                        entity: t("admin.tourism.packages"),
                      }),
                      okText: t("common.yes"),
                      cancelText: t("common.no"),
                      onOk: () => handleTogglePackageStatus(record),
                    })
                  }
                >
                  {record.status === "ACTIVE"
                    ? t("common.deactivate")
                    : t("common.activate")}
                </Button>
                {record.status !== "ACTIVE" && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      modal.confirm({
                        title: `${t("common.delete")} "${record.name}"?`,
                        content: t("admin.deleteConfirm"),
                        okText: t("common.delete"),
                        okButtonProps: { danger: true },
                        cancelText: t("common.cancel"),
                        onOk: () => handleDeletePackage(record.id),
                      })
                    }
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(placeQuery.toLowerCase()),
  );
  const filteredPackages = packages.filter((pkg) =>
    [pkg.name, pkg.place?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(packageQuery.toLowerCase()),
  );

  if (!mounted || fetching || sessionLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.tourism.title")}</h1>
      <Card
        title={t("admin.tourism.places")}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
            {/* Tombol tambah hanya untuk MASTER — viewer hidden. */}
            {isMaster && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showPlaceForm()}
              >
                {t("common.add")}
              </Button>
            )}
          </Space>
        }
      >
        <Table
          dataSource={filteredPlaces}
          columns={placeColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>
      <Card
        title={t("admin.tourism.packages")}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setPackageQuery(e.target.value)}
            />
            {/* Tombol tambah hanya untuk MASTER — viewer hidden. */}
            {isMaster && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showPackageForm()}
              >
                {t("common.add")}
              </Button>
            )}
          </Space>
        }
      >
        <Table
          dataSource={filteredPackages}
          columns={packageColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal lihat foto tempat wisata */}
      <Modal
        title={`${t("common.viewPhoto")} — ${viewPlace?.name ?? ""}`}
        open={viewPlace !== null}
        footer={null}
        onCancel={() => setViewPlace(null)}
        width={640}
      >
        {viewPlace?.photo ? (
          <Image
            src={viewPlace.photo}
            alt={viewPlace.name}
            className="w-full! rounded!"
          />
        ) : (
          <p className="text-center py-8 text-foreground/60">
            {t("common.noPhoto")}
          </p>
        )}
      </Modal>

      {/* Drawer tambah/edit tempat wisata */}
      <Drawer
        title={
          editingPlace
            ? `${t("common.edit")} ${t("admin.tourism.places")}`
            : `${t("common.add")} ${t("admin.tourism.places")}`
        }
        open={isPlaceModalOpen}
        onClose={() => {
          placeForm.resetFields();
          setEditingPlace(null);
          setIsPlaceModalOpen(false);
        }}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                placeForm.resetFields();
                setEditingPlace(null);
                setIsPlaceModalOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="primary" loading={saving} onClick={handleSavePlace}>
              {t("common.save")}
            </Button>
          </div>
        }
        {...modalBodyProps()}
      >
        <FormAdmin
          formProps={{ form: placeForm }}
          layout={placeFormLayout}
          uploadFolder="places"
        />
      </Drawer>

      {/* Drawer tambah/edit paket */}
      <Drawer
        title={
          editingPackage
            ? `${t("common.edit")} ${t("admin.tourism.packages")}`
            : `${t("common.add")} ${t("admin.tourism.packages")}`
        }
        open={isPackageModalOpen}
        onClose={() => {
          packageForm.resetFields();
          setEditingPackage(null);
          setIsPackageModalOpen(false);
        }}
        width={560}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                packageForm.resetFields();
                setEditingPackage(null);
                setIsPackageModalOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSavePackage}
            >
              {t("common.save")}
            </Button>
          </div>
        }
        {...modalBodyProps()}
      >
        <FormAdmin
          formProps={{ form: packageForm }}
          layout={packageFormLayout}
          optionList={{
            placeId: places.map((p) => ({ label: p.name, value: p.id })),
            facilities: facilityOptions.map((f) => ({ label: f, value: f })),
          }}
        />
      </Drawer>
    </div>
  );
};

export default TourismDecorator;
