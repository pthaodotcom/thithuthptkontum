import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import NganHangClient from "./NganHangClient";

export const dynamic = "force-dynamic";
export default async function NganHangCauHoiPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase.from("mon").select("mon_id,ten_mon").eq("to_truong_tai_khoan_id",session.sub).maybeSingle();
  if (!mon) redirect("/soan-cau-hoi");
  const [{data:cauHoi},{data:chuyenDe},{data:mucDo},{data:nguoiTao}] = await Promise.all([
    supabase.from("cau_hoi").select("cau_hoi_id,phan,noi_dung,dap_an_phan3,trang_thai_duyet,trang_thai_su_dung,trang_thai_hoat_dong,muc_do_id,nguoi_tao_tai_khoan_id,tai_khoan!cau_hoi_nguoi_tao_tai_khoan_id_fkey(ho_ten),chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung),bai_hoc!inner(bai_hoc_id,ten_bai_hoc,chuyen_de!inner(chuyen_de_id,mon_id,ten_chuyen_de)),yeu_cau_chinh_sua(yc_id,trang_thai)").eq("bai_hoc.chuyen_de.mon_id",mon.mon_id).order("updated_at",{ascending:false}),
    supabase.from("chuyen_de").select("chuyen_de_id,ten_chuyen_de,bai_hoc(bai_hoc_id,ten_bai_hoc)").eq("mon_id",mon.mon_id),
    supabase.from("muc_do_nhan_thuc").select("muc_do_id,ten_muc").order("thu_tu"),
    supabase.from("tai_khoan").select("tai_khoan_id,ho_ten").eq("vai_tro","GiaoVien").eq("mon_id",mon.mon_id).eq("trang_thai","HoatDong").order("ho_ten"),
  ]);
  return <NganHangClient mon={mon.ten_mon} cauHoi={(cauHoi??[]) as never[]} chuyenDe={(chuyenDe??[]) as never[]} mucDo={mucDo??[]} nguoiTao={nguoiTao??[]} currentUserId={session.sub}/>;
}
