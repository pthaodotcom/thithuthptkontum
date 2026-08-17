import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BadgeInfo,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { DashboardShell, type DashboardNavGroup } from "@/components/dashboard/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ChinhSuaThongTinCaNhan } from "./ChinhSuaThongTinCaNhan";

export const dynamic = "force-dynamic";

type Relation<T> = T | T[] | null;

function motQuanHe<T>(value: Relation<T> | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function dinhDangNgay(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function dinhDangNgaySinh(value: string | null | undefined, namSinh: number | null | undefined) {
  if (!value) return namSinh ? `Năm ${namSinh}` : "Chưa cập nhật";
  const [nam, thang, ngay] = value.split("-");
  if (!nam || !thang || !ngay) return namSinh ? `Năm ${namSinh}` : "Chưa cập nhật";
  return `${ngay}/${thang}/${nam}`;
}

function dinhDangGioiTinh(value: string | null | undefined) {
  if (value === "Nam") return "Nam";
  if (value === "Nu") return "Nữ";
  if (value === "Khac") return "Khác";
  return "Chưa cập nhật";
}

function dongThongTin({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border/70 py-4 last:border-b-0 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
      <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="break-words text-sm font-semibold text-foreground sm:text-right">{value}</dd>
    </div>
  );
}

export default async function ThongTinTaiKhoanPage() {
  const session = await laySessionHienHanh();
  if (!session) redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const [{ data: taiKhoan }, { data: lopGiangDay }, { data: monToTruong }] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select(
        "ma_so,ho_ten,vai_tro,trang_thai,nam_sinh,ngay_sinh,gioi_tinh,email_ca_nhan,so_dien_thoai,dia_chi,sdt_zalo_phu_huynh,email_phu_huynh,created_at,lop:lop_id(ten_lop,khoi),mon:mon_id(ten_mon),monTuChon1:mon_tu_chon_1_id(ten_mon),monTuChon2:mon_tu_chon_2_id(ten_mon)"
      )
      .eq("tai_khoan_id", session.sub)
      .maybeSingle(),
    session.vai_tro === "GiaoVien"
      ? supabase
          .from("phan_cong_giang_day")
          .select("lop:lop_id(ten_lop,khoi)")
          .eq("giao_vien_tai_khoan_id", session.sub)
      : Promise.resolve({ data: [] }),
    session.vai_tro === "GiaoVien"
      ? supabase
          .from("mon")
          .select("ten_mon")
          .eq("to_truong_tai_khoan_id", session.sub)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!taiKhoan) redirect("/dang-nhap");

  const lop = motQuanHe(taiKhoan.lop);
  const mon = motQuanHe(taiKhoan.mon);
  const monTuChon1 = motQuanHe(taiKhoan.monTuChon1);
  const monTuChon2 = motQuanHe(taiKhoan.monTuChon2);
  const cacLopGiangDay = (lopGiangDay ?? [])
    .map((item) => motQuanHe(item.lop))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.ten_lop)
    .sort((a, b) => a.localeCompare(b, "vi"));

  const laToTruong = Boolean(monToTruong?.ten_mon);
  const vaiTroHienThi =
    session.vai_tro === "Admin"
      ? "Quản trị viên"
      : session.vai_tro === "HocSinh"
        ? "Học sinh"
        : laToTruong
          ? `Tổ trưởng môn ${monToTruong?.ten_mon}`
          : "Giáo viên";
  const trangChu =
    session.vai_tro === "Admin"
      ? "/mon-hoc"
      : session.vai_tro === "HocSinh"
        ? "/ky-thi"
        : laToTruong
          ? "/khung-chuyen-de"
          : "/soan-cau-hoi";
  const navGroups: DashboardNavGroup[] = [
    {
      label: "Tài khoản cá nhân",
      items: [
        { href: trangChu, label: "Khu vực làm việc", icon: LayoutDashboard },
        { href: "/thong-tin-tai-khoan", label: "Thông tin tài khoản", icon: UserRound },
      ],
    },
  ];
  const initial = taiKhoan.ho_ten.trim().charAt(0).toUpperCase() || "?";
  const dangHoatDong = taiKhoan.trang_thai === "HoatDong";

  return (
    <DashboardShell
      brandLabel="Thi thử THPT"
      brandSub={vaiTroHienThi}
      navGroups={navGroups}
      userId={session.sub}
      userName={taiKhoan.ho_ten}
      userRole={vaiTroHienThi}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm" aria-hidden="true">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-accent">Tài khoản cá nhân</p>
                <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {taiKhoan.ho_ten}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{taiKhoan.ma_so}</span>
                  <span aria-hidden="true">·</span>
                  <span>{vaiTroHienThi}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              <span
                className={cn(
                  "inline-flex min-h-9 w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
                  dangHoatDong
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {dangHoatDong ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                {dangHoatDong ? "Đang hoạt động" : "Đã đình chỉ"}
              </span>
              <ChinhSuaThongTinCaNhan
                laHocSinh={session.vai_tro === "HocSinh"}
                sdtZaloPhuHuynh={taiKhoan.sdt_zalo_phu_huynh || ""}
                emailPhuHuynh={taiKhoan.email_phu_huynh || ""}
                initialData={{
                  ho_ten: taiKhoan.ho_ten,
                  nam_sinh: taiKhoan.nam_sinh ?? "",
                  ngay_sinh: taiKhoan.ngay_sinh || "",
                  gioi_tinh: (taiKhoan.gioi_tinh || "") as "Nam" | "Nu" | "Khac" | "",
                  email_ca_nhan: taiKhoan.email_ca_nhan || "",
                  so_dien_thoai: taiKhoan.so_dien_thoai || "",
                  dia_chi: taiKhoan.dia_chi || "",
                }}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <section aria-labelledby="thong-tin-co-ban" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="thong-tin-co-ban" className="text-lg font-bold text-foreground">Thông tin cơ bản</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Thông tin định danh và liên hệ của bạn.</p>
              </div>
            </div>
            <dl className="mt-4">
              {dongThongTin({ icon: UserRound, label: "Họ và tên", value: taiKhoan.ho_ten })}
              {dongThongTin({ icon: ShieldCheck, label: "Mã đăng nhập", value: taiKhoan.ma_so })}
              {dongThongTin({ icon: Users, label: "Vai trò", value: vaiTroHienThi })}
              {dongThongTin({
                icon: CalendarDays,
                label: "Ngày sinh",
                value: dinhDangNgaySinh(taiKhoan.ngay_sinh, taiKhoan.nam_sinh),
              })}
              {dongThongTin({ icon: BadgeInfo, label: "Giới tính", value: dinhDangGioiTinh(taiKhoan.gioi_tinh) })}
              {dongThongTin({ icon: Mail, label: "Email cá nhân", value: taiKhoan.email_ca_nhan || "Chưa cập nhật" })}
              {dongThongTin({ icon: Phone, label: "Số điện thoại", value: taiKhoan.so_dien_thoai || "Chưa cập nhật" })}
              {dongThongTin({ icon: MapPin, label: "Địa chỉ", value: taiKhoan.dia_chi || "Chưa cập nhật" })}
              {dongThongTin({ icon: CalendarDays, label: "Ngày tạo tài khoản", value: dinhDangNgay(taiKhoan.created_at) })}
            </dl>
          </section>

          <div className="space-y-6">
            <section aria-labelledby="thong-tin-vai-tro" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  {session.vai_tro === "HocSinh" ? <GraduationCap className="h-5 w-5" aria-hidden="true" /> : <BookOpen className="h-5 w-5" aria-hidden="true" />}
                </span>
                <h2 id="thong-tin-vai-tro" className="text-lg font-bold text-foreground">
                  {session.vai_tro === "HocSinh" ? "Thông tin học tập" : "Thông tin công tác"}
                </h2>
              </div>

              {session.vai_tro === "HocSinh" ? (
                <dl className="mt-4">
                  {dongThongTin({
                    icon: Users,
                    label: "Lớp",
                    value: lop?.ten_lop ? `${lop.ten_lop} · Khối ${lop.khoi}` : "Chưa phân lớp",
                  })}
                  {dongThongTin({
                    icon: Mail,
                    label: "Môn tự chọn",
                    value: [monTuChon1?.ten_mon, monTuChon2?.ten_mon].filter(Boolean).join(", ") || "Chưa chọn",
                  })}
                  {dongThongTin({
                    icon: Phone,
                    label: "SĐT Zalo phụ huynh",
                    value: taiKhoan.sdt_zalo_phu_huynh || "Chưa cập nhật",
                  })}
                  {dongThongTin({
                    icon: BookOpen,
                    label: "Email phụ huynh",
                    value: taiKhoan.email_phu_huynh || "Chưa cập nhật",
                  })}
                </dl>
              ) : session.vai_tro === "GiaoVien" ? (
                <dl className="mt-4">
                  {dongThongTin({ icon: BookOpen, label: "Môn phụ trách", value: mon?.ten_mon || "Chưa phân công" })}
                  {dongThongTin({
                    icon: Users,
                    label: "Lớp giảng dạy",
                    value: cacLopGiangDay.join(", ") || "Chưa phân công",
                  })}
                </dl>
              ) : (
                <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">
                  Tài khoản này dùng để quản lý người dùng, môn học, lớp học và các đợt thi được giao.
                </p>
              )}
            </section>

            <section aria-labelledby="bao-mat-tai-khoan" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="bao-mat-tai-khoan" className="text-lg font-bold text-foreground">Bảo mật tài khoản</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Nên đổi mật khẩu định kỳ và không chia sẻ mật khẩu cho người khác.</p>
                </div>
              </div>
              <Link href="/doi-mat-khau" className={cn(buttonVariants({ variant: "outline" }), "mt-5 min-h-11 w-full cursor-pointer") }>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Đổi mật khẩu
              </Link>
            </section>
          </div>
        </div>

        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {session.vai_tro === "HocSinh"
            ? "Bạn có thể tự cập nhật hồ sơ cá nhân. SĐT và email phụ huynh, mã đăng nhập, vai trò, lớp và môn tự chọn do quản trị viên hoặc chức năng chuyên trách quản lý."
            : "Bạn có thể tự cập nhật hồ sơ cá nhân. Mã đăng nhập, vai trò, môn và phân công do quản trị viên quản lý."}
        </p>
      </div>
    </DashboardShell>
  );
}
