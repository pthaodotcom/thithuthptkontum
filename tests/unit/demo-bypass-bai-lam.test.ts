import { afterEach, describe, expect, it } from "vitest";

import { demoBypassDangBat, phanLoaiBaiLamKetThucDemo } from "@/lib/demo/bypass";

const cu = process.env.DEMO_BYPASS_ENABLED;
afterEach(() => { process.env.DEMO_BYPASS_ENABLED = cu; });

describe("cờ bật bypass demo", () => {
  it("chỉ bật khi giá trị là true", () => {
    process.env.DEMO_BYPASS_ENABLED = "true";
    expect(demoBypassDangBat()).toBe(true);
    process.env.DEMO_BYPASS_ENABLED = "false";
    expect(demoBypassDangBat()).toBe(false);
  });
});
describe("phân loại bài làm khi kết thúc lượt demo", () => {
  it("lọc chính xác bài đã nộp có điểm để xử lý và tách bài chưa nộp để gỡ", () => {
    const danhSach = [
      { bai_lam_id: "bai-1", trang_thai: "DaNopBai", diem_tong: 8.5 },
      { bai_lam_id: "bai-2", trang_thai: "DangThi", diem_tong: null },
      { bai_lam_id: "bai-3", trang_thai: "ChuaDangNhap", diem_tong: null },
      { bai_lam_id: "bai-4", trang_thai: "DaNopBai", diem_tong: 7.0 },
      { bai_lam_id: "bai-5", trang_thai: "DaNopBai", diem_tong: null }, // chưa chấm xong
    ];

    const { idsDuocXuLy, idsChuaNop } = phanLoaiBaiLamKetThucDemo(danhSach);

    expect(idsDuocXuLy).toEqual(["bai-1", "bai-4"]);
    expect(idsChuaNop).toEqual(["bai-2", "bai-3", "bai-5"]);
  });

  it("trả về idsDuocXuLy rỗng khi không có học sinh nào nộp bài có điểm", () => {
    const danhSach = [
      { bai_lam_id: "bai-1", trang_thai: "DangThi", diem_tong: null },
      { bai_lam_id: "bai-2", trang_thai: "ChuaDangNhap", diem_tong: null },
    ];

    const { idsDuocXuLy, idsChuaNop } = phanLoaiBaiLamKetThucDemo(danhSach);

    expect(idsDuocXuLy).toHaveLength(0);
    expect(idsChuaNop).toEqual(["bai-1", "bai-2"]);
  });

  it("giữ nguyên toàn bộ khi tất cả học sinh đã nộp và có điểm", () => {
    const danhSach = [
      { bai_lam_id: "bai-1", trang_thai: "DaNopBai", diem_tong: 9.0 },
      { bai_lam_id: "bai-2", trang_thai: "DaNopBai", diem_tong: 6.25 },
    ];

    const { idsDuocXuLy, idsChuaNop } = phanLoaiBaiLamKetThucDemo(danhSach);

    expect(idsDuocXuLy).toEqual(["bai-1", "bai-2"]);
    expect(idsChuaNop).toHaveLength(0);
  });
});
