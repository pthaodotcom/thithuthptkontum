import type { SupabaseClient } from "@supabase/supabase-js";
import type { DuLieuCauHoi } from "@/lib/rules/cau-hoi";
import { taoDauVanCauHoi, type DauVanCauHoi } from "@/lib/rules/cau-hoi-trung";

export type LoaiGoiYTrung = "TrungChinhXac" | "CungMauKhacSo" | "GanGiongNoiDung";

export type GoiYTrung = {
  cauHoiId: string;
  noiDung: string;
  phan: string;
  nhomId: string | null;
  tenChuyenDe: string;
  tenBaiHoc: string;
  loai: LoaiGoiYTrung;
  diemTuongDong: number;
};

type DongGoiY = {
  cau_hoi_id: string;
  noi_dung: string;
  phan: string;
  nhom_id: string | null;
  ten_chuyen_de: string;
  ten_bai_hoc: string;
  trung_hash: boolean;
  cung_mau_chinh_xac: boolean;
  chu_ky_so: string;
  do_tuong_dong: number;
  do_tuong_dong_mau: number;
};

function docNguong(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
}

export const NGUONG_GAN_GIONG_NOI_DUNG = docNguong("QUESTION_TEXT_SIMILARITY_THRESHOLD", 0.72);
export const NGUONG_CUNG_MAU_CAU_HOI = docNguong("QUESTION_TEMPLATE_SIMILARITY_THRESHOLD", 0.84);

function phanLoai(row: DongGoiY, dauVan: DauVanCauHoi): { loai: LoaiGoiYTrung; diem: number } | null {
  if (row.trung_hash) return { loai: "TrungChinhXac", diem: 1 };
  if (row.chu_ky_so !== dauVan.chuKySo && (row.cung_mau_chinh_xac || row.do_tuong_dong_mau >= NGUONG_CUNG_MAU_CAU_HOI)) {
    return { loai: "CungMauKhacSo", diem: row.do_tuong_dong_mau };
  }
  if (row.do_tuong_dong >= NGUONG_GAN_GIONG_NOI_DUNG) {
    return { loai: "GanGiongNoiDung", diem: row.do_tuong_dong };
  }
  return null;
}

export async function phatHienCauHoiTrung(
  supabase: SupabaseClient,
  monId: string,
  input: DuLieuCauHoi,
  cauHoiLoaiTruId?: string,
) {
  const dauVan = taoDauVanCauHoi(input);
  const { data, error } = await supabase.rpc("tim_cau_hoi_trung", {
    p_mon_id: monId,
    p_phan: input.phan,
    p_noi_dung_chuan_hoa: dauVan.noiDungChuanHoa,
    p_mau_cau_hoi: dauVan.mauCauHoi,
    p_chu_ky_so: dauVan.chuKySo,
    p_content_hash: dauVan.contentHash,
    p_cau_hoi_loai_tru_id: cauHoiLoaiTruId || null,
    p_gioi_han: 5,
  });
  if (error) {
    return { dauVan, goiY: [] as GoiYTrung[], canhBao: "Chưa kiểm tra được câu hỏi trùng; Tổ trưởng cần kiểm tra thủ công." };
  }
  const goiY = ((data ?? []) as DongGoiY[]).flatMap((row) => {
    const ketQua = phanLoai(row, dauVan);
    if (!ketQua) return [];
    return [{
      cauHoiId: row.cau_hoi_id,
      noiDung: row.noi_dung,
      phan: row.phan,
      nhomId: row.nhom_id,
      tenChuyenDe: row.ten_chuyen_de,
      tenBaiHoc: row.ten_bai_hoc,
      loai: ketQua.loai,
      diemTuongDong: Math.max(0, Math.min(1, ketQua.diem)),
    } satisfies GoiYTrung];
  });
  return { dauVan, goiY, canhBao: undefined as string | undefined };
}

export async function luuDauVanCauHoi(
  supabase: SupabaseClient,
  cauHoiId: string,
  dauVan: DauVanCauHoi,
  sourceUpdatedAt = new Date().toISOString(),
) {
  const { error } = await supabase.from("cau_hoi_dau_van").upsert({
    cau_hoi_id: cauHoiId,
    content_hash: dauVan.contentHash,
    noi_dung_chuan_hoa: dauVan.noiDungChuanHoa,
    mau_cau_hoi: dauVan.mauCauHoi,
    chu_ky_so: dauVan.chuKySo,
    source_updated_at: sourceUpdatedAt,
  }, { onConflict: "cau_hoi_id" });
  return !error;
}

export function nhanLoaiGoiYTrung(loai: LoaiGoiYTrung) {
  return loai === "TrungChinhXac"
    ? "Trùng chính xác"
    : loai === "CungMauKhacSo"
      ? "Cùng dạng – khác số"
      : "Gần giống nội dung";
}
