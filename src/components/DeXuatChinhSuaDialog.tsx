"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { BookOpen, Loader2, MessageSquareWarning, Send, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { guiYeuCauChinhSua } from "@/app/(giao-vien)/yeu-cau-chinh-sua/actions";
import RichContentEditor from "@/components/RichContentEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NHAN_PHAN_LOAI_LOI, PHAN_LOAI_LOI, type PhanLoaiLoi } from "@/lib/rules/yeu-cau-chinh-sua";

type ChiTiet = { thu_tu: number; noi_dung: string; la_dap_an_dung: boolean };
type CauHoi = { cau_hoi_id: string; phan: string; noi_dung: string; dap_an_phan3: string | null; muc_do_id: string; chi_tiet_cau_hoi: ChiTiet[]; bai_hoc: { bai_hoc_id: string } };
type ChuyenDe = { chuyen_de_id: string; ten_chuyen_de: string; bai_hoc: { bai_hoc_id: string; ten_bai_hoc: string }[] };
type MucDo = { muc_do_id: string; ten_muc: string };

export default function DeXuatChinhSuaDialog({ cauHoi, chuyenDe, mucDo, onClose }: { cauHoi: CauHoi | null; chuyenDe: ChuyenDe[]; mucDo: MucDo[]; onClose: () => void }) {
  const [noiDung, setNoiDung] = useState("");
  const [baiHocId, setBaiHocId] = useState("");
  const [mucDoId, setMucDoId] = useState("");
  const [chiTiet, setChiTiet] = useState<ChiTiet[]>([]);
  const [dapAn3, setDapAn3] = useState("");
  const [phanLoaiLoi, setPhanLoaiLoi] = useState<PhanLoaiLoi | "">("");
  const [lyDo, setLyDo] = useState("");
  const [lyDoTouched, setLyDoTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!cauHoi) return;
    setNoiDung(cauHoi.noi_dung); setBaiHocId(cauHoi.bai_hoc.bai_hoc_id); setMucDoId(cauHoi.muc_do_id);
    setChiTiet([...cauHoi.chi_tiet_cau_hoi].sort((a, b) => a.thu_tu - b.thu_tu));
    setDapAn3(cauHoi.dap_an_phan3 || ""); setPhanLoaiLoi(""); setLyDo(""); setLyDoTouched(false); setSubmitError("");
  }, [cauHoi]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cauHoi || !["I", "II", "III"].includes(cauHoi.phan)) return;
    setLyDoTouched(true);
    if (lyDo.trim().length < 5) return;
    setSubmitError("");
    startTransition(async () => {
      const result = await guiYeuCauChinhSua({ cauHoiId: cauHoi.cau_hoi_id, lyDo, phanLoaiLoi: phanLoaiLoi || undefined, deXuat: {
        phan: cauHoi.phan as "I" | "II" | "III", baiHocId, mucDoId, noiDung,
        chiTiet: cauHoi.phan === "III" ? [] : chiTiet.map((item) => ({ noiDung: item.noi_dung, laDapAnDung: item.la_dap_an_dung })),
        dapAnPhan3: cauHoi.phan === "III" ? dapAn3 : null,
      }});
      if (!result.success) { setSubmitError(result.error || "Không thể gửi yêu cầu. Vui lòng kiểm tra và thử lại."); toast.error(result.error); return; }
      toast.success("Đã gửi yêu cầu chỉnh sửa"); onClose();
    });
  }

  const lyDoError = lyDoTouched && lyDo.trim().length < 5 ? "Vui lòng nhập ít nhất 5 ký tự để Tổ trưởng hiểu nội dung cần sửa." : "";

  return <Dialog open={!!cauHoi} onOpenChange={(open) => !open && onClose()}><DialogContent className="gap-0 p-0 sm:max-w-4xl">
    {cauHoi && <form className="space-y-5" onSubmit={submit}>
      <DialogHeader className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 pr-16 text-left sm:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><MessageSquareWarning className="h-5 w-5" aria-hidden="true" /></span><div><DialogTitle>Đề xuất chỉnh sửa</DialogTitle><DialogDescription>Phần {cauHoi.phan} · Nội dung sẽ được gửi cho Tổ trưởng duyệt</DialogDescription></div></div></DialogHeader>
      <div className="space-y-5 px-5 sm:px-6">
      <section className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><BookOpen className="h-4 w-4 text-sky-700" aria-hidden="true" />Nội dung câu hỏi</div><div className="grid gap-2"><Label>Đề bài <span className="text-red-600" aria-hidden="true">*</span></Label><RichContentEditor value={noiDung} onChange={setNoiDung} placeholder="Nhập nội dung câu hỏi đề xuất…" minHeightClass="min-h-40" /></div>
      {cauHoi.phan === "III" ? <div className="grid gap-2"><Label>Đáp án 4 ký tự</Label><Input className="h-11" maxLength={4} pattern="[0-9,-]{4}" value={dapAn3} onChange={(e) => setDapAn3(e.target.value)} /></div> : <div className="space-y-2"><Label>{cauHoi.phan === "I" ? "Phương án trả lời" : "Các ý Đúng/Sai"}</Label>{chiTiet.map((item, index) => <div key={item.thu_tu} className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-slate-700 shadow-sm">{String.fromCharCode((cauHoi.phan === "I" ? 65 : 97) + index)}</span><Input className="h-11 bg-white" value={item.noi_dung} onChange={(e) => setChiTiet((old) => old.map((x, i) => i === index ? { ...x, noi_dung: e.target.value } : x))} /><label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium"><input className="h-5 w-5 accent-slate-900" type={cauHoi.phan === "I" ? "radio" : "checkbox"} name={cauHoi.phan === "I" ? "correct" : undefined} checked={item.la_dap_an_dung} onChange={() => setChiTiet((old) => old.map((x, i) => ({ ...x, la_dap_an_dung: cauHoi.phan === "I" ? i === index : i === index ? !x.la_dap_an_dung : x.la_dap_an_dung })))} />{item.la_dap_an_dung ? "Đúng" : "Sai"}</label></div>)}</div>}</section>
      <section className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><SlidersHorizontal className="h-4 w-4 text-sky-700" aria-hidden="true" />Phân loại câu hỏi</div><div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2"><Label>Bài học</Label><select className="h-10 min-w-0 rounded-lg border bg-white px-3 text-sm" value={baiHocId} onChange={(e) => setBaiHocId(e.target.value)}>{chuyenDe.map((cd) => <optgroup key={cd.chuyen_de_id} label={cd.ten_chuyen_de}>{cd.bai_hoc.map((bh) => <option key={bh.bai_hoc_id} value={bh.bai_hoc_id}>{bh.ten_bai_hoc}</option>)}</optgroup>)}</select></div>
        <div className="grid min-w-0 gap-2"><Label>Mức độ</Label><select className="h-10 min-w-0 rounded-lg border bg-white px-3 text-sm" value={mucDoId} onChange={(e) => setMucDoId(e.target.value)}>{mucDo.map((md) => <option key={md.muc_do_id} value={md.muc_do_id}>{md.ten_muc}</option>)}</select></div>
      </div></section>
      <section className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><MessageSquareWarning className="h-4 w-4 text-sky-700" aria-hidden="true" />Lý do đề xuất</div><div className="space-y-4 rounded-xl border border-slate-200 p-4"><div className="grid gap-2"><Label>Phân loại lỗi <span className="font-normal text-slate-500">(tùy chọn)</span></Label><select className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900" value={phanLoaiLoi} onChange={(e) => setPhanLoaiLoi(e.target.value as PhanLoaiLoi | "")}><option value="">Không chọn</option>{PHAN_LOAI_LOI.map((key) => <option key={key} value={key}>{NHAN_PHAN_LOAI_LOI[key]}</option>)}</select></div><div className="grid gap-2"><Label htmlFor="revision-reason">Lý do chỉnh sửa <span className="text-red-600" aria-hidden="true">*</span></Label><textarea id="revision-reason" required minLength={5} maxLength={500} aria-invalid={!!lyDoError} aria-describedby="revision-reason-help" value={lyDo} onChange={(e) => setLyDo(e.target.value)} onBlur={() => setLyDoTouched(true)} className={`min-h-24 resize-y rounded-lg border p-3 text-base leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${lyDoError ? "border-red-500 bg-red-50/40" : "border-slate-300"}`} /><div id="revision-reason-help" className="flex justify-between gap-3 text-xs"><span className={lyDoError ? "font-medium text-red-700" : "text-slate-500"} role={lyDoError ? "alert" : undefined}>{lyDoError || "Mô tả cụ thể điểm chưa chính xác và nội dung mong muốn."}</span><span className="shrink-0 tabular-nums text-slate-500">{lyDo.length}/500</span></div></div></div></section>
      {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{submitError}</div>}
      </div>
      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6"><Button type="button" variant="outline" className="min-h-11 cursor-pointer px-5" disabled={isPending} onClick={onClose}>Hủy</Button><Button className="min-h-11 cursor-pointer px-5" disabled={isPending || lyDo.trim().length < 5}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Send className="mr-2 h-4 w-4" />}{isPending ? "Đang gửi…" : "Gửi đề xuất"}</Button></div>
    </form>}
  </DialogContent></Dialog>;
}
