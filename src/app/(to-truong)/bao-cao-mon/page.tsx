/**
 * UC-REPORT-03 (scope To truong: MOI lop cho Mon minh, khong can trong bang
 * phan cong) - FR-M5-03. To truong chon Mon (co dinh la mon minh phu trach,
 * xem tuy-chon.ts) -> Lop (khong gioi han) -> Ca thi.
 * UC-REPORT-06: tong quan mon hoc toan truong, so sanh ket qua giua cac Lop.
 */
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
  const [monOptions, lopOptions, caThiOptions] = await Promise.all([
    layDanhSachMonChoBaoCao(),
    monId ? layDanhSachLopChoMon(monId) : Promise.resolve([]),
    monId && lopId ? layDanhSachCaThiChoLopMon(monId, lopId) : Promise.resolve([]),
  ]);
  const daChonDu = Boolean(monId && lopId && caThiMonId);

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section id="bo-loc-bao-cao" className="scroll-mt-24" aria-labelledby="bo-loc-title">
        <BoLocBaoCao
          monOptions={monOptions}
          lopOptions={lopOptions}
          caThiOptions={caThiOptions}
          monId={monId}
          lopId={lopId}
          caThiMonId={caThiMonId}
          eyebrow="Phạm vi báo cáo"
          title="Chọn dữ liệu cần xem"
          description="Chọn lần lượt môn, lớp và ca thi. Hệ thống sẽ cập nhật báo cáo ngay sau lựa chọn cuối cùng."
        />
      </section>
      {!daChonDu && <DashboardOverview scope="to-truong" />}
      {daChonDu && <ReportOverview title="Báo cáo chi tiết lớp" monId={monId} lopId={lopId} caThiMonId={caThiMonId} />}
    </main>
  );
}
