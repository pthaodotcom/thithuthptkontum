import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import KetQuaClient, { type BaiLamThiItem } from "./KetQuaClient";

export const dynamic = "force-dynamic";

export default async function KetQuaPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const { data } = await supabase
    .from("bai_lam_thi")
    .select(
      "bai_lam_id,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_vao_thi,thoi_diem_nop,ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),nhan_xet_ai(noi_dung,nguon),phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de))",
    )
    .eq("hoc_sinh_tai_khoan_id", session.sub)
    .eq("trang_thai", "DaNopBai")
    .order("thoi_diem_nop", { ascending: false });

  return <KetQuaClient initialData={(data || []) as unknown as BaiLamThiItem[]} />;
}
