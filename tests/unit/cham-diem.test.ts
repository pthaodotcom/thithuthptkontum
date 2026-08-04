import { describe, expect, it } from "vitest";
import { chamBai } from "@/lib/rules/cham-diem";

describe("cham diem theo snapshot", () => {
  it("cham du ba phan va lam tron hai chu so", () => {
    const ketQua = chamBai(
      [
        { snapshotId: "p1", phan: "I", chiTiet: [{ id: "a", thuTu: 1, laDapAnDung: true }] },
        { snapshotId: "p2", phan: "II", chiTiet: [1, 2, 3, 4].map((thuTu) => ({ id: `${thuTu}`, thuTu, laDapAnDung: thuTu % 2 === 0 })) },
        { snapshotId: "p3", phan: "III", dapAnPhan3: "1,25", chiTiet: [] },
      ],
      [
        { cauHoiSnapshotId: "p1", chiTietThuTu: 0, dapAnLuaChonId: "a" },
        ...[1, 2, 3, 4].map((chiTietThuTu) => ({ cauHoiSnapshotId: "p2", chiTietThuTu, dapAnDungSai: chiTietThuTu % 2 === 0 })),
        { cauHoiSnapshotId: "p3", chiTietThuTu: 0, dapAnChuoi: "1,25" },
      ],
      { phan1DiemMoiCau: 0.25, phan2Diem1Y: 0.1, phan2Diem2Y: 0.25, phan2Diem3Y: 0.5, phan2Diem4Y: 1, phan3DiemMoiCau: 0.25 },
    );
    expect(ketQua).toEqual({ diemTong: 1.5, soCauDung: 3, soCauSai: 0 });
  });
});
