export type Phan = "I" | "II" | "III";

export interface CauCham {
  snapshotId: string;
  phan: Phan;
  dapAnPhan3?: string | null;
  chiTiet: Array<{ id: string; thuTu: number; laDapAnDung: boolean }>;
}

export interface TraLoiCham {
  cauHoiSnapshotId: string;
  chiTietThuTu: number;
  dapAnLuaChonId?: string | null;
  dapAnDungSai?: boolean | null;
  dapAnChuoi?: string | null;
}

export interface BaremSnapshot {
  phan1DiemMoiCau?: number | null;
  phan2Diem1Y?: number | null;
  phan2Diem2Y?: number | null;
  phan2Diem3Y?: number | null;
  phan2Diem4Y?: number | null;
  phan3DiemMoiCau?: number | null;
}

export function chamBai(
  cauHoi: CauCham[],
  traLoi: TraLoiCham[],
  barem: BaremSnapshot,
) {
  let diem = 0;
  let dung = 0;
  let sai = 0;

  for (const cau of cauHoi) {
    const cacTraLoi = traLoi.filter((item) => item.cauHoiSnapshotId === cau.snapshotId);
    let cauDung = false;
    if (cau.phan === "I") {
      const dapAnDung = cau.chiTiet.find((item) => item.laDapAnDung)?.id;
      cauDung = Boolean(dapAnDung && cacTraLoi[0]?.dapAnLuaChonId === dapAnDung);
      if (cauDung) diem += barem.phan1DiemMoiCau ?? 0;
    } else if (cau.phan === "II") {
      const soYDung = cau.chiTiet.filter((chiTiet) => {
        const tl = cacTraLoi.find((item) => item.chiTietThuTu === chiTiet.thuTu);
        return tl?.dapAnDungSai === chiTiet.laDapAnDung;
      }).length;
      const muc = [
        0,
        barem.phan2Diem1Y ?? 0,
        barem.phan2Diem2Y ?? 0,
        barem.phan2Diem3Y ?? 0,
        barem.phan2Diem4Y ?? 0,
      ];
      diem += muc[soYDung] ?? 0;
      cauDung = soYDung === 4;
    } else {
      cauDung = cacTraLoi[0]?.dapAnChuoi === cau.dapAnPhan3;
      if (cauDung) diem += barem.phan3DiemMoiCau ?? 0;
    }
    if (cauDung) dung += 1;
    else sai += 1;
  }

  return { diemTong: Math.round(diem * 100) / 100, soCauDung: dung, soCauSai: sai };
}
