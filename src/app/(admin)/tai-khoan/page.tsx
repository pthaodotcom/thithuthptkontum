import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import TaiKhoanClient from "./TaiKhoanClient";
import QuanLyGiaoVienClient from "./QuanLyGiaoVienClient";

export const dynamic = "force-dynamic";

export default async function TaiKhoanPage({ searchParams }: { searchParams: Promise<{ loai?: string; tab?: string }> }) {
  const { loai, tab } = await searchParams;
  const initialFilter = ["HocSinh", "GiaoVien", "ToTruong", "Admin"].includes(loai || "") ? loai! : "TatCa";
  const supabase = taoSupabaseServiceRole();
  const [taiKhoanResult, lopResult, monResult, phanCongResult] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select("tai_khoan_id, ma_so, ho_ten, vai_tro, trang_thai, nam_sinh, email_phu_huynh, lop_id, mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id, phai_doi_mat_khau, lop(ten_lop), mon:mon!tai_khoan_mon_id_fkey(mon_id, ten_mon)")
      .order("created_at", { ascending: false }),
    supabase.from("lop").select("lop_id, ten_lop, khoi").eq("trang_thai", "HoatDong").order("ten_lop"),
    supabase.from("mon").select("mon_id, ten_mon, loai_mon, to_truong_tai_khoan_id").eq("trang_thai", "DangDung").order("ten_mon"),
    supabase.from("phan_cong_giang_day").select("id, giao_vien_tai_khoan_id, lop_id"),
  ]);
  const taiKhoan = taiKhoanResult.data;
  const lop = lopResult.data;
  const mon = monResult.data;
  const queryError = taiKhoanResult.error || lopResult.error || monResult.error || phanCongResult.error;
  const isTeacherManagement = initialFilter === "GiaoVien";
  const activeTeacherTab = tab === "phan-cong" ? "phan-cong" : "danh-sach";
  const giaoVien = (taiKhoan || []).filter(item => item.vai_tro === "GiaoVien" && item.trang_thai === "HoatDong");
  if (queryError) {
    console.warn(`[tai-khoan] Không thể tải đầy đủ dữ liệu (${queryError.code || "UNKNOWN"}): ${queryError.message}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{isTeacherManagement ? "Quản lý giáo viên" : "Quản lý tài khoản"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isTeacherManagement
            ? "Quản lý hồ sơ, tài khoản và phân công lớp giảng dạy cho giáo viên."
            : "Tạo, cập nhật, reset mật khẩu và đình chỉ tài khoản. Không xóa dữ liệu lịch sử."}
        </p>
      </div>
      {queryError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Không thể tải đầy đủ dữ liệu tài khoản. Vui lòng tải lại trang; nếu lỗi tiếp diễn, kiểm tra kết nối Supabase.
        </div>
      )}
      {isTeacherManagement ? (
        <QuanLyGiaoVienClient
          activeTab={activeTeacherTab}
          taiKhoanProps={{ initialData: (taiKhoan || []) as never[], lopList: lop || [], monList: mon || [], initialFilter }}
          phanCongProps={{
            giaoVienList: giaoVien as never[],
            lopList: lop || [],
            monList: (mon || []).map(item => ({ mon_id: item.mon_id, ten_mon: item.ten_mon })),
            initialAssignments: phanCongResult.data || [],
          }}
        />
      ) : (
        <TaiKhoanClient initialData={(taiKhoan || []) as never[]} lopList={lop || []} monList={mon || []} initialFilter={initialFilter} />
      )}
    </div>
  );
}
