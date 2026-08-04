import { describe, expect, it } from "vitest";
import {
  coTuDongThuBai,
  conDuocDoiMon,
  conDuocVaoThi,
  hopLeViPham,
  xepNhomNangLuc,
} from "@/lib/rules/ky-thi";

describe("quy tac ky thi", () => {
  it("phan nhom dung cac nguong co dinh", () => {
    expect([4.99, 5, 6.49, 6.5, 7.99, 8].map(xepNhomNangLuc)).toEqual([
      "CanOnTapGap", "TrungBinh", "TrungBinh", "Kha", "Kha", "DaNamVung",
    ]);
  });
  it("khoa vao thi sau 15 phut neu khong co ngoai le", () => {
    const batDau = new Date("2026-08-01T00:00:00Z");
    expect(conDuocVaoThi(batDau, new Date("2026-08-01T00:15:00Z"), false)).toBe(true);
    expect(conDuocVaoThi(batDau, new Date("2026-08-01T00:15:01Z"), false)).toBe(false);
    expect(conDuocVaoThi(batDau, new Date("2026-08-01T00:30:00Z"), true)).toBe(true);
  });
  it("chi ghi nhan su kien vuot nguong va thu bai lan thu ba", () => {
    expect(hopLeViPham("ChuyenTab", 10)).toBe(false);
    expect(hopLeViPham("ChuyenTab", 11)).toBe(true);
    expect(hopLeViPham("MatKetNoi", 30)).toBe(false);
    expect(hopLeViPham("MatKetNoi", 31)).toBe(true);
    expect(coTuDongThuBai(2)).toBe(false);
    expect(coTuDongThuBai(3)).toBe(true);
  });
  it("doi mon truoc 48 gio va toi da hai lan", () => {
    const ca = new Date("2026-08-03T00:00:00Z");
    expect(conDuocDoiMon(ca, new Date("2026-07-31T23:59:59Z"), 1)).toBe(true);
    expect(conDuocDoiMon(ca, new Date("2026-08-01T00:00:00Z"), 1)).toBe(false);
    expect(conDuocDoiMon(ca, new Date("2026-07-31T00:00:00Z"), 2)).toBe(false);
  });
});
