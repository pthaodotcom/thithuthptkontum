"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const daPrefetch = useRef(false);
  const searchParams = useSearchParams();
  const [hrefPath, hrefQuery] = href.split("?");
  const currentQuery = searchParams.toString();

  // So khop ca query string de cac link cung path goc (vd /tai-khoan va
  // /tai-khoan?loai=HocSinh) khong cung active mot luc.
  const active = hrefQuery
    ? pathname === hrefPath && currentQuery === hrefQuery
    : (pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)) && currentQuery === "";

  function prefetchMotLan() {
    if (daPrefetch.current) return;
    daPrefetch.current = true;
    router.prefetch(href);
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={prefetchMotLan}
      onFocus={prefetchMotLan}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-all duration-200",
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
      <span className="truncate">{label}</span>
    </Link>
  );
}
