import { BookOpenCheck, GraduationCap, Sparkles, TrendingUp, Users } from "lucide-react";
import { layBaoCao, type ReportRow } from "@/lib/reports/data";
import InteractiveAdminDashboard from "@/components/reports/InteractiveAdminDashboard";

type DashboardScope = "admin" | "giao-vien" | "to-truong";
type GroupMetric = { label: string; count: number; average: number };

function groupMetrics(rows: ReportRow[], getLabel: (row: ReportRow) => string): GroupMetric[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) { const label = getLabel(row); groups.set(label, [...(groups.get(label) || []), row.diem]); }
  return [...groups].map(([label, scores]) => ({ label, count: scores.length, average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 100) / 100 })).sort((a, b) => b.average - a.average || a.label.localeCompare(b.label, "vi"));
}

function BarList({ title, items, max = 10, suffix = " điểm" }: { title: string; items: { label: string; value: number; detail?: string }[]; max?: number; suffix?: string }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold text-foreground">{title}</h2><div className="mt-4 space-y-4">{items.length ? items.map((item) => <div key={item.label}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-foreground">{item.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{item.value.toFixed(2)}{suffix}{item.detail ? ` · ${item.detail}` : ""}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${item.label}: ${item.value.toFixed(2)}${suffix}`}><div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.min(100, Math.max(0, item.value / max * 100))}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}</div></section>;
}

export default async function DashboardOverview({ scope }: { scope: DashboardScope }) {
  const report = await layBaoCao();
  const rows = report.rows;
  if (scope === "admin") return <InteractiveAdminDashboard rows={rows} />;
  const studentCount = new Set(rows.map((row) => row.hocSinhId)).size;
  const passRate = rows.length ? Math.round(rows.filter((row) => row.diem >= 5).length / rows.length * 10_000) / 100 : 0;
  const masteredRate = rows.length ? Math.round(rows.filter((row) => row.nhom === "DaNamVung").length / rows.length * 10_000) / 100 : 0;
  const classes = groupMetrics(rows, (row) => row.lop);
  const grades = groupMetrics(rows, (row) => `Khối ${row.khoi || "—"}`);
  const titles = { admin: ["Kết quả toàn trường", "Tổng hợp kết quả thi của toàn trường."], "giao-vien": ["Kết quả các lớp phụ trách", "Tổng hợp kết quả của các lớp và môn đang giảng dạy."], "to-truong": ["Kết quả môn học", "So sánh kết quả giữa các lớp của môn phụ trách."] } as const;

  return <div className="space-y-6">
    <div><p className="flex items-center gap-2 text-sm font-semibold text-accent"><Sparkles className="h-4 w-4" />Báo cáo thống kê</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{titles[scope][0]}</h1><p className="mt-1 text-muted-foreground">{titles[scope][1]}</p></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Học sinh", value: studentCount.toLocaleString("vi-VN"), detail: `${rows.length} bài thi`, icon: Users },
      { label: "Điểm trung bình", value: report.diemTrungBinh.toFixed(2), detail: "trên thang 10", icon: TrendingUp },
      { label: "Tỷ lệ đạt", value: `${passRate.toFixed(1)}%`, detail: "từ 5 điểm", icon: BookOpenCheck },
      { label: "Đã nắm vững", value: `${masteredRate.toFixed(1)}%`, detail: "nhóm năng lực cao", icon: GraduationCap },
    ].map((item) => <div key={item.label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">{item.label}</p><item.icon className="h-5 w-5 text-primary" /></div><p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{item.value}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div>)}</section>
    <div className="grid gap-6 xl:grid-cols-2"><BarList title="Phổ điểm" max={Math.max(1, ...report.phoDiem.map((x) => x.soLuong))} suffix=" bài" items={report.phoDiem.map((x) => ({ label: x.nhan, value: x.soLuong }))} /><BarList title="Kết quả theo 4 mức" max={Math.max(1, ...report.nhomNangLuc.map((x) => x.soLuong))} suffix=" học sinh" items={report.nhomNangLuc.map((x) => ({ label: ({ CanOnTapGap: "Cần ôn tập gấp", TrungBinh: "Trung bình", Kha: "Khá", DaNamVung: "Đã nắm vững" } as Record<string, string>)[x.nhom] || "Chưa xác định", value: x.soLuong }))} /></div>
    <div className="grid gap-6 xl:grid-cols-2"><BarList title="Điểm trung bình theo lớp" items={classes.slice(0, 8).map((x) => ({ label: x.label, value: x.average, detail: `${x.count} bài` }))} /><BarList title="Điểm trung bình theo khối" items={grades.slice(0, 6).map((x) => ({ label: x.label, value: x.average, detail: `${x.count} bài` }))} /></div>
  </div>;
}
