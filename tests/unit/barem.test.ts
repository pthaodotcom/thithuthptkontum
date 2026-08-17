import { describe, expect, it } from "vitest";
import { validateBaremMon } from "@/lib/rules/barem";

/**
 * Vi du unit test cho lib/rules/* - FR-M1-01. Chay: npm run test
 * Day la khuon mau: moi rule nghiep vu moi trong lib/rules/ nen co file test
 * tuong ung truoc khi coi la "Done" o Phase 1.
 */
describe("validateBaremMon (FR-M1-01)", () => {
  it("chap nhan cau hinh chuan co tong diem bang 10", () => {
    const ketQua = validateBaremMon({
      phan1SoCau: 24,
      phan1DiemMoiCau: 0.25,
      phan2SoCau: 4,
      phan2Diem1Y: 0.1,
      phan2Diem2Y: 0.25,
      phan2Diem3Y: 0.4,
      phan2Diem4Y: 0.5,
      phan3SoCau: 4,
      phan3DiemMoiCau: 0.5,
    });
    expect(ketQua.hopLe).toBe(true);
    expect(ketQua.tongDiem).toBeCloseTo(10);
  });

  it("tu choi neu tong diem khac 10", () => {
    const ketQua = validateBaremMon({
      phan1SoCau: 36,
      phan1DiemMoiCau: 0.25,
    });
    expect(ketQua.hopLe).toBe(false);
    expect(ketQua.loi.some((l) => l.includes("Tổng điểm"))).toBe(true);
  });

  it("tu choi neu thang Phan II khong tang dan", () => {
    const ketQua = validateBaremMon({
      phan2SoCau: 4,
      phan2Diem1Y: 0.5,
      phan2Diem2Y: 0.25,
      phan2Diem3Y: 0.5,
      phan2Diem4Y: 1.0,
      phan1SoCau: 24,
      phan1DiemMoiCau: 0.25,
      phan3SoCau: 0,
      phan3DiemMoiCau: null,
    });
    expect(ketQua.hopLe).toBe(false);
    expect(ketQua.loi.some((l) => l.includes("tăng dần"))).toBe(true);
  });
});
