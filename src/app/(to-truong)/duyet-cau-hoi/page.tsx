import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import DuyetCauHoiClient from "./DuyetCauHoiClient";

export const dynamic = "force-dynamic";

export default async function DuyetCauHoiPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase.from("mon").select("mon_id,ten_mon")
    .eq("to_truong_tai_khoan_id", session.sub).maybeSingle();
  if (!mon) redirect("/soan-cau-hoi");
  const [{ data: cauHoi }, { data: yeuCau }] = await Promise.all([
    supabase.from("cau_hoi")
      .select("cau_hoi_id,phan,noi_dung,dap_an_phan3,created_at,chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung),muc_do_nhan_thuc(ten_muc),bai_hoc!inner(ten_bai_hoc,chuyen_de!inner(mon_id,ten_chuyen_de)),tai_khoan!cau_hoi_nguoi_tao_tai_khoan_id_fkey(ho_ten)")
      .eq("trang_thai_duyet", "ChoDuyet").eq("bai_hoc.chuyen_de.mon_id", mon.mon_id).order("created_at"),
    supabase.from("yeu_cau_chinh_sua")
      .select("yc_id,cau_hoi_id,noi_dung_de_xuat,ngay_gui,cau_hoi!inner(phan,noi_dung,dap_an_phan3,chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung),bai_hoc!inner(chuyen_de!inner(mon_id))),tai_khoan!yeu_cau_chinh_sua_nguoi_de_xuat_tai_khoan_id_fkey(ho_ten)")
      .eq("trang_thai", "ChoDuyet").eq("cau_hoi.bai_hoc.chuyen_de.mon_id", mon.mon_id).order("ngay_gui"),
  ]);
  return <DuyetCauHoiClient mon={mon.ten_mon} cauHoi={(cauHoi ?? []) as never[]} yeuCau={(yeuCau ?? []) as never[]} />;
}
