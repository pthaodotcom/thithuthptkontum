"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  FileSearch,
  Filter,
  GraduationCap,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";

import { lamSachNhanXet } from "@/lib/ai/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BaiLamThiItem = {
  bai_lam_id: string;
  diem_tong: number | null;
  so_cau_dung: number | null;
  so_cau_sai: number | null;
  thoi_diem_vao_thi: string | null;
  thoi_diem_nop: string | null;
  ca_thi_mon:
    | {
        mon: { ten_mon: string } | { ten_mon: string }[] | null;
        ca_thi:
          | {
              dot_thi:
                | { ten_dot_thi: string; dot_thi_id?: string }
                | { ten_dot_thi: string; dot_thi_id?: string }[]
                | null;
            }
          | {
              dot_thi:
                | { ten_dot_thi: string; dot_thi_id?: string }
                | { ten_dot_thi: string; dot_thi_id?: string }[]
                | null;
            }[]
          | null;
      }
    | {
        mon: { ten_mon: string } | { ten_mon: string }[] | null;
        ca_thi:
          | {
              dot_thi:
                | { ten_dot_thi: string; dot_thi_id?: string }
                | { ten_dot_thi: string; dot_thi_id?: string }[]
                | null;
            }
          | {
              dot_thi:
                | { ten_dot_thi: string; dot_thi_id?: string }
                | { ten_dot_thi: string; dot_thi_id?: string }[]
                | null;
            }[]
          | null;
      }[]
    | null;
  nhan_xet_ai:
    | { noi_dung: string; nguon: string }
    | { noi_dung: string; nguon: string }[]
    | null;
  phan_tich_chuyen_de:
    | {
        ty_le_dung: number;
        chuyen_de: { ten_chuyen_de: string } | { ten_chuyen_de: string }[] | null;
      }[]
    | null;
};

const scoreRangeLabels: Record<string, string> = {
  all: "Tất cả mức điểm",
  gioi: "Điểm Giỏi (≥ 8.0)",
  kha: "Điểm Khá (6.5 – 7.9)",
  trung_binh: "Trung bình (5.0 – 6.4)",
  can_on_tap: "Cần ôn tập (< 5.0)",
};

