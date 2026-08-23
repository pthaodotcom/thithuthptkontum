import Link from "next/link";
import { AlertTriangle, BarChart3, FileDown, ShieldCheck, Users } from "lucide-react";
import { layBaoCao } from "@/lib/reports/data";

const nhanNhom: Record<string, string> = {
  CanOnTapGap: "Cần ôn tập gấp", TrungBinh: "Trung bình", Kha: "Khá", DaNamVung: "Đã nắm vững",
};
const mauNhom: Record<string, string> = {
  CanOnTapGap: "bg-rose-500", TrungBinh: "bg-amber-500", Kha: "bg-sky-500", DaNamVung: "bg-emerald-500",
};

export default async function ReportOverview({ title, monId, lopId, caThiMonId }: { title: string; monId?: string; lopId?: string; caThiMonId?: string }) {
  const query = new URLSearchParams();
  if (monId) query.set("monId", monId);
  if (lopId) query.set("lopId", lopId);
  if (caThiMonId) query.set("caThiMonId", caThiMonId);
  const daChonDu = Boolean(monId && lopId && caThiMonId);
  const exportQuery = query.toString();

  if (!daChonDu) return <div className="space-y-5"><ReportHeader title={title} exportQuery={exportQuery} /><div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Chọn môn, lớp và ca thi ở trên để xem báo cáo.</div></div>;

  const report = await layBaoCao({ monId, lopId, caThiMonId });
  return <div className="space-y-5">
    <ReportHeader title={title} exportQuery={exportQuery} />
    {report.rows.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Kết quả chưa sẵn sàng cho ca thi này.</div> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Tóm tắt kết quả">
        <MetricCard label="Bài đã chấm" value={report.rows.length.toLocaleString("vi-VN")} detail="bài thi hợp lệ" icon={Users} />
        <MetricCard label="Điểm trung bình" value={report.diemTrungBinh.toFixed(2)} detail="trên thang điểm 10" />
        <MetricCard label="Tổng vi phạm" value={String(report.tongViPham)} detail="lần được ghi nhận" tone={report.tongViPham ? "danger" : "normal"} icon={AlertTriangle} />
        <MetricCard label="Bài có vi phạm" value={String(report.soBaiCoViPham)} detail="trên tổng số bài" tone={report.soBaiCoViPham ? "danger" : "normal"} />
        <MetricCard label="Bài bị thu" value={String(report.soBaiTuDongThu)} detail="do vi phạm quy chế" tone={report.soBaiTuDongThu ? "danger" : "normal"} icon={ShieldCheck} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="score-distribution-title">
          <div className="flex items-start justify-between gap-3"><div><h2 id="score-distribution-title" className="font-semibold text-foreground">Phổ điểm</h2><p className="mt-1 text-xs text-muted-foreground">Số học sinh theo khoảng điểm</p></div><BarChart3 className="h-5 w-5 text-accent" aria-hidden="true" /></div>
          <div className="mt-5 space-y-3">{report.phoDiem.map((item) => { const max = Math.max(1, ...report.phoDiem.map((x) => x.soLuong)); return <div key={item.nhan} className="grid grid-cols-[5rem_1fr_2rem] items-center gap-3 text-sm"><span className="text-muted-foreground">{item.nhan}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(0, item.soLuong / max * 100)}%` }} /></div><span className="text-right font-semibold tabular-nums text-foreground">{item.soLuong}</span></div>; })}</div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="ability-title">
          <div><h2 id="ability-title" className="font-semibold text-foreground">Kết quả theo 4 mức</h2><p className="mt-1 text-xs text-muted-foreground">Phân nhóm năng lực của học sinh</p></div>
          <div className="mt-4 grid grid-cols-2 gap-3">{report.nhomNangLuc.map((item) => <div key={item.nhom} className="rounded-lg bg-muted/70 p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${mauNhom[item.nhom] || "bg-slate-400"}`} /><p className="truncate text-xs text-muted-foreground">{nhanNhom[item.nhom] || item.nhom}</p></div><p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{item.soLuong}</p><p className="text-xs text-muted-foreground">học sinh</p></div>)}</div>
        </section>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="student-results-title">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-5 py-4"><div><h2 id="student-results-title" className="font-semibold text-foreground">Chi tiết học sinh</h2><p className="mt-1 text-xs text-muted-foreground">Chọn tên học sinh để xem bài làm và kết quả chi tiết.</p></div><span className="text-xs text-muted-foreground">{report.rows.length} kết quả</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><caption className="sr-only">Bảng kết quả học sinh trong lớp</caption><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 text-left font-semibold">Học sinh</th><th className="px-4 py-3 text-left font-semibold">Lớp</th><th className="px-4 py-3 text-left font-semibold">Môn / đợt thi</th><th className="px-4 py-3 text-right font-semibold">Điểm</th><th className="px-4 py-3 text-left font-semibold">Nhóm</th><th className="px-5 py-3 text-left font-semibold">Vi phạm</th></tr></thead>
          <tbody>{report.rows.map((row) => <tr key={row.baiLamId} className="border-t border-border transition-colors hover:bg-muted/30"><td className="px-5 py-3.5"><Link className="font-semibold text-primary hover:underline" href={`/tra-cuu?baiLamId=${row.baiLamId}`}>{row.hoTen}</Link><div className="mt-0.5 text-xs text-muted-foreground">{row.maSo}</div></td><td className="px-4 py-3.5 text-foreground">{row.lop}</td><td className="px-4 py-3.5 text-foreground">{row.mon}<div className="mt-0.5 text-xs text-muted-foreground">{row.dotThi}</div></td><td className="px-4 py-3.5 text-right"><span className="font-bold tabular-nums text-foreground">{row.diem.toFixed(2)}</span></td><td className="px-4 py-3.5 text-foreground">{nhanNhom[row.nhom] || row.nhom}</td><td className="px-5 py-3.5">{row.soViPham ? <span className="font-semibold text-destructive">{row.soViPham} lần{row.tuDongThuBaiDoViPham ? " · Đã thu bài" : ""}</span> : <span className="text-muted-foreground">Không có</span>}</td></tr>)}</tbody>
        </table></div>
      </section>
    </>}
  </div>;
}

function ReportHeader({ title, exportQuery }: { title: string; exportQuery: string }) {
  return <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Báo cáo học tập</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi kết quả các bài thi đã nộp trong lớp và môn được phân công.</p></div><div className="flex gap-2"><Link className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted" href={`/api/bao-cao/xuat?format=xlsx&${exportQuery}`}><FileDown className="h-4 w-4" aria-hidden="true" />Xuất Excel</Link><Link className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90" href={`/api/bao-cao/xuat?format=pdf&${exportQuery}`}>Xuất PDF</Link></div></header>;
}

function MetricCard({ label, value, detail, tone = "normal", icon: Icon }: { label: string; value: string; detail: string; tone?: "normal" | "danger"; icon?: typeof Users }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p>{Icon && <Icon className={`h-4 w-4 ${tone === "danger" ? "text-destructive" : "text-accent"}`} aria-hidden="true" />}</div><p className={`mt-2 text-2xl font-bold tabular-nums ${tone === "danger" ? "text-destructive" : "text-foreground"}`}>{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>;
}
