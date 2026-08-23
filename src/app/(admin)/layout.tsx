import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Clock,
  Users,
  UserCog,
  UserRoundCheck,
  GraduationCap,
  ScrollText,
  BarChart3,
  Mail,
  CalendarDays,
  DoorOpen,
  ShieldAlert,
  UserRoundSearch,
} from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { demoBypassDangBat } from "@/lib/demo/bypass";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
  {
    label: "Danh mục",
    items: [
      { href: "/mon-hoc", label: "Môn học", icon: BookOpen },
      { href: "/khung-gio", label: "Quản lý khung giờ ca thi", icon: Clock },
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
    ],
  },
  {
    label: "Kỳ thi",
    items: [
      { href: "/dot-thi", label: "Quản lý đợt thi", icon: CalendarDays },
      { href: "/quan-ly-vi-pham", label: "Quản lý vi phạm", icon: ShieldAlert },
    ],
  },
  {
    label: "Hệ thống",
      items: [{ href: "/audit-log", label: "Lịch sử thay đổi", icon: ScrollText }],
  },
  {
    label: "Kết quả",
    items: [
      { href: "/bao-cao", label: "Báo cáo", icon: BarChart3 },
      { href: "/bao-cao-hoc-sinh", label: "Nhật ký báo cáo", icon: UserRoundSearch },
      { href: "/thong-bao-email", label: "Nhật ký email", icon: Mail },
    ],
  },
  ...(demoBypassDangBat()
    ? [{
        label: "Công cụ demo",
        items: [{ href: "/mo-thi-ngay", label: "Thiết lập lịch demo", icon: DoorOpen }],
      }]
    : []),
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    redirect("/dang-nhap");
  }
  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("ho_ten")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub="Quản trị viên"
      navGroups={navGroups}
      userId={session.sub}
      userName={taiKhoan?.ho_ten ?? "Quản trị viên"}
      userRole="Quản trị viên"
    >
      {children}
    </DashboardShell>
  );
}
