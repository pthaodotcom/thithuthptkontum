/**
 * Module báo cáo BI dành cho Ban giám hiệu/Admin.
 * Bốn trang báo cáo dùng chung dữ liệu và bộ lọc: toàn khối, lớp, môn, cá nhân.
 */
import InteractiveAdminDashboard from "@/components/reports/InteractiveAdminDashboard";
import { layBaoCao } from "@/lib/reports/data";

export const dynamic = "force-dynamic";

export default async function BaoCaoAdminPage() {
  const report = await layBaoCao();
  return <div className="space-y-5">
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Thống kê vi phạm">
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Tổng lượt vi phạm</p><p className="mt-1 text-3xl font-bold text-destructive">{report.tongViPham}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Bài thi có vi phạm</p><p className="mt-1 text-3xl font-bold">{report.soBaiCoViPham}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Bài tự động thu do vi phạm</p><p className="mt-1 text-3xl font-bold text-destructive">{report.soBaiTuDongThu}</p></div>
    </section>
    <InteractiveAdminDashboard rows={report.rows} />
  </div>;
}
