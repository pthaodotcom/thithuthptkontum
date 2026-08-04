import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import LopHocClient from "./LopHocClient";

export const dynamic = "force-dynamic";

export default async function LopHocPage() {
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase
    .from("lop")
    .select("*")
    .order("khoi")
    .order("ten_lop");

  if (error) console.error("Lỗi lấy lớp học:", error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý Lớp học</h1>
        <p className="text-muted-foreground text-sm mt-1">Danh sách lớp học theo khối. Sĩ số tự động tính từ tài khoản học sinh.</p>
      </div>
      <LopHocClient initialData={data || []} />
    </div>
  );
}
