"use server";

import { revalidatePath } from "next/cache";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export async function thuLaiEmail(baiLamId: string) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") throw new Error("Không có quyền");
  const supabase = taoSupabaseServiceRole();
  const { data: emailLog, error: logError } = await supabase.from("email_log").update({
    trang_thai: "ChoGui", ma_loi: null, chi_tiet_loi: null,
  }).eq("bai_lam_id", baiLamId)
    .in("trang_thai", ["ThatBaiTamThoi", "CanXuLyThuCong"])
    .select("bai_lam_id")
    .maybeSingle();
  if (logError) throw new Error("Chưa thể chuẩn bị gửi lại email. Vui lòng thử lại.");
  if (!emailLog) throw new Error("Email này không cần gửi lại hoặc đang được xử lý.");
  const { error } = await supabase.from("job_hang_doi").insert({
    loai_job: "gui_email", tham_chieu_id: baiLamId,
    khoa_idempotency: `email-manual:${baiLamId}:${Date.now()}`,
  });
  if (error) throw new Error("Chưa thể gửi lại email lúc này. Vui lòng thử lại sau.");
  revalidatePath("/thong-bao-email");
}
