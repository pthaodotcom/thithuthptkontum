import { describe, expect, it } from "vitest";

import { apDungDemoBypass } from "@/lib/demo/bypass";

const lichThat = {
  trangThai: "KetThuc",
  gioBatDau: "2026-08-16T07:00:00.000Z",
  gioKetThuc: "2026-08-16T09:00:00.000Z",
};

describe("cấu hình lịch demo theo ca", () => {
  it("giữ nguyên lịch thật khi môn không có override", () => {
    expect(apDungDemoBypass(lichThat, null)).toEqual(lichThat);
  });

  it("chuyển ca Vào thi thành Đang mở", () => {
    expect(apDungDemoBypass(lichThat, {
      trang_thai: "VaoThi",
      gio_bat_dau: "2026-08-16T10:00:00.000Z",
      gio_ket_thuc: "2026-08-16T12:00:00.000Z",
    })).toEqual({
      trangThai: "DangMo",
      gioBatDau: "2026-08-16T10:00:00.000Z",
      gioKetThuc: "2026-08-16T12:00:00.000Z",
    });
  });

  it("chuyển ca sang Sắp diễn ra với giờ demo riêng", () => {
    expect(apDungDemoBypass(lichThat, {
      trang_thai: "SapDienRa",
      gio_bat_dau: "2026-08-16T13:00:00.000Z",
      gio_ket_thuc: "2026-08-16T15:00:00.000Z",
    }).trangThai).toBe("SapDienRa");
  });

  it("áp dụng cùng một lịch cho nhiều môn trong một ca", () => {
    const override = {
      trang_thai: "SapDienRa",
      gio_bat_dau: "2026-08-16T13:00:00.000Z",
      gio_ket_thuc: "2026-08-16T15:00:00.000Z",
    } as const;
    const monTuChon1 = apDungDemoBypass(lichThat, override);
    const monTuChon2 = apDungDemoBypass(lichThat, override);

    expect(monTuChon1).toEqual(monTuChon2);
    expect(monTuChon1.trangThai).toBe("SapDienRa");
  });
});
