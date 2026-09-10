"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BookOpen, Layers3, Link2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { GoiYTrung } from "@/lib/cau-hoi/trung-lap";
import { NHAN_PHAN_LOAI_LOI, type PhanLoaiLoi } from "@/lib/rules/yeu-cau-chinh-sua";
import { duyetCauHoi, duyetYeuCau, ganNhomCauHoiTrung } from "./actions";

type ChiTiet = { thu_tu: number; noi_dung: string; la_dap_an_dung: boolean };
type Cau = {
  cau_hoi_id: string;
  phan: string;
  noi_dung: string;
  dap_an_phan3?: string;
  created_at?: string;
  chi_tiet_cau_hoi: ChiTiet[];
  muc_do_nhan_thuc?: { ten_muc: string } | { ten_muc: string }[] | null;
  bai_hoc?: { ten_bai_hoc: string; chuyen_de?: { ten_chuyen_de: string } | { ten_chuyen_de: string }[] | null } | null;
  tai_khoan?: { ho_ten: string } | { ho_ten: string }[] | null;
  goi_y_trung?: GoiYTrung[];
};
type YC = { yc_id: string; noi_dung_de_xuat: { ly_do?: string; phan_loai_loi?: PhanLoaiLoi | null; [key: string]: unknown }; cau_hoi: Cau };
type QuyetDinh = "DaDuyet" | "TuChoi" | "CanChinhSua";

