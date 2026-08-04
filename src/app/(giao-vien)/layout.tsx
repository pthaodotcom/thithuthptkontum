import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, FilePenLine, MessageSquareWarning } from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
  {
    items: [
      { href: "/soan-cau-hoi", label: "Soạn câu hỏi", icon: FilePenLine },
      { href: "/ngan-hang-cau-hoi-mon", label: "Ngân hàng câu hỏi", icon: BookOpen },
      { href: "/yeu-cau-chinh-sua", label: "Yêu cầu chỉnh sửa", icon: MessageSquareWarning },
      { href: "/bao-cao-lop", label: "Báo cáo lớp", icon: BarChart3 },
    ],
  },
];

export default async function GiaoVienLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub="Giáo viên"
      navGroups={navGroups}
      userId={session.sub}
      userName="Giáo viên"
      userRole="Giáo viên bộ môn"
    >
      {children}
    </DashboardShell>
  );
}
