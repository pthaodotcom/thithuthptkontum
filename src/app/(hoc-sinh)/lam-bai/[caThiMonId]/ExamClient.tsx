"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Loader2,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import {
  capNhatOperation,
  dapAnMoiNhat,
  layHangDoi,
  themOperation,
  xoaOperation,
  type QueueOperation,
  type TraLoiOffline,
} from "@/lib/offline/exam-queue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Cau = {
  snapshotId: string;
  phan: "I" | "II" | "III";
  noiDung: string;
  chiTiet: Array<{ id: string; thuTu: number; noiDung: string }>;
};
type LyDo = "TuNop" | "HetGio" | "ViPham";

export default function ExamClient({
  caThiMonId, baiLamId, gioKetThuc, cauHoi, banDau,
}: {
  caThiMonId: string; baiLamId?: string; gioKetThuc?: string;
  cauHoi: Cau[]; banDau: TraLoiOffline[];
}) {
  const router = useRouter();
  const [dapAn, setDapAn] = useState<TraLoiOffline[]>(banDau);
  const [status, setStatus] = useState("Đã lưu");
  const [pending, setPending] = useState(0);
  const [conLai, setConLai] = useState(0);
  const [warning, setWarning] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangVaoThi, setDangVaoThi] = useState(false);
  const [dangTaiLaiDe, startTransition] = useTransition();
  const hiddenAt = useRef<number | null>(null);
  const offlineAt = useRef<number | null>(null);
  const dapAnRef = useRef(dapAn);
  const syncing = useRef(false);
  const submitQueued = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warned = useRef(new Set<number>());
  dapAnRef.current = dapAn;

  const dongBo = useCallback(async () => {
    if (!baiLamId || !navigator.onLine || syncing.current) return;
    syncing.current = true;
    try {
      let queue = await layHangDoi(baiLamId);
      setPending(queue.length);
      while (queue.length && navigator.onLine) {
        const op = queue[0]!;
        setStatus(`Đang lưu · ${queue.length} thay đổi đang chờ`);
        const endpoint = op.type === "autosave" ? "autosave" : "nop-bai";
        const body = op.type === "autosave"
          ? { baiLamId, traLoi: op.answers }
          : { baiLamId, lyDo: op.lyDo, canhBaoLuuCuoi: false };
        try {
          const response = await fetch(`/api/bai-thi/${endpoint}`, {
            method: "POST",
            headers: { "content-type": "application/json", "Idempotency-Key": op.operationId },
            body: JSON.stringify(body),
          });
          if (!response.ok) {
            const retryable = response.status >= 500 || response.status === 429;
            op.attempts += 1;
            op.lastError = `${response.status}: ${await response.text()}`;
            await capNhatOperation(op);
            setStatus(`Chưa lưu được · ${queue.length} thay đổi đang chờ`);
            if (retryable) {
              const delay = Math.min(30_000, 500 * 2 ** Math.min(op.attempts, 6)) + Math.random() * 300;
              window.setTimeout(() => void dongBo(), delay);
            }
            return;
          }
          await xoaOperation(op.operationId);
          if (op.type === "submit") {
            location.href = `/ket-qua/${baiLamId}`;
            return;
          }
          queue = await layHangDoi(baiLamId);
          setPending(queue.length);
        } catch (error) {
          op.attempts += 1;
          op.lastError = error instanceof Error ? error.message : "Mất kết nối";
          await capNhatOperation(op);
          setStatus(`Đã lưu trên thiết bị · ${queue.length} thay đổi chờ gửi`);
          return;
        }
      }
      setPending(0);
      setStatus("Đã lưu");
    } finally {
      syncing.current = false;
    }
  }, [baiLamId]);

  const xepAutosave = useCallback(async () => {
    if (!baiLamId) return;
    await themOperation({ baiLamId, type: "autosave", answers: dapAnRef.current });
    const queue = await layHangDoi(baiLamId);
    setPending(queue.length);
    setStatus(navigator.onLine ? "Đang lưu" : `Đã lưu trên thiết bị · ${queue.length} thay đổi chờ gửi`);
    void dongBo();
  }, [baiLamId, dongBo]);

  const nop = useCallback(async (lyDo: LyDo) => {
    if (!baiLamId || submitQueued.current) return;
    submitQueued.current = true;
    if (debounce.current) clearTimeout(debounce.current);
    await xepAutosave();
    await themOperation({ baiLamId, type: "submit", answers: dapAnRef.current, lyDo });
    const queue = await layHangDoi(baiLamId);
    setPending(queue.length);
    setStatus(navigator.onLine ? "Đang lưu" : `Đã lưu trên thiết bị · ${queue.length} thay đổi chờ gửi`);
    void dongBo();
  }, [baiLamId, dongBo, xepAutosave]);

  const viPham = useCallback(async (
    loai: "Copy" | "ChuyenTab" | "MatKetNoi",
    thoiLuongGiay?: number,
  ) => {
    if (!baiLamId || !navigator.onLine) return;
    const response = await fetch("/api/bai-thi/vi-pham", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ baiLamId, loai, thoiLuongGiay, eventId: crypto.randomUUID() }),
    });
    const json = await response.json();
    if (json.data?.tuDongThuBai) await nop("ViPham");
  }, [baiLamId, nop]);

  useEffect(() => {
    if (!baiLamId) { setHydrated(true); return; }
    void layHangDoi(baiLamId).then((queue) => {
      const local = dapAnMoiNhat(queue);
      if (local) setDapAn(local);
      submitQueued.current = queue.some((x) => x.type === "submit");
      setPending(queue.length);
      setStatus(queue.length ? (navigator.onLine ? "Đang lưu" : `Đã lưu trên thiết bị · ${queue.length} thay đổi chờ gửi`) : "Đã lưu");
      setHydrated(true);
      void dongBo();
    });
  }, [baiLamId, dongBo]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/exam-sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        const resources = performance.getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(location.origin));
        (registration.active ?? navigator.serviceWorker.controller)?.postMessage({
          type: "CACHE_EXAM",
          urls: [location.href, ...resources],
        });
      })
      .catch(() => {
        // IndexedDB remains the source of truth even if shell caching is not
        // available in a restricted browser.
      });
  }, []);

  useEffect(() => {
    if (!hydrated || !baiLamId) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void xepAutosave(), 600);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [dapAn, hydrated, baiLamId, xepAutosave]);

  useEffect(() => {
    if (!baiLamId || !gioKetThuc) return;
    const save = setInterval(() => void xepAutosave(), 30_000);
    const clock = setInterval(() => {
      const seconds = Math.max(0, Math.floor((new Date(gioKetThuc).getTime() - Date.now()) / 1000));
      setConLai(seconds);
      for (const mark of [600, 300]) if (seconds <= mark && !warned.current.has(mark)) {
        warned.current.add(mark); setWarning(`Chỉ còn ${mark / 60} phút làm bài.`);
      }
      if (seconds === 0) void nop("HetGio");
    }, 1000);
    const online = () => {
      if (offlineAt.current) {
        void viPham("MatKetNoi", (Date.now() - offlineAt.current) / 1000);
        offlineAt.current = null;
      }
      void dongBo();
    };
    const offline = () => { offlineAt.current = Date.now(); setStatus(`Đã lưu trên thiết bị · ${pending} thay đổi chờ gửi`); };
    const visibility = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current) {
        void viPham("ChuyenTab", (Date.now() - hiddenAt.current) / 1000); hiddenAt.current = null;
      }
    };
    const copy = (event: ClipboardEvent) => { event.preventDefault(); void viPham("Copy"); };
    document.addEventListener("copy", copy);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", online); window.addEventListener("offline", offline);
    return () => {
      clearInterval(save); clearInterval(clock);
      document.removeEventListener("copy", copy); document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", online); window.removeEventListener("offline", offline);
    };
  }, [baiLamId, gioKetThuc, dongBo, nop, pending, viPham, xepAutosave]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Đang mở lại bài làm của bạn…</span>
        </div>
      </div>
    );
  }

  if (!baiLamId) {
    const dangMoDe = dangVaoThi || dangTaiLaiDe;
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">Bạn chưa vào ca thi này.</p>
        <Button
          size="lg"
          disabled={dangMoDe}
          onClick={async () => {
            setDangVaoThi(true);
            try {
              const response = await fetch("/api/bai-thi/vao-thi", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ caThiMonId }),
              });
              const json = await response.json();
              if (response.ok) {
                startTransition(() => router.refresh());
                return;
              }
              alert(json.message);
            } catch {
              alert("Chưa thể mở bài thi. Vui lòng thử lại.");
            } finally {
              setDangVaoThi(false);
            }
          }}
        >
          {dangMoDe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {dangMoDe ? "Đang mở đề…" : "Vào thi"}
        </Button>
      </div>
    );
  }

  const set = (answer: TraLoiOffline) => setDapAn((items) => [
    ...items.filter((x) => !(x.cauHoiSnapshotId === answer.cauHoiSnapshotId && x.chiTietThuTu === answer.chiTietThuTu)),
    answer,
  ]);

  const daTraLoi = (c: Cau) => {
    if (c.phan === "I") return dapAn.some((t) => t.cauHoiSnapshotId === c.snapshotId && Boolean(t.dapAnLuaChonId));
    if (c.phan === "II") return c.chiTiet.every((x) => dapAn.some((t) => t.cauHoiSnapshotId === c.snapshotId && t.chiTietThuTu === x.thuTu && t.dapAnDungSai !== undefined));
    return Boolean(dapAn.find((t) => t.cauHoiSnapshotId === c.snapshotId)?.dapAnChuoi);
  };
  const soCauDaLam = cauHoi.filter(daTraLoi).length;
  const khan = conLai > 0 && conLai <= 300;
  const sapHet = conLai > 300 && conLai <= 600;

  return (
    <div className="space-y-5 pb-10">
      {warning && (
        <div
          role="alert"
          className="sticky top-[4.75rem] z-20 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{warning}</span>
          <button
            aria-label="Đóng cảnh báo"
            className="shrink-0 rounded p-0.5 hover:bg-amber-200/60 dark:hover:bg-amber-900"
            onClick={() => setWarning("")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums",
              khan
                ? "animate-pulse bg-destructive/10 text-destructive"
                : sapHet
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
                  : "bg-secondary text-secondary-foreground"
            )}
          >
            Còn {Math.floor(conLai / 60)}:{String(conLai % 60).padStart(2, "0")}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" data-testid="sync-status">
            <TrangThaiDongBoIcon status={status} />
            <span>{status}{pending > 0 && !status.includes("thay đổi") ? ` · ${pending} thay đổi đang chờ` : ""}</span>
            {status.startsWith("Chưa lưu được") && (
              <button className="inline-flex items-center gap-1 text-primary underline underline-offset-2" onClick={() => void dongBo()}>
                <RefreshCw className="h-3.5 w-3.5" /> Thử lại
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Đã làm <b className="text-foreground">{soCauDaLam}</b>/{cauHoi.length} câu
          </span>
          <Button variant="destructive" disabled={submitQueued.current} onClick={() => setConfirmOpen(true)}>
            <Send className="h-4 w-4" /> Nộp bài
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-3">
        {cauHoi.map((c, i) => {
          const done = daTraLoi(c);
          return (
            <a
              key={c.snapshotId}
              href={`#cau-${i + 1}`}
              title={`Câu ${i + 1} · Phần ${c.phan}${done ? " · đã làm" : ""}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
            >
              {i + 1}
            </a>
          );
        })}
      </div>

      {cauHoi.map((c, i) => {
        const done = daTraLoi(c);
        return (
          <article key={c.snapshotId} id={`cau-${i + 1}`} className="scroll-mt-28 rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  Phần {c.phan}
                </span>
              </div>
              {done && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Đã trả lời" />}
            </div>

            <div className="rich-content" dangerouslySetInnerHTML={{ __html: c.noiDung }} />

            {c.phan === "I" && (
              <div className="mt-4 space-y-2">
                {c.chiTiet.map((x, idx) => {
                  const checked = dapAn.some((t) => t.cauHoiSnapshotId === c.snapshotId && t.dapAnLuaChonId === x.id);
                  return (
                    <label
                      key={x.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                    >
                      <input
                        data-testid={`answer-${c.snapshotId}-${x.thuTu}`}
                        type="radio"
                        name={c.snapshotId}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                        checked={checked}
                        onChange={() => set({ cauHoiSnapshotId: c.snapshotId, chiTietThuTu: 0, dapAnLuaChonId: x.id })}
                      />
                      <span className="flex-1 pt-px">
                        <span className="mr-1.5 font-medium text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                        <span dangerouslySetInnerHTML={{ __html: x.noiDung }} />
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {c.phan === "II" && (
              <div className="mt-4 divide-y divide-border rounded-lg border border-border">
                {c.chiTiet.map((x, idx) => (
                  <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <span className="flex-1">
                      <span className="mr-1.5 font-medium text-muted-foreground">{String.fromCharCode(97 + idx)})</span>
                      <span dangerouslySetInnerHTML={{ __html: x.noiDung }} />
                    </span>
                    <div className="flex shrink-0 gap-2" role="group" aria-label={`Ý ${idx + 1}`}>
                      {[true, false].map((value) => {
                        const active = dapAn.some(
                          (t) => t.cauHoiSnapshotId === c.snapshotId && t.chiTietThuTu === x.thuTu && t.dapAnDungSai === value
                        );
                        return (
                          <button
                            key={String(value)}
                            type="button"
                            aria-pressed={active}
                            className={cn(
                              "h-9 min-w-16 rounded-md border px-3 text-sm font-medium transition-colors",
                              active
                                ? value
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-destructive bg-destructive text-destructive-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            )}
                            onClick={() => set({ cauHoiSnapshotId: c.snapshotId, chiTietThuTu: x.thuTu, dapAnDungSai: value })}
                          >
                            {value ? "Đúng" : "Sai"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {c.phan === "III" && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Đáp số (tối đa 4 ký tự)</label>
                <input
                  className="h-11 w-40 rounded-lg border border-input bg-background px-3 text-center font-mono text-lg tracking-[.4em] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  inputMode="decimal"
                  maxLength={4}
                  value={dapAn.find((t) => t.cauHoiSnapshotId === c.snapshotId)?.dapAnChuoi ?? ""}
                  onChange={(event) => set({
                    cauHoiSnapshotId: c.snapshotId,
                    chiTietThuTu: 0,
                    dapAnChuoi: event.target.value.replace(/[^0-9,.-]/g, "").slice(0, 4),
                  })}
                />
              </div>
            )}
          </article>
        );
      })}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nộp bài?</DialogTitle>
            <DialogDescription>
              Bạn đã làm {soCauDaLam}/{cauHoi.length} câu. Sau khi nộp, bạn sẽ không thể chỉnh sửa lại đáp án.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Tiếp tục làm bài
            </Button>
            <Button variant="destructive" onClick={() => { setConfirmOpen(false); void nop("TuNop"); }}>
              Xác nhận nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrangThaiDongBoIcon({ status }: { status: string }) {
  if (status.startsWith("Chưa lưu được")) return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status.startsWith("Đang lưu")) return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  if (status.startsWith("Đã lưu trên thiết bị")) return <CloudOff className="h-3.5 w-3.5 text-amber-600" />;
  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
}
