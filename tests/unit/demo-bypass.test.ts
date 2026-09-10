import { describe, expect, it } from "vitest";

import { apDungDemoBypassTheoBaiLam } from "@/lib/demo/bypass";

const lichThat = {
  trangThai: "KetThuc",
  gioBatDau: "2026-08-16T07:00:00.000Z",
  gioKetThuc: "2026-08-16T09:00:00.000Z",
};

describe("cấu hình lịch demo theo bài làm", () => {
  it("giữ nguyên lịch thật khi môn không có override", () => {
    expect(apDungDemoBypassTheoBaiLam(lichThat, null)).toEqual(lichThat);
  });

  it("chuyển ca Vào thi thành Đang mở", () => {
    expect(apDungDemoBypassTheoBaiLam(lichThat, {
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
    expect(apDungDemoBypassTheoBaiLam(lichThat, {
      trang_thai: "SapDienRa",
      gio_bat_dau: "2026-08-16T13:00:00.000Z",
      gio_ket_thuc: "2026-08-16T15:00:00.000Z",
    }).trangThai).toBe("SapDienRa");
  });

  it("không làm thay đổi lịch thật nếu bài làm khác không có override", () => {
    const override = {
      trang_thai: "SapDienRa",
      gio_bat_dau: "2026-08-16T13:00:00.000Z",
      gio_ket_thuc: "2026-08-16T15:00:00.000Z",
    } as const;
    const monTuChon1 = apDungDemoBypassTheoBaiLam(lichThat, override);
    const monTuChon2 = apDungDemoBypassTheoBaiLam(lichThat, null);

    expect(monTuChon1.trangThai).toBe("SapDienRa");
    expect(monTuChon2).toEqual(lichThat);
  });
});
