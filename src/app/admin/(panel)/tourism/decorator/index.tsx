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
  Space,
  Tag,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FireOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import {
  AdminTable,
  RowActions,
  numberSorter,
  textSorter,
  useAdminColumns,
} from "@/components/admin/table";
import { drawerBodyProps } from "@/helpers/drawer";
import { asAppError } from "@/helpers/error";
import { facilityOptions } from "@/helpers/menu";
import { getImageString, uploadFileFromUrl } from "@/helpers/image";
import { formatRupiah } from "@/utils/format";
import { placeFormLayout, packageFormLayout } from "../config";

interface PlaceRow {
  id: string;
  name: string;
  /** Deskripsi tempat wisata (tampil di expanded row). */
  description: string | null;
  status: "ACTIVE" | "NONACTIVE";
  photo: string | null;
  /** Jumlah paket yang terhubung dengan tempat ini. */
  packageCount: number;
  /** Paket populer terhubung — dasar tag & warning nonaktif. */
  popularPackageCount: number;
}

interface PackageRow {
  id: string;
  name: string;
  placeId: string | null;
  place: { id: string; name: string; status: "ACTIVE" | "NONACTIVE" } | null;
  facilities: string[];
  price: number;
  status: "ACTIVE" | "NONACTIVE";
  /** Total kuantitas terjual lunas — dasar tag "Populer" (sama seperti web). */
  timesPurchased: number;
}

interface PlaceFormValues {
  name: string;
  description?: string;
  photo?: unknown;
}

interface PackageFormValues {
  name: string;
  placeId?: string;
  facilities?: string[];
  price?: number;
}

