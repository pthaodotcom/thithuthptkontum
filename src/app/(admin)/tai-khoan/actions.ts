"use server";

import { laySessionHienHanh } from "@/lib/auth/session";
import { bamMatKhau, taoMatKhauMacDinh } from "@/lib/auth/password";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const vaiTroSchema = z.enum(["Admin", "ToTruong", "GiaoVien", "HocSinh"]);
const inputSchema = z.object({
  ma_so: z.string().trim().min(4, "Mã số phải có 4–20 ký tự").max(20, "Mã số phải có 4–20 ký tự"),
  ho_ten: z.string().trim().min(1, "Họ tên không được để trống").max(100, "Họ tên tối đa 100 ký tự"),
  vai_tro: vaiTroSchema,
  nam_sinh: z.number().int().min(1900).max(new Date().getFullYear()),
  lop_id: z.string().uuid().nullable().optional(),
  mon_id: z.string().uuid().nullable().optional(),
  email_phu_huynh: z.string().trim().toLowerCase().email("Email phụ huynh không hợp lệ").nullable().optional().or(z.literal("")),
  mon_tu_chon_1_id: z.string().uuid().nullable().optional(),
  mon_tu_chon_2_id: z.string().uuid().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.vai_tro === "HocSinh" && !value.lop_id) {
    ctx.addIssue({ code: "custom", path: ["lop_id"], message: "Học sinh phải thuộc một lớp" });
  }
  if (value.vai_tro === "HocSinh" && !value.mon_tu_chon_1_id) {
    ctx.addIssue({ code: "custom", path: ["mon_tu_chon_1_id"], message: "Học sinh phải chọn đủ hai môn tự chọn" });
  }
  if (value.vai_tro === "HocSinh" && !value.mon_tu_chon_2_id) {
    ctx.addIssue({ code: "custom", path: ["mon_tu_chon_2_id"], message: "Học sinh phải chọn đủ hai môn tự chọn" });
  }
  if ((value.vai_tro === "GiaoVien" || value.vai_tro === "ToTruong") && !value.mon_id) {
    ctx.addIssue({ code: "custom", path: ["mon_id"], message: "Giáo viên phải phụ trách một môn" });
  }
  if (value.vai_tro === "HocSinh"
    && value.mon_tu_chon_1_id
    && value.mon_tu_chon_1_id === value.mon_tu_chon_2_id) {
    ctx.addIssue({ code: "custom", path: ["mon_tu_chon_2_id"], message: "Hai môn tự chọn phải khác nhau" });
  }
});

export type TaiKhoanInput = z.infer<typeof inputSchema>;
export type ImportResult = { thanhCong: number; loi: { dong: number; maLoi: string; chiTiet: string }[] };

async function damBaoAdmin() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") throw new Error("Không có quyền thực hiện");
}

function payloadTaiKhoan(input: TaiKhoanInput, matKhauHash?: string) {
  const laHocSinh = input.vai_tro === "HocSinh";
  const laGiaoVien = input.vai_tro === "GiaoVien" || input.vai_tro === "ToTruong";
  return {
    ma_so: input.ma_so.trim(),
    ho_ten: input.ho_ten.trim(),
    vai_tro: input.vai_tro === "HocSinh" ? "HocSinh" : input.vai_tro === "Admin" ? "Admin" : "GiaoVien",
    nam_sinh: input.nam_sinh,
    lop_id: laHocSinh ? input.lop_id || null : null,
    email_phu_huynh: laHocSinh ? input.email_phu_huynh?.trim().toLowerCase() || null : null,
    mon_tu_chon_1_id: laHocSinh ? input.mon_tu_chon_1_id || null : null,
    mon_tu_chon_2_id: laHocSinh ? input.mon_tu_chon_2_id || null : null,
    mon_id: laGiaoVien ? input.mon_id || null : null,
    ...(matKhauHash ? {
      mat_khau_hash: matKhauHash,
      phai_doi_mat_khau: true,
      mat_khau_mac_dinh_het_han_luc: new Date(Date.now() + 15 * 86400000).toISOString(),
    } : {}),
  };
}

async function capNhatBoNhiem(
  taiKhoanId: string,
  vaiTro: TaiKhoanInput["vai_tro"],
  monId?: string | null,
) {
  const supabase = taoSupabaseServiceRole();
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("to_truong_tai_khoan_id", taiKhoanId);
  if (vaiTro === "ToTruong" && monId) {
    const { error } = await supabase.from("mon").update({ to_truong_tai_khoan_id: taiKhoanId }).eq("mon_id", monId);
    if (error) throw new Error(error.message);
  }
}

export async function taoTaiKhoan(input: TaiKhoanInput) {
  await damBaoAdmin();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const supabase = taoSupabaseServiceRole();
  const matKhau = taoMatKhauMacDinh(parsed.data.ma_so, parsed.data.nam_sinh);
  const { data, error } = await supabase
    .from("tai_khoan")
    .insert(payloadTaiKhoan(parsed.data, await bamMatKhau(matKhau)))
    .select("tai_khoan_id")
    .single();
  if (error) return { success: false, error: error.code === "23505" ? "Mã số đã tồn tại" : error.message };
  try {
    await capNhatBoNhiem(data.tai_khoan_id, parsed.data.vai_tro, parsed.data.mon_id);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không thể bổ nhiệm tổ trưởng" };
  }
  revalidatePath("/tai-khoan");
  return { success: true, matKhau };
}