export default function DuyetCauHoiClient({ mon, cauHoi, yeuCau }: { mon: string; cauHoi: Cau[]; yeuCau: YC[] }) {
  return <div className="space-y-8"><header><p className="text-sm font-semibold text-blue-600">Môn {mon}</p><h1 className="text-2xl font-bold">Duyệt nội dung</h1></header>
    <Queue title={`Câu hỏi mới (${cauHoi.length})`} empty="Không có câu hỏi đang chờ.">{cauHoi.map(c => <Card key={c.cau_hoi_id} cau={c} onAction={(q,l) => duyetCauHoi({id:c.cau_hoi_id,quyetDinh:q,lyDo:l})} />)}</Queue>
    <Queue title={`Yêu cầu chỉnh sửa (${yeuCau.length})`} empty="Không có yêu cầu chỉnh sửa đang chờ.">{yeuCau.map(y => <div key={y.yc_id} className="rounded-xl border bg-white p-5"><p className="mb-3 font-semibold">So sánh nội dung cũ / đề xuất</p><div className="grid gap-4 md:grid-cols-2"><Preview title="Nội dung cũ" cau={y.cau_hoi}/><Preview title="Nội dung đề xuất" cau={{...y.cau_hoi,noi_dung:String(y.noi_dung_de_xuat.noi_dung ?? ""),dap_an_phan3:String(y.noi_dung_de_xuat.dap_an_phan3 ?? ""),chi_tiet_cau_hoi:(y.noi_dung_de_xuat.chi_tiet_cau_hoi as ChiTiet[]) ?? []}} /></div>{(y.noi_dung_de_xuat.ly_do || y.noi_dung_de_xuat.phan_loai_loi) && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{y.noi_dung_de_xuat.phan_loai_loi && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold">{NHAN_PHAN_LOAI_LOI[y.noi_dung_de_xuat.phan_loai_loi]}</span>}{y.noi_dung_de_xuat.ly_do && <span><b>Lý do đề xuất:</b> {y.noi_dung_de_xuat.ly_do}</span>}</div>}<Actions allowRevision={false} onAction={(q,l)=>duyetYeuCau({id:y.yc_id,quyetDinh:q as "DaDuyet"|"TuChoi",lyDo:l})}/></div>)}</Queue>
  </div>;
}
function Queue({title,empty,children}:{title:string;empty:string;children:React.ReactNode}) { return <section><h2 className="mb-3 text-lg font-bold">{title}</h2><div className="space-y-4">{children || <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">{empty}</p>}</div></section>; }
function Card({cau,onAction}:{cau:Cau;onAction:(q:QuyetDinh,l?:string)=>Promise<{success:boolean;error?:string}>}) { return <div className="rounded-xl border bg-white p-5"><Preview cau={cau}/>{Boolean(cau.goi_y_trung?.length) && <GoiYCauHoiTrung cauHoiId={cau.cau_hoi_id} items={cau.goi_y_trung!}/>}<Actions onAction={onAction}/></div>; }

function GoiYCauHoiTrung({ cauHoiId, items }: { cauHoiId: string; items: GoiYTrung[] }) {
  const [pending, start] = useTransition();
  const [daGan, setDaGan] = useState<string | null>(null);
  const ganNhom = (daiDienId: string) => start(async () => {
    const result = await ganNhomCauHoiTrung(cauHoiId, daiDienId);
    if (!result.success) { toast.error(result.error); return; }
    setDaGan(daiDienId);
    toast.success("Đã xác nhận hai câu thuộc cùng nhóm");
  });
  return <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
    <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/><div><p className="text-sm font-semibold text-amber-900">Câu hỏi có khả năng trùng hoặc cùng dạng</p><p className="mt-0.5 text-xs text-amber-800">Thuật toán chỉ gợi ý. Hãy đối chiếu nội dung và đáp án trước khi xác nhận nhóm.</p></div></div>
    <div className="mt-3 space-y-2">{items.map((item) => <div key={item.cauHoiId} className="rounded-md border border-amber-200 bg-white p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{nhanLoaiTrung(item.loai)}</span><span className="text-xs text-slate-500">{Math.round(item.diemTuongDong * 100)}% · {item.tenChuyenDe} / {item.tenBaiHoc}</span></div><p className="mt-2 line-clamp-3 text-slate-800">{boHtml(item.noiDung)}</p><div className="mt-2 flex justify-end"><Button type="button" size="sm" variant="outline" disabled={pending || daGan === item.cauHoiId} onClick={() => ganNhom(item.cauHoiId)}><Link2 className="mr-1.5 h-3.5 w-3.5"/>{daGan === item.cauHoiId ? "Đã gán cùng nhóm" : "Xác nhận cùng nhóm"}</Button></div></div>)}</div>
  </div>;
}

function nhanLoaiTrung(loai: GoiYTrung["loai"]) {
  return loai === "TrungChinhXac" ? "Trùng chính xác" : loai === "CungMauKhacSo" ? "Cùng dạng – khác số" : "Gần giống nội dung";
}

function boHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function motGiaTri<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function Preview({title,cau}:{title?:string;cau:Cau}) {
  const mucDo = motGiaTri(cau.muc_do_nhan_thuc)?.ten_muc;
  const baiHoc = motGiaTri(cau.bai_hoc);
  const chuyenDe = motGiaTri(baiHoc?.chuyen_de)?.ten_chuyen_de;
  const nguoiTao = motGiaTri(cau.tai_khoan)?.ho_ten;
  return <div className="rounded-lg bg-slate-50 p-4">
    <div className="flex flex-wrap items-center gap-2" aria-label="Thông tin câu hỏi">
      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold uppercase text-slate-700">{title ?? `Phần ${cau.phan}`}</span>
      {mucDo && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{mucDo}</span>}
      {chuyenDe && <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700"><Layers3 className="h-3 w-3" aria-hidden="true" />{chuyenDe}</span>}
      {baiHoc?.ten_bai_hoc && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><BookOpen className="h-3 w-3" aria-hidden="true" />{baiHoc.ten_bai_hoc}</span>}
      {nguoiTao && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><UserRound className="h-3 w-3" aria-hidden="true" />{nguoiTao}</span>}
    </div>
    <div className="mt-3 whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{__html:cau.noi_dung}} />
    {cau.chi_tiet_cau_hoi?.sort((a,b)=>a.thu_tu-b.thu_tu).map(x=><p key={x.thu_tu} className={`mt-1 text-sm ${x.la_dap_an_dung?"font-semibold text-emerald-700":""}`}>{x.thu_tu}. <span dangerouslySetInnerHTML={{__html:x.noi_dung}}/></p>)}
    {cau.dap_an_phan3&&<p className="mt-2 text-sm font-semibold">Đáp án: {cau.dap_an_phan3}</p>}
  </div>;
}
function Actions({onAction,allowRevision=true}:{onAction:(q:QuyetDinh,l?:string)=>Promise<{success:boolean;error?:string}>;allowRevision?:boolean}) {
  const [lyDo,setLyDo]=useState("");
  const [pending,start]=useTransition();
  const run=(quyetDinh:QuyetDinh)=>start(async()=>{
    const result=await onAction(quyetDinh,lyDo);
    if(!result.success){toast.error(result.error);return;}
    toast.success(quyetDinh==="DaDuyet"?"Đã duyệt":quyetDinh==="CanChinhSua"?"Đã gửi yêu cầu chỉnh sửa cho giáo viên":"Đã từ chối");
  });
  return <div className="mt-4 flex flex-wrap items-end gap-2">
    <div className="min-w-64 flex-1">
      <Label className="mb-1.5 block text-sm">Lý do / góp ý <span className="font-normal text-slate-500">{allowRevision?"(bắt buộc khi từ chối hoặc yêu cầu sửa)":"(bắt buộc khi từ chối)"}</span></Label>
      <input className="h-10 w-full rounded-md border px-3 text-sm" placeholder="Nêu rõ lý do hoặc nội dung cần chỉnh sửa…" value={lyDo} onChange={e=>setLyDo(e.target.value)}/>
    </div>
    <Button disabled={pending} onClick={()=>run("DaDuyet")}>{pending?"Đang xử lý…":"Duyệt"}</Button>
    {allowRevision&&<Button disabled={pending||!lyDo.trim()} variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:text-amber-900" onClick={()=>run("CanChinhSua")}>Yêu cầu sửa</Button>}
    <Button disabled={pending||!lyDo.trim()} variant="destructive" onClick={()=>run("TuChoi")}>Từ chối</Button>
  </div>;
}
