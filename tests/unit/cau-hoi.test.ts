import { describe, expect, it } from "vitest";
import { cauHoiSchema, tachDapAnPhan2 } from "@/lib/rules/cau-hoi";

const base = {
  baiHocId: "11111111-1111-4111-8111-111111111111",
  mucDoId: "22222222-2222-4222-8222-222222222222",
  noiDung: "Nội dung",
};

describe("khuôn câu hỏi", () => {
  it("Phần I có đúng bốn phương án và một đáp án đúng", () => {
    expect(cauHoiSchema.safeParse({ ...base, phan: "I", chiTiet: ["A", "B", "C", "D"].map((noiDung, i) => ({ noiDung, laDapAnDung: i === 1 })) }).success).toBe(true);
    expect(cauHoiSchema.safeParse({ ...base, phan: "I", chiTiet: ["A", "B", "C", "D"].map((noiDung) => ({ noiDung, laDapAnDung: true })) }).success).toBe(false);
  });

  it("Phần II chấp nhận bốn ý độc lập", () => {
    expect(cauHoiSchema.safeParse({ ...base, phan: "II", chiTiet: ["a", "b", "c", "d"].map((noiDung, i) => ({ noiDung, laDapAnDung: i % 2 === 0 })) }).success).toBe(true);
  });

  it("Phần III chỉ chấp nhận chuỗi bốn ký tự", () => {
    expect(cauHoiSchema.safeParse({ ...base, phan: "III", chiTiet: [], dapAnPhan3: "-1,2" }).success).toBe(true);
    expect(cauHoiSchema.safeParse({ ...base, phan: "III", chiTiet: [], dapAnPhan3: "12.3" }).success).toBe(false);
  });

  it("đọc đáp án đúng sai import", () => {
    expect(tachDapAnPhan2("Đ; S; 1; 0")).toEqual([true, false, true, false]);
    expect(tachDapAnPhan2("Đ; S")).toBeNull();
  });
});

