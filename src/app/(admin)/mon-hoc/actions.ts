"use server";

import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateBaremMon } from "@/lib/rules/barem";

const CAC_COT_BAREM = ["phan1_so_cau", "phan1_diem_moi_cau", "phan2_so_cau", "phan2_diem_1y", "phan2_diem_2y", "phan2_diem_3y", "phan2_diem_4y", "phan3_so_cau", "phan3_diem_moi_cau"] as const;

function chuanHoaBarem(barem: any) {
  const payload: any = {};
  for (const k of CAC_COT_BAREM) {
    payload[k] = barem[k] === "" || barem[k] == null ? null : Number(barem[k]);
  }
  return payload;
}

function loiFriendlyTuDb(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Tên môn hoặc thứ tự ca bắt buộc đã được dùng bởi môn khác đang hoạt động.";
  }
  return error.message;
}

export async function taoMonHoc(data: any) {
  const supabase = taoSupabaseServiceRole();
  const { ten_mon, loai_mon, thu_tu_ca_bat_buoc, ...barem } = data;

  const payloadBarem = chuanHoaBarem(barem);
  const ketQua = validateBaremMon({
    phan1SoCau: payloadBarem.phan1_so_cau,
    phan1DiemMoiCau: payloadBarem.phan1_diem_moi_cau,
    phan2SoCau: payloadBarem.phan2_so_cau,
    phan2Diem1Y: payloadBarem.phan2_diem_1y,
    phan2Diem2Y: payloadBarem.phan2_diem_2y,
    phan2Diem3Y: payloadBarem.phan2_diem_3y,
    phan2Diem4Y: payloadBarem.phan2_diem_4y,
    phan3SoCau: payloadBarem.phan3_so_cau,
    phan3DiemMoiCau: payloadBarem.phan3_diem_moi_cau,
  });
  if (!ketQua.hopLe) {
    return { success: false, error: ketQua.loi.join("; ") };
  }

  const payload: any = {
    ten_mon,
    loai_mon,
    thu_tu_ca_bat_buoc: loai_mon === "BatBuoc" ? (thu_tu_ca_bat_buoc || null) : null,
    ...payloadBarem,
  };

  const { error } = await supabase.from("mon").insert([payload]);

  if (error) {
    return { success: false, error: loiFriendlyTuDb(error) };
  }

  revalidatePath("/mon-hoc");
  return { success: true };
}

export async function capNhatMonHoc(mon_id: string, data: any) {
  const supabase = taoSupabaseServiceRole();
  const { ten_mon, loai_mon, thu_tu_ca_bat_buoc, ...barem } = data;

  const payloadBarem = chuanHoaBarem(barem);
  const ketQua = validateBaremMon({
    phan1SoCau: payloadBarem.phan1_so_cau,
    phan1DiemMoiCau: payloadBarem.phan1_diem_moi_cau,
    phan2SoCau: payloadBarem.phan2_so_cau,
    phan2Diem1Y: payloadBarem.phan2_diem_1y,
    phan2Diem2Y: payloadBarem.phan2_diem_2y,
    phan2Diem3Y: payloadBarem.phan2_diem_3y,
    phan2Diem4Y: payloadBarem.phan2_diem_4y,
    phan3SoCau: payloadBarem.phan3_so_cau,
    phan3DiemMoiCau: payloadBarem.phan3_diem_moi_cau,
  });
  if (!ketQua.hopLe) {
    return { success: false, error: ketQua.loi.join("; ") };
  }

  const payload: any = {
    ten_mon,
    loai_mon,
    thu_tu_ca_bat_buoc: loai_mon === "BatBuoc" ? (thu_tu_ca_bat_buoc || null) : null,
    ...payloadBarem,
  };

  const { error } = await supabase.from("mon").update(payload).eq("mon_id", mon_id);

  if (error) {
    return { success: false, error: loiFriendlyTuDb(error) };
  }

  revalidatePath("/mon-hoc");
  return { success: true };
}

export async function xoaMonHoc(mon_id: string) {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("mon").delete().eq("mon_id", mon_id);
  if (error) return {
    success: false,
    error: error.code === "23503"
      ? "Không thể xóa môn đã có dữ liệu liên quan."
      : error.message,
  };
  revalidatePath("/mon-hoc");
  return { success: true };
}

export async function doiTrangThaiMon(mon_id: string, trang_thai: "DangDung" | "NgungDung") {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("mon").update({ trang_thai }).eq("mon_id", mon_id);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/mon-hoc");
  return { success: true };
}
