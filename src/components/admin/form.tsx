"use client";

import { ReactNode, useEffect, useState } from "react";
import Editor from "@/components/custom/editor";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  FormProps,
} from "antd";
import type { NamePath } from "antd/es/form/interface";
import type { DefaultOptionType } from "antd/es/select";
import DatePicker from "antd/es/date-picker";
import { InboxOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { UploadFileLike } from "@/helpers/image";
import { FormAdminProps, FormLayout, FormLayoutItem } from "@/models/form";

/* ------------------------------------------------------------------ */
/*  Icon cache – preload once, then render from cache without hooks     */
/* ------------------------------------------------------------------ */

type IconComponent = React.ComponentType<{
  style?: React.CSSProperties;
  className?: string;
}>;

const antdIconCache: Record<string, IconComponent | null> = {};

async function ensureIcon(iconName: string): Promise<void> {
  if (antdIconCache[iconName]) return;
  try {
    const mod = (await import("@ant-design/icons")) as unknown as Record<
      string,
      IconComponent | undefined
    >;
    antdIconCache[iconName] = mod[iconName] ?? null;
  } catch {
    antdIconCache[iconName] = null;
  }
}

function getCachedIcon(iconName: string): IconComponent | null {
  return antdIconCache[iconName] ?? null;
}

/** Collect unique icon names from a layout config */
function collectIconNames(layout: FormLayout[] | undefined): string[] {
  const names = new Set<string>();
  for (const section of layout ?? []) {
    if (section.hidden) continue;
    for (const item of section.items) {
      if (item.icon) names.add(item.icon);
    }
  }
  return Array.from(names);
}

/** Ambil storagePath dari file hasil upload antd (lokal atau response). */
function getStoragePath(file: unknown): string | null {
  if (!file || typeof file !== "object") return null;
  const f = file as UploadFileLike;
  return f.storagePath ?? f.response?.data?.storagePath ?? null;
}

/**
 * Hapus aset di Cloudinary via DELETE /api/upload. Memakai storagePath
 * (public_id) bila ada; bila tidak, fallback ke parameter `url`.
 */
async function deleteUploadAsset(file: unknown): Promise<void> {
  if (!file || typeof file !== "object") return;
  const f = file as UploadFileLike;
  const path = getStoragePath(file);
  const url = f.url ?? f.response?.data?.url ?? null;

  const params = new URLSearchParams();
  if (path) params.set("path", path);
  else if (url) params.set("url", url);
  else return;

  try {
    await fetch(`/api/upload?${params.toString()}`, { method: "DELETE" });
  } catch (e) {
    console.error("Error deleting asset from Cloudinary:", e);
  }
}

/**
 * Stash file lama per field, diisi saat beforeUpload (sebelum nilai form
 * berganti) dan dipakai saat upload baru selesai untuk menghapus aset
 * lama yang diganti (upload maxCount=1 tidak memicu onRemove).
 */
const replacedUploadFiles = new Map<string, UploadFileLike>();

/* ------------------------------------------------------------------ */
/*  Field render helper – returns JSX, NOT a component                  */
/* ------------------------------------------------------------------ */

interface RenderFieldParams {
  type?: string;
  name?: NamePath;
  value?: unknown;
  placeholder?: string;
  disabled?: boolean;
  icon?: string;
  select?: { options?: DefaultOptionType[] };
  accept?: string;
  maxLength?: number;
  uploadHint?: { hint: string; subHint: string };
  formInstance?: import("antd").FormInstance;
  uploadFolder?: string;
}

function renderField(params: RenderFieldParams): ReactNode {
  const {
    type,
    name,
    placeholder,
    disabled,
    icon,
    select,
    accept,
    maxLength,
    uploadHint,
    formInstance,
    uploadFolder,
  } = params;

  let tpl: string | undefined;
  switch (type) {
    case "input":
    case "textarea":
    case "editor":
    case "password":
      tpl = placeholder;
      break;
    case "select":
    case "select_multiple":
      tpl = placeholder;
      break;
    default:
      tpl = placeholder;
  }

  const IconComp = icon ? getCachedIcon(icon) : null;
  const prefixNode = IconComp ? <IconComp style={{ marginRight: 4 }} /> : null;

  switch (type) {
    case "input":
      return (
        <Input
          prefix={prefixNode}
          placeholder={tpl}
          disabled={disabled}
          maxLength={maxLength}
        />
      );
    case "number":
      return (
        <InputNumber
          prefix={prefixNode}
          placeholder={tpl}
          disabled={disabled}
          className="w-full!"
          min={0}
        />
      );
    case "password":
      return (
        <Input.Password
          prefix={prefixNode}
          placeholder={tpl}
          disabled={disabled}
          maxLength={maxLength}
        />
      );
    case "textarea":
      return (
        <Input.TextArea
          placeholder={tpl}
          disabled={disabled}
          maxLength={maxLength}
          showCount={maxLength !== undefined}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      );
    case "select":
      return (
        <Select
          prefix={prefixNode}
          placeholder={tpl}
          disabled={disabled}
          options={select?.options}
          allowClear
        />
      );
    case "select_multiple":
      return (
        <Select
          mode="multiple"
          allowClear
          prefix={prefixNode}
          placeholder={tpl}
          disabled={disabled}
          options={select?.options}
        />
      );
    case "upload":
      return (
        <Upload.Dragger
          name={typeof name === "string" ? name : undefined}
          disabled={disabled}
          multiple={false}
          maxCount={1}
          accept={accept ?? "image/*"}
          listType="picture"
          action="/api/upload"
          data={{ folder: uploadFolder ?? "misc" }}
          beforeUpload={(file) => {
            if (file.size > 2 * 1024 * 1024) return false;
            const prev = formInstance?.getFieldValue(name);
            const prevFile = Array.isArray(prev) ? prev[0] : null;
            if (prevFile) replacedUploadFiles.set(String(name), prevFile);
            return true;
          }}
          onChange={(info) => {
            if (info.file.status === "done" && info.file.response?.success) {
              const url = info.file.response.data.url;
              const storagePath = info.file.response.data.storagePath;
              const replaced = replacedUploadFiles.get(String(name));
              replacedUploadFiles.delete(String(name));
              if (replaced) void deleteUploadAsset(replaced);
              formInstance?.setFieldValue(name, [
                {
                  uid: info.file.uid,
                  name: info.file.name,
                  status: "done",
                  url,
                  storagePath,
                },
              ]);
            }
          }}
          onRemove={async (file) => {
            await deleteUploadAsset(file);
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{uploadHint?.hint}</p>
          <p className="ant-upload-hint">{uploadHint?.subHint}</p>
        </Upload.Dragger>
      );
    case "editor":
      return (
        <Editor
          placeholder={tpl}
          disabled={disabled}
          maxLength={maxLength}
        />
      );
    case "date":
      return (
        <DatePicker
          disabled={disabled}
          style={{ width: "100%" }}
          placeholder={tpl}
        />
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  FormAdmin component                                                */
/* ------------------------------------------------------------------ */

/**
 * Form generik untuk panel admin, digerakkan konfigurasi layout
 * (pola admin-portfolio). Dipakai bersama FormDrawer/Modal.
 */
const FormAdmin = ({
  layout,
  optionList,
  formProps,
  uploadFolder,
}: FormAdminProps) => {
  const { t } = useT();
  const [, setIconsReady] = useState(false);

  const form = Form.useFormInstance();

  useEffect(() => {
    let cancelled = false;
    const iconNames = collectIconNames(layout);
    Promise.all(iconNames.map(ensureIcon)).then(() => {
      if (!cancelled) setIconsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [layout]);

  /** Hitung panjang teks bersih (editor HTML tag diabaikan). */
  const getTextLength = (item: FormLayoutItem, value: unknown): number => {
    if (typeof value !== "string") return 0;
    if (item.type === "editor") {
      return value
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim().length;
    }
    return value.length;
  };

  /** Susun rules form: custom + required + batas maxLength. */
  const buildRules = (item: FormLayoutItem, required: boolean | undefined) => {
    const rules = [...(item.rules ?? [])];
    if (required) {
      rules.push({
        required: true,
        message: t("validation.required", {
          field: item.label ?? t(`form.${item.name}`),
        }),
      });
    }
    if (item.maxLength !== undefined) {
      rules.push({
        validator: (_: unknown, value: unknown) => {
          if (getTextLength(item, value) > item.maxLength!) {
            return Promise.reject(
              new Error(
                t("validation.maxLength", {
                  field: item.label ?? t(`form.${item.name}`),
                  max: item.maxLength!,
                }),
              ),
            );
          }
          return Promise.resolve();
        },
      });
    }
    return rules.length > 0 ? rules : undefined;
  };

  /** Render item form standar. */
  const renderStandardField = (item: FormLayoutItem) => (
    <Form.Item
      name={item.name}
      label={item.label ?? t(`form.${item.name}`)}
      rules={buildRules(item, item.required)}
    >
      {renderField({
        type: item.type,
        name: item.name,
        placeholder: item.placeholder,
        icon: item.icon,
        disabled: (formProps as FormProps)?.disabled || item.disabled,
        select: { options: optionList?.[item.name] },
        maxLength: item.maxLength,
        uploadHint: {
          hint: t("upload.hint"),
          subHint: t("upload.subHint"),
        },
        formInstance: (formProps as FormProps)?.form ?? form,
        uploadFolder,
      })}
    </Form.Item>
  );

  const renderForm = (formLayout: FormLayout[]) =>
    formLayout
      .filter((section) => !section.hidden)
      .map((section) => {
        const sectionTitle = section.titleKey
          ? t(section.titleKey)
          : section.title;
        return (
          <div key={sectionTitle?.toLowerCase() ?? section.key}>
            <h2
              hidden={!sectionTitle}
              className="font-semibold text-xl py-1 m-0"
            >
              {sectionTitle}
            </h2>
            <hr hidden={!sectionTitle} className="py-1 border-neutral-500/50" />
            {section.items.map((item: FormLayoutItem) => {
              /* ---- repeatable list ---- */
              if (item.isList) {
                return (
                  <Form.List key={item.name} name={item.name}>
                    {(fields, { add }) => (
                      <div className="flex flex-col gap-2">
                        <label>{item.label ?? t(`form.${item.name}`)}</label>
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} className="flex gap-2">
                            <Form.Item
                              {...restField}
                              name={name}
                              rules={buildRules(item, item.required)}
                              className="!mb-0 flex-1"
                            >
                              {renderField({
                                type: item.type,
                                name: item.name,
                                icon: item.icon,
                                disabled: item.disabled,
                                select: { options: optionList?.[item.name] },
                                maxLength: item.maxLength,
                              })}
                            </Form.Item>
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          disabled={item.disabled}
                          onClick={() => add()}
                          block
                          style={{ margin: "0 0 24px" }}
                        >
                          {t("common.addField", {
                            field: item.label ?? t(`form.${item.name}`),
                          })}
                        </Button>
                      </div>
                    )}
                  </Form.List>
                );
              }

              /* ---- upload fields ---- */
              if (item.type === "upload") {
                return (
                  <Form.Item
                    key={item.name}
                    name={item.name}
                    label={item.label ?? t(`form.${item.name}`)}
                    valuePropName="fileList"
                    getValueFromEvent={(e) => {
                      if (Array.isArray(e)) return e;
                      return e?.fileList;
                    }}
                  >
                    {renderField({
                      type: item.type,
                      name: item.name,
                      placeholder: item.placeholder,
                      disabled: item.disabled,
                      accept: item.accept,
                      select: { options: optionList?.[item.name] },
                      uploadHint: {
                        hint: t("upload.hint"),
                        subHint: t("upload.subHint"),
                      },
                      formInstance: (formProps as FormProps)?.form ?? form,
                      uploadFolder,
                    })}
                  </Form.Item>
                );
              }

              /* ---- conditional field (hiddenWhen) ---- */
              if (item.hiddenWhen) {
                const cond = item.hiddenWhen;
                return (
                  <Form.Item
                    key={item.name}
                    noStyle
                    shouldUpdate={(prev, cur) =>
                      prev[cond.field] !== cur[cond.field]
                    }
                  >
                    {({ getFieldValue }) => {
                      const val = getFieldValue(cond.field);
                      const hidden =
                        cond.equals !== undefined
                          ? val === cond.equals
                          : val !== cond.notEquals;
                      return hidden ? null : renderStandardField(item);
                    }}
                  </Form.Item>
                );
              }

              /* ---- standard field ---- */
              return <div key={item.name}>{renderStandardField(item)}</div>;
            })}
          </div>
        );
      });

  return (
    <Form
      autoComplete="off"
      form={formProps?.form ?? form}
      disabled={formProps?.disabled}
      layout={formProps?.layout ?? "vertical"}
      initialValues={formProps?.initialValues}
      onValuesChange={formProps?.onValuesChange}
    >
      {renderForm(layout)}
    </Form>
  );
};

export default FormAdmin;
