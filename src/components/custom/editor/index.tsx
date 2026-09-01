"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[150px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
  ),
});

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Batas jumlah karakter teks (tag HTML diabaikan saat menghitung). */
  maxLength?: number;
}

const modules = {
  toolbar: [["bold", "italic", "underline"], ["link"], ["blockquote"]],
};

const formats = ["bold", "italic", "underline", "link", "blockquote"];

/** Hitung jumlah karakter teks bersih (tanpa tag HTML). */
const countTextLength = (html?: string | null): number => {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length;
};

/** Text editor rich (react-quill-new) untuk form paragraf, pola admin-portfolio. */
const Editor = ({
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
}: EditorProps) => {
  const { theme } = useTheme();
  const quillModules = useMemo(() => modules, []);
  const [focused, setFocused] = useState(false);
  const length = countTextLength(value);

  useEffect(() => {
    const editorContainer = document.querySelector(
      ".ql-editor",
    ) as HTMLElement;
    if (editorContainer) {
      editorContainer.style.minHeight = "100px";
    }
  }, []);

  return (
    <div className={`transition-colors ${theme === "dark" ? "dark" : ""}`}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={quillModules}
        formats={formats}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {maxLength !== undefined && (focused || length > 0) && (
        <div
          className={`text-right text-xs mt-1 ${
            length > maxLength ? "text-red-500" : "text-gray-400"
          }`}
        >
          {length} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default Editor;
