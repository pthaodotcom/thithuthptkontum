"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ViPham = { id: string; loai_vi_pham: string; thoi_diem: string };
type Row = {
  bai_lam_id: string;
  trang_thai: string;
  tai_khoan: { ma_so: string; ho_ten: string } | Array<{ ma_so: string; ho_ten: string }> | null;
  ca_thi_mon: { mon: { ten_mon: string } | null; ca_thi: { dot_thi: { ten_dot_thi: string } | null } | null }
    | Array<{ mon: { ten_mon: string } | null; ca_thi: { dot_thi: { ten_dot_thi: string } | null } | null }> | null;
  vi_pham: ViPham[] | null;
};

const NHAN_LOAI: Record<string, string> = {
  Copy: "Sao chép nội dung",
  ChuyenTab: "Chuyển tab/ứng dụng",
  MatKetNoi: "Mất kết nối",
};

const NHAN_TRANG_THAI: Record<string, string> = {
  DangThi: "Đang thi",
  DaNopBai: "Đã nộp bài",
  BiKhoaChoXuLy: "Chờ xử lý",
  ChuaDangNhap: "Chưa vào thi",
};

export default function MonitorClient() {
  const [data, setData] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/giam-sat", { cache: "no-store", signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Không thể tải danh sách vi phạm.");
      setData(body.data ?? []);
      setError("");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Không thể tải danh sách vi phạm.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const pollingId = setInterval(() => void load(controller.signal), 30_000);
    return () => { controller.abort(); clearInterval(pollingId); };
  }, [load]);

  const summary = useMemo(() => {
    const total = data.reduce((sum, row) => sum + (row.vi_pham?.length ?? 0), 0);
    return { total, students: data.length, threshold: data.filter((row) => (row.vi_pham?.length ?? 0) >= 3).length };
  }, [data]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Quản lý vi phạm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi các vi phạm được hệ thống tự động ghi nhận trong quá trình làm bài.</p>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{error}</div>}

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">Tổng vi phạm: {summary.total}</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">Học sinh vi phạm: {summary.students}</span>
        <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">Đạt ngưỡng xử lý: {summary.threshold}</span>
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow className="bg-muted/50 hover:bg-muted/50"><TableHead>Học sinh</TableHead><TableHead>Đợt thi</TableHead><TableHead>Môn</TableHead><TableHead>Loại vi phạm gần nhất</TableHead><TableHead>Số lần</TableHead><TableHead>Thời điểm gần nhất</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Chưa ghi nhận vi phạm nào.</TableCell></TableRow>}
            {data.map((item) => {
              const account = Array.isArray(item.tai_khoan) ? item.tai_khoan[0] : item.tai_khoan;
              const exam = Array.isArray(item.ca_thi_mon) ? item.ca_thi_mon[0] : item.ca_thi_mon;
              const violations = [...(item.vi_pham ?? [])].sort((a, b) => Date.parse(b.thoi_diem) - Date.parse(a.thoi_diem));
              const latest = violations[0];
              return <TableRow key={item.bai_lam_id}>
                <TableCell><p className="font-medium">{account?.ho_ten}</p><p className="text-xs text-muted-foreground">{account?.ma_so}</p></TableCell>
                <TableCell>{exam?.ca_thi?.dot_thi?.ten_dot_thi}</TableCell>
                <TableCell>{exam?.mon?.ten_mon}</TableCell>
                <TableCell>{latest ? (NHAN_LOAI[latest.loai_vi_pham] ?? latest.loai_vi_pham) : "—"}</TableCell>
                <TableCell><span className="font-semibold text-destructive">{violations.length}</span></TableCell>
                <TableCell>{latest && new Date(latest.thoi_diem).toLocaleString("vi-VN")}</TableCell>
                <TableCell>{violations.length >= 3 ? <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">Đạt ngưỡng xử lý</span> : <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Đã ghi nhận</span>}</TableCell>
                <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelected(item)}><Eye className="mr-1 h-4 w-4" />Chi tiết</Button></TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Chi tiết vi phạm</DialogTitle></DialogHeader>
          {selected && <div className="space-y-3">
            <p className="text-sm">Học sinh: <b>{(Array.isArray(selected.tai_khoan) ? selected.tai_khoan[0] : selected.tai_khoan)?.ho_ten}</b></p>
            <div className="max-h-80 space-y-2 overflow-auto">
              {[...(selected.vi_pham ?? [])].sort((a,b) => Date.parse(b.thoi_diem)-Date.parse(a.thoi_diem)).map((viPham, index) => <div key={viPham.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span><b>Lần {selected.vi_pham!.length - index}:</b> {NHAN_LOAI[viPham.loai_vi_pham] ?? viPham.loai_vi_pham}</span><time className="text-muted-foreground">{new Date(viPham.thoi_diem).toLocaleString("vi-VN")}</time></div>)}
            </div>
            <p className="text-xs text-muted-foreground">Trạng thái bài thi: {NHAN_TRANG_THAI[selected.trang_thai] ?? selected.trang_thai}</p>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
