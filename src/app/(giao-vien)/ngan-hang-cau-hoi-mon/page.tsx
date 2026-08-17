import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import NganHangClient from "@/app/(to-truong)/ngan-hang-cau-hoi/NganHangClient";

export const dynamic = "force-dynamic";

export default async function NganHangCauHoiMonPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("mon_id, mon:mon!tai_khoan_mon_id_fkey(ten_mon, ho_tro_ngan_hang_cau_hoi)")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();
  const mon = Array.isArray(taiKhoan?.mon) ? taiKhoan.mon[0] : taiKhoan?.mon;

  if (!taiKhoan?.mon_id || !mon) {
    return <ThongBao title="Chưa có môn phụ trách" detail="Vui lòng liên hệ quản trị viên để cập nhật môn trước khi xem ngân hàng câu hỏi." />;
  }
  if (!mon.ho_tro_ngan_hang_cau_hoi) {
    return <ThongBao title="Không có ngân hàng câu hỏi" detail={`Môn ${mon.ten_mon} chưa sử dụng ngân hàng câu hỏi.`} />;
  }

  const [{ data: cauHoi }, { data: chuyenDe }, { data: mucDo }, { data: nguoiTao }] = await Promise.all([
    supabase
      .from("cau_hoi")
      .select("cau_hoi_id,phan,noi_dung,dap_an_phan3,trang_thai_duyet,trang_thai_su_dung,trang_thai_hoat_dong,muc_do_id,nguoi_tao_tai_khoan_id,tai_khoan!cau_hoi_nguoi_tao_tai_khoan_id_fkey(ho_ten),chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung),bai_hoc!inner(bai_hoc_id,ten_bai_hoc,chuyen_de!inner(chuyen_de_id,mon_id,ten_chuyen_de)),yeu_cau_chinh_sua(yc_id,trang_thai)")
      .eq("bai_hoc.chuyen_de.mon_id", taiKhoan.mon_id)
      .order("updated_at", { ascending: false }),
    supabase.from("chuyen_de").select("chuyen_de_id,ten_chuyen_de,bai_hoc(bai_hoc_id,ten_bai_hoc)").eq("mon_id", taiKhoan.mon_id),
    supabase.from("muc_do_nhan_thuc").select("muc_do_id,ten_muc").order("thu_tu"),
    supabase.from("tai_khoan").select("tai_khoan_id,ho_ten").eq("vai_tro","GiaoVien").eq("mon_id",taiKhoan.mon_id).eq("trang_thai","HoatDong").order("ho_ten"),
  ]);

  return <NganHangClient mon={mon.ten_mon} cauHoi={(cauHoi ?? []) as never[]} chuyenDe={(chuyenDe ?? []) as never[]} mucDo={mucDo ?? []} nguoiTao={nguoiTao ?? []} currentUserId={session.sub} readOnly allowOwnRevision />;
}

function ThongBao({ title, detail }: { title: string; detail: string }) {
  return <main className="mx-auto mt-16 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-amber-900">{title}</h1><p className="mt-2 text-sm text-amber-700">{detail}</p></main>;
}
