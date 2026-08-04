import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, GraduationCap, Search, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { layBaoCao } from "@/lib/reports/data";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BaoCaoCaNhanAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; hocSinhId?: string }> }) {
  const { q = "", hocSinhId } = await searchParams;
  const report = await layBaoCao();
  const keyword = q.trim().toLocaleLowerCase("vi");
  const students = new Map<string, typeof report.rows>();
  for (const row of report.rows) students.set(row.hocSinhId, [...(students.get(row.hocSinhId) || []), row]);

  if (!hocSinhId) {
    const items = [...students.entries()]
      .map(([id, studentRows]) => ({
        id,
        first: studentRows[0]!,
        rows: studentRows,
        average: studentRows.reduce((sum, row) => sum + row.diem, 0) / studentRows.length,
        best: Math.max(...studentRows.map((row) => row.diem)),
      }))
      .filter((item) => !keyword || `${item.first.hoTen} ${item.first.maSo} ${item.first.lop}`.toLocaleLowerCase("vi").includes(keyword))
      .sort((a, b) => a.first.hoTen.localeCompare(b.first.hoTen, "vi"));
    return <div className="space-y-6"><div><p className="flex items-center gap-2 text-sm font-semibold text-accent"><GraduationCap className="h-4 w-4" />Báo cáo thống kê</p><h1 className="mt-2 text-3xl font-bold">Báo cáo cá nhân</h1><p className="mt-1 text-muted-foreground">Chọn một học sinh để xem tổng quan năng lực và kết quả từng lần thi.</p></div>
      <form className="flex max-w-xl gap-2"><label htmlFor="q" className="sr-only">Tìm học sinh</label><input id="q" name="q" defaultValue={q} placeholder="Tên, mã học sinh hoặc lớp" className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"><Search className="h-4 w-4" />Tìm</button></form>
      {!items.length ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Không tìm thấy học sinh có kết quả thi.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Link key={item.id} href={`/bao-cao-ca-nhan?hocSinhId=${item.id}`} className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-foreground">{item.first.hoTen}</h2><p className="text-sm text-muted-foreground">{item.first.maSo} · {item.first.lop}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><div className="mt-5 grid grid-cols-3 gap-3 text-center"><div><p className="text-xl font-bold tabular-nums">{item.rows.length}</p><p className="text-xs text-muted-foreground">Bài thi</p></div><div><p className="text-xl font-bold tabular-nums">{item.average.toFixed(2)}</p><p className="text-xs text-muted-foreground">Trung bình</p></div><div><p className="text-xl font-bold tabular-nums">{item.best.toFixed(2)}</p><p className="text-xs text-muted-foreground">Cao nhất</p></div></div></Link>)}</div>}
    </div>;
  }

  const rows = students.get(hocSinhId) || [];
  if (!rows.length) return <div className="space-y-4"><Link href="/bao-cao-ca-nhan" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Danh sách học sinh</Link><div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Không tìm thấy báo cáo của học sinh này.</div></div>;
  const first = rows[0]!;
  const average = rows.reduce((sum, row) => sum + row.diem, 0) / rows.length;
  const best = Math.max(...rows.map((row) => row.diem));
  const baiIds = rows.map((row) => row.baiLamId);
  const supabase = taoSupabaseServiceRole();
  const { data: comments } = await supabase.from("nhan_xet_ai").select("bai_lam_id,noi_dung,nguon,thoi_diem_sinh").in("bai_lam_id", baiIds);
  const commentMap = new Map((comments || []).map((item) => [item.bai_lam_id, item]));

  return <div className="space-y-6"><Link href="/bao-cao-ca-nhan" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />Danh sách học sinh</Link><div><p className="text-sm font-semibold text-accent">Báo cáo năng lực cá nhân</p><h1 className="mt-2 text-3xl font-bold">{first.hoTen}</h1><p className="text-muted-foreground">{first.maSo} · {first.lop}</p></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Số bài đã thi", value: String(rows.length), icon: BarChart3 }, { label: "Điểm trung bình", value: average.toFixed(2), icon: TrendingUp }, { label: "Điểm cao nhất", value: best.toFixed(2), icon: Trophy }, { label: "Nhóm hiện tại", value: first.nhom === "DaNamVung" ? "Nắm vững" : first.nhom === "Kha" ? "Khá" : first.nhom === "TrungBinh" ? "Trung bình" : "Cần ôn tập", icon: Sparkles },
    ].map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-border bg-card p-5"><div className="flex justify-between"><p className="text-sm text-muted-foreground">{item.label}</p><Icon className="h-5 w-5 text-primary" /></div><p className="mt-3 text-2xl font-bold">{item.value}</p></div>; })}</section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Kết quả từng lần thi</h2>{rows.map((row) => { const comment = commentMap.get(row.baiLamId); return <article key={row.baiLamId} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-bold">{row.mon} · {row.dotThi}</h3><p className="text-sm text-muted-foreground">Đúng {row.soCauDung} · Sai {row.soCauSai}</p></div><p className="text-3xl font-bold tabular-nums">{row.diem.toFixed(2)}</p></div><div className="mt-4 rounded-xl bg-muted p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-card px-2 py-1 text-xs font-semibold">{comment?.nguon || "Chưa có"}</span><span className="text-xs text-muted-foreground">Nhận xét</span></div><p className="mt-2 whitespace-pre-wrap leading-7 text-foreground">{comment?.noi_dung || "Chưa có nhận xét."}</p></div><div className="mt-4 flex justify-end"><Link href={`/tra-cuu?baiLamId=${row.baiLamId}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted">Xem dữ liệu đối chiếu <ArrowRight className="h-4 w-4" /></Link></div></article>; })}</section>
  </div>;
}
