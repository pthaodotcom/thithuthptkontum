import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

// Trang chủ: kiểm tra session và redirect đúng màn hình theo vai trò
export default async function Home() {
  const session = await laySessionHienHanh();

  if (!session) {
    redirect("/dang-nhap");
  }

  if (session.phai_doi_mat_khau) {
    redirect("/doi-mat-khau");
  }

  // Redirect theo vai trò
  switch (session.vai_tro) {
    case "Admin":
      redirect("/mon-hoc");
    case "GiaoVien":
      const supabase = taoSupabaseServiceRole();
      const { data: monQuanLy } = await supabase
        .from("mon")
        .select("mon_id")
        .eq("to_truong_tai_khoan_id", session.sub)
        .maybeSingle();
      redirect(monQuanLy ? "/khung-chuyen-de" : "/soan-cau-hoi");
    case "HocSinh":
      redirect("/ky-thi");
    default:
      redirect("/dang-nhap");
  }
}
