"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export async function danhDauThongBaoDaDoc(thongBaoId: string) {
  const session = await laySessionHienHanh();
  if (!session) return { success: false };
  const id = z.string().uuid().safeParse(thongBaoId);
  if (!id.success) return { success: false };
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("thong_bao_noi_bo").update({ da_doc: true, read_at: new Date().toISOString() })
    .eq("id", id.data).eq("nguoi_nhan_tai_khoan_id", session.sub);
  if (error) return { success: false };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function danhDauTatCaThongBaoDaDoc() {
  const session = await laySessionHienHanh();
  if (!session) return { success: false };
  const supabase = taoSupabaseServiceRole();
  const { error } = await supabase.from("thong_bao_noi_bo").update({ da_doc: true, read_at: new Date().toISOString() })
    .eq("nguoi_nhan_tai_khoan_id", session.sub).eq("da_doc", false);
  if (error) return { success: false };
  revalidatePath("/", "layout");
  return { success: true };
}
