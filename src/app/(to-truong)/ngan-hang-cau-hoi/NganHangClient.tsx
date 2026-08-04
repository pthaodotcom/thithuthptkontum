"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, ChevronDown, FileText, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import RichContent from "@/components/RichContent";
import { Button } from "@/components/ui/button";
import DeXuatChinhSuaDialog from "@/components/DeXuatChinhSuaDialog";
import { xoaHoacVoHieuHoa } from "./actions";

type ChiTiet = { thu_tu: number; noi_dung: string; la_dap_an_dung: boolean };
type ChuyenDe = { chuyen_de_id: string; ten_chuyen_de: string; bai_hoc: { bai_hoc_id: string; ten_bai_hoc: string }[] };
type MucDo = { muc_do_id: string; ten_muc: string };
type NguoiTao = { tai_khoan_id: string; ho_ten: string };
type Cau = {
  cau_hoi_id: string; phan: string; noi_dung: string; dap_an_phan3: string | null;
  chi_tiet_cau_hoi: ChiTiet[]; trang_thai_duyet: string; trang_thai_su_dung: string;
  trang_thai_hoat_dong: string; muc_do_id: string; nguoi_tao_tai_khoan_id: string | null;
  tai_khoan: { ho_ten: string } | null;
  bai_hoc: { bai_hoc_id: string; ten_bai_hoc: string; chuyen_de: { chuyen_de_id: string; ten_chuyen_de: string } };
  yeu_cau_chinh_sua: { trang_thai: string }[];
};

const PAGE_SIZE = 20;

