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
    const baiLamIds = [...new Set(
      formData.getAll("baiLamId").map((value) => String(value)).filter(Boolean),
    )];
    if (!baiLamIds.length) throw new Error("Không có bài thi để sinh nhận xét");
    if (baiLamIds.length > 10) throw new Error("Số môn trong đợt thi không hợp lệ");

    const supabase = await requireAdmin();
    const { data: baiThi, error } = await supabase.from("bai_lam_thi")
      .select("bai_lam_id,hoc_sinh_tai_khoan_id,diem_tong,phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de)),ca_thi_mon!inner(ca_thi!inner(dot_thi_id))")
      .in("bai_lam_id", baiLamIds).eq("trang_thai", "DaNopBai");
    if (error) throw new Error("Chưa tải được các bài thi để tạo nhận xét. Vui lòng thử lại.");
    if (!baiThi || baiThi.length !== baiLamIds.length || baiThi.some((bai) => bai.diem_tong == null)) {
      throw new Error("Không tìm thấy đầy đủ các bài thi đã nộp");
    }

    const hocSinhIds = new Set(baiThi.map((bai) => bai.hoc_sinh_tai_khoan_id));
    const dotThiIds = new Set(baiThi.map((bai) => {
      const caThiMon = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
      const caThi = Array.isArray(caThiMon?.ca_thi) ? caThiMon.ca_thi[0] : caThiMon?.ca_thi;
      return caThi?.dot_thi_id;
    }));
    if (hocSinhIds.size !== 1 || dotThiIds.size !== 1 || dotThiIds.has(undefined)) {
      throw new Error("Các bài thi không thuộc cùng một học sinh và đợt thi");
    }

    const thoiDiemSinh = new Date().toISOString();
    const ketQua = await Promise.all(baiThi.map(async (bai) => {
      const nhom = xepNhomNangLuc(Number(bai.diem_tong));
      const chuyenDeYeu = (bai.phan_tich_chuyen_de || [])
        .filter((item) => Number(item.ty_le_dung) < 60)
        .map((item) => {
          const chuyenDe = Array.isArray(item.chuyen_de) ? item.chuyen_de[0] : item.chuyen_de;
          return chuyenDe?.ten_chuyen_de || "";
        })
        .filter(Boolean);

      try {
        const noiDung = await sinhNhanXetGemini({
          diem: Number(bai.diem_tong),
          nhom,
          chuyenDeYeu,
        });
        return { bai_lam_id: bai.bai_lam_id, noi_dung: noiDung, nguon: "AI" as const, so_lan_thu_lai: 0, thoi_diem_sinh: thoiDiemSinh };
      } catch {
        return { bai_lam_id: bai.bai_lam_id, noi_dung: nhanXetFallback(nhom, chuyenDeYeu, Number(bai.diem_tong)), nguon: "Fallback" as const, so_lan_thu_lai: 0, thoi_diem_sinh: thoiDiemSinh };
      }
    }));

    const { error: saveError } = await supabase.from("nhan_xet_ai")
      .upsert(ketQua, { onConflict: "bai_lam_id" });
    if (saveError) throw new Error("Đã tạo nhận xét nhưng chưa lưu được. Vui lòng thử lại.");

    const soNhanXetAi = ketQua.filter((item) => item.nguon === "AI").length;
    const soFallback = ketQua.length - soNhanXetAi;
    revalidatePath("/bao-cao-hoc-sinh");
    revalidatePath("/bao-cao-ca-nhan");
    revalidatePath("/ket-qua");
    return {
      ok: soFallback === 0,
      message: soFallback
      ? `Đã tạo nhận xét cho ${ketQua.length} môn; ${soFallback} môn dùng mẫu có sẵn.`
      : `Đã tạo lại nhận xét cho ${ketQua.length} môn trong đợt thi.`,
    };
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
    if (error || !bai) throw new Error("Không tìm thấy bài thi.");
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
    if (!result.thanhCong) throw new Error("Chưa gửi được email. Vui lòng kiểm tra lại địa chỉ email và thử lại.");
    const { error: logError } = await supabase.from("email_log").upsert({
      bai_lam_id: baiLamId, email_gui: tk.email_phu_huynh, tieu_de: content.tieuDe,
      trang_thai: "DaGui", so_lan_thu: 1, message_id: result.messageId,
      thoi_diem_gui: new Date().toISOString(), ma_loi: null, chi_tiet_loi: null,
    }, { onConflict: "bai_lam_id" });
    if (logError) throw new Error("Email đã gửi nhưng chưa lưu được lịch sử gửi. Vui lòng tải lại trang để kiểm tra.");
    revalidatePath("/bao-cao-hoc-sinh");
    return { ok: true, message: process.env.EMAIL_ENABLED === "true" ? "Đã gửi lại email cho phụ huynh." : "Chức năng gửi email đang tắt. Nội dung email đã được chuẩn bị để kiểm tra." };
  } catch (cause) {
    return { ok: false, message: cause instanceof Error ? cause.message : "Không thể gửi báo cáo" };
  }
}
