import Link from "next/link";
import { Search, UserRoundSearch } from "lucide-react";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";
export default async function BaoCaoHocSinhPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = taoSupabaseServiceRole();
  const query = supabase.from("bai_lam_thi").select("bai_lam_id,diem_tong,thoi_diem_nop,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,ma_so,lop(ten_lop)),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),nhan_xet_ai(noi_dung,nguon,thoi_diem_sinh)").eq("trang_thai", "DaNopBai").not("diem_tong", "is", null).order("thoi_diem_nop", { ascending: false }).limit(200);
  const { data, error } = await query;
  const keyword = q.trim().toLocaleLowerCase("vi");
  const rows = (data || []).filter((row) => {
    if (!keyword) return true;
    const tk = Array.isArray(row.tai_khoan) ? row.tai_khoan[0] : row.tai_khoan;
    return `${tk?.ho_ten || ""} ${tk?.ma_so || ""}`.toLocaleLowerCase("vi").includes(keyword);
  });
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><UserRoundSearch className="h-6 w-6 text-primary" />Nhật ký báo cáo</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái nhận xét AI và xử lý lại báo cáo của từng học sinh.</p></div><form className="flex min-w-72 gap-2"><label className="sr-only" htmlFor="q">Tìm học sinh</label><input id="q" name="q" defaultValue={q} placeholder="Tên hoặc mã học sinh" className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"><Search className="h-4 w-4" />Tìm</button></form></div>
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">{error.message}</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[850px] text-sm"><thead className="bg-muted/50"><tr><th className="p-3 text-left">Học sinh</th><th className="p-3 text-left">Bài thi</th><th className="p-3 text-right">Điểm</th><th className="p-3 text-left">Nhận xét AI</th><th className="p-3 text-left">Thao tác</th></tr></thead><tbody>{rows.map((row) => {
      const tk = Array.isArray(row.tai_khoan) ? row.tai_khoan[0] : row.tai_khoan; const lop = Array.isArray(tk?.lop) ? tk.lop[0] : tk?.lop; const ctm = Array.isArray(row.ca_thi_mon) ? row.ca_thi_mon[0] : row.ca_thi_mon; const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon; const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi; const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi; const nx = Array.isArray(row.nhan_xet_ai) ? row.nhan_xet_ai[0] : row.nhan_xet_ai;
      return <tr key={row.bai_lam_id} className="border-t border-border align-top"><td className="p-3"><Link href={`/tra-cuu?baiLamId=${row.bai_lam_id}`} className="font-semibold text-primary hover:underline">{tk?.ho_ten}</Link><div className="text-xs text-muted-foreground">{tk?.ma_so} · {lop?.ten_lop || "Chưa xếp lớp"}</div></td><td className="p-3">{mon?.ten_mon}<div className="text-xs text-muted-foreground">{dot?.ten_dot_thi}</div></td><td className="p-3 text-right text-lg font-bold tabular-nums">{Number(row.diem_tong).toFixed(2)}</td><td className="max-w-md p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${nx?.nguon === "AI" ? "bg-violet-100 text-violet-800" : "bg-amber-100 text-amber-800"}`}>{nx?.nguon || "Chưa có"}</span><p className="mt-2 line-clamp-2 text-muted-foreground">{nx?.noi_dung || "Chưa sinh nhận xét"}</p></td><td className="p-3"><ReportActions baiLamId={row.bai_lam_id} preview={{ hoTen: tk?.ho_ten || "Học sinh", maSo: tk?.ma_so || "—", lop: lop?.ten_lop || "Chưa xếp lớp", mon: mon?.ten_mon || "Môn thi", dotThi: dot?.ten_dot_thi || "Đợt thi", diem: Number(row.diem_tong), nguon: nx?.nguon || "Chưa có", noiDung: nx?.noi_dung || "", sinhLuc: nx?.thoi_diem_sinh || null, nopLuc: row.thoi_diem_nop }} /></td></tr>;
    })}</tbody></table></div>}
  </div>;
}
