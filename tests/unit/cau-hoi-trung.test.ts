import { describe, expect, it } from "vitest";
import { chuanHoaVanBanCauHoi, taoDauVanCauHoi } from "@/lib/rules/cau-hoi-trung";
import type { DuLieuCauHoi } from "@/lib/rules/cau-hoi";

const taoCau = (noiDung: string): DuLieuCauHoi => ({
  phan: "I",
  baiHocId: "11111111-1111-4111-8111-111111111111",
  mucDoId: "22222222-2222-4222-8222-222222222222",
  noiDung,
  chiTiet: ["1", "2", "3", "4"].map((value, index) => ({ noiDung: value, laDapAnDung: index === 0 })),
  dapAnPhan3: null,
});

describe("dấu vân câu hỏi", () => {
  it("bỏ khác biệt HTML, tiền tố và khoảng trắng khi tạo hash", () => {
    const a = taoDauVanCauHoi(taoCau("Câu 12: Giải <b>phương trình</b> x + 1 = 2"));
    const b = taoDauVanCauHoi(taoCau("giải phương trình   x+1=2"));
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("giữ cấu trúc chỉ số trên thay vì nối dính ký tự", () => {
    expect(chuanHoaVanBanCauHoi("x<sup>2</sup> + 1")).toContain("x ^ (2)");
  });

  it("nhận ra cùng mẫu Toán khi chỉ thay số", () => {
    const a = taoDauVanCauHoi(taoCau("Giải phương trình 2x + 3 = 7"));
    const b = taoDauVanCauHoi(taoCau("Giải phương trình 4x + 5 = 13"));
    expect(a.contentHash).not.toBe(b.contentHash);
    expect(a.mauCauHoi).toBe(b.mauCauHoi);
    expect(a.chuKySo).not.toBe(b.chuKySo);
  });

  it("không làm mất dấu toán học khi thay số", () => {
    const cong = taoDauVanCauHoi(taoCau("x + 3 = 5"));
    const tru = taoDauVanCauHoi(taoCau("x - 3 = 5"));
    expect(cong.mauCauHoi).not.toBe(tru.mauCauHoi);
  });
});
