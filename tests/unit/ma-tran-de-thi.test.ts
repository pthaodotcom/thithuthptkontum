import { describe, expect, it } from "vitest";
import { chonKhongTrungNhom, kiemTraMaTran } from "@/lib/rules/ma-tran-de-thi";

describe("ma tran de thi", () => {
  it("bao dung o thieu va so luong thieu", () => {
    const result = kiemTraMaTran(
      [{ phan: "I", chuyenDeId: "cd1", mucDoId: "md1", soLuong: 3 }],
      [{ phan: "I", chuyenDeId: "cd1", mucDoId: "md1", khaDung: 1 }],
      { I: 3 },
    );
    expect(result.hopLe).toBe(false);
    expect(result.thieu[0]).toMatchObject({ khaDung: 1, thieu: 2 });
  });

  it("khoa tong so cau theo cau hinh mon", () => {
    const result = kiemTraMaTran([], [], { I: 2, II: 1 });
    expect(result.saiTong).toEqual([
      { phan: "I", batBuoc: 2, thucTe: 0 },
      { phan: "II", batBuoc: 1, thucTe: 0 },
    ]);
  });

  it("khong chon hai cau cung nhom", () => {
    const result = chonKhongTrungNhom([
      { id: "a", nhomId: "g1" },
      { id: "b", nhomId: "g1" },
      { id: "c", nhomId: null },
    ], 2);
    expect(result.map((x) => x.id)).toEqual(["a", "c"]);
  });
});
