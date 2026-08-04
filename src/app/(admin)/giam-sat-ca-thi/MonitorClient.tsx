"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AlertTriangle, RadioTower, ShieldAlert, WifiOff } from "lucide-react";
import { taoSupabaseBrowserClient } from "@/lib/supabase/client";
import { xuLyNgoaiLe } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TrangThaiRealtime = "DANG_KET_NOI" | "DA_KET_NOI" | "MAT_KET_NOI";

type MonitorRow = {
  bai_lam_id: string;
  trang_thai: string;
  thoi_diem_vao_thi: string | null;
  thoi_diem_nop: string | null;
  diem_tong: number | null;
  tai_khoan:
    | { ma_so: string; ho_ten: string; trang_thai: string }
    | Array<{ ma_so: string; ho_ten: string; trang_thai: string }>
    | null;
  ca_thi_mon:
    | {
        mon: { ten_mon: string } | null;
        ca_thi: {
          so_thu_tu_ca: number;
          trang_thai: string;
          dot_thi: { ten_dot_thi: string } | null;
        } | null;
      }
    | Array<{
        mon: { ten_mon: string } | null;
        ca_thi: {
          so_thu_tu_ca: number;
          trang_thai: string;
          dot_thi: { ten_dot_thi: string } | null;
        } | null;
      }>
    | null;
  vi_pham: Array<{ id: string }> | null;
};

type TokenResponse = {
  data?: { token?: string };
  message?: string;
};

const BANG_REALTIME = ["bai_lam_thi", "vi_pham", "tai_khoan", "ca_thi"] as const;

const NHAN_TRANG_THAI: Record<string, string> = {
  ChuaDangNhap: "Chưa vào thi",
  DangThi: "Đang thi",
  BiKhoaChoXuLy: "Bị khóa · cần xử lý",
  DaNopBai: "Đã nộp bài",
  VangMat: "Vắng mặt",
  KhongTheDuThi_LoiToChuc: "Lỗi tổ chức",
};

const MAU_TRANG_THAI: Record<string, string> = {
  ChuaDangNhap: "bg-muted text-muted-foreground",
  DangThi: "bg-primary/10 text-primary",
  BiKhoaChoXuLy: "bg-destructive/10 text-destructive",
  DaNopBai: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  VangMat: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  KhongTheDuThi_LoiToChuc: "bg-destructive/10 text-destructive",
};

