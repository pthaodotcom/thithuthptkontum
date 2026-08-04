import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import KhungGioClient from "./KhungGioClient";

export const dynamic = "force-dynamic";

export default async function KhungGioPage() {
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase
    .from("khung_gio_chuan")
    .select("*")
    .order("so_thu_tu_ca");

  if (error) console.error("Lỗi lấy khung giờ:", error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý khung giờ ca thi</h1>
        <p className="text-muted-foreground text-sm mt-1">4 ca thi cố định: Ngày 1 (Sáng/Chiều), Ngày 2 (Sáng/Chiều). Bấm vào ô để chỉnh sửa.</p>
      </div>
      <KhungGioClient initialData={data || []} />
    </div>
  );
}
