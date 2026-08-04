import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import TaiKhoanClient from "./TaiKhoanClient";

export const dynamic = "force-dynamic";

export default async function TaiKhoanPage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const { loai } = await searchParams;
  const initialFilter = ["HocSinh", "GiaoVien", "ToTruong", "Admin"].includes(loai || "") ? loai! : "TatCa";
  const supabase = taoSupabaseServiceRole();
  const [taiKhoanResult, lopResult, monResult] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select("tai_khoan_id, ma_so, ho_ten, vai_tro, trang_thai, nam_sinh, email_phu_huynh, lop_id, mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id, phai_doi_mat_khau, lop(ten_lop), mon:mon!tai_khoan_mon_id_fkey(mon_id, ten_mon)")
      .order("created_at", { ascending: false }),
    supabase.from("lop").select("lop_id, ten_lop, khoi").eq("trang_thai", "HoatDong").order("ten_lop"),
    supabase.from("mon").select("mon_id, ten_mon, loai_mon, to_truong_tai_khoan_id").eq("trang_thai", "DangDung").order("ten_mon"),
  ]);
  const taiKhoan = taiKhoanResult.data;
  const lop = lopResult.data;
  const mon = monResult.data;
  const queryError = taiKhoanResult.error || lopResult.error || monResult.error;
  if (queryError) {
    console.warn(`[tai-khoan] Không thể tải đầy đủ dữ liệu (${queryError.code || "UNKNOWN"}): ${queryError.message}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý tài khoản</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo, cập nhật, reset mật khẩu và đình chỉ tài khoản. Không xóa dữ liệu lịch sử.
        </p>
      </div>
      {queryError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Không thể tải đầy đủ dữ liệu tài khoản. Vui lòng tải lại trang; nếu lỗi tiếp diễn, kiểm tra kết nối Supabase.
        </div>
      )}
      <TaiKhoanClient
        initialData={(taiKhoan || []) as never[]}
        lopList={lop || []}
        monList={mon || []}
        initialFilter={initialFilter}
      />
    </div>
  );
}
