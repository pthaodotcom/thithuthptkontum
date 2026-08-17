"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Actor = { maSo: string; hoTen: string };
type AuditItem = {
  id: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_id: string | null;
  nguoi_thuc_hien_tai_khoan_id: string | null;
  nguoi_thuc_hien: Actor | null;
  du_lieu: unknown;
  du_lieu_truoc: unknown;
  du_lieu_sau: unknown;
  thoi_diem: string;
  la_du_lieu_legacy: boolean;
};
type ApiData = {
  items: AuditItem[];
  page: number;
  pageSize: 25 | 50 | 100;
  total: number;
  boLoc: {
    hanhDong: string[];
    doiTuong: string[];
    nguoiThucHien: Array<{ id: string; maSo: string; hoTen: string }>;
  };
};

const emptyData: ApiData = {
  items: [], page: 1, pageSize: 25, total: 0,
  boLoc: { hanhDong: [], doiTuong: [], nguoiThucHien: [] },
};

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  const text = value == null ? "" : JSON.stringify(value, null, 2);
  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {text && (
          <button type="button" className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => void navigator.clipboard.writeText(text)}>
            <Copy className="h-3 w-3" /> Sao chép
          </button>
        )}
      </div>
      {text ? (
        <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {text}
        </pre>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Không có thông tin
        </div>
      )}
    </section>
  );
}

export default function AuditLogClient() {
  const [data, setData] = useState<ApiData>(emptyData);
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    tuNgay: "", denNgay: "", hanhDong: "", doiTuong: "",
    nguoiThucHien: "", pageSize: "25",
  });

  const params = useMemo(() => {
    const result = new URLSearchParams({ page: String(page), pageSize: filters.pageSize });
    if (filters.tuNgay) result.set("tuNgay", new Date(filters.tuNgay).toISOString());
    if (filters.denNgay) result.set("denNgay", new Date(filters.denNgay).toISOString());
    if (filters.hanhDong) result.set("hanhDong", filters.hanhDong);
    if (filters.doiTuong) result.set("doiTuong", filters.doiTuong);
    if (filters.nguoiThucHien) result.set("nguoiThucHien", filters.nguoiThucHien);
    return result;
  }, [filters, page]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/audit-log?${params}`, {
        cache: "no-store", signal,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Chưa tải được lịch sử thay đổi");
      setData(body.data);
      setError("");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Chưa tải được lịch sử thay đổi");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const changeFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Lịch sử thay đổi</h1>
        <p className="text-sm text-muted-foreground">
          Xem ai đã thay đổi thông tin nào và thay đổi vào lúc nào.
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-1 text-sm text-foreground">
          <span>Từ ngày, giờ</span>
          <input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={filters.tuNgay}
            onChange={(event) => changeFilter("tuNgay", event.target.value)} />
        </label>
        <label className="space-y-1 text-sm text-foreground">
          <span>Đến ngày, giờ</span>
          <input type="datetime-local" className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={filters.denNgay}
            onChange={(event) => changeFilter("denNgay", event.target.value)} />
        </label>
        <label className="space-y-1 text-sm text-foreground">
          <span>Hành động</span>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={filters.hanhDong}
            onChange={(event) => changeFilter("hanhDong", event.target.value)}>
            <option value="">Tất cả</option>
            {data.boLoc.hanhDong.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm text-foreground">
          <span>Đối tượng</span>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={filters.doiTuong}
            onChange={(event) => changeFilter("doiTuong", event.target.value)}>
            <option value="">Tất cả</option>
            {data.boLoc.doiTuong.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm text-foreground">
          <span>Người thực hiện</span>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={filters.nguoiThucHien}
            onChange={(event) => changeFilter("nguoiThucHien", event.target.value)}>
            <option value="">Tất cả</option>
            {data.boLoc.nguoiThucHien.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.maSo} · {actor.hoTen}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm text-foreground">
          <span>Số mục mỗi trang</span>
          <select className="h-10 w-full rounded-lg border border-input bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={filters.pageSize}
            onChange={(event) => changeFilter("pageSize", event.target.value)}>
            <option value="25">25</option><option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </section>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-destructive">{error}</p>}
      <div className="overflow-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left text-foreground">
            <tr>
              <th className="p-3">Thời điểm</th><th className="p-3">Hành động</th>
              <th className="p-3">Đối tượng</th><th className="p-3">Người thực hiện</th>
              <th className="p-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Đang tải…</td></tr>}
            {!loading && !data.items.length && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Không có thay đổi nào phù hợp.</td></tr>
            )}
            {!loading && data.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3 text-foreground">
                  {new Intl.DateTimeFormat("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium",
                  }).format(new Date(item.thoi_diem))}
                </td>
                <td className="p-3 font-medium text-foreground">{item.hanh_dong}</td>
                <td className="p-3">
                  <div className="text-foreground">{item.doi_tuong}</div>
                  <div className="max-w-60 truncate font-mono text-xs text-muted-foreground">{item.doi_tuong_id ?? "—"}</div>
                </td>
                <td className="p-3 text-foreground">
                  {item.nguoi_thuc_hien
                    ? `${item.nguoi_thuc_hien.maSo} · ${item.nguoi_thuc_hien.hoTen}`
                    : item.nguoi_thuc_hien_tai_khoan_id ?? "Hệ thống"}
                </td>
                <td className="p-3 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelected(item)}>Xem thay đổi</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{data.total} bản ghi · Trang {data.page}/{totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button>
          <Button variant="outline" size="sm"
            disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button>
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(value) => !value && setSelected(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>{selected?.hanh_dong} · {selected?.doi_tuong}</DialogTitle>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{selected?.id}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selected?.la_du_lieu_legacy && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Mục này được lưu theo định dạng cũ nên không tách riêng được thông tin trước và sau khi thay đổi.
            </p>
          )}
          {selected && (
            <div className="grid gap-4 md:grid-cols-2">
              <JsonPanel title="Trước" value={selected.du_lieu_truoc} />
              <JsonPanel title="Sau" value={selected.du_lieu_sau} />
            </div>
          )}
          {selected?.la_du_lieu_legacy && (
            <JsonPanel title="Thông tin đã lưu" value={selected.du_lieu} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
