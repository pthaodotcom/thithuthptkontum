/**
 * Module báo cáo BI dành cho Ban giám hiệu/Admin.
 * Bốn trang báo cáo dùng chung dữ liệu và bộ lọc: toàn khối, lớp, môn, cá nhân.
 */
import InteractiveAdminDashboard from "@/components/reports/InteractiveAdminDashboard";
import { layBaoCao } from "@/lib/reports/data";

export const dynamic = "force-dynamic";

export default async function BaoCaoAdminPage() {
  const report = await layBaoCao();
  return <InteractiveAdminDashboard rows={report.rows} />;
}
