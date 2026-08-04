"use server";

import { revalidatePath } from "next/cache";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { nhanXetFallback, sinhNhanXetGemini } from "@/lib/ai/gemini";
import { guiEmailKetQua, taoNoiDungEmail } from "@/lib/email/gmail";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";

export type ReportActionState = { ok: boolean; message: string } | null;

async function requireAdmin() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") throw new Error("Không có quyền");
  return taoSupabaseServiceRole();
}

export async function sinhLaiNhanXet(_state: ReportActionState, formData: FormData): Promise<ReportActionState> {
  try {
    const baiLamId = String(formData.get("baiLamId") || "");
    const supabase = await requireAdmin();
    const { data: bai, error } = await supabase.from("bai_lam_thi")
      .select("bai_lam_id,diem_tong,phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de))")
      .eq("bai_lam_id", baiLamId).eq("trang_thai", "DaNopBai").single();
    if (error || !bai || bai.diem_tong == null) throw new Error(error?.message || "Không tìm thấy bài thi");
    const nhom = xepNhomNangLuc(Number(bai.diem_tong));
    const chuyenDeYeu = (bai.phan_tich_chuyen_de || []).filter((x) => Number(x.ty_le_dung) < 60).map((x) => {
      const cd = Array.isArray(x.chuyen_de) ? x.chuyen_de[0] : x.chuyen_de;
      return cd?.ten_chuyen_de || "";
    }).filter(Boolean);
    let noiDung: string;
    let nguon: "AI" | "Fallback" = "AI";
    let message = "Đã sinh lại nhận xét bằng Gemini.";
    try {
      noiDung = await sinhNhanXetGemini({ diem: Number(bai.diem_tong), nhom, chuyenDeYeu });
    } catch (cause) {
      noiDung = nhanXetFallback(nhom);
      nguon = "Fallback";
      message = `Gemini chưa khả dụng; đã dùng mẫu dự phòng (${cause instanceof Error ? cause.message : "lỗi không xác định"}).`;
    }
    const { error: saveError } = await supabase.from("nhan_xet_ai").upsert({
      bai_lam_id: baiLamId, noi_dung: noiDung, nguon, so_lan_thu_lai: 0,
      thoi_diem_sinh: new Date().toISOString(),
    }, { onConflict: "bai_lam_id" });
    if (saveError) throw new Error(saveError.message);
    revalidatePath("/bao-cao-hoc-sinh");
    return { ok: nguon === "AI", message };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : "Không thể sinh lại nhận xét" };
  }
}

export async function guiLaiBaoCao(_state: ReportActionState, formData: FormData): Promise<ReportActionState> {
  try {
    const baiLamId = String(formData.get("baiLamId") || "");
    const supabase = await requireAdmin();
    const { data: bai, error } = await supabase.from("bai_lam_thi")
      .select("bai_lam_id,diem_tong,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,email_phu_huynh),nhan_xet_ai(noi_dung),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi)))")
      .eq("bai_lam_id", baiLamId).single();
    if (error || !bai) throw new Error(error?.message || "Không tìm thấy bài thi");
    const tk = Array.isArray(bai.tai_khoan) ? bai.tai_khoan[0] : bai.tai_khoan;
    const nx = Array.isArray(bai.nhan_xet_ai) ? bai.nhan_xet_ai[0] : bai.nhan_xet_ai;
    const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
    const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
    const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
    const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
    if (!tk?.email_phu_huynh) throw new Error("Học sinh chưa có email phụ huynh");
    if (!nx?.noi_dung) throw new Error("Chưa có nhận xét để gửi");
    const input = { email: tk.email_phu_huynh, hoTen: tk.ho_ten, mon: mon?.ten_mon || "Môn thi", dotThi: dot?.ten_dot_thi || "Đợt thi", diem: Number(bai.diem_tong), nhom: xepNhomNangLuc(Number(bai.diem_tong)), nhanXet: nx.noi_dung, lienKetBaoCao: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ket-qua` };
    const result = await guiEmailKetQua(input);
    const content = taoNoiDungEmail(input);
    if (!result.thanhCong) throw new Error(`${result.maLoi}: ${result.chiTiet}`);
    const { error: logError } = await supabase.from("email_log").upsert({
      bai_lam_id: baiLamId, email_gui: tk.email_phu_huynh, tieu_de: content.tieuDe,
      trang_thai: "DaGui", so_lan_thu: 1, message_id: result.messageId,
      thoi_diem_gui: new Date().toISOString(), ma_loi: null, chi_tiet_loi: null,
    }, { onConflict: "bai_lam_id" });
    if (logError) throw new Error(logError.message);
    revalidatePath("/bao-cao-hoc-sinh");
    return { ok: true, message: process.env.EMAIL_ENABLED === "true" ? "Đã gửi lại email cho phụ huynh." : "Đã mô phỏng gửi email (EMAIL_ENABLED=false)." };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : "Không thể gửi báo cáo" };
  }
}
