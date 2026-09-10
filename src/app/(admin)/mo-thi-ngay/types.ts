export type HocSinhDemo = {
  baiLamId: string;
  caThiId: string;
  hoTen: string;
  maSo: string;
  tenLop: string;
  tenMon: string;
  soThuTuCa: number;
  trangThaiBai: string;
  diemTong: number | null;
  coEmail: boolean;
};

export type CaThiBypass = {
  caThiId: string;
  soThuTuCa: number;
  gioBatDau: string;
  gioKetThuc: string;
  hocSinh: HocSinhDemo[];
};

export type DotThiBypass = {
  dotThiId: string;
  tenDotThi: string;
  namHoc: string;
  cacCa: CaThiBypass[];
};

export type TrangThaiBaiDemo =
  | "ChuaVaoThi" | "DangLamBai" | "DaNopBai" | "ChoXuLy"
  | "DangTaoNhanXet" | "DangGuiEmail" | "HoanTat" | "ThieuEmail"
  | "ThatBaiTamThoi" | "CanXuLy";

export type BaiTheoDoiDemo = HocSinhDemo & { trangThai: TrangThaiBaiDemo };

export type LuotThiDemo = {
  demoLuotThiId: string;
  trangThai: "DangMo" | "DangXuLy" | "HoanTat" | "CanXuLy";
  lyDo: string;
  createdAt: string;
  ketThucLuc: string | null;
  cacBai: BaiTheoDoiDemo[];
  soJobConLai: number;
};