export default function KetQuaClient({ initialData }: { initialData: BaiLamThiItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedDot, setSelectedDot] = useState<string>("all");
  const [selectedMon, setSelectedMon] = useState<string>("all");
  const [selectedScoreRange, setSelectedScoreRange] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");

  // Metrics tổng quan
  const scores = useMemo(() => initialData.map((item) => Number(item.diem_tong || 0)), [initialData]);
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const latest = scores[0] || 0;

  const personalMetrics = [
    { label: "Số bài đã thi", value: String(scores.length), icon: BookOpenCheck },
    { label: "Điểm trung bình", value: average.toFixed(2), icon: TrendingUp },
    { label: "Điểm cao nhất", value: best.toFixed(2), icon: Trophy },
    { label: "Kết quả gần nhất", value: latest.toFixed(2), icon: BarChart3 },
  ];

  // Danh sách các đợt thi & môn học duy nhất có trong dữ liệu
  const { dotThiList, monList } = useMemo(() => {
    const dotMap = new Map<string, string>();
    const monSet = new Set<string>();

    for (const b of initialData) {
      const c = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
      const m = Array.isArray(c?.mon) ? c?.mon[0] : c?.mon;
      const ca = Array.isArray(c?.ca_thi) ? c?.ca_thi[0] : c?.ca_thi;
      const d = Array.isArray(ca?.dot_thi) ? ca?.dot_thi[0] : ca?.dot_thi;

      if (d?.ten_dot_thi) {
        dotMap.set(d.ten_dot_thi, d.ten_dot_thi);
      }
      if (m?.ten_mon) {
        monSet.add(m.ten_mon);
      }
    }

    return {
      dotThiList: Array.from(dotMap.values()),
      monList: Array.from(monSet.values()),
    };
  }, [initialData]);

  // Bộ lọc dữ liệu
  const filteredData = useMemo(() => {
    return initialData
      .filter((b) => {
        const c = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
        const m = Array.isArray(c?.mon) ? c?.mon[0] : c?.mon;
        const ca = Array.isArray(c?.ca_thi) ? c?.ca_thi[0] : c?.ca_thi;
        const d = Array.isArray(ca?.dot_thi) ? ca?.dot_thi[0] : ca?.dot_thi;
        const nx = Array.isArray(b.nhan_xet_ai) ? b.nhan_xet_ai[0] : b.nhan_xet_ai;

        const tenMon = m?.ten_mon || "";
        const tenDot = d?.ten_dot_thi || "";
        const noiDungNx = nx?.noi_dung || "";
        const score = Number(b.diem_tong ?? 0);

        // Lọc theo từ khóa tìm kiếm
        if (search.trim()) {
          const keyword = search.trim().toLowerCase();
          const matchTenMon = tenMon.toLowerCase().includes(keyword);
          const matchTenDot = tenDot.toLowerCase().includes(keyword);
          const matchNx = noiDungNx.toLowerCase().includes(keyword);
          const matchChuyenDe = (b.phan_tich_chuyen_de || []).some((p) => {
            const cd = Array.isArray(p.chuyen_de) ? p.chuyen_de[0] : p.chuyen_de;
            return (cd?.ten_chuyen_de || "").toLowerCase().includes(keyword);
          });

          if (!matchTenMon && !matchTenDot && !matchNx && !matchChuyenDe) {
            return false;
          }
        }

        // Lọc theo Đợt thi
        if (selectedDot !== "all" && tenDot !== selectedDot) {
          return false;
        }

        // Lọc theo Môn học
        if (selectedMon !== "all" && tenMon !== selectedMon) {
          return false;
        }

        // Lọc theo Mức điểm
        if (selectedScoreRange === "gioi" && score < 8.0) return false;
        if (selectedScoreRange === "kha" && (score < 6.5 || score >= 8.0)) return false;
        if (selectedScoreRange === "trung_binh" && (score < 5.0 || score >= 6.5)) return false;
        if (selectedScoreRange === "can_on_tap" && score >= 5.0) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = a.thoi_diem_nop ? new Date(a.thoi_diem_nop).getTime() : 0;
        const timeB = b.thoi_diem_nop ? new Date(b.thoi_diem_nop).getTime() : 0;
        const scoreA = Number(a.diem_tong ?? 0);
        const scoreB = Number(b.diem_tong ?? 0);

        if (sortOrder === "newest") return timeB - timeA;
        if (sortOrder === "oldest") return timeA - timeB;
        if (sortOrder === "score_desc") return scoreB - scoreA;
        if (sortOrder === "score_asc") return scoreA - scoreB;
        return 0;
      });
  }, [initialData, search, selectedDot, selectedMon, selectedScoreRange, sortOrder]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    selectedDot !== "all" ||
    selectedMon !== "all" ||
    selectedScoreRange !== "all" ||
    sortOrder !== "newest";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedDot("all");
    setSelectedMon("all");
    setSelectedScoreRange("all");
    setSortOrder("newest");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <BarChart3 className="h-3.5 w-3.5" />
          Kết quả của bạn
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Điểm và nhận xét
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          Xem điểm, phần kiến thức cần ôn và nhận xét chi tiết của từng bài thi đã tham gia.
        </p>
      </div>

      {/* Thống kê cá nhân */}
      {!!scores.length && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {personalMetrics.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{item.value}</p>
                </div>
              );
            })}
          </section>

          <section className="rounded-md border border-border bg-card p-4">
            <h2 className="text-sm font-bold">Điểm các lần thi gần đây</h2>
            <div className="mt-3 space-y-2.5">
              {initialData.slice(0, 8).map((item) => {
                const ctm = Array.isArray(item.ca_thi_mon) ? item.ca_thi_mon[0] : item.ca_thi_mon;
                const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
                const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
                const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
                const score = Number(item.diem_tong ?? 0);
                return (
                  <div key={item.bai_lam_id}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate font-medium">
                        {mon?.ten_mon} · {dot?.ten_dot_thi}
                      </span>
                      <span className="tabular-nums font-semibold text-muted-foreground">
                        {score.toFixed(2)}/10
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded bg-muted"
                      role="img"
                      aria-label={`${mon?.ten_mon}: ${score.toFixed(2)} trên 10`}
                    >
                      <div
                        className="h-full rounded bg-primary transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC (GỌN GÀNG, KHÔNG PHỒNG) */}
      {!!initialData.length && (
        <section className="rounded-md border border-border bg-card p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Tra cứu & Bộ lọc bài thi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Hiển thị {filteredData.length} / {initialData.length} bài thi
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 px-2 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Đặt lại
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Ô tìm kiếm từ khóa */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm môn, đợt thi, chuyên đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 pr-7 text-xs rounded-md"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Lọc theo Đợt thi */}
            <div>
              <Select value={selectedDot} onValueChange={(val) => val && setSelectedDot(val)}>
                <SelectTrigger className="h-9 w-full rounded-md text-xs px-2.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>
                      {selectedDot === "all" ? "Tất cả đợt thi" : selectedDot}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">Tất cả đợt thi ({dotThiList.length})</SelectItem>
                  {dotThiList.map((dot) => (
                    <SelectItem key={dot} value={dot}>
                      {dot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lọc theo Môn học */}
            <div>
              <Select value={selectedMon} onValueChange={(val) => val && setSelectedMon(val)}>
                <SelectTrigger className="h-9 w-full rounded-md text-xs px-2.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>
                      {selectedMon === "all" ? "Tất cả môn học" : selectedMon}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">Tất cả môn ({monList.length})</SelectItem>
                  {monList.map((mon) => (
                    <SelectItem key={mon} value={mon}>
                      {mon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lọc theo Mức điểm */}
            <div>
              <Select value={selectedScoreRange} onValueChange={(val) => val && setSelectedScoreRange(val)}>
                <SelectTrigger className="h-9 w-full rounded-md text-xs px-2.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue>
                      {scoreRangeLabels[selectedScoreRange] || "Tất cả mức điểm"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">Tất cả mức điểm</SelectItem>
                  <SelectItem value="gioi">Điểm Giỏi (≥ 8.0)</SelectItem>
                  <SelectItem value="kha">Điểm Khá (6.5 – 7.9)</SelectItem>
                  <SelectItem value="trung_binh">Trung bình (5.0 – 6.4)</SelectItem>
                  <SelectItem value="can_on_tap">Cần ôn tập (&lt; 5.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hàng phụ: Sắp xếp kết quả */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 shrink-0 font-medium">
              <ArrowUpDown className="h-3 w-3" />
              <span>Sắp xếp:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: "newest", label: "Mới nhất" },
                { key: "oldest", label: "Cũ nhất" },
                { key: "score_desc", label: "Điểm cao nhất" },
                { key: "score_asc", label: "Điểm thấp nhất" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSortOrder(s.key)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    sortOrder === s.key
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trạng thái chưa có bài thi nào */}
      {!initialData?.length && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground sm:text-sm">
          Hoàn thành ít nhất một bài thi để xem điểm và nhận xét.
        </div>
      )}

      {/* Trạng thái bộ lọc không khớp bài thi nào */}
      {!!initialData.length && !filteredData.length && (
        <div className="rounded-md border border-dashed border-border bg-card p-8 text-center space-y-2.5">
          <Search className="h-6 w-6 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-semibold text-foreground">Không tìm thấy bài thi phù hợp</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Không có bài thi nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-1 h-8 text-xs gap-1.5 rounded-md">
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại tất cả bộ lọc
          </Button>
        </div>
      )}

      {/* DANH SÁCH BÀI THI */}
      <div className="grid gap-3.5">
        {filteredData.map((b) => {
          const c = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
          const m = Array.isArray(c?.mon) ? c.mon[0] : c?.mon;
          const ca = Array.isArray(c?.ca_thi) ? c.ca_thi[0] : c?.ca_thi;
          const d = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
          const nx = Array.isArray(b.nhan_xet_ai) ? b.nhan_xet_ai[0] : b.nhan_xet_ai;
          const phut =
            b.thoi_diem_vao_thi && b.thoi_diem_nop
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(b.thoi_diem_nop).getTime() -
                      new Date(b.thoi_diem_vao_thi).getTime()) /
                      60000,
                  ),
                )
              : 0;

          const score = Number(b.diem_tong ?? 0);
          const scoreColor =
            score >= 8.0
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : score >= 6.5
                ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20"
                : score >= 5.0
                  ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";

          return (
            <article key={b.bai_lam_id} className="rounded-md border border-border bg-card p-4 transition-colors hover:border-border/80">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{d?.ten_dot_thi}</p>
                  <h2 className="text-base font-bold text-foreground mt-0.5">{m?.ten_mon}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Đúng {b.so_cau_dung ?? 0} · Sai {b.so_cau_sai ?? 0} · {phut} phút làm bài
                  </p>
                </div>
                <div className={`rounded-md border px-3 py-1.5 text-center ${scoreColor}`}>
                  <p className="text-2xl font-bold tabular-nums">{score.toFixed(2)}</p>
                  <p className="text-[10px] uppercase tracking-wide font-medium">Điểm số</p>
                </div>
              </div>

              {/* Tỷ lệ đúng theo chuyên đề */}
              {!!b.phan_tich_chuyen_de?.length && (
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {b.phan_tich_chuyen_de.map((p) => {
                    const cd = Array.isArray(p.chuyen_de) ? p.chuyen_de[0] : p.chuyen_de;
                    const tyLe = Number(p.ty_le_dung ?? 0);
                    const isWeak = tyLe < 60;
                    return (
                      <div
                        key={cd?.ten_chuyen_de}
                        className={`flex items-center justify-between rounded p-2 text-xs transition-colors ${
                          isWeak
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{cd?.ten_chuyen_de}</span>
                        <strong className={`tabular-nums shrink-0 ${isWeak ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                          {tyLe.toFixed(0)}%
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nhận xét AI */}
              <div className="mt-3 flex gap-2.5 rounded border-l-2 border-primary bg-primary/5 p-3 text-xs text-foreground leading-relaxed">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p>
                  {lamSachNhanXet(nx?.noi_dung || "") || "Kết quả đang được phân tích."}
                </p>
              </div>

              {/* Footer card */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-2.5 text-xs text-muted-foreground">
                <span>
                  Nộp lúc {b.thoi_diem_nop ? new Date(b.thoi_diem_nop).toLocaleString("vi-VN") : "—"}
                </span>
                <Link
                  href={`/ket-qua/${b.bai_lam_id}`}
                  className="inline-flex min-h-9 items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <FileSearch className="h-3.5 w-3.5" /> Xem chi tiết bài làm <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
