"use client";

import { useRef, useState } from "react";
import {
  Bold, Code2, Eye, ImagePlus, Italic, Link2, List, ListOrdered,
  Pilcrow, Sigma, Table2, Underline,
} from "lucide-react";
import { toast } from "sonner";
import RichContent from "@/components/RichContent";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
};

export default function RichContentEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung…",
  minHeightClass = "min-h-56",
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function insert(before: string, after = "", fallback = "") {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      const caret = start + before.length + selected.length + after.length;
      textarea?.setSelectionRange(caret, caret);
    });
  }
  function insertRaw(content: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${content}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea?.focus();
      const caret = start + content.length;
      textarea?.setSelectionRange(caret, caret);
    });
  }

  function insertFormula(display: boolean) {
    const formula = window.prompt("Nhập công thức LaTeX:", display ? "\\frac{a}{b}" : "x^2");
    if (!formula) return;
    insertRaw(display ? `\n$$${formula}$$\n` : `$${formula}$`);
  }

  function insertLink() {
    const url = window.prompt("Nhập đường dẫn liên kết:", "https://");
    if (!url) return;
    const safeUrl = url.replace(/["<>]/g, "");
    insert(`<a href="${safeUrl}">`, "</a>", "Nội dung liên kết");
  }

  async function insertImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Vui lòng chọn đúng định dạng ảnh");
    if (file.size > 2 * 1024 * 1024) return toast.error("Ảnh không được vượt quá 2 MB");
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const safeAlt = file.name.replace(/[<>"']/g, "");
    insertRaw(`\n<img src="${dataUrl}" alt="${safeAlt}" />\n`);
    if (imageRef.current) imageRef.current.value = "";
  }

  const tools = [
    { title: "Đoạn văn", icon: Pilcrow, action: () => insert("<p>", "</p>", "Nội dung") },
    { title: "In đậm", icon: Bold, action: () => insert("<strong>", "</strong>", "văn bản") },
    { title: "In nghiêng", icon: Italic, action: () => insert("<em>", "</em>", "văn bản") },
    { title: "Gạch chân", icon: Underline, action: () => insert("<u>", "</u>", "văn bản") },
    { title: "Danh sách", icon: List, action: () => insert("\n<ul>\n  <li>", "</li>\n</ul>\n", "Mục") },
    { title: "Danh sách số", icon: ListOrdered, action: () => insert("\n<ol>\n  <li>", "</li>\n</ol>\n", "Mục") },
    { title: "Công thức trong dòng", icon: Sigma, action: () => insertFormula(false) },
    { title: "Công thức dạng khối", icon: Code2, action: () => insertFormula(true) },
    { title: "Chèn bảng 2×2", icon: Table2, action: () => insertRaw("\n<table><tbody><tr><td>Ô 1</td><td>Ô 2</td></tr><tr><td>Ô 3</td><td>Ô 4</td></tr></tbody></table>\n") },
    { title: "Chèn liên kết", icon: Link2, action: insertLink },
    { title: "Chèn ảnh", icon: ImagePlus, action: () => imageRef.current?.click() },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b bg-slate-50 px-2.5 py-1.5">
        <div className="flex flex-wrap gap-1">
          {tools.map(({ title, icon: Icon, action }) => (
            <button key={title} type="button" title={title} aria-label={title} onClick={action} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm">
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(event) => void insertImage(event.target.files?.[0])} />
        </div>
        <div className="flex rounded-lg border bg-white p-0.5">
          <button type="button" onClick={() => setMode("edit")} className={`rounded-md px-2.5 py-1 text-xs font-medium ${mode === "edit" ? "bg-primary text-primary-foreground" : "text-slate-600"}`}>Soạn thảo</button>
          <button type="button" onClick={() => setMode("preview")} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${mode === "preview" ? "bg-primary text-primary-foreground" : "text-slate-600"}`}><Eye className="h-3.5 w-3.5" />Xem trước</button>
        </div>
      </div>
      {mode === "edit" ? (
        <textarea ref={textareaRef} className={`${minHeightClass} w-full resize-y border-0 p-3 text-sm leading-6 outline-none`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <div className={`${minHeightClass} bg-white p-3`}>
          {value.trim() ? <RichContent value={value} className="text-sm leading-6" /> : <p className="text-sm text-slate-400">Chưa có nội dung để xem trước.</p>}
        </div>
      )}
      <div className="border-t bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
        Có thể định dạng chữ, công thức toán, bảng, liên kết và ảnh tối đa 2 MB.
      </div>
    </div>
  );
}
