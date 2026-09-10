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

  // Báo cáo là điểm vào chung sau khi đăng nhập cho các vai trò quản lý.
  switch (session.vai_tro) {
    case "Admin":
      redirect("/bao-cao");
    case "GiaoVien": {
      // Tổ trưởng vẫn dùng vai trò GiaoVien, nên xác định theo bổ nhiệm môn.
      const supabase = taoSupabaseServiceRole();
      const { data: monQuanLy } = await supabase
        .from("mon")
        .select("mon_id")
        .eq("to_truong_tai_khoan_id", session.sub)
        .limit(1)
        .maybeSingle();
      redirect(monQuanLy ? "/bao-cao-mon" : "/bao-cao-lop");
    }
    case "HocSinh":
      redirect("/ky-thi");
    default:
      redirect("/dang-nhap");
  }
}
