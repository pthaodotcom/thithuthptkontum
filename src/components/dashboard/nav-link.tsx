"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function DashboardNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hrefPath, hrefQuery] = href.split("?");
  const currentQuery = searchParams.toString();
  const [dangChuyenTrang, setDangChuyenTrang] = useState(false);

  // So khop ca query string de cac link cung path goc (vd /tai-khoan va
  // /tai-khoan?loai=HocSinh) khong cung active mot luc.
  const active = hrefQuery
    ? pathname === hrefPath && currentQuery === hrefQuery
    : (pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)) && currentQuery === "";

  useEffect(() => {
    if (pathname === hrefPath && currentQuery === (hrefQuery ?? "")) {
      setDangChuyenTrang(false);
    }
  }, [currentQuery, hrefPath, hrefQuery, pathname]);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-busy={dangChuyenTrang || undefined}
      onClick={(event) => {
        if (active || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        setDangChuyenTrang(true);
      }}
      className={cn(
        "group relative flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-all duration-200",
        dangChuyenTrang && "pointer-events-none opacity-70",
        active
          ? "bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(15,23,42,0.16)]"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted hover:text-foreground"
      )}
      >
        <span
          className={cn(
            "shrink-0",
            active ? "text-gold" : "text-muted-foreground group-hover:text-accent"
          )}
        >
          {icon}
        </span>
        {dangChuyenTrang ? (
          <span className="flex min-w-0 items-center gap-2" role="status">
            <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            <span className="truncate">Đang mở…</span>
          </span>
        ) : <span className="truncate">{label}</span>}
    </Link>
  );
}
