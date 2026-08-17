import { describe, expect, it } from "vitest";
import { tongHopMonTheoLop, type ReportRow } from "../../src/lib/reports/data";

const row = (lop: string, diem: number): ReportRow => ({
  baiLamId: `${lop}-${diem}`, hocSinhId: "hs", maSo: "HS", hoTen: "Học sinh",
  lopId: lop, lop, monId: "toan", mon: "Toán", dotThi: "Đợt 1", diem,
  soCauDung: 1, soCauSai: 0,
  nhom: diem < 5 ? "CanOnTapGap" : diem < 6.5 ? "TrungBinh" : diem < 8 ? "Kha" : "DaNamVung",
  nopLuc: null,
  soViPham: 0, loaiViPham: [], viPhamGanNhat: null, tuDongThuBaiDoViPham: false,
});

describe("tongHopMonTheoLop", () => {
  it("tổng hợp, tính tỷ lệ đạt và xếp lớp theo điểm trung bình", () => {
    const result = tongHopMonTheoLop([row("12A1", 4), row("12A1", 8), row("12A2", 7)]);
    expect(result.map((x) => x.lop)).toEqual(["12A2", "12A1"]);
    expect(result[1]).toMatchObject({ soBai: 2, diemTrungBinh: 6, tyLeDat: 50 });
    expect(result[1]!.nhomNangLuc).toMatchObject({ CanOnTapGap: 1, DaNamVung: 1 });
  });
});
