import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, Menu, Sparkles } from "lucide-react";

import { DashboardNavLink } from "@/components/dashboard/nav-link";
import LogoutButton from "@/components/dashboard/logout-button";
import { NotificationMenu, type ThongBaoItem } from "@/components/dashboard/notification-menu";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export type DashboardNavItem = { href: string; label: string; icon: LucideIcon };
export type DashboardNavGroup = { label?: string; items: DashboardNavItem[] };

function Navigation({ navGroups, label }: { navGroups: DashboardNavGroup[]; label: string }) {
  return (
    <nav aria-label={label} className="space-y-5">
      {navGroups.map((group, idx) => (
        <div key={group.label ?? idx} className="space-y-1">
          {group.label && (
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
              {group.label}
            </p>
          )}
          {group.items.map(({ href, label: itemLabel, icon: Icon }) => (
            <DashboardNavLink
              key={href}
              href={href}
              label={itemLabel}
              icon={<Icon className="h-4 w-4" aria-hidden="true" />}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export async function DashboardShell({
  brandLabel, brandSub, navGroups, userId, userName, userRole, children,
}: {
  brandLabel: string;
  brandSub?: string;
  navGroups: DashboardNavGroup[];
  userId: string;
  userName: string;
  userRole: string;
  children: ReactNode;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";
  const supabase = taoSupabaseServiceRole();
  const { data: notificationData } = await supabase.from("thong_bao_noi_bo")
    .select("id,tieu_de,noi_dung,duong_dan,da_doc,created_at")
    .eq("nguoi_nhan_tai_khoan_id", userId).order("created_at", { ascending: false }).limit(12);
  const notifications = (notificationData || []) as ThongBaoItem[];

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <a href="#noi-dung-chinh" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-lg transition-transform focus:translate-y-0">
        Chuyển đến nội dung chính
      </a>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border/80 bg-card/95 shadow-[8px_0_30px_rgba(15,23,42,0.03)] backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 border-b border-border/70 px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight">{brandLabel}</p>
            {brandSub && <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{brandSub}</p>}
          </div>
          <div className="ml-auto"><NotificationMenu items={notifications}/></div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Navigation navGroups={navGroups} label="Điều hướng chính" />
        </div>
        <div className="border-t border-border/70 bg-muted/30 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-card px-2 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent ring-1 ring-accent/15">{initial}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{userRole}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{brandLabel}</p>
              <p className="truncate text-xs text-muted-foreground">{brandSub}</p>
            </div>
          </div>
          <div className="ml-auto"><NotificationMenu items={notifications}/></div>
          <details className="group relative">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-background transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Mở menu</span>
            </summary>
            <div className="absolute right-0 mt-2 max-h-[calc(100vh-5rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-2xl">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 font-bold text-accent">{initial}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userRole}</p>
                </div>
              </div>
              <Navigation navGroups={navGroups} label="Điều hướng di động" />
              <div className="mt-3 border-t border-border pt-3"><LogoutButton /></div>
            </div>
          </details>
        </div>
      </header>

      <main id="noi-dung-chinh" className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground lg:mb-7">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Không gian học tập và quản lý kỳ thi
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
