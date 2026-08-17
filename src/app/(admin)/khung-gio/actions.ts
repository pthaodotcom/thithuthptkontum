"use server";

import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function capNhatKhungGio(
  so_thu_tu_ca: number,
  gio_bat_dau: string,
  thoi_luong_phut: number
) {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase
    .from("khung_gio_chuan")
    .upsert({ so_thu_tu_ca, gio_bat_dau, thoi_luong_phut }, { onConflict: "so_thu_tu_ca" });

  if (error) {
    return { success: false, error: "Chưa lưu được khung giờ. Vui lòng kiểm tra thông tin và thử lại." };
  }
  revalidatePath("/khung-gio");
  return { success: true };
}
