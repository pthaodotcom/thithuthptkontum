"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, IdCard, KeyRound, Loader2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DangNhapPage() {
  const router = useRouter();
  const [maSo, setMaSo] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/dang-nhap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ma_so: maSo, mat_khau: matKhau }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại");
        return;
      }

      if (data.phai_doi_mat_khau) {
        router.push("/doi-mat-khau");
      } else {
        router.push("/"); // redirect ve home de middleware hoac layout xu ly tiep
      }
    } catch {
      setError("Có lỗi xảy ra khi kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập hệ thống"
      subtitle="Nhập mã số và mật khẩu được cấp để tiếp tục."
    >
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ma_so">Mã số</Label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ma_so"
              type="text"
              autoComplete="username"
              value={maSo}
              onChange={(e) => setMaSo(e.target.value)}
              className="h-11 pl-10"
              placeholder="VD: GV0012, HS20250045"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mat_khau">Mật khẩu</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mat_khau"
              type="password"
              autoComplete="current-password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className="h-11 pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} size="lg" className="mt-2 h-12 w-full text-[0.95rem]">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Quên mật khẩu hoặc gặp sự cố đăng nhập? Liên hệ quản trị viên nhà trường.
      </p>
    </AuthShell>
  );
}
