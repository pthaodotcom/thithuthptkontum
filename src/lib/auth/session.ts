import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { kySessionJwt, xacMinhSessionJwt, type VaiTro } from "@/lib/auth/jwt";
import { xacMinhMatKhau } from "@/lib/auth/password";

/**
 * FR-M2-02: dang nhap bang ma_so + mat_khau, khoa 5 lan sai lien tiep / 15 phut.
 * FR-M5-01: moi tai khoan chi 1 phien lam viec tai 1 thoi diem - dang nhap moi
 * sinh session_id moi va ghi de tai_khoan.phien_hien_hanh, phien cu coi nhu bi huy
 * (middleware/API se so sanh claim session_id trong JWT voi cot nay).
 */

const TEN_COOKIE_SESSION = "session";
const SO_PHUT_KHOA = 15;
const SO_LAN_SAI_TOI_DA = 5;

export interface KetQuaDangNhap {
  thanhCong: boolean;
  loi?: string;
  phaiDoiMatKhau?: boolean;
}

export async function dangNhap(maSo: string, matKhau: string): Promise<KetQuaDangNhap> {
  const supabase = taoSupabaseServiceRole();

  const { data: taiKhoan, error } = await supabase
    .from("tai_khoan")
    .select(
      "tai_khoan_id, mat_khau_hash, vai_tro, trang_thai, phai_doi_mat_khau, so_lan_sai_lien_tiep, khoa_dang_nhap_den, mat_khau_mac_dinh_het_han_luc"
    )
    .eq("ma_so", maSo)
    .maybeSingle();

  if (error) {
    console.error("Khong the truy van tai khoan khi dang nhap:", error.message);
    return { thanhCong: false, loi: "Chưa kết nối được đến hệ thống. Vui lòng thử lại sau ít phút." };
  }

  if (!taiKhoan) {
    return { thanhCong: false, loi: "Mã số hoặc mật khẩu không đúng." };
  }

  if (taiKhoan.trang_thai === "DinhChi") {
    return { thanhCong: false, loi: "Tài khoản đang bị tạm khóa. Vui lòng liên hệ quản trị viên nhà trường." };
  }

  if (taiKhoan.khoa_dang_nhap_den && new Date(taiKhoan.khoa_dang_nhap_den) > new Date()) {
    return { thanhCong: false, loi: `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${new Date(taiKhoan.khoa_dang_nhap_den).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.` };
  }

  // Mat khau mac dinh het hieu luc sau 15 ngay neu chua tung dang nhap (FR-M2-02)
  if (
    taiKhoan.phai_doi_mat_khau &&
    taiKhoan.mat_khau_mac_dinh_het_han_luc &&
    new Date(taiKhoan.mat_khau_mac_dinh_het_han_luc) < new Date()
  ) {
    return { thanhCong: false, loi: "Mật khẩu ban đầu đã hết hạn. Vui lòng liên hệ quản trị viên để được cấp lại." };
  }

  const dungMatKhau = await xacMinhMatKhau(matKhau, taiKhoan.mat_khau_hash);

  if (!dungMatKhau) {
    const soLanSaiMoi = taiKhoan.so_lan_sai_lien_tiep + 1;
    const capNhat: Record<string, unknown> = { so_lan_sai_lien_tiep: soLanSaiMoi };
    if (soLanSaiMoi >= SO_LAN_SAI_TOI_DA) {
      capNhat.khoa_dang_nhap_den = new Date(Date.now() + SO_PHUT_KHOA * 60_000).toISOString();
      capNhat.so_lan_sai_lien_tiep = 0;
    }
    await supabase.from("tai_khoan").update(capNhat).eq("tai_khoan_id", taiKhoan.tai_khoan_id);
    return { thanhCong: false, loi: "Mã số hoặc mật khẩu không đúng." };
  }

  // Dang nhap thanh cong: reset dem sai, sinh session_id moi (huy phien cu)
  const sessionId = randomUUID();
  const { data: updatedSession, error: sessionUpdateError } = await supabase
    .from("tai_khoan")
    .update({ so_lan_sai_lien_tiep: 0, khoa_dang_nhap_den: null, phien_hien_hanh: sessionId })
    .eq("tai_khoan_id", taiKhoan.tai_khoan_id)
    .select("phien_hien_hanh")
    .maybeSingle();
  if (sessionUpdateError || updatedSession?.phien_hien_hanh !== sessionId) {
    console.error("Khong the cap nhat phien dang nhap:", sessionUpdateError);
    return { thanhCong: false, loi: "Chưa kết nối được đến hệ thống. Vui lòng thử lại sau ít phút." };
  }

  const jwt = await kySessionJwt({
    sub: taiKhoan.tai_khoan_id,
    vai_tro: taiKhoan.vai_tro as VaiTro,
    session_id: sessionId,
    phai_doi_mat_khau: taiKhoan.phai_doi_mat_khau,
  });

  const cookieStore = await cookies();
  cookieStore.set(TEN_COOKIE_SESSION, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // localhost không hỗ trợ Secure cookie
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h, khop THOI_HAN_SESSION trong jwt.ts
  });

  return { thanhCong: true, phaiDoiMatKhau: taiKhoan.phai_doi_mat_khau };
}

export const laySessionHienHanh = cache(async function laySessionHienHanh() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEN_COOKIE_SESSION)?.value;
  if (!token) return null;

  const claims = await xacMinhSessionJwt(token);
  if (!claims) return null;

  // Doi chieu session_id voi tai_khoan.phien_hien_hanh - neu da dang nhap noi
  // khac, phien nay coi nhu bi huy (FR-M5-01: mot phien lam bai duy nhat).
  const supabase = taoSupabaseServiceRole();
  const { data } = await supabase
    .from("tai_khoan")
    .select("phien_hien_hanh")
    .eq("tai_khoan_id", claims.sub)
    .maybeSingle();

  if (!data || data.phien_hien_hanh !== claims.session_id) return null;

  return claims;
});

export async function dangXuat() {
  const cookieStore = await cookies();
  cookieStore.delete(TEN_COOKIE_SESSION);
}