export default function NganHangClient({ mon, cauHoi, chuyenDe, mucDo, nguoiTao, currentUserId, readOnly = false, allowOwnRevision = false }: {
  mon: string; cauHoi: Cau[]; chuyenDe: ChuyenDe[]; mucDo: MucDo[]; nguoiTao: NguoiTao[]; currentUserId: string; readOnly?: boolean; allowOwnRevision?: boolean;
}) {
  const [q, setQ] = useState("");
  const [phan, setPhan] = useState("");
  const [duyet, setDuyet] = useState("");
  const [dung, setDung] = useState("");
  const [owner, setOwner] = useState("");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [level, setLevel] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revisionQuestion, setRevisionQuestion] = useState<Cau | null>(null);
  const [pending, start] = useTransition();

  const lessons = useMemo(() => chuyenDe
    .filter((item) => !chapter || item.chuyen_de_id === chapter)
    .flatMap((item) => item.bai_hoc), [chuyenDe, chapter]);

  const rows = useMemo(() => cauHoi.filter((item) =>
    (!q || item.noi_dung.toLowerCase().includes(q.toLowerCase()))
    && (!phan || item.phan === phan)
    && (!duyet || item.trang_thai_duyet === duyet)
    && (!dung || item.trang_thai_su_dung === dung)
    && (!owner || item.nguoi_tao_tai_khoan_id === (owner === "mine" ? currentUserId : owner))
    && (!chapter || item.bai_hoc.chuyen_de.chuyen_de_id === chapter)
    && (!lesson || item.bai_hoc.bai_hoc_id === lesson)
    && (!level || item.muc_do_id === level)
  ), [cauHoi, q, phan, duyet, dung, owner, currentUserId, chapter, lesson, level]);
  const visibleRows = rows.slice(0, visibleCount);

  const remove = (id: string) => {
    if (!window.confirm("Xóa hoặc vô hiệu hóa câu hỏi này?")) return;
    start(async () => {
      const result = await xoaHoacVoHieuHoa(id);
      result.success ? toast.success(result.voHieuHoa ? "Đã vô hiệu hóa" : "Đã xóa") : toast.error(result.error);
    });
  };

  const bulkRemove = () => {
    const ids = [...selected];
    if (!ids.length || !window.confirm(`Xóa hoặc vô hiệu hóa ${ids.length} câu hỏi đã chọn?`)) return;
    start(async () => {
      const results = await Promise.all(ids.map((id) => xoaHoacVoHieuHoa(id)));
      const successCount = results.filter((result) => result.success).length;
      if (successCount) toast.success(`Đã xử lý ${successCount}/${ids.length} câu hỏi`);
      if (successCount < ids.length) toast.error(`${ids.length - successCount} câu hỏi không thể xử lý`);
      setSelected(new Set());
    });
  };

  const toggleSelected = (id: string) => setSelected((old) => {
    const next = new Set(old);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-blue-600">Môn {mon}</p>
      <h1 className="text-2xl font-bold">Ngân hàng câu hỏi</h1>
      <p className="mt-1 text-sm text-slate-500">{readOnly ? "Xem các câu hỏi thuộc môn phụ trách và những câu hỏi bạn đã tải lên." : "Tra cứu và quản lý các câu hỏi trong kho của bộ môn."}</p>
    </header>

    <div className="grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <input className="h-10 rounded-md border px-3 text-sm sm:col-span-2" placeholder="Tìm nội dung câu hỏi…" aria-label="Tìm nội dung câu hỏi" value={q} onChange={(event) => { setQ(event.target.value); setVisibleCount(PAGE_SIZE); }} />
      <Filter value={chapter} set={(value) => { setChapter(value); setLesson(""); setVisibleCount(PAGE_SIZE); }} all="Mọi chương" items={chuyenDe.map((item) => [item.chuyen_de_id, item.ten_chuyen_de])} />
      <Filter value={lesson} set={(value) => { setLesson(value); setVisibleCount(PAGE_SIZE); }} all="Mọi bài học" items={lessons.map((item) => [item.bai_hoc_id, item.ten_bai_hoc])} />
      <Filter value={level} set={(value) => { setLevel(value); setVisibleCount(PAGE_SIZE); }} all="Mọi mức độ" items={mucDo.map((item) => [item.muc_do_id, item.ten_muc])} />
      <Filter value={owner} set={setOwner} all="Tất cả người tạo" items={[
        ["mine", "Câu hỏi của tôi"],
        ...nguoiTao.filter((item) => item.tai_khoan_id !== currentUserId).map((item) => [item.tai_khoan_id, item.ho_ten]),
      ]} />
      <Filter value={phan} set={setPhan} all="Mọi phần" items={[["I", "Phần I"], ["II", "Phần II"], ["III", "Phần III"]]} />
      <Filter value={duyet} set={setDuyet} all="Mọi trạng thái duyệt" items={[["ChoDuyet", "Chờ duyệt"], ["CanChinhSua", "Cần chỉnh sửa"], ["DaDuyet", "Đã duyệt"], ["TuChoi", "Từ chối"]]} />
      <Filter value={dung} set={setDung} all="Mọi trạng thái sử dụng" items={[["ChuaDung", "Chưa dùng"], ["DaDung", "Đã dùng"]]} />
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <p>Đang hiển thị <strong className="text-slate-900">{Math.min(visibleRows.length, rows.length)}</strong> trong <strong className="text-slate-900">{rows.length}</strong> câu hỏi phù hợp.</p>
      {!readOnly && visibleRows.length > 0 && <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={visibleRows.every((item) => selected.has(item.cau_hoi_id))} onChange={(event) => setSelected(event.target.checked ? new Set(visibleRows.map((item) => item.cau_hoi_id)) : new Set())} />
        Chọn tất cả đang hiển thị
      </label>}
    </div>

    {!readOnly && selected.size > 0 && <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-900 px-4 py-3 text-white shadow-lg">
      <span className="text-sm font-semibold">Đã chọn {selected.size} câu hỏi</span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>Bỏ chọn</Button>
        <Button size="sm" variant="destructive" disabled={pending} onClick={bulkRemove}><Trash2 className="mr-1.5 h-4 w-4" />Xóa / Vô hiệu hóa</Button>
      </div>
    </div>}

    <div className="space-y-3">
      {rows.length === 0 && <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Không có câu hỏi phù hợp với bộ lọc.</div>}
      {visibleRows.map((item) => <QuestionCard
        key={item.cau_hoi_id}
        item={item}
        levelName={mucDo.find((levelItem) => levelItem.muc_do_id === item.muc_do_id)?.ten_muc || "Chưa xác định"}
        isMine={item.nguoi_tao_tai_khoan_id === currentUserId}
        readOnly={readOnly}
        checked={selected.has(item.cau_hoi_id)}
        pending={pending}
        allowRevision={allowOwnRevision && item.nguoi_tao_tai_khoan_id === currentUserId && item.trang_thai_duyet === "DaDuyet"}
        onRevision={() => setRevisionQuestion(item)}
        onToggle={() => toggleSelected(item.cau_hoi_id)}
        onRemove={() => remove(item.cau_hoi_id)}
      />)}
    </div>

    <DeXuatChinhSuaDialog cauHoi={revisionQuestion} chuyenDe={chuyenDe} mucDo={mucDo} onClose={() => setRevisionQuestion(null)} />

    {visibleRows.length < rows.length && <div className="flex justify-center">
      <Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Tải thêm {Math.min(PAGE_SIZE, rows.length - visibleRows.length)} câu hỏi</Button>
    </div>}
  </div>;
}

function QuestionCard({ item, levelName, isMine, readOnly, checked, pending, allowRevision, onToggle, onRemove, onRevision }: {
  item: Cau; levelName: string; isMine: boolean; readOnly: boolean; checked: boolean; pending: boolean;
  allowRevision: boolean;
  onToggle: () => void; onRemove: () => void; onRevision: () => void;
}) {
  return <article className={`rounded-xl border bg-white p-4 transition-colors ${checked ? "border-blue-400 bg-blue-50/30 ring-1 ring-blue-200" : "border-slate-200"}`}>
    <div className="flex items-start gap-3">
      {!readOnly && <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" aria-label="Chọn câu hỏi" checked={checked} onChange={onToggle} />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="bg-blue-100 text-blue-700">Phần {item.phan}</Badge>
          <Badge className="bg-violet-100 text-violet-700">{levelName}</Badge>
          <Badge className={item.trang_thai_duyet === "DaDuyet" ? "bg-emerald-100 text-emerald-700" : item.trang_thai_duyet === "ChoDuyet" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>{approvalLabel(item.trang_thai_duyet)}</Badge>
          <Badge className={item.trang_thai_su_dung === "DaDung" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}>{usageLabel(item.trang_thai_su_dung)}</Badge>
          {item.trang_thai_hoat_dong === "VoHieuHoa" && <Badge className="bg-red-100 text-red-700">Vô hiệu hóa</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <strong className="text-slate-700">{item.bai_hoc.chuyen_de.ten_chuyen_de}</strong>
          </span>
          <span className="hidden h-4 border-l border-slate-300 sm:block" aria-hidden="true" />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <strong className="text-slate-700">{item.bai_hoc.ten_bai_hoc}</strong>
          </span>
          <span className="hidden h-4 border-l border-slate-300 sm:block" aria-hidden="true" />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span><strong className="text-slate-700">Người tạo:</strong> {isMine ? "Bạn" : item.tai_khoan?.ho_ten || "Không xác định"}</span>
          </span>
        </div>
        <RichContent value={mathContent(item.noi_dung)} className="mt-3 text-sm leading-6 text-slate-900" />

        <details className="group mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold text-emerald-800">
            Xem đáp án
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="border-t border-emerald-200 px-3 py-3"><DapAn cau={item} /></div>
        </details>

        {item.yeu_cau_chinh_sua?.some((request) => request.trang_thai === "ChoDuyet") && <p className="mt-3 text-xs font-semibold text-amber-700">Đang có yêu cầu chỉnh sửa chờ duyệt.</p>}
        {allowRevision && !item.yeu_cau_chinh_sua?.some((request) => request.trang_thai === "ChoDuyet") && <div className="mt-3 flex justify-end"><Button type="button" size="sm" variant="outline" onClick={onRevision}>Đề xuất chỉnh sửa</Button></div>}
        {!readOnly && <div className="mt-3 flex justify-end"><Button size="sm" variant="outline" disabled={pending} onClick={onRemove}>{item.trang_thai_su_dung === "ChuaDung" ? "Xóa" : "Vô hiệu hóa"}</Button></div>}
      </div>
    </div>
  </article>;
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function DapAn({ cau }: { cau: Cau }) {
  if (cau.phan === "III") return <p className="text-sm text-emerald-800"><span className="font-semibold">Đáp án:</span> {cau.dap_an_phan3 || "Chưa có đáp án"}</p>;
  const chiTiet = [...(cau.chi_tiet_cau_hoi || [])].sort((a, b) => a.thu_tu - b.thu_tu);
  if (!chiTiet.length) return <p className="text-sm italic text-amber-700">Câu hỏi chưa có dữ liệu đáp án.</p>;
  return <div className="grid gap-2 sm:grid-cols-2">{chiTiet.map((detail, index) => {
    const correct = detail.la_dap_an_dung;
    return <div key={detail.thu_tu} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${correct ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${correct ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>{correct ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}</span>
      <div className="min-w-0"><b>{cau.phan === "I" ? String.fromCharCode(65 + index) : String.fromCharCode(97 + index)}.</b> <RichContent value={mathContent(detail.noi_dung)} className="inline" /> {cau.phan === "II" && <strong className="ml-1">({correct ? "Đúng" : "Sai"})</strong>}</div>
    </div>;
  })}</div>;
}

function Filter({ value, set, all, items }: { value: string; set: (value: string) => void; all: string; items: string[][] }) {
  return <select className="h-10 min-w-0 rounded-md border bg-white px-3 text-sm" aria-label={all} value={value} onChange={(event) => set(event.target.value)}>
    <option value="">{all}</option>
    {items.map((item) => <option key={item[0]} value={item[0]}>{item[1]}</option>)}
  </select>;
}

function approvalLabel(value: string) {
  return value === "DaDuyet" ? "Đã duyệt" : value === "ChoDuyet" ? "Chờ duyệt" : value === "CanChinhSua" ? "Cần chỉnh sửa" : "Từ chối";
}

function usageLabel(value: string) {
  return value === "DaDung" ? "Đã dùng" : "Chưa dùng";
}

function mathContent(value: string) {
  return value.includes("$") ? value : value.replace(/([A-Za-z])\^([0-9]+)/g, "$1<sup>$2</sup>");
}
