import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, FileCheck2, Files, LayoutList } from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

export default async function ToTruongLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase
    .from("mon")
    .select("ten_mon")
    .eq("to_truong_tai_khoan_id", session.sub)
    .maybeSingle();
  if (!mon) redirect("/soan-cau-hoi");

  const navGroups: DashboardNavGroup[] = [
    {
      items: [
        { href: "/khung-chuyen-de", label: "Khung chuyên đề", icon: LayoutList },
        { href: "/duyet-cau-hoi", label: "Duyệt câu hỏi", icon: FileCheck2 },
        { href: "/ngan-hang-cau-hoi", label: "Ngân hàng câu hỏi", icon: BookOpen },
        { href: "/de-thi", label: "Đề thi", icon: Files },
        { href: "/bao-cao-mon", label: "Báo cáo môn", icon: BarChart3 },
      ],
    },
  ];

  return (
    <DashboardShell
      brandLabel="Tổ trưởng bộ môn"
      brandSub={`Môn ${mon.ten_mon}`}
      navGroups={navGroups}
      userId={session.sub}
      userName="Tổ trưởng"
      userRole={`Môn ${mon.ten_mon}`}
    >
      {children}
    </DashboardShell>
  );
}
