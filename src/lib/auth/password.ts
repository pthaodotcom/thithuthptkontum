import bcrypt from "bcryptjs";

/**
 * Quy tac mat khau theo FR-M2-02:
 * - Mat khau mac dinh = ma_so + nam_sinh, het hieu luc sau 15 ngay neu chua
 *   tung dang nhap (kiem tra o session.ts khi dang nhap, dung
 *   tai_khoan.mat_khau_mac_dinh_het_han_luc).
 * - Mat khau moi (sau doi lan dau) phai >= 8 ky tu, co it nhat 1 chu hoa va 1 chu so.
 * - Sai 5 lan lien tiep -> khoa dang nhap 15 phut (xu ly o session.ts).
 */

const SO_VONG_BAM = 10;

export function taoMatKhauMacDinh(maSo: string, namSinh: number): string {
  return `${maSo}${namSinh}`;
}

export async function bamMatKhau(matKhau: string): Promise<string> {
  return bcrypt.hash(matKhau, SO_VONG_BAM);
}

export async function xacMinhMatKhau(matKhau: string, hash: string): Promise<boolean> {
  return bcrypt.compare(matKhau, hash);
}

export interface KetQuaValidateMatKhau {
  hopLe: boolean;
  loi?: string;
}

/** FR-M2-02: mat khau moi >= 8 ky tu, co chu hoa va chu so. */
export function validateMatKhauMoi(matKhau: string): KetQuaValidateMatKhau {
  if (matKhau.length < 8) {
    return { hopLe: false, loi: "Mat khau phai co it nhat 8 ky tu" };
  }
  if (!/[A-Z]/.test(matKhau)) {
    return { hopLe: false, loi: "Mat khau phai co it nhat 1 chu hoa" };
  }
  if (!/[0-9]/.test(matKhau)) {
    return { hopLe: false, loi: "Mat khau phai co it nhat 1 chu so" };
  }
  return { hopLe: true };
}
