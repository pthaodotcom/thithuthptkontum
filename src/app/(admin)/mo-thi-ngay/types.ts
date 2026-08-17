export type MonTrongCaBypass = {
  caThiMonId: string;
  monId: string;
  tenMon: string;
  soHocSinh: number;
  coDeTaiSuDung: boolean;
};

export type CaThiBypass = {
  caThiId: string;
  dotThiId: string;
  soThuTuCa: number;
  gioBatDau: string;
  gioKetThuc: string;
  trangThai: string;
  override: {
    trangThai: "VaoThi" | "SapDienRa";
    gioBatDau: string;
    gioKetThuc: string;
  } | null;
  cauHinhCuKhongDongNhat: boolean;
  mons: MonTrongCaBypass[];
};

export type DotThiBypass = {
  dotThiId: string;
  tenDotThi: string;
  namHoc: string;
  cacCa: CaThiBypass[];
};

export type KetQuaMoCaBypass = {
  success: true;
  data: {
    tenDotThi: string;
    soCaVaoThi: number;
    soCaSapDienRa: number;
    soCaTheoLichThat: number;
    soMonDuocApDung: number;
    soMonCoDeTaiSuDung: number;
    soBaiDuocKhoiPhuc: number;
    soBaiDuocMoKhoa: number;
  };
};

export type LoiMoCaBypass = { success: false; error: string };
