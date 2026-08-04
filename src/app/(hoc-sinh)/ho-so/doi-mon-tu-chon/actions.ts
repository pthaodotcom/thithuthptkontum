"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const schema = z.object({
  dotThiId: z.string().uuid(),
  viTri: z.enum(["TC1", "TC2"]),
  monMoiId: z.string().uuid(),
});

const loi: Record<string, string> = {
  DA_QUA_HAN_DOI_MON:
    "Cửa sổ đổi môn tự chọn cho đợt thi này đã đóng.",
  DA_DU_HAI_LAN_DOI_MON:
    "Bạn đã dùng hết 2 lần đổi được phép cho vị trí môn này trong đợt thi.",
  HAI_MON_TU_CHON_PHAI_KHAC_NHAU:
    "Tự chọn 1 và Tự chọn 2 phải là hai môn khác nhau.",
  MON_MOI_TRUNG_MON_HIEN_TAI:
    "Môn mới đang là lựa chọn hiện tại.",
  MON_TU_CHON_KHONG_HOP_LE:
    "Môn tự chọn không hợp lệ hoặc đã ngừng dùng.",
  HOC_SINH_KHONG_THUOC_DOT_THI:
    "Bạn không thuộc phạm vi của đợt thi này.",
  KHONG_TIM_THAY_CA_SANG_NGAY_2:
    "Đợt thi chưa có đủ lịch thi Ngày 2.",
};

export async function doiMonTuChon(input: z.input<typeof schema>) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") {
    return { success: false as const, error: "Không có quyền đổi môn" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Dữ liệu không hợp lệ" };
  }

  const { data, error } = await taoSupabaseServiceRole().rpc("doi_mon_tu_chon", {
    p_hoc_sinh_id: session.sub,
    p_dot_thi_id: parsed.data.dotThiId,
    p_vi_tri: parsed.data.viTri,
    p_mon_moi_id: parsed.data.monMoiId,
  });

  if (error) {
    const code = Object.keys(loi).find((item) => error.message.includes(item));
    return {
      success: false as const,
      error: code ? loi[code] : "Không thể đổi môn tự chọn",
    };
  }

  const ketQua = Array.isArray(data) ? data[0] : data;
  revalidatePath("/ho-so/doi-mon-tu-chon");
  return {
    success: true as const,
    monMoiChuaCoDe: Boolean(ketQua?.mon_moi_chua_co_de),
    daGiuLichSuMonCu: Boolean(ketQua?.da_giu_lich_su_mon_cu),
    monCuDaCoDe: Boolean(ketQua?.mon_cu_da_co_de),
    soLanDaDoi: Number(ketQua?.so_lan_da_doi ?? 0),
  };
}
