import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, FileCheck2, Files, FilePenLine, LayoutList, MessageSquareWarning } from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { layThongBaoDashboard } from "@/lib/dashboard/data";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

export default async function ToTruongLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const [{ data: taiKhoan }, notifications] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select("ho_ten, vai_tro, mon_id, mon:mon_id(mon_id,ten_mon,to_truong_tai_khoan_id)")
      .eq("tai_khoan_id", session.sub)
      .maybeSingle(),
    layThongBaoDashboard(session.sub),
  ]);
  const mon = Array.isArray(taiKhoan?.mon) ? taiKhoan.mon[0] : taiKhoan?.mon;
  if (!mon) redirect("/soan-cau-hoi");

  const laToTruong = mon.to_truong_tai_khoan_id === session.sub;

  const navGroups: DashboardNavGroup[] = laToTruong
    ? [{ items: [
        { href: "/khung-chuyen-de", label: "Khung chuyên đề", icon: LayoutList },
        { href: "/duyet-cau-hoi", label: "Duyệt câu hỏi", icon: FileCheck2 },
        { href: "/ngan-hang-cau-hoi", label: "Ngân hàng câu hỏi", icon: BookOpen },
        { href: "/de-thi", label: "Đề thi", icon: Files },
        { href: "/bao-cao-mon", label: "Báo cáo môn", icon: BarChart3 },
      ] }]
    : [{ items: [
        { href: "/soan-cau-hoi", label: "Soạn câu hỏi", icon: FilePenLine },
        { href: "/ngan-hang-cau-hoi-mon", label: "Ngân hàng câu hỏi", icon: BookOpen },
        { href: "/yeu-cau-chinh-sua", label: "Yêu cầu chỉnh sửa", icon: MessageSquareWarning },
        { href: "/de-thi", label: "Đề thi", icon: Files },
        { href: "/bao-cao-lop", label: "Báo cáo lớp", icon: BarChart3 },
      ] }];

  return (
    <DashboardShell
      brandLabel={laToTruong ? "Tổ trưởng bộ môn" : "Thi thử THPT"}
      brandSub={laToTruong ? `Môn ${mon.ten_mon}` : "Giáo viên"}
      navGroups={navGroups}
      notifications={notifications}
      userName={taiKhoan?.ho_ten ?? (laToTruong ? "Tổ trưởng" : "Giáo viên")}
      userRole={`Môn ${mon.ten_mon}`}
    >
      {children}
    </DashboardShell>
  );
}
