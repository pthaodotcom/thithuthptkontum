export type TrangThaiDemoBypass = "VaoThi" | "SapDienRa";

export type DemoBypassOverride = {
  trang_thai: TrangThaiDemoBypass;
  gio_bat_dau: string;
  gio_ket_thuc: string;
};

export function demoBypassDangBat() {
  return process.env.DEMO_BYPASS_ENABLED === "true";
}

export function apDungDemoBypass(
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
