"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/dang-xuat", { method: "POST" });
    router.push("/dang-nhap");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LogOut className="h-4 w-4" />
      Đăng xuất
    </button>
  );
}
