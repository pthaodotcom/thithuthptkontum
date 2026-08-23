import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, FilePenLine, Files, MessageSquareWarning } from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
  {
    items: [
      { href: "/soan-cau-hoi", label: "Soạn câu hỏi", icon: FilePenLine },
      { href: "/ngan-hang-cau-hoi-mon", label: "Ngân hàng câu hỏi", icon: BookOpen },
      { href: "/yeu-cau-chinh-sua", label: "Yêu cầu chỉnh sửa", icon: MessageSquareWarning },
      { href: "/de-thi", label: "Đề thi", icon: Files },
      { href: "/bao-cao-lop", label: "Báo cáo lớp", icon: BarChart3 },
    ],
  },
];

export default async function GiaoVienLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("ho_ten, mon:mon_id(ten_mon)")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();
  const mon = Array.isArray(taiKhoan?.mon) ? taiKhoan.mon[0] : taiKhoan?.mon;

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub="Giáo viên"
      navGroups={navGroups}
      userId={session.sub}
      userName={taiKhoan?.ho_ten ?? "Giáo viên"}
      userRole={mon?.ten_mon ? `Giáo viên môn ${mon.ten_mon}` : "Giáo viên bộ môn"}
    >
      {children}
    </DashboardShell>
  );
}
