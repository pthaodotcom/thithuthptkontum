import Link from "next/link";
import { Search, UserRoundSearch } from "lucide-react";
import { lamSachNhanXet } from "@/lib/ai/gemini";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import ReportActions, { type ReportPreview } from "./ReportActions";

export const dynamic = "force-dynamic";

type BaoCaoTheoDot = ReportPreview & {
  hocSinhId: string;
  dotThiId: string;
  nopGanNhat: string | null;
};

export default async function BaoCaoHocSinhPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase.from("bai_lam_thi")
    .select("bai_lam_id,hoc_sinh_tai_khoan_id,diem_tong,thoi_diem_nop,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,ma_so,lop(ten_lop)),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(dot_thi_id,ten_dot_thi))),nhan_xet_ai(noi_dung,nguon,thoi_diem_sinh)")
    .eq("trang_thai", "DaNopBai")
    .not("diem_tong", "is", null)
    .order("thoi_diem_nop", { ascending: false })
    .limit(200);

  const baoCaoMap = new Map<string, BaoCaoTheoDot>();
  for (const row of data || []) {
    const taiKhoan = Array.isArray(row.tai_khoan) ? row.tai_khoan[0] : row.tai_khoan;
    const lop = Array.isArray(taiKhoan?.lop) ? taiKhoan.lop[0] : taiKhoan?.lop;
    const caThiMon = Array.isArray(row.ca_thi_mon) ? row.ca_thi_mon[0] : row.ca_thi_mon;
    const mon = Array.isArray(caThiMon?.mon) ? caThiMon.mon[0] : caThiMon?.mon;
    const caThi = Array.isArray(caThiMon?.ca_thi) ? caThiMon.ca_thi[0] : caThiMon?.ca_thi;
    const dotThi = Array.isArray(caThi?.dot_thi) ? caThi.dot_thi[0] : caThi?.dot_thi;
    const nhanXet = Array.isArray(row.nhan_xet_ai) ? row.nhan_xet_ai[0] : row.nhan_xet_ai;
    if (!taiKhoan || !dotThi) continue;

    const key = `${row.hoc_sinh_tai_khoan_id}:${dotThi.dot_thi_id}`;
    const monHoc = {
      baiLamId: row.bai_lam_id,
      mon: mon?.ten_mon || "Môn thi",
      diem: Number(row.diem_tong),
      nguon: nhanXet?.nguon || "Chưa có",
      noiDung: lamSachNhanXet(nhanXet?.noi_dung || ""),
      sinhLuc: nhanXet?.thoi_diem_sinh || null,
      nopLuc: row.thoi_diem_nop,
    };
    const hienTai = baoCaoMap.get(key);

    if (hienTai) {
      hienTai.monHoc.push(monHoc);
      if (!hienTai.nopGanNhat || (row.thoi_diem_nop && row.thoi_diem_nop > hienTai.nopGanNhat)) {
        hienTai.nopGanNhat = row.thoi_diem_nop;
      }
      continue;
    }

    baoCaoMap.set(key, {
      hocSinhId: row.hoc_sinh_tai_khoan_id,
      dotThiId: dotThi.dot_thi_id,
      hoTen: taiKhoan.ho_ten || "Học sinh",
      maSo: taiKhoan.ma_so || "—",
      lop: lop?.ten_lop || "Chưa xếp lớp",
      dotThi: dotThi.ten_dot_thi || "Đợt thi",
      nopGanNhat: row.thoi_diem_nop,
      monHoc: [monHoc],
    });
  }

  const keyword = q.trim().toLocaleLowerCase("vi");
  const baoCao = [...baoCaoMap.values()]
    .filter((item) => !keyword || `${item.hoTen} ${item.maSo}`.toLocaleLowerCase("vi").includes(keyword))
    .map((item) => ({ ...item, monHoc: item.monHoc.sort((a, b) => a.mon.localeCompare(b.mon, "vi")) }))
    .sort((a, b) => (b.nopGanNhat || "").localeCompare(a.nopGanNhat || ""));

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><UserRoundSearch className="h-6 w-6 text-primary" />Báo cáo học sinh</h1><p className="mt-1 text-sm text-muted-foreground">Xem điểm và nhận xét của từng học sinh theo đợt thi.</p></div>
      <form className="flex min-w-72 gap-2"><label className="sr-only" htmlFor="q">Tìm học sinh</label><input id="q" name="q" defaultValue={q} placeholder="Tên hoặc mã học sinh" className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"><Search className="h-4 w-4" />Tìm</button></form>
    </div>

    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">Không thể tải báo cáo học sinh. Vui lòng thử lại.</div> : <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[850px] text-sm">
        <thead className="bg-muted/50"><tr><th className="p-3 text-left">Học sinh</th><th className="p-3 text-left">Đợt thi</th><th className="p-3 text-right">Điểm TB</th><th className="p-3 text-left">Nhận xét</th><th className="p-3 text-left">Thao tác</th></tr></thead>
        <tbody>{baoCao.map((item) => {
          const diemTrungBinh = item.monHoc.reduce((tong, mon) => tong + mon.diem, 0) / item.monHoc.length;
          const soMonCoNhanXet = item.monHoc.filter((mon) => mon.noiDung).length;
          const monDauTien = item.monHoc[0]!;
          return <tr key={`${item.hocSinhId}:${item.dotThiId}`} className="border-t border-border align-top">
            <td className="p-3"><Link href={`/tra-cuu?baiLamId=${monDauTien.baiLamId}`} className="font-semibold text-primary hover:underline">{item.hoTen}</Link><div className="text-xs text-muted-foreground">{item.maSo} · {item.lop}</div></td>
            <td className="p-3"><span className="font-medium">{item.dotThi}</span><div className="mt-1 text-xs text-muted-foreground">{item.monHoc.map((mon) => mon.mon).join(" · ")}</div></td>
            <td className="p-3 text-right text-lg font-bold tabular-nums">{diemTrungBinh.toFixed(2)}</td>
            <td className="max-w-md p-3"><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">{soMonCoNhanXet}/{item.monHoc.length} môn</span><p className="mt-2 line-clamp-2 text-muted-foreground">{soMonCoNhanXet === item.monHoc.length ? "Đã có nhận xét cho tất cả môn trong đợt thi." : "Còn môn chưa có nhận xét."}</p></td>
            <td className="p-3"><ReportActions preview={item} /></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </div>;
}
