import type { ThongBaoItem } from "@/components/dashboard/notification-menu";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export async function layThongBaoDashboard(userId: string): Promise<ThongBaoItem[]> {
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase
    .from("thong_bao_noi_bo")
    .select("id,tieu_de,noi_dung,duong_dan,da_doc,created_at")
    .eq("nguoi_nhan_tai_khoan_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.warn(`[dashboard] Không thể tải thông báo (${error.code || "UNKNOWN"}): ${error.message}`);
    return [];
  }

  return (data || []) as ThongBaoItem[];
}
