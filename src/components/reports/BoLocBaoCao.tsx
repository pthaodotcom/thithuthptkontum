"use client";

import { useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MonOption, LopOption, CaThiOption } from "@/lib/reports/tuy-chon";

function nhanCaThi(ca: CaThiOption) {
  const gio = new Date(ca.gio_bat_dau).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `${ca.ten_dot_thi} (${ca.nam_hoc}) — Ca ${ca.so_thu_tu_ca} — ${gio}`;
}

export default function BoLocBaoCao({
  monOptions,
  lopOptions,
  caThiOptions,
  monId,
  lopId,
  caThiMonId,
  eyebrow = "Phạm vi báo cáo",
  title = "Chọn dữ liệu cần xem",
  description = "Chọn lần lượt môn, lớp và ca thi. Hệ thống sẽ cập nhật báo cáo ngay sau lựa chọn cuối cùng.",
  hideHeader = false,
}: {
  monOptions: MonOption[];
  lopOptions: LopOption[];
  caThiOptions: CaThiOption[];
  monId?: string;
  lopId?: string;
  caThiMonId?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  hideHeader?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedMon, setSelectedMon] = useState(monId || "");
  const [selectedLop, setSelectedLop] = useState(lopId || "");
  const [selectedCa, setSelectedCa] = useState(caThiMonId || "");
  const [localLopOptions, setLocalLopOptions] = useState(lopOptions);
  const [localCaOptions, setLocalCaOptions] = useState(caThiOptions);
  const [loading, setLoading] = useState<"lop" | "ca" | "">("");
  const [error, setError] = useState("");

  async function loadOptions(params: string, target: "lop" | "ca") {
    setLoading(target);
    setError("");
    try {
      const response = await fetch(`/api/bao-cao/tuy-chon?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được lựa chọn báo cáo");
      const data = (await response.json()) as { lopOptions?: LopOption[]; caThiOptions?: CaThiOption[] };
      if (target === "lop") setLocalLopOptions(data.lopOptions || []);
      else setLocalCaOptions(data.caThiOptions || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được lựa chọn báo cáo");
    } finally {
      setLoading("");
    }
  }

  function chooseMon(value: string) {
    setSelectedMon(value);
    setSelectedLop("");
    setSelectedCa("");
    setLocalCaOptions([]);
    if (value) void loadOptions(`monId=${encodeURIComponent(value)}`, "lop");
    else setLocalLopOptions([]);
  }

  function chooseLop(value: string) {
    setSelectedLop(value);
    setSelectedCa("");
    if (value && selectedMon)
      void loadOptions(`monId=${encodeURIComponent(selectedMon)}&lopId=${encodeURIComponent(value)}`, "ca");
    else setLocalCaOptions([]);
  }

  function search() {
    if (!selectedMon || !selectedLop || !selectedCa) {
      setError("Vui lòng chọn đủ môn, lớp và ca thi trước khi tìm kiếm.");
      return;
    }
    setError("");
    router.push(
      `${pathname}?monId=${encodeURIComponent(selectedMon)}&lopId=${encodeURIComponent(selectedLop)}&caThiMonId=${encodeURIComponent(selectedCa)}`
    );
  }

  function reset() {
    setSelectedMon("");
    setSelectedLop("");
    setSelectedCa("");
    setLocalLopOptions([]);
    setLocalCaOptions([]);
    setError("");
    router.push(pathname);
  }

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 id="bo-loc-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Đặt lại
            </button>
            <button
              type="button"
              onClick={search}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Tìm kiếm
            </button>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Đặt lại
          </button>
          <button
            type="button"
            onClick={search}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Tìm kiếm
          </button>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.7fr)]">
          <div className="min-w-0 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Môn</label>
            <Select value={selectedMon} onValueChange={(value) => value && chooseMon(value)}>
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Chọn môn">
                  {monOptions.find((m) => m.mon_id === selectedMon)?.ten_mon}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monOptions.map((m) => (
                  <SelectItem key={m.mon_id} value={m.mon_id}>
                    {m.ten_mon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Lớp</label>
            <Select
              value={selectedLop}
              onValueChange={(value) => value && chooseLop(value)}
              disabled={!selectedMon || loading === "lop" || localLopOptions.length === 0}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue
                  placeholder={
                    loading === "lop"
                      ? "Đang tải lớp…"
                      : selectedMon
                      ? "Chọn lớp"
                      : "Chọn môn trước"
                  }
                >
                  {localLopOptions.find((l) => l.lop_id === selectedLop)
                    ? `${localLopOptions.find((l) => l.lop_id === selectedLop)!.ten_lop} (${localLopOptions.find((l) => l.lop_id === selectedLop)!.khoi})`
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {localLopOptions.map((l) => (
                  <SelectItem key={l.lop_id} value={l.lop_id}>
                    {l.ten_lop} ({l.khoi})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Ca thi</label>
            <Select
              value={selectedCa}
              onValueChange={(value) => value && setSelectedCa(value)}
              disabled={!selectedLop || loading === "ca" || localCaOptions.length === 0}
            >
              <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden">
                <SelectValue
                  className="min-w-0 flex-1 overflow-hidden"
                  placeholder={
                    loading === "ca"
                      ? "Đang tải ca thi…"
                      : selectedLop
                      ? "Chọn ca thi"
                      : "Chọn lớp trước"
                  }
                >
                  {(() => {
                    const c = localCaOptions.find((x) => x.ca_thi_mon_id === selectedCa);
                    return c ? <span className="block min-w-0 truncate">{nhanCaThi(c)}</span> : undefined;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {localCaOptions.map((c) => (
                  <SelectItem key={c.ca_thi_mon_id} value={c.ca_thi_mon_id}>
                    {nhanCaThi(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p
          className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
          role={error ? "alert" : undefined}
        >
          {error || "Chọn điều kiện rồi bấm Tìm kiếm để xem báo cáo."}
        </p>
      </div>
    </div>
  );
}
