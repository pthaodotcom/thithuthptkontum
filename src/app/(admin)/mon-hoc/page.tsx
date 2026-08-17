import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import MonHocClient from "./MonHocClient";

export const dynamic = "force-dynamic";

export default async function MonHocPage() {
  const supabase = taoSupabaseServiceRole();
  
  // Fetch danh sách môn học
  const { data: dsMon, error } = await supabase
    .from("mon")
    .select(`
      *,
      to_truong:tai_khoan!fk_mon_to_truong(ho_ten)
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Lỗi khi lấy danh sách môn:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý Môn học</h1>
      <p className="text-muted-foreground text-sm mt-1">Thêm môn học, chọn loại môn và thiết lập cách tính điểm.</p>
        </div>
      </div>
      <MonHocClient initialData={dsMon || []} />
    </div>
  );
}
