import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, CalendarDays, Repeat, TrendingUp } from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";

const navGroups: DashboardNavGroup[] = [
  {
    items: [
      { href: "/ky-thi", label: "Kỳ thi", icon: CalendarDays },
      { href: "/ket-qua", label: "Kết quả", icon: BarChart3 },
      { href: "/bao-cao-nang-luc", label: "Báo cáo năng lực", icon: TrendingUp },
      { href: "/ho-so/doi-mon-tu-chon", label: "Đổi môn tự chọn", icon: Repeat },
    ],
  },
];

export default async function HocSinhLayout({ children }: { children: ReactNode }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("ho_ten, lop:lop_id(ten_lop)")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();
  const lop = Array.isArray(taiKhoan?.lop) ? taiKhoan.lop[0] : taiKhoan?.lop;

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub="Học sinh"
      navGroups={navGroups}
      userId={session.sub}
      userName={taiKhoan?.ho_ten ?? "Học sinh"}
      userRole={lop?.ten_lop ? `Lớp ${lop.ten_lop}` : "Học sinh"}
    >
      {children}
    </DashboardShell>
  );
}
