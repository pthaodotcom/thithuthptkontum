import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import SoanCauHoiClient from "./SoanCauHoiClient";

export const dynamic = "force-dynamic";

export default async function SoanCauHoiPage({ searchParams }: { searchParams: Promise<{ chinhSua?: string }> }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const { chinhSua } = await searchParams;
  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("mon_id, mon:mon!tai_khoan_mon_id_fkey(mon_id, ten_mon, ho_tro_ngan_hang_cau_hoi, phan1_so_cau, phan2_so_cau, phan3_so_cau)")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();
  const mon = Array.isArray(taiKhoan?.mon) ? taiKhoan.mon[0] : taiKhoan?.mon;
  if (!mon || !taiKhoan?.mon_id) {
    return <ThongBao title="Chưa có môn phụ trách" detail="Vui lòng liên hệ quản trị viên để cập nhật môn trước khi soạn câu hỏi." />;
  }
  if (!mon.ho_tro_ngan_hang_cau_hoi) {
    return <ThongBao title="Không soạn câu hỏi tại đây" detail={`Môn ${mon.ten_mon} chưa sử dụng ngân hàng câu hỏi và chức năng chấm tự động.`} />;
  }
  const [{ data: chuyenDe }, { data: mucDo }, { data: cauHoi }, { data: cauHoiChinhSua }] = await Promise.all([
    supabase
      .from("chuyen_de")
      .select("chuyen_de_id, ten_chuyen_de, bai_hoc(bai_hoc_id, ten_bai_hoc)")
      .eq("mon_id", taiKhoan.mon_id)
      .eq("trang_thai", "DangDung")
      .eq("bai_hoc.trang_thai", "DangDung")
      .order("created_at"),
    supabase.from("muc_do_nhan_thuc").select("muc_do_id, ten_muc").order("thu_tu"),
    supabase
      .from("cau_hoi")
      .select("cau_hoi_id, phan, noi_dung, dap_an_phan3, muc_do_id, ly_do_duyet, trang_thai_duyet, created_at, chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung), bai_hoc!inner(bai_hoc_id,chuyen_de!inner(chuyen_de_id,mon_id))")
      .eq("nguoi_tao_tai_khoan_id", session.sub)
      .eq("bai_hoc.chuyen_de.mon_id", taiKhoan.mon_id)
      .order("created_at", { ascending: false })
      .limit(10),
    chinhSua
      ? supabase
          .from("cau_hoi")
          .select("cau_hoi_id, phan, noi_dung, dap_an_phan3, muc_do_id, ly_do_duyet, trang_thai_duyet, created_at, chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung), bai_hoc!inner(bai_hoc_id,chuyen_de!inner(chuyen_de_id,mon_id))")
          .eq("cau_hoi_id", chinhSua)
          .eq("nguoi_tao_tai_khoan_id", session.sub)
          .eq("trang_thai_duyet", "CanChinhSua")
          .eq("bai_hoc.chuyen_de.mon_id", taiKhoan.mon_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const phan = [
    mon.phan1_so_cau !== null ? "I" : null,
    mon.phan2_so_cau !== null ? "II" : null,
    mon.phan3_so_cau !== null ? "III" : null,
  ].filter(Boolean) as ("I" | "II" | "III")[];

  const danhSachCauHoi = cauHoiChinhSua && !cauHoi?.some((item) => item.cau_hoi_id === cauHoiChinhSua.cau_hoi_id)
    ? [cauHoiChinhSua, ...(cauHoi || [])]
    : (cauHoi || []);

  return <SoanCauHoiClient mon={mon.ten_mon} phanChoPhep={phan} chuyenDe={(chuyenDe || []) as never[]} mucDo={mucDo || []} cauHoiGanDay={danhSachCauHoi as never[]} initialEditingId={chinhSua} />;
}

function ThongBao({ title, detail }: { title: string; detail: string }) {
  return <main className="mx-auto mt-16 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-amber-900">{title}</h1><p className="mt-2 text-sm text-amber-700">{detail}</p></main>;
}
