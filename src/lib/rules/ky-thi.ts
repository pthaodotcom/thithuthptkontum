export type NhomNangLuc =
  | "CanOnTapGap"
  | "TrungBinh"
  | "Kha"
  | "DaNamVung";

export function namHocTuNgay(ngay: Date) {
  const nam = ngay.getFullYear();
  const thang = ngay.getMonth() + 1;
  return thang >= 8 ? `${nam}-${nam + 1}` : `${nam - 1}-${nam}`;
}

export function xepNhomNangLuc(diemTrungBinh: number): NhomNangLuc {
  if (diemTrungBinh < 5) return "CanOnTapGap";
  if (diemTrungBinh < 6.5) return "TrungBinh";
  if (diemTrungBinh < 8) return "Kha";
  return "DaNamVung";
}

export function conDuocVaoThi(
  gioBatDau: Date,
  hienTai: Date,
  daMoKhoaNgoaiLe: boolean,
) {
  if (hienTai < gioBatDau) return false;
  return daMoKhoaNgoaiLe || hienTai.getTime() <= gioBatDau.getTime() + 15 * 60_000;
}

export function hopLeViPham(
  loai: "Copy" | "ChuyenTab" | "MatKetNoi",
  thoiLuongGiay?: number,
) {
  if (loai === "Copy") return true;
  if (loai === "ChuyenTab") return (thoiLuongGiay ?? 0) > 10;
  return (thoiLuongGiay ?? 0) > 30;
}

export function coTuDongThuBai(soViPham: number) {
  return soViPham >= 3;
}

export function conDuocDoiMon(
  gioCaSangNgay2: Date,
  hienTai: Date,
  soLanDaDoi: number,
) {
  return (
    soLanDaDoi < 2 &&
    hienTai.getTime() < gioCaSangNgay2.getTime() - 48 * 60 * 60_000
  );
}
