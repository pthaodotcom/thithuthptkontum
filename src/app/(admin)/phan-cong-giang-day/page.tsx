import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import PhanCongClient from "./PhanCongClient";

export const dynamic = "force-dynamic";

export default async function PhanCongGiangDayPage() {
  const supabase = taoSupabaseServiceRole();
  const [{ data: giaoVien }, { data: lop }, { data: mon }, { data: phanCong, error }] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select("tai_khoan_id, ma_so, ho_ten, mon_id, mon:mon!tai_khoan_mon_id_fkey(ten_mon)")
      .eq("vai_tro", "GiaoVien")
      .eq("trang_thai", "HoatDong")
      .order("ho_ten"),
    supabase.from("lop").select("lop_id, ten_lop, khoi").eq("trang_thai", "HoatDong").order("khoi").order("ten_lop"),
    supabase.from("mon").select("mon_id, ten_mon").eq("trang_thai", "DangDung").order("ten_mon"),
    supabase.from("phan_cong_giang_day").select("id, giao_vien_tai_khoan_id, lop_id"),
  ]);
  if (error) console.error("Lỗi lấy phân công:", error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Phân công giảng dạy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn lớp cho từng giáo viên; môn dạy được tự động suy ra từ môn phụ trách.
        </p>
      </div>
      <PhanCongClient
        giaoVienList={(giaoVien || []) as never[]}
        lopList={lop || []}
        monList={mon || []}
        initialAssignments={phanCong || []}
      />
    </div>
  );
}
