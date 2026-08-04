/**
 * UC-REPORT-03 (scope Giao vien) - FR-M5-03.
 * Giao vien chi chon duoc to hop Lop x Mon co trong bang Phan cong giang day
 * (FR-M2-04); To truong chon Mon minh phu trach roi thay MOI Lop cua Mon do
 * (khong gioi han theo Phan cong) - logic phan quyen nam trong
 * src/lib/reports/tuy-chon.ts va src/lib/reports/data.ts.
 */
import ReportOverview from "@/components/reports/ReportOverview";
import DashboardOverview from "@/components/reports/DashboardOverview";
import BoLocBaoCao from "@/components/reports/BoLocBaoCao";
import { layDanhSachMonChoBaoCao, layDanhSachLopChoMon, layDanhSachCaThiChoLopMon } from "@/lib/reports/tuy-chon";

export default async function BaoCaoLopPage({
  searchParams,
}: {
  searchParams: Promise<{ monId?: string; lopId?: string; caThiMonId?: string }>;
}) {
  const { monId, lopId, caThiMonId } = await searchParams;
  const monOptions = await layDanhSachMonChoBaoCao();
  const lopOptions = monId ? await layDanhSachLopChoMon(monId) : [];
  const caThiOptions = monId && lopId ? await layDanhSachCaThiChoLopMon(monId, lopId) : [];
  const daChonDu = Boolean(monId && lopId && caThiMonId);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {!daChonDu && <DashboardOverview scope="giao-vien" />}
      <div id="bo-loc-bao-cao"><BoLocBaoCao monOptions={monOptions} lopOptions={lopOptions} caThiOptions={caThiOptions} monId={monId} lopId={lopId} caThiMonId={caThiMonId} /></div>
      {daChonDu && <ReportOverview title="Báo cáo lớp phụ trách" monId={monId} lopId={lopId} caThiMonId={caThiMonId} />}
    </main>
  );
}