export async function capNhatTaiKhoan(taiKhoanId: string, input: TaiKhoanInput) {
  await damBaoAdmin();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("tai_khoan").update(payloadTaiKhoan(parsed.data)).eq("tai_khoan_id", taiKhoanId);
  if (error) return { success: false, error: error.code === "23505" ? "Mã số đã tồn tại" : error.message };
  try {
    await capNhatBoNhiem(taiKhoanId, parsed.data.vai_tro, parsed.data.mon_id);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không thể cập nhật bổ nhiệm" };
  }
  revalidatePath("/tai-khoan");
  return { success: true };
}

export async function doiTrangThaiTaiKhoan(
  taiKhoanId: string,
  trangThai: "HoatDong" | "DinhChi",
  lyDo = "",
) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    return { success: false as const, error: "Không có quyền thực hiện" };
  }
  if (trangThai === "DinhChi" && lyDo.trim().length < 3) {
    return { success: false as const, error: "Lý do là bắt buộc" };
  }
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase.rpc("cap_nhat_trang_thai_tai_khoan", {
    p_tai_khoan_id: taiKhoanId,
    p_trang_thai: trangThai,
    p_ly_do: lyDo.trim(),
    p_admin_id: session.sub,
  });
  if (error) {
    const messages: Record<string, string> = {
      LY_DO_LA_BAT_BUOC: "Lý do là bắt buộc",
      KHONG_THE_DINH_CHI_ADMIN: "Không thể đình chỉ tài khoản Admin",
      TRANG_THAI_DA_THAY_DOI: "Trạng thái tài khoản đã thay đổi",
      KHONG_TIM_THAY_TAI_KHOAN: "Không tìm thấy tài khoản",
    };
    const code = Object.keys(messages).find((item) => error.message.includes(item));
    return {
      success: false as const,
      error: code ? messages[code] : "Không thể cập nhật trạng thái tài khoản",
    };
  }
  const result = Array.isArray(data) ? data[0] : data;
  revalidatePath("/tai-khoan");
  revalidatePath("/giam-sat-ca-thi");
  return {
    success: true as const,
    dangLamBai: Boolean(result?.dang_lam_bai),
  };
}

export async function resetMatKhau(taiKhoanId: string) {
  await damBaoAdmin();
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase.from("tai_khoan").select("ma_so, nam_sinh").eq("tai_khoan_id", taiKhoanId).single();
  if (error) return { success: false, error: error.message };
  if (!data.nam_sinh) return { success: false, error: "Tài khoản chưa có năm sinh để tạo mật khẩu mặc định" };
  const matKhau = taoMatKhauMacDinh(data.ma_so, data.nam_sinh);
  const { error: updateError } = await supabase.from("tai_khoan").update({
    mat_khau_hash: await bamMatKhau(matKhau),
    phai_doi_mat_khau: true,
    mat_khau_mac_dinh_het_han_luc: new Date(Date.now() + 15 * 86400000).toISOString(),
    so_lan_sai_lien_tiep: 0,
    khoa_dang_nhap_den: null,
    phien_hien_hanh: null,
  }).eq("tai_khoan_id", taiKhoanId);
  if (updateError) return { success: false, error: updateError.message };
  revalidatePath("/tai-khoan");
  return { success: true, matKhau };
}

export async function xoaTaiKhoan(taiKhoanId: string) {
  await damBaoAdmin();
  const supabase = taoSupabaseServiceRole();
  const { data } = await supabase.from("tai_khoan").select("vai_tro").eq("tai_khoan_id", taiKhoanId).single();
  if (data?.vai_tro === "Admin") return { success: false, error: "Không thể xóa tài khoản Admin" };
  const { error } = await supabase.from("tai_khoan").delete().eq("tai_khoan_id", taiKhoanId);
  if (error) return { success: false, error: error.code === "23503" ? "Tài khoản đã có lịch sử; hãy đình chỉ thay vì xóa." : error.message };
  revalidatePath("/tai-khoan");
  return { success: true };
}

export async function importTaiKhoan(rows: (TaiKhoanInput & { dong: number })[]): Promise<ImportResult> {
  await damBaoAdmin();
  const result: ImportResult = { thanhCong: 0, loi: [] };
  const duplicates = new Set<string>();
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.ma_so?.trim().toLowerCase();
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  for (const row of rows) {
    if (duplicates.has(row.ma_so?.trim().toLowerCase())) {
      result.loi.push({ dong: row.dong, maLoi: "TRUNG_TRONG_FILE", chiTiet: "Mã số bị trùng trong file" });
      continue;
    }
    const response = await taoTaiKhoan(row);
    if (response.success) result.thanhCong += 1;
    else result.loi.push({
      dong: row.dong,
      maLoi: response.error === "Mã số đã tồn tại" ? "MA_SO_DA_TON_TAI" : "DU_LIEU_KHONG_HOP_LE",
      chiTiet: response.error || "Không xác định",
    });
  }
  return result;
}