export default function MonitorClient() {
  const [data, setData] = useState<MonitorRow[]>([]);
  const [error, setError] = useState("");
  const [lastOk, setLastOk] = useState<Date | null>(null);
  const [realtimeStatus, setRealtimeStatus] =
    useState<TrangThaiRealtime>("DANG_KET_NOI");
  const [selected, setSelected] = useState<MonitorRow | null>(null);
  const [lyDo, setLyDo] = useState("");
  const [pending, startTransition] = useTransition();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/giam-sat", {
        cache: "no-store",
        signal,
      });
      const body = await response.json();
      if (response.ok) {
        setData(body.data ?? []);
        setLastOk(new Date());
        setError("");
      } else {
        setError(body.message ?? "Không thể tải dữ liệu giám sát.");
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Dữ liệu có thể đã cũ; hệ thống đang thử kết nối lại.");
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void load(), 250);
  }, [load]);

  useEffect(() => {
    const abortController = new AbortController();
    let channel: RealtimeChannel | null = null;
    let tokenRefreshId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function layToken() {
      const response = await fetch("/api/giam-sat/realtime-token", {
        cache: "no-store",
        signal: abortController.signal,
      });
      const body = (await response.json()) as TokenResponse;
      const token = body.data?.token;
      if (!response.ok || !token) {
        throw new Error(body.message ?? "Không thể cấp token Realtime.");
      }
      return token;
    }

    async function subscribe() {
      try {
        const token = await layToken();
        if (cancelled) return;

        const client = taoSupabaseBrowserClient(token);
        await client.realtime.setAuth(token);
        channel = client.channel("admin-monitoring");
        for (const table of BANG_REALTIME) {
          channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            scheduleRefresh
          );
        }

        channel.subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("DA_KET_NOI");
            scheduleRefresh();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setRealtimeStatus("MAT_KET_NOI");
          }
        });

        tokenRefreshId = setInterval(async () => {
          try {
            const refreshedToken = await layToken();
            await client.realtime.setAuth(refreshedToken);
          } catch {
            if (!cancelled) setRealtimeStatus("MAT_KET_NOI");
          }
        }, 4 * 60 * 1000);
      } catch (cause) {
        if (cancelled || (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        setRealtimeStatus("MAT_KET_NOI");
      }
    }

    void load(abortController.signal);
    void subscribe();
    const pollingId = setInterval(() => void load(abortController.signal), 30_000);

    return () => {
      cancelled = true;
      abortController.abort();
      clearInterval(pollingId);
      if (tokenRefreshId) clearInterval(tokenRefreshId);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (channel) void channel.unsubscribe();
    };
  }, [load, scheduleRefresh]);

  const counts = useMemo(
    () =>
      data.reduce<Record<string, number>>((acc, item) => {
        acc[item.trang_thai] = (acc[item.trang_thai] ?? 0) + 1;
        return acc;
      }, {}),
    [data]
  );

  const act = (loai: "MoKhoaVaoTre" | "Reset_TiepTuc" | "Reset_LamLai") => {
    if (!selected) return;
    startTransition(async () => {
      const result = await xuLyNgoaiLe({
        baiLamId: selected.bai_lam_id,
        loai,
        lyDo,
      });
      setError(result.success ? "" : result.error ?? "Có lỗi");
      if (result.success) {
        setSelected(null);
        setLyDo("");
        await load();
      }
    });
  };

  const realtimeLabel =
    realtimeStatus === "DA_KET_NOI"
      ? "Realtime đã kết nối"
      : realtimeStatus === "DANG_KET_NOI"
        ? "Đang kết nối Realtime"
        : "Mất Realtime · đang dùng polling 30 giây";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Giám sát ca thi</h1>
          <p data-testid="realtime-status" className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {realtimeStatus === "DA_KET_NOI" ? (
              <RadioTower className="h-3.5 w-3.5 text-emerald-600" />
            ) : realtimeStatus === "DANG_KET_NOI" ? (
              <RadioTower className="h-3.5 w-3.5 animate-pulse text-amber-600" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            {realtimeLabel}.{" "}
            {lastOk && `Cập nhật ${lastOk.toLocaleTimeString("vi-VN")}`}
          </p>
        </div>
      </header>

      {error && (
        <div data-testid="monitor-stale-banner" role="alert" className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, value]) => (
          <span
            key={key}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              MAU_TRANG_THAI[key] ?? "bg-muted text-muted-foreground"
            )}
          >
            {NHAN_TRANG_THAI[key] ?? key}: {value}
          </span>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Học sinh</TableHead>
              <TableHead>Đợt/Ca</TableHead>
              <TableHead>Môn</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Vi phạm</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có ca thi nào đang diễn ra.
                </TableCell>
              </TableRow>
            )}
            {data.map((item) => {
              const taiKhoan = Array.isArray(item.tai_khoan)
                ? item.tai_khoan[0]
                : item.tai_khoan;
              const caThiMon = Array.isArray(item.ca_thi_mon)
                ? item.ca_thi_mon[0]
                : item.ca_thi_mon;
              const soViPham = item.vi_pham?.length ?? 0;
              return (
                <TableRow key={item.bai_lam_id} data-bai-lam-id={item.bai_lam_id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{taiKhoan?.ho_ten}</p>
                    <p className="text-xs text-muted-foreground">{taiKhoan?.ma_so}</p>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {caThiMon?.ca_thi?.dot_thi?.ten_dot_thi} / Ca {caThiMon?.ca_thi?.so_thu_tu_ca}
                  </TableCell>
                  <TableCell className="text-foreground">{caThiMon?.mon?.ten_mon}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        MAU_TRANG_THAI[item.trang_thai] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.trang_thai === "BiKhoaChoXuLy" && <ShieldAlert className="h-3 w-3" />}
                      {item.trang_thai}
                    </span>
                    {taiKhoan?.trang_thai === "DinhChi" && item.trang_thai === "DangThi" && (
                      <span className="ml-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-400">
                        Bị đình chỉ · hiệu lực từ ca sau
                      </span>
                    )}
                  </TableCell>
                  <TableCell data-testid={`vi-pham-${item.bai_lam_id}`}>
                    <span className={cn("font-medium", soViPham > 0 ? "text-destructive" : "text-muted-foreground")}>
                      {soViPham}/3
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                      Xử lý
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xử lý ngoại lệ bài thi</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Học sinh: <b>{(Array.isArray(selected.tai_khoan) ? selected.tai_khoan[0] : selected.tai_khoan)?.ho_ten}</b>
                {" · "}Trạng thái hiện tại:{" "}
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", MAU_TRANG_THAI[selected.trang_thai] ?? "bg-muted text-muted-foreground")}>
                  {selected.trang_thai}
                </span>
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="ly-do-xu-ly">
                  Lý do (bắt buộc)
                </label>
                <textarea
                  id="ly-do-xu-ly"
                  autoFocus
                  className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  placeholder="Vd: Học sinh báo mất kết nối, xác minh qua giám thị phòng thi..."
                  value={lyDo}
                  onChange={(event) => setLyDo(event.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pending || lyDo.trim().length < 3}
                onClick={() => act("Reset_LamLai")}
              >
                Làm lại
              </Button>
              <Button
                variant="outline"
                disabled={pending || lyDo.trim().length < 3}
                onClick={() => act("Reset_TiepTuc")}
              >
                Tiếp tục
              </Button>
              <Button
                disabled={pending || lyDo.trim().length < 3 || selected?.trang_thai !== "BiKhoaChoXuLy"}
                onClick={() => act("MoKhoaVaoTre")}
              >
                Mở khóa vào trễ
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
