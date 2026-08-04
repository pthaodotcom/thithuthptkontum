"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichContent, { renderRichContent } from "@/components/RichContent";
import RichContentEditor from "@/components/RichContentEditor";
import { NHAN_PHAN_LOAI_LOI, PHAN_LOAI_LOI, type PhanLoaiLoi } from "@/lib/rules/yeu-cau-chinh-sua";
import { guiYeuCauChinhSua } from "./actions";

type CauHoi = {
  cau_hoi_id: string; phan: "I" | "II" | "III"; noi_dung: string; dap_an_phan3: string | null;
  bai_hoc_id: string; muc_do_id: string;
  chi_tiet_cau_hoi: { thu_tu: number; noi_dung: string; la_dap_an_dung: boolean }[];
};
type ChuyenDe = { chuyen_de_id: string; ten_chuyen_de: string; bai_hoc: { bai_hoc_id: string; ten_bai_hoc: string }[] };
type MucDo = { muc_do_id: string; ten_muc: string };

export default function YeuCauChinhSuaClient({ cauHoi, chuyenDe, mucDo, yeuCau }: {
  cauHoi: CauHoi[]; chuyenDe: ChuyenDe[]; mucDo: MucDo[];
  yeuCau: { yc_id: string; cau_hoi_id: string; trang_thai: string; ngay_gui: string; noi_dung_de_xuat: { ly_do?: string; phan_loai_loi?: PhanLoaiLoi | null } }[];
}) {
  const pendingIds = new Set(yeuCau.filter((item) => item.trang_thai === "ChoDuyet").map((item) => item.cau_hoi_id));
  const baiHocPhang = useMemo(() => chuyenDe.flatMap((cd) => cd.bai_hoc.map((bh) => ({ ...bh, ten_chuyen_de: cd.ten_chuyen_de }))), [chuyenDe]);
  const mucDoById = useMemo(() => new Map(mucDo.map((item) => [item.muc_do_id, item.ten_muc])), [mucDo]);

  const [tuKhoa, setTuKhoa] = useState("");
  const [locBaiHoc, setLocBaiHoc] = useState("");
  const [locMucDo, setLocMucDo] = useState("");
  const [locPhan, setLocPhan] = useState("");

  const [selected, setSelected] = useState<CauHoi | null>(null);
  const [noiDung, setNoiDung] = useState("");
  const [baiHocId, setBaiHocId] = useState("");
  const [mucDoId, setMucDoId] = useState("");
  const [chiTiet, setChiTiet] = useState<CauHoi["chi_tiet_cau_hoi"]>([]);
  const [dapAn3, setDapAn3] = useState("");
  const [phanLoaiLoi, setPhanLoaiLoi] = useState<PhanLoaiLoi | "">("");
  const [isPending, startTransition] = useTransition();

  const cauHoiHienThi = useMemo(() => cauHoi.filter((item) => {
    if (locPhan && item.phan !== locPhan) return false;
    if (locBaiHoc && item.bai_hoc_id !== locBaiHoc) return false;
    if (locMucDo && item.muc_do_id !== locMucDo) return false;
    if (tuKhoa.trim() && !item.noi_dung.toLowerCase().includes(tuKhoa.trim().toLowerCase())) return false;
    return true;
  }), [cauHoi, locPhan, locBaiHoc, locMucDo, tuKhoa]);

  function edit(item: CauHoi) {
    setSelected(item); setNoiDung(item.noi_dung); setBaiHocId(item.bai_hoc_id); setMucDoId(item.muc_do_id);
    setChiTiet([...item.chi_tiet_cau_hoi].sort((a, b) => a.thu_tu - b.thu_tu)); setDapAn3(item.dap_an_phan3 || "");
    setPhanLoaiLoi("");
  }

  function huy() {
    setSelected(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await guiYeuCauChinhSua({
        cauHoiId: selected.cau_hoi_id,
        lyDo: String(form.get("lyDo") || ""),
        phanLoaiLoi: phanLoaiLoi || undefined,
        deXuat: {
          phan: selected.phan, baiHocId, mucDoId, noiDung,
          chiTiet: selected.phan === "III" ? [] : chiTiet.map((item) => ({ noiDung: item.noi_dung, laDapAnDung: item.la_dap_an_dung })),
          dapAnPhan3: selected.phan === "III" ? dapAn3 : null,
        },
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Đã gửi yêu cầu chỉnh sửa");
      setSelected(null);
    });
  }

  return <div className="space-y-6">
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-bold">Câu hỏi đã duyệt</h2>
      <div className="mb-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" placeholder="Tìm theo nội dung câu hỏi…" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select className="h-9 min-w-0 rounded-lg border border-slate-300 px-2 text-xs" value={locPhan} onChange={(e) => setLocPhan(e.target.value)}>
            <option value="">Mọi Phần</option>
            <option value="I">Phần I</option>
            <option value="II">Phần II</option>
            <option value="III">Phần III</option>
          </select>
          <select className="h-9 min-w-0 rounded-lg border border-slate-300 px-2 text-xs" value={locBaiHoc} onChange={(e) => setLocBaiHoc(e.target.value)}>
            <option value="">Mọi bài học</option>
            {baiHocPhang.map((bh) => <option key={bh.bai_hoc_id} value={bh.bai_hoc_id}>{bh.ten_bai_hoc}</option>)}
          </select>
          <select className="h-9 min-w-0 rounded-lg border border-slate-300 px-2 text-xs" value={locMucDo} onChange={(e) => setLocMucDo(e.target.value)}>
            <option value="">Mọi mức độ</option>
            {mucDo.map((md) => <option key={md.muc_do_id} value={md.muc_do_id}>{md.ten_muc}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        {cauHoiHienThi.length ? cauHoiHienThi.map((item) => {
          const dangChon = selected?.cau_hoi_id === item.cau_hoi_id;
          return <article key={item.cau_hoi_id} className={`rounded-lg border p-4 transition-colors ${dangChon ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"}`}>
            <div className="flex items-start gap-3">
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">Phần {item.phan}</span>
              <p className="line-clamp-3 flex-1 text-sm">{item.noi_dung.replace(/<[^>]+>/g, " ")}</p>
            </div>
            <Button className="mt-3" size="sm" variant={dangChon ? "default" : "outline"} disabled={pendingIds.has(item.cau_hoi_id)} onClick={() => edit(item)}>
              {pendingIds.has(item.cau_hoi_id) ? "Đang chờ duyệt" : dangChon ? "Đang chỉnh sửa" : "Đề xuất chỉnh sửa"}
            </Button>
          </article>;
        }) : <p className="text-sm text-slate-500">Không có câu hỏi nào khớp bộ lọc.</p>}
      </div>
    </section>

    <Dialog open={!!selected} onOpenChange={(open) => !open && huy()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-4xl">
      {selected && <form className="space-y-5" onSubmit={submit}>
        <DialogHeader className="border-b pr-8 pb-4 text-left">
          <DialogTitle>Đề xuất chỉnh sửa · Phần {selected.phan}</DialogTitle>
          <DialogDescription className="line-clamp-2">{selected.noi_dung.replace(/<[^>]+>/g, " ")}</DialogDescription>
        </DialogHeader>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Nội dung gốc (chỉ đọc)</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <RichContent value={selected.noi_dung} />
            {selected.phan !== "III" ? [...selected.chi_tiet_cau_hoi].sort((a, b) => a.thu_tu - b.thu_tu).map((item) => (
              <p key={item.thu_tu} className={`mt-1 ${item.la_dap_an_dung ? "font-semibold text-emerald-700" : ""}`}>{item.thu_tu}. <span dangerouslySetInnerHTML={{ __html: renderRichContent(item.noi_dung) }} /></p>
            )) : selected.dap_an_phan3 && <p className="mt-2 font-semibold">Đáp án: {selected.dap_an_phan3}</p>}
            <p className="mt-2 text-xs text-slate-500">Bài học hiện tại: {baiHocPhang.find((bh) => bh.bai_hoc_id === selected.bai_hoc_id)?.ten_bai_hoc || "—"} · Mức độ hiện tại: {mucDoById.get(selected.muc_do_id) || "—"}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Nội dung chính (đề xuất)</p>
          <div className="grid gap-2"><Label>Đề bài</Label><RichContentEditor value={noiDung} onChange={setNoiDung} placeholder="Nhập nội dung câu hỏi đề xuất…" minHeightClass="min-h-40" /></div>
          {selected.phan === "III" ? <div className="grid gap-2"><Label>Đáp án 4 ký tự</Label><Input maxLength={4} pattern="[0-9,-]{4}" value={dapAn3} onChange={(e) => setDapAn3(e.target.value)} /></div> : <div className="space-y-2"><Label>{selected.phan === "I" ? "Phương án" : "Các ý Đúng/Sai"}</Label>{chiTiet.map((item, index) => <div key={item.thu_tu} className="flex gap-2"><Input value={item.noi_dung} onChange={(e) => setChiTiet((old) => old.map((x, i) => i === index ? { ...x, noi_dung: e.target.value } : x))} /><label className="flex shrink-0 items-center gap-1 text-sm"><input type={selected.phan === "I" ? "radio" : "checkbox"} name={selected.phan === "I" ? "correct" : undefined} checked={item.la_dap_an_dung} onChange={() => setChiTiet((old) => old.map((x, i) => ({ ...x, la_dap_an_dung: selected.phan === "I" ? i === index : i === index ? !x.la_dap_an_dung : x.la_dap_an_dung })))} />{item.la_dap_an_dung ? "Đúng" : "Sai"}</label></div>)}</div>}
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
          <p className="text-xs font-semibold uppercase text-slate-500 sm:col-span-2">Thuộc tính phân loại</p>
          <div className="grid min-w-0 gap-2">
            <Label>Bài học</Label>
            <select title={baiHocPhang.find((bh) => bh.bai_hoc_id === baiHocId)?.ten_bai_hoc} className="h-10 min-w-0 w-full truncate rounded-lg border border-slate-300 bg-white px-3 text-sm" value={baiHocId} onChange={(e) => setBaiHocId(e.target.value)}>
              {chuyenDe.map((cd) => <optgroup key={cd.chuyen_de_id} label={cd.ten_chuyen_de}>
                {cd.bai_hoc.map((bh) => <option key={bh.bai_hoc_id} value={bh.bai_hoc_id}>{bh.ten_bai_hoc}</option>)}
              </optgroup>)}
            </select>
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Mức độ</Label>
            <select className="h-10 min-w-0 w-full truncate rounded-lg border border-slate-300 bg-white px-3 text-sm" value={mucDoId} onChange={(e) => setMucDoId(e.target.value)}>
              {mucDo.map((md) => <option key={md.muc_do_id} value={md.muc_do_id}>{md.ten_muc}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Lý do</p>
          <div className="grid gap-2">
            <Label>Phân loại lỗi <span className="font-normal text-slate-400">(tuỳ chọn)</span></Label>
            <select className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={phanLoaiLoi} onChange={(e) => setPhanLoaiLoi(e.target.value as PhanLoaiLoi | "")}>
              <option value="">Không chọn</option>
              {PHAN_LOAI_LOI.map((key) => <option key={key} value={key}>{NHAN_PHAN_LOAI_LOI[key]}</option>)}
            </select>
          </div>
          <div className="grid gap-2"><Label>Lý do chỉnh sửa</Label><textarea name="lyDo" required minLength={5} maxLength={500} className="min-h-20 rounded-md border p-3 text-sm" /></div>
        </div>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap gap-2 border-t bg-white px-6 py-4">
          <Button disabled={isPending}><Send className="mr-1.5 h-4 w-4" />{isPending ? "Đang gửi…" : "Gửi yêu cầu"}</Button>
          <Button type="button" variant="outline" onClick={huy}>Hủy</Button>
        </div>
      </form>}
      </DialogContent>
    </Dialog>

    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-bold">Lịch sử yêu cầu</h2>
      {yeuCau.length ? <div className="space-y-2">{yeuCau.map((item) => <div key={item.yc_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {item.noi_dung_de_xuat?.phan_loai_loi && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">{NHAN_PHAN_LOAI_LOI[item.noi_dung_de_xuat.phan_loai_loi]}</span>}
          <span className="truncate">{item.noi_dung_de_xuat?.ly_do || "Yêu cầu chỉnh sửa"}</span>
        </span>
        <span className={item.trang_thai === "ChoDuyet" ? "text-amber-700" : item.trang_thai === "DaDuyet" ? "text-emerald-700" : "text-red-700"}>{item.trang_thai === "ChoDuyet" ? "Chờ duyệt" : item.trang_thai === "DaDuyet" ? "Đã duyệt" : "Từ chối"}</span>
      </div>)}</div> : <p className="text-sm text-slate-500">Chưa có yêu cầu.</p>}
    </section>
  </div>;
}
