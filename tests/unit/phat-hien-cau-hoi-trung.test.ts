import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { phatHienCauHoiTrung } from "@/lib/cau-hoi/trung-lap";
import { taoDauVanCauHoi } from "@/lib/rules/cau-hoi-trung";
import type { DuLieuCauHoi } from "@/lib/rules/cau-hoi";

const cau = (noiDung: string): DuLieuCauHoi => ({
  phan: "I",
  baiHocId: "11111111-1111-4111-8111-111111111111",
  mucDoId: "22222222-2222-4222-8222-222222222222",
  noiDung,
  chiTiet: ["1", "2", "3", "4"].map((value, index) => ({ noiDung: value, laDapAnDung: index === 0 })),
  dapAnPhan3: null,
});

function supabaseTraVe(data: Record<string, unknown>[]) {
  return { rpc: async () => ({ data, error: null }) } as unknown as SupabaseClient;
}

const rowBase = {
  cau_hoi_id: "33333333-3333-4333-8333-333333333333",
  noi_dung: "Câu hỏi đã có",
  phan: "I",
  nhom_id: null,
  ten_chuyen_de: "Đại số",
  ten_bai_hoc: "Phương trình",
};

describe("phân loại gợi ý câu hỏi trùng", () => {
  it("ưu tiên trùng chính xác", async () => {
    const input = cau("Giải phương trình 2x + 3 = 7");
    const result = await phatHienCauHoiTrung(supabaseTraVe([{ ...rowBase, trung_hash: true, cung_mau_chinh_xac: true, chu_ky_so: taoDauVanCauHoi(input).chuKySo, do_tuong_dong: 1, do_tuong_dong_mau: 1 }]), "mon", input);
    expect(result.goiY[0]?.loai).toBe("TrungChinhXac");
  });

  it("phân biệt cùng mẫu nhưng khác số", async () => {
    const input = cau("Giải phương trình 2x + 3 = 7");
    const bienThe = taoDauVanCauHoi(cau("Giải phương trình 4x + 5 = 13"));
    const result = await phatHienCauHoiTrung(supabaseTraVe([{ ...rowBase, trung_hash: false, cung_mau_chinh_xac: true, chu_ky_so: bienThe.chuKySo, do_tuong_dong: 0.91, do_tuong_dong_mau: 1 }]), "mon", input);
    expect(result.goiY[0]?.loai).toBe("CungMauKhacSo");
  });

  it("chỉ cảnh báo gần giống khi vượt ngưỡng", async () => {
    const input = cau("Cho hàm số y = x^2");
    const result = await phatHienCauHoiTrung(supabaseTraVe([
      { ...rowBase, cau_hoi_id: "44444444-4444-4444-8444-444444444444", trung_hash: false, cung_mau_chinh_xac: false, chu_ky_so: "", do_tuong_dong: 0.8, do_tuong_dong_mau: 0.5 },
      { ...rowBase, cau_hoi_id: "55555555-5555-4555-8555-555555555555", trung_hash: false, cung_mau_chinh_xac: false, chu_ky_so: "", do_tuong_dong: 0.4, do_tuong_dong_mau: 0.4 },
    ]), "mon", input);
    expect(result.goiY.map((item) => item.loai)).toEqual(["GanGiongNoiDung"]);
  });
});
