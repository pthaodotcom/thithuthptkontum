import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import KhungChuyenDeClient from "./KhungChuyenDeClient";

export const dynamic = "force-dynamic";

export default async function KhungChuyenDePage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase
    .from("mon")
    .select("mon_id, ten_mon")
    .eq("to_truong_tai_khoan_id", session.sub)
    .maybeSingle();

  if (!mon) {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-bold text-amber-900">Chưa được bổ nhiệm Tổ trưởng</h1>
        <p className="mt-2 text-sm text-amber-700">
          Chỉ Tổ trưởng bộ môn mới được quản lý khung chuyên đề. Vui lòng liên hệ quản trị viên để kiểm tra thông tin bổ nhiệm.
        </p>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("chuyen_de")
    .select("chuyen_de_id, ten_chuyen_de, ma_chuyen_de, trang_thai, bai_hoc(bai_hoc_id, ten_bai_hoc, ma_bai_hoc, trang_thai, cau_hoi(count))")
    .eq("mon_id", mon.mon_id)
    .order("created_at")
    .order("created_at", { referencedTable: "bai_hoc" });

  if (error) console.error("Lỗi lấy khung chuyên đề:", error.message);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Môn {mon.ten_mon}</p>
        <h1 className="text-2xl font-bold tracking-tight">Khung Chuyên đề → Bài học</h1>
        <p className="mt-1 text-sm text-slate-500">
          Giáo viên sẽ chọn các chuyên đề và bài học này khi soạn câu hỏi, lập ma trận đề.
        </p>
      </div>
      <KhungChuyenDeClient initialData={(data || []) as never[]} />
    </div>
  );
}
