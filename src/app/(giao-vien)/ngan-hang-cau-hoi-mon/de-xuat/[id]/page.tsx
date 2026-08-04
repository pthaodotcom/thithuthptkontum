import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import YeuCauChinhSuaClient from "../../../yeu-cau-chinh-sua/YeuCauChinhSuaClient";

export const dynamic = "force-dynamic";

export default async function DeXuatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const { id } = await params;
  const supabase = taoSupabaseServiceRole();
  const { data: tk } = await supabase.from("tai_khoan").select("mon_id").eq("tai_khoan_id", session.sub).maybeSingle();
  if (!tk?.mon_id) notFound();
  const [{ data: cauHoi }, { data: chuyenDe }, { data: mucDo }, { data: yeuCau }] = await Promise.all([
    supabase.from("cau_hoi").select("cau_hoi_id,phan,noi_dung,dap_an_phan3,bai_hoc_id,muc_do_id,chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung)").eq("cau_hoi_id", id).eq("nguoi_tao_tai_khoan_id", session.sub).eq("trang_thai_duyet", "DaDuyet"),
    supabase.from("chuyen_de").select("chuyen_de_id,ten_chuyen_de,bai_hoc(bai_hoc_id,ten_bai_hoc)").eq("mon_id", tk.mon_id).eq("trang_thai", "DangDung"),
    supabase.from("muc_do_nhan_thuc").select("muc_do_id,ten_muc").order("thu_tu"),
    supabase.from("yeu_cau_chinh_sua").select("yc_id,cau_hoi_id,trang_thai,ngay_gui,noi_dung_de_xuat").eq("nguoi_de_xuat_tai_khoan_id", session.sub).eq("cau_hoi_id", id),
  ]);
  if (!cauHoi?.length) notFound();
  return <main className="min-h-screen bg-slate-50 p-6"><div className="space-y-5"><header><Link href="/ngan-hang-cau-hoi-mon" className="text-sm font-semibold text-blue-600">← Ngân hàng câu hỏi</Link><h1 className="mt-3 text-2xl font-bold">Đề xuất chỉnh sửa câu hỏi</h1></header><YeuCauChinhSuaClient cauHoi={cauHoi as never[]} chuyenDe={(chuyenDe || []) as never[]} mucDo={mucDo || []} yeuCau={(yeuCau || []) as never[]} /></div></main>;
}
