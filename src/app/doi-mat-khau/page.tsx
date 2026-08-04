"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, KeyRound, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DoiMatKhauPage() {
  const router = useRouter();
  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhan, setXacNhan] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dieuKien = [
    { dat: matKhauMoi.length >= 8, text: "Tối thiểu 8 ký tự" },
    { dat: /[A-Z]/.test(matKhauMoi), text: "Có ít nhất 1 chữ hoa" },
    { dat: /[0-9]/.test(matKhauMoi), text: "Có ít nhất 1 chữ số" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (matKhauMoi !== xacNhan) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!dieuKien.every((d) => d.dat)) {
      setError("Mật khẩu mới phải >= 8 ký tự, có chữ hoa và số");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/doi-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mat_khau_cu: matKhauCu, mat_khau_moi: matKhauMoi }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đổi mật khẩu thất bại");
        return;
      }

      router.push("/");
    } catch {
      setError("Có lỗi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đổi mật khẩu"
      subtitle="Đây là lần đăng nhập đầu hoặc mật khẩu đã hết hạn — hãy đặt mật khẩu mới."
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mat_khau_cu">Mật khẩu hiện tại</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mat_khau_cu"
              type="password"
              autoComplete="current-password"
              value={matKhauCu}
              onChange={(e) => setMatKhauCu(e.target.value)}
              className="h-10 pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mat_khau_moi">Mật khẩu mới</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mat_khau_moi"
              type="password"
              autoComplete="new-password"
              value={matKhauMoi}
              onChange={(e) => setMatKhauMoi(e.target.value)}
              className="h-10 pl-9"
              required
            />
          </div>
          <ul className="mt-2 space-y-1">
            {dieuKien.map(({ dat, text }) => (
              <li
                key={text}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  dat ? "text-emerald-600" : "text-muted-foreground"
                )}
              >
                <Check className={cn("h-3.5 w-3.5", dat ? "opacity-100" : "opacity-30")} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="xac_nhan">Xác nhận mật khẩu mới</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="xac_nhan"
              type="password"
              autoComplete="new-password"
              value={xacNhan}
              onChange={(e) => setXacNhan(e.target.value)}
              className="h-10 pl-9"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} size="lg" className="mt-2 h-11 w-full text-[0.95rem]">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Đang xử lý..." : "Xác nhận"}
        </Button>
      </form>
    </AuthShell>
  );
}
