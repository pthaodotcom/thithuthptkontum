export type OMaTran = {
  phan: "I" | "II" | "III";
  chuyenDeId: string;
  mucDoId: string;
  soLuong: number;
};

export type SucChua = Omit<OMaTran, "soLuong"> & { khaDung: number };

export function kiemTraMaTran(
  maTran: OMaTran[],
  sucChua: SucChua[],
  cauHinh: Partial<Record<OMaTran["phan"], number>>,
) {
  const thieu = maTran.flatMap((o) => {
    const co = sucChua.find((s) => s.phan === o.phan && s.chuyenDeId === o.chuyenDeId && s.mucDoId === o.mucDoId)?.khaDung ?? 0;
    return co < o.soLuong ? [{ ...o, khaDung: co, thieu: o.soLuong - co }] : [];
  });
  const tongTheoPhan = maTran.reduce<Partial<Record<OMaTran["phan"], number>>>((acc, o) => {
    acc[o.phan] = (acc[o.phan] ?? 0) + o.soLuong;
    return acc;
  }, {});
  const saiTong = (Object.entries(cauHinh) as [OMaTran["phan"], number][]).flatMap(([phan, batBuoc]) =>
    (tongTheoPhan[phan] ?? 0) === batBuoc ? [] : [{ phan, batBuoc, thucTe: tongTheoPhan[phan] ?? 0 }],
  );
  return { hopLe: thieu.length === 0 && saiTong.length === 0, thieu, saiTong };
}

export function chonKhongTrungNhom<T extends { id: string; nhomId?: string | null }>(pool: T[], soLuong: number, daChon: T[] = []) {
  const nhomDaDung = new Set(daChon.map((x) => x.nhomId ?? x.id));
  const ketQua: T[] = [];
  for (const item of pool) {
    const nhom = item.nhomId ?? item.id;
    if (!nhomDaDung.has(nhom)) {
      ketQua.push(item);
      nhomDaDung.add(nhom);
      if (ketQua.length === soLuong) break;
    }
  }
  return ketQua;
}
