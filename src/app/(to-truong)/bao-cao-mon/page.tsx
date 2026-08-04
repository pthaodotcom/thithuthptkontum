/**
 * UC-REPORT-03 (scope To truong: MOI lop cho Mon minh, khong can trong bang
 * phan cong) - FR-M5-03. To truong chon Mon (co dinh la mon minh phu trach,
 * xem tuy-chon.ts) -> Lop (khong gioi han) -> Ca thi.
 * UC-REPORT-06: tong quan mon hoc toan truong, so sanh ket qua giua cac Lop.
 */
import SubjectOverview from "@/components/reports/SubjectOverview";
import ReportOverview from "@/components/reports/ReportOverview";
import DashboardOverview from "@/components/reports/DashboardOverview";
import BoLocBaoCao from "@/components/reports/BoLocBaoCao";
import { layDanhSachMonChoBaoCao, layDanhSachLopChoMon, layDanhSachCaThiChoLopMon } from "@/lib/reports/tuy-chon";

export default async function BaoCaoTheoMonPage({
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
      {!monId && <DashboardOverview scope="to-truong" />}
      <div id="bo-loc-bao-cao"><BoLocBaoCao monOptions={monOptions} lopOptions={lopOptions} caThiOptions={caThiOptions} monId={monId} lopId={lopId} caThiMonId={caThiMonId} /></div>
      {monId && !daChonDu && <SubjectOverview monId={monId} />}
      {daChonDu && <ReportOverview title="Báo cáo chi tiết lớp" monId={monId} lopId={lopId} caThiMonId={caThiMonId} />}
    </main>
  );
}
