"use server";

import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function taoLop(ten_lop: string, khoi: string) {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("lop").insert([{ ten_lop: ten_lop.trim(), khoi }]);
  if (error) return { success: false, error: "Chưa tạo được lớp. Vui lòng kiểm tra tên lớp và thử lại." };
  revalidatePath("/lop-hoc");
  return { success: true };
}

export async function capNhatLop(lop_id: string, ten_lop: string, khoi: string) {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase
    .from("lop")
    .update({ ten_lop: ten_lop.trim(), khoi })
    .eq("lop_id", lop_id);
  if (error) return { success: false, error: "Chưa cập nhật được lớp. Vui lòng thử lại." };
  revalidatePath("/lop-hoc");
  return { success: true };
}

export async function doiTrangThaiLop(lop_id: string, trang_thai: "HoatDong" | "NgungHoatDong") {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("lop").update({ trang_thai }).eq("lop_id", lop_id);
  if (error) return { success: false, error: "Chưa thay đổi được trạng thái lớp. Vui lòng thử lại." };
  revalidatePath("/lop-hoc");
  return { success: true };
}

export async function xoaLop(lop_id: string) {
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("lop").delete().eq("lop_id", lop_id);
  if (error) return { success: false, error: error.message.includes("LOP_DANG_CO_HOC_SINH") || error.code === "23503" ? "Không thể xóa lớp đã có học sinh hoặc kết quả thi." : "Chưa xóa được lớp. Vui lòng thử lại." };
  revalidatePath("/lop-hoc");
  return { success: true };
}
