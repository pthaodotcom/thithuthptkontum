export type TrangThaiDemoBypass = "VaoThi" | "SapDienRa";

export type DemoBypassOverride = {
  trang_thai: TrangThaiDemoBypass;
  gio_bat_dau: string;
  gio_ket_thuc: string;
};

export function demoBypassDangBat() {
  return process.env.DEMO_BYPASS_ENABLED === "true";
}

/**
 * Ap dung override da duoc tra cuu theo bai_lam_id. Ham nay khong tu truy van
 * database de cac caller bat buoc giu pham vi bypass o dung mot hoc sinh.
 */
export function apDungDemoBypassTheoBaiLam(
  lichThat: { trangThai: string; gioBatDau: string; gioKetThuc: string },
  override?: DemoBypassOverride | null
) {
  if (!override) return lichThat;
  return {
    trangThai: override.trang_thai === "VaoThi" ? "DangMo" : "SapDienRa",
    gioBatDau: override.gio_bat_dau,
    gioKetThuc: override.gio_ket_thuc,
  };
}

/**
 * Phan loai bai lam khi ket thuc luot demo:
 * - idsDuocXuLy: bai da nop va da co diem tong (se phan tich, tao Gemini AI, gui email)
 * - idsChuaNop: bai chua nop hoac chua co diem (go khoi demo, giu nguyen bai lam, khong cham vang)
 */
export function phanLoaiBaiLamKetThucDemo<T extends { bai_lam_id: string; trang_thai: string; diem_tong: number | null }>(
  danhSach: T[]
) {
  const idsDuocXuLy: string[] = [];
  const idsChuaNop: string[] = [];

  for (const item of danhSach) {
    if (item.trang_thai === "DaNopBai" && item.diem_tong !== null) {
      idsDuocXuLy.push(item.bai_lam_id);
    } else {
      idsChuaNop.push(item.bai_lam_id);
    }
  }

  return { idsDuocXuLy, idsChuaNop };
}
