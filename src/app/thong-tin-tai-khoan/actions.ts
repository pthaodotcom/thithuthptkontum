"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const namHienTai = new Date().getFullYear();
const ngayHienTai = new Date().toISOString().slice(0, 10);

function laNgayHopLe(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parts = value.split("-").map(Number);
  const nam = parts[0];
  const thang = parts[1];
  const ngay = parts[2];
  if (nam === undefined || thang === undefined || ngay === undefined) return false;
  const parsed = new Date(Date.UTC(nam, thang - 1, ngay));
  return (
    parsed.getUTCFullYear() === nam &&
    parsed.getUTCMonth() === thang - 1 &&
    parsed.getUTCDate() === ngay
  );
}

const thongTinCaNhanSchema = z.object({
  ho_ten: z
    .string()
    .trim()
    .min(1, "Họ và tên không được để trống")
    .max(100, "Họ và tên tối đa 100 ký tự"),
  nam_sinh: z.union([
    z.coerce.number().int().min(1900).max(namHienTai),
    z.literal(""),
  ]),
  ngay_sinh: z
    .string()
    .trim()
    .refine(
      (value) => !value || (laNgayHopLe(value) && value >= "1900-01-01" && value <= ngayHienTai),
      "Ngày sinh không hợp lệ hoặc nằm ngoài khoảng cho phép",
    ),
  gioi_tinh: z.enum(["Nam", "Nu", "Khac", ""]),
  email_ca_nhan: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email cá nhân tối đa 254 ký tự")
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Email cá nhân không hợp lệ",
    ),
  so_dien_thoai: z
    .string()
    .trim()
    .max(20, "Số điện thoại tối đa 20 ký tự")
    .refine(
      (value) => !value || /^\+?[0-9]{9,15}$/.test(value.replace(/[\s.-]/g, "")),
      "Số điện thoại phải có từ 9 đến 15 chữ số",
    ),
  dia_chi: z.string().trim().max(255, "Địa chỉ tối đa 255 ký tự"),
});

export type ThongTinCaNhanInput = {
  ho_ten: string;
  nam_sinh: string | number;
  ngay_sinh: string;
  gioi_tinh: "Nam" | "Nu" | "Khac" | "";
  email_ca_nhan: string;
  so_dien_thoai: string;
  dia_chi: string;
};

export type KetQuaCapNhatThongTin =
  | {
      success: true;
      data: {
        ho_ten: string;
        nam_sinh: number;
        ngay_sinh: string;
        gioi_tinh: "Nam" | "Nu" | "Khac" | "";
        email_ca_nhan: string;
        so_dien_thoai: string;
        dia_chi: string;
      };
    }
  | { success: false; error: string; field?: keyof ThongTinCaNhanInput };

function chuanHoaSoDienThoai(value: string) {
  return value.replace(/[\s.-]/g, "");
}

export async function capNhatThongTinCaNhan(
  input: ThongTinCaNhanInput,
): Promise<KetQuaCapNhatThongTin> {
  const session = await laySessionHienHanh();
  if (!session) {
    return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const parsed = thongTinCaNhanSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      success: false,
      error: issue?.message || "Thông tin chưa hợp lệ.",
      field: issue?.path[0] as keyof ThongTinCaNhanInput | undefined,
    };
  }
  if (!parsed.data.ngay_sinh && !parsed.data.nam_sinh) {
    return {
      success: false,
      error: "Vui lòng cập nhật ngày sinh để hoàn thiện hồ sơ.",
      field: "ngay_sinh",
    };
  }

  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan, error: queryError } = await supabase
    .from("tai_khoan")
    .select("vai_tro,trang_thai,nam_sinh")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();

  if (queryError || !taiKhoan) {
    return { success: false, error: "Không tìm thấy tài khoản cần cập nhật." };
  }
  if (taiKhoan.trang_thai !== "HoatDong") {
    return { success: false, error: "Tài khoản đang bị đình chỉ nên không thể cập nhật thông tin." };
  }

  const namSinh = parsed.data.ngay_sinh
    ? Number(parsed.data.ngay_sinh.slice(0, 4))
    : taiKhoan.nam_sinh ?? Number(parsed.data.nam_sinh);
  const payload = {
    ho_ten: parsed.data.ho_ten,
    nam_sinh: namSinh,
    ngay_sinh: parsed.data.ngay_sinh || null,
    gioi_tinh: parsed.data.gioi_tinh || null,
    email_ca_nhan: parsed.data.email_ca_nhan || null,
    so_dien_thoai: parsed.data.so_dien_thoai
      ? chuanHoaSoDienThoai(parsed.data.so_dien_thoai)
      : null,
    dia_chi: parsed.data.dia_chi || null,
  };

  const { data: daCapNhat, error: updateError } = await supabase
    .from("tai_khoan")
    .update(payload)
    .eq("tai_khoan_id", session.sub)
    .eq("trang_thai", "HoatDong")
    .select("ho_ten,nam_sinh,ngay_sinh,gioi_tinh,email_ca_nhan,so_dien_thoai,dia_chi")
    .maybeSingle();

  if (updateError || !daCapNhat) {
    return { success: false, error: "Chưa cập nhật được thông tin. Vui lòng thử lại." };
  }

  revalidatePath("/thong-tin-tai-khoan");
  return {
    success: true,
    data: {
      ho_ten: daCapNhat.ho_ten,
      nam_sinh: daCapNhat.nam_sinh,
      ngay_sinh: daCapNhat.ngay_sinh || "",
      gioi_tinh: (daCapNhat.gioi_tinh || "") as "Nam" | "Nu" | "Khac" | "",
      email_ca_nhan: daCapNhat.email_ca_nhan || "",
      so_dien_thoai: daCapNhat.so_dien_thoai || "",
      dia_chi: daCapNhat.dia_chi || "",
    },
  };
}
