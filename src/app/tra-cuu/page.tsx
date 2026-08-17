/**
 * UC-REPORT-05 (scope Hoc sinh: chi bai thi cua chinh minh) - Tra cuu ket qua thi (FR-M6-05)
 * Khong bao gom xu ly khieu nai/sua diem - ngoai pham vi (xem Open Item #4 trong khung FR).
 * TODO: implement theo use-case-v3/06-UC-M6-Analysis-Reporting-vi.md
 *
 * Dat ngoai moi route group vai-tro (khong phai chi rieng (hoc-sinh)) vi trang nay
 * duoc GiaoVien/ToTruong/Admin dung de drill-down tu ReportOverview
 * (src/components/reports/ReportOverview.tsx) — dat trong (hoc-sinh) se bi layout do
 * redirect nham cac vai tro khac ve /dang-nhap.
 */
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { layBaoCao } from "@/lib/reports/data";

export const dynamic = "force-dynamic";

const NHAN_TRANG_THAI: Record<string, string> = {
  ChuaDangNhap: "Chưa vào thi",
  DangThi: "Đang làm bài",
  DaNopBai: "Đã nộp bài",
  BiKhoaChoXuLy: "Đang chờ giám thị xử lý",
  VangMat: "Vắng mặt",
  LoiToChuc: "Có sự cố trong ca thi",
};

const NHAN_VI_PHAM: Record<string, string> = {
  Copy: "Sao chép nội dung",
  ChuyenTab: "Rời khỏi màn hình làm bài",
  MatKetNoi: "Mất kết nối mạng",
};

export default async function TraCuuPage({ searchParams }: { searchParams: Promise<{ baiLamId?: string }> }) {
  const session = await laySessionHienHanh();
  if (!session) redirect("/dang-nhap");
  const { baiLamId } = await searchParams;

  if (!baiLamId) {
    return (
      <TraCuuShell>
        <p className="text-muted-foreground">Chọn một bài thi trong báo cáo để xem chi tiết.</p>
      </TraCuuShell>
    );
  }

  if (session.vai_tro !== "HocSinh") {
    const report = await layBaoCao();
    if (!report.rows.some((row) => row.baiLamId === baiLamId)) {
      return (
        <TraCuuShell>
          <KhongCoQuyen />
        </TraCuuShell>
      );
    }
  }

  const supabase = taoSupabaseServiceRole();
  const { data: bai } = await supabase.from("bai_lam_thi")
    .select("bai_lam_id,hoc_sinh_tai_khoan_id,trang_thai,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_vao_thi,thoi_diem_nop,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,ma_so),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),vi_pham(loai_vi_pham,thoi_diem),tra_loi(id,cau_hoi_snapshot_id)")
    .eq("bai_lam_id", baiLamId).single();

  if (!bai || (session.vai_tro === "HocSinh" && bai.hoc_sinh_tai_khoan_id !== session.sub)) {
    return (
      <TraCuuShell>
        <KhongCoQuyen />
      </TraCuuShell>
    );
  }

  const tk = Array.isArray(bai.tai_khoan) ? bai.tai_khoan[0] : bai.tai_khoan;
  const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
  const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
  const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
  const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
  const phut = bai.thoi_diem_vao_thi && bai.thoi_diem_nop
    ? Math.max(0, Math.round((new Date(bai.thoi_diem_nop).getTime() - new Date(bai.thoi_diem_vao_thi).getTime()) / 60000))
    : 0;

  return (
    <TraCuuShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Chi tiết bài thi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tk?.ho_ten} ({tk?.ma_so}) · {mon?.ten_mon} · {dot?.ten_dot_thi}
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Điểm", Number(bai.diem_tong).toFixed(2)],
          ["Đúng", bai.so_cau_dung ?? 0],
          ["Sai", bai.so_cau_sai ?? 0],
          ["Thời gian", `${phut} phút`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Thông tin bài thi</h2>
        <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div className="flex gap-1.5"><dt className="font-medium text-foreground">Trạng thái:</dt><dd>{NHAN_TRANG_THAI[bai.trang_thai] ?? "Chưa xác định"}</dd></div>
          <div className="flex gap-1.5"><dt className="font-medium text-foreground">Nộp lúc:</dt><dd>{bai.thoi_diem_nop ? new Date(bai.thoi_diem_nop).toLocaleString("vi-VN") : "—"}</dd></div>
          <div className="flex gap-1.5"><dt className="font-medium text-foreground">Số câu trả lời đã lưu:</dt><dd>{bai.tra_loi?.length || 0}</dd></div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Vi phạm trong khi làm bài</h2>
        {!bai.vi_pham?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Không có vi phạm được ghi nhận.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {bai.vi_pham.map((v) => (
              <li key={`${v.loai_vi_pham}-${v.thoi_diem}`}>
                {NHAN_VI_PHAM[v.loai_vi_pham] ?? "Vi phạm khác"} · {new Date(v.thoi_diem).toLocaleString("vi-VN")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </TraCuuShell>
  );
}

function TraCuuShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-2 p-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
        <div>{children}</div>
      </div>
    </div>
  );
}

function KhongCoQuyen() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
      <ShieldAlert className="h-5 w-5 shrink-0" />
      <p>Không có quyền xem bài thi này.</p>
    </div>
  );
}
