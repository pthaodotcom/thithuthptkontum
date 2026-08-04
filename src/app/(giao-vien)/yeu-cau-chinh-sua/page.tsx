import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import RichContent from "@/components/RichContent";

export const dynamic = "force-dynamic";

export default async function YeuCauChinhSuaPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data: cauHoi } = await supabase.from("cau_hoi")
    .select("cau_hoi_id,phan,noi_dung,ly_do_duyet,updated_at,bai_hoc(ten_bai_hoc,chuyen_de(ten_chuyen_de))")
    .eq("nguoi_tao_tai_khoan_id", session.sub)
    .eq("trang_thai_duyet", "CanChinhSua")
    .order("updated_at", { ascending: false });

  return <main className="min-h-screen bg-slate-50 p-6"><div className="space-y-6">
    <header><h1 className="text-2xl font-bold">Yêu cầu chỉnh sửa</h1><p className="mt-1 text-sm text-slate-500">Các câu hỏi Tổ trưởng yêu cầu bạn chỉnh sửa và gửi lại.</p></header>
    <section className="space-y-3">
      {(cauHoi || []).map((item) => <article key={item.cau_hoi_id} className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded bg-blue-100 px-2 py-1 font-bold text-blue-700">Phần {item.phan}</span><span className="text-slate-500">{new Date(item.updated_at).toLocaleString("vi-VN")}</span></div>
        <RichContent value={item.noi_dung} className="mt-3 text-sm" />
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><b>Nội dung cần sửa:</b> {item.ly_do_duyet || "Tổ trưởng chưa ghi chú chi tiết."}</div>
        <div className="mt-4 flex justify-end"><Button nativeButton={false} render={<Link href={`/soan-cau-hoi?chinhSua=${item.cau_hoi_id}`} />}><Pencil className="mr-1.5 h-4 w-4" />Sửa câu hỏi</Button></div>
      </article>)}
      {!cauHoi?.length && <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">Hiện không có câu hỏi nào cần chỉnh sửa.</div>}
    </section>
  </div></main>;
}
