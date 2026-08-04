import { NextRequest, NextResponse } from "next/server";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ baiLamId: string }> }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const { baiLamId } = await params;
  const db = taoSupabaseServiceRole();
  const { data: bai, error } = await db.from("bai_lam_thi").select("diem_tong,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,email_phu_huynh),nhan_xet_ai(noi_dung),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi)))").eq("bai_lam_id", baiLamId).single();
  if (error || !bai) return NextResponse.json({ error: "Không tìm thấy bài thi" }, { status: 404 });
  const tk = Array.isArray(bai.tai_khoan) ? bai.tai_khoan[0] : bai.tai_khoan; const nx = Array.isArray(bai.nhan_xet_ai) ? bai.nhan_xet_ai[0] : bai.nhan_xet_ai; const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon; const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon; const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi; const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
  if (!tk?.email_phu_huynh || !nx?.noi_dung) return NextResponse.json({ error: "Email chưa đủ dữ liệu để xem trước" }, { status: 422 });
  const tenMon = mon?.ten_mon || "Môn thi"; const hoTen = tk.ho_ten; const diem = Number(bai.diem_tong);
  return NextResponse.json({ nguoiNhan: tk.email_phu_huynh, hoTen, mon: tenMon, dotThi: dot?.ten_dot_thi || "Đợt thi", diem, nhom: xepNhomNangLuc(diem), nhanXet: nx.noi_dung, lienKetBaoCao: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ket-qua`, tieuDe: `Kết quả thi thử môn ${tenMon} - ${hoTen}` });
}
