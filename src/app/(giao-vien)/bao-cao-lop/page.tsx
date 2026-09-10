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
      {!daChonDu && <DashboardOverview scope="giao-vien" />}
      {daChonDu && <ReportOverview title="Báo cáo lớp phụ trách" monId={monId} lopId={lopId} caThiMonId={caThiMonId} />}
    </main>
  );
}
