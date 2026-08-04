import type { ReactNode } from "react";
import { GraduationCap, ShieldCheck, Timer, ClipboardCheck } from "lucide-react";

const diemNhan = [
  { icon: Timer, text: "Đồng hồ thi tự động, không bù giờ" },
  { icon: ShieldCheck, text: "Giám sát ca thi theo thời gian thực" },
  { icon: ClipboardCheck, text: "Chấm và tổng hợp kết quả tức thì" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Bảng thương hiệu — chỉ hiện trên màn hình rộng */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-primary px-12 py-12 text-primary-foreground lg:flex xl:px-16 xl:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-gold/30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border border-primary-foreground/10"
          aria-hidden
        />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-gold-foreground shadow-lg shadow-black/10">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Thi thử THPT</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gold">Nền tảng số cho nhà trường</p>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-[2.7rem]">
            Nền tảng thi thử trực tuyến cho toàn trường
          </h1>
          <p className="mt-5 text-[15px] leading-7 text-primary-foreground/70">
            Quản lý đợt thi, ngân hàng câu hỏi và kết quả học sinh trong một hệ thống thống nhất.
          </p>

          <ul className="mt-10 space-y-4">
            {diemNhan.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium text-primary-foreground/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/10">
                  <Icon className="h-4 w-4 text-gold" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Hệ thống Thi thử Trực tuyến cấp Trường THPT
        </p>
      </div>

      {/* Vùng form */}
      <div className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-9 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4.5 w-4.5" />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Thi thử THPT
            </span>
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">Chào mừng trở lại</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