const TourismDecorator = () => {
  const { t } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal, message } = App.useApp();

  // Aturan role: MASTER bisa akses opsi + tambah; VIEWER hidden.
  const isMaster = session?.role === "MASTER";

  // Kolom global (status, opsi) untuk kedua tabel.
  const placeCols = useAdminColumns<PlaceRow>();
  const packageCols = useAdminColumns<PackageRow>();

  const [placeForm] = Form.useForm<PlaceFormValues>();
  const [packageForm] = Form.useForm<PackageFormValues>();

  const [fetching, setFetching] = useState(true);
  const [places, setPlaces] = useState<PlaceRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceRow | null>(null);
  /** Foto yang sedang dipreview langsung (lightbox, bukan modal). */
  const [preview, setPreview] = useState<{
    src: string;
    name: string;
  } | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageRow | null>(null);

  const [saving, setSaving] = useState(false);

  /** Buka foto langsung di image preview. */
  const openPhoto = (src: string | null, name: string) => {
    if (!src) {
      message.info(t("common.noPhoto"));
      return;
    }
    setPreview({ src, name });
  };

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
        description: record.description ?? undefined,
        // File existing ditampilkan utuh di form upload (nama + preview).
        photo: record.photo ? [uploadFileFromUrl(record.photo)] : undefined,
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
      const payload = {
        name: values.name,
        description: values.description ?? "",
        photo,
      };
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

  const handleDeletePlace = async (id: string) => {
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
          // Validasi tempat nonaktif — arahkan aktifkan tempat dulu.
          err.message === "PLACE_INACTIVE"
            ? t("admin.tourism.placeInactiveError")
            : err.message ||
              t("notif.toggleFailed", { entity: t("admin.tourism.packages") }),
        placement: "bottomRight",
      });
    }
  };

  const handleDeletePackage = async (id: string) => {
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

  /** Tag "Populer" — dipakai di tabel tempat wisata & paket. */
  const popularTag = (
    <Tag color="orange" icon={<FireOutlined />} className="m-0!">
      {t("admin.tourism.popular")}
    </Tag>
  );

  /** true bila tempat wisata paket ini nonaktif (paket tak bisa diaktifkan). */
  const placeInactive = (record: PackageRow) =>
    Boolean(record.place && record.place.status !== "ACTIVE");

  const placeColumns = [
    {
      title: t("admin.tourism.places"),
      dataIndex: "name",
      key: "name",
      sorter: textSorter<PlaceRow>((row) => row.name),
      // Filter populer: punya/tidak punya paket populer (semantik tag Populer).
      filters: [
        { text: t("admin.tourism.popular"), value: "popular" },
        { text: t("admin.tourism.notPopular"), value: "notPopular" },
      ],
      onFilter: (
        value: string | number | bigint | symbol | boolean,
        record: PlaceRow,
      ) =>
        value === "popular"
          ? record.popularPackageCount > 0
          : record.popularPackageCount === 0,
      render: (name: string, record: PlaceRow) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{name}</span>
          {/* Tag populer: punya paket populer yang terhubung. */}
          {record.popularPackageCount > 0 && popularTag}
          {/* Jumlah paket menempel di samping nama (bukan kolom sendiri);
              tanpa paket (0) tidak ditampilkan. */}
          {record.packageCount > 0 && (
            <Tag className="m-0!">
              {t("admin.tourism.packageCountInline", {
                n: record.packageCount,
              })}
            </Tag>
          )}
        </span>
      ),
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    placeCols.status,
    // Opsi digabung dropdown three-dots; hanya untuk MASTER —
    // viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          placeCols.actions((record) => (
            <RowActions
              items={[
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: t("common.edit"),
                  onClick: () => showPlaceForm(record),
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
                        entity: t("admin.tourism.places"),
                      }),
                      // Peringatan cascade: paket terhubung ikut nonaktif —
                      // tekankan bila ada paket populer yang terdampak.
                      ...(record.status === "ACTIVE" && {
                        content:
                          record.popularPackageCount > 0
                            ? t("admin.tourism.placePopularWarning")
                            : t("admin.tourism.placeCascadeWarning"),
                      }),
                      okText: t("common.yes"),
                      cancelText: t("common.no"),
                      onOk: () => handleTogglePlaceStatus(record),
                    }),
                },
                {
                  key: "view",
                  icon: <EyeOutlined />,
                  label: t("common.viewPhoto"),
                  onClick: () => openPhoto(record.photo, record.name),
                },
                ...(record.status !== "ACTIVE"
                  ? [
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: t("common.delete"),
                        onClick: () =>
                          modal.confirm({
                            title: `${t("common.delete")} "${record.name}"?`,
                            content: t("admin.deleteConfirm"),
                            okText: t("common.delete"),
                            okButtonProps: { danger: true },
                            cancelText: t("common.cancel"),
                            onOk: () => handleDeletePlace(record.id),
                          }),
                      },
                    ]
                  : []),
              ]}
            />
          )),
        ]
      : []),
  ];

  const packageColumns = [
    {
      title: t("admin.tourism.packages"),
      dataIndex: "name",
      key: "name",
      sorter: textSorter<PackageRow>((row) => row.name),
      // Filter popular: paket yang pernah dibayar lunas vs belum.
      filters: [
        { text: t("admin.tourism.popular"), value: "popular" },
        { text: t("admin.tourism.notPopular"), value: "regular" },
      ],
      onFilter: (value: string | number | bigint | symbol | boolean, record: PackageRow) =>
        value === "popular"
          ? record.timesPurchased > 0
          : record.timesPurchased === 0,
      render: (name: string, record: PackageRow) => (
        <span className="flex flex-wrap items-center gap-2">
          <span>{name}</span>
          {/* Tag populer: paket pernah dibayar (order PAID). */}
          {record.timesPurchased > 0 && popularTag}
        </span>
      ),
    },
    {
      title: t("admin.tourism.place"),
      dataIndex: ["place", "name"],
      key: "placeName",
      sorter: textSorter<PackageRow>((row) => row.place?.name),
      filters: places
        .map((p) => ({ text: p.name, value: p.id }))
        .sort((a, b) => a.text.localeCompare(b.text)),
      onFilter: (value: string | number | bigint | symbol | boolean, record: PackageRow) =>
        record.placeId === value,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: t("admin.tourism.facilities"),
      dataIndex: "facilities",
      key: "facilities",
      sorter: textSorter<PackageRow>((row) => row.facilities.join(", ")),
      filters: [
        ...new Set(packages.flatMap((pkg) => pkg.facilities)),
      ]
        .sort((a, b) => a.localeCompare(b))
        .map((facility) => ({ text: facility, value: facility })),
      onFilter: (
        value: string | number | bigint | symbol | boolean,
        record: PackageRow,
      ) => record.facilities.includes(String(value)),
      render: (facilities: string[]) => (
        <span>{facilities.join(", ")}</span>
      ),
    },
    {
      title: t("common.price"),
      dataIndex: "price",
      key: "price",
      sorter: numberSorter<PackageRow>((row) => row.price),
      render: (price: number) => (
        <span className="font-medium">{formatRupiah(price)}</span>
      ),
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    packageCols.status,
    // Opsi digabung dropdown three-dots; hanya untuk MASTER —
    // viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          packageCols.actions((record) => (
            <RowActions
              items={[
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: t("common.edit"),
                  onClick: () => showPackageForm(record),
                },
                // Opsi aktifkan disembunyikan bila tempat wisatanya
                // nonaktif — validasi server akan menolak (PLACE_INACTIVE);
                // aktifkan tempat wisatanya dulu.
                ...(record.status === "ACTIVE" || !placeInactive(record)
                  ? [
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
                              entity: t("admin.tourism.packages"),
                            }),
                            // Peringatan bila menonaktifkan paket populer.
                            ...(record.status === "ACTIVE" &&
                              record.timesPurchased > 0 && {
                                content: t("admin.tourism.popularWarning"),
                              }),
                            okText: t("common.yes"),
                            cancelText: t("common.no"),
                            onOk: () => handleTogglePackageStatus(record),
                          }),
                      },
                    ]
                  : []),
                ...(record.status !== "ACTIVE"
                  ? [
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: t("common.delete"),
                        onClick: () =>
                          modal.confirm({
                            title: `${t("common.delete")} "${record.name}"?`,
                            content: t("admin.deleteConfirm"),
                            okText: t("common.delete"),
                            okButtonProps: { danger: true },
                            cancelText: t("common.cancel"),
                            onOk: () => handleDeletePackage(record.id),
                          }),
                      },
                    ]
                  : []),
              ]}
            />
          )),
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
        {/* Expanded row: deskripsi tempat wisata (pola table blog). */}
        <AdminTable
          dataSource={filteredPlaces}
          columns={placeColumns}
          expandable={{
            expandedRowRender: (record: PlaceRow) => (
              <div>
                <p className="m-0! text-xs font-semibold uppercase tracking-wide text-foreground/40">
                  {t("admin.tourism.description")}
                </p>
                <p className="m-0! mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {record.description || "-"}
                </p>
              </div>
            ),
            // Row tanpa deskripsi tidak perlu di-expand.
            rowExpandable: (record: PlaceRow) => !!record.description,
          }}
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
        <AdminTable dataSource={filteredPackages} columns={packageColumns} />
      </Card>

      {/* Preview foto tempat wisata langsung (lightbox, tanpa modal) */}
      <Image
        src={preview?.src}
        alt={preview?.name}
        style={{ display: "none" }}
        preview={{
          open: preview !== null,
          src: preview?.src,
          onOpenChange: (open) => {
            if (!open) setPreview(null);
          },
        }}
      />

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
        size={560}
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
        {...drawerBodyProps()}
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
        size={560}
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
        {...drawerBodyProps()}
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
