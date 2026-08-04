import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Clock,
  Users,
  UserCog,
  UserRoundCheck,
  ClipboardList,
  GraduationCap,
  ScrollText,
  BarChart3,
  Mail,
  CalendarDays,
  MonitorCheck,
  UserRoundSearch,
} from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
  {
    label: "Danh mục",
    items: [
      { href: "/mon-hoc", label: "Môn học", icon: BookOpen },
      { href: "/khung-gio", label: "Khung giờ chuẩn", icon: Clock },
      { href: "/lop-hoc", label: "Quản lý lớp", icon: Users },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { href: "/tai-khoan", label: "Tất cả tài khoản", icon: Users },
      { href: "/tai-khoan?loai=HocSinh", label: "Quản lý học sinh", icon: GraduationCap },
      { href: "/tai-khoan?loai=GiaoVien", label: "Quản lý giáo viên", icon: UserCog },
      { href: "/to-truong-bo-mon", label: "Bổ nhiệm tổ trưởng", icon: UserRoundCheck },
      { href: "/phan-cong-giang-day", label: "Phân công dạy", icon: ClipboardList },
    ],
  },
  {
    label: "Kỳ thi",
    items: [
      { href: "/dot-thi", label: "Quản lý đợt thi", icon: CalendarDays },
      { href: "/giam-sat-ca-thi", label: "Giám sát ca thi", icon: MonitorCheck },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ href: "/audit-log", label: "Nhật ký kiểm toán", icon: ScrollText }],
  },
  {
    label: "Kết quả",
    items: [
      { href: "/bao-cao", label: "Báo cáo", icon: BarChart3 },
      { href: "/bao-cao-hoc-sinh", label: "Nhật ký báo cáo", icon: UserRoundSearch },
      { href: "/thong-bao-email", label: "Nhật ký email", icon: Mail },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    redirect("/dang-nhap");
  }

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub="Admin Panel"
      navGroups={navGroups}
      userId={session.sub}
      userName="Admin"
      userRole="Quản trị viên"
    >
      {children}
    </DashboardShell>
  );
}
