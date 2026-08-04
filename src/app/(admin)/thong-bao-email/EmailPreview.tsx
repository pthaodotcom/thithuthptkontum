"use client";

import { useState } from "react";
import { Eye, ExternalLink, LoaderCircle, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Preview = { nguoiNhan: string; hoTen: string; mon: string; dotThi: string; diem: number; nhom: string; nhanXet: string; lienKetBaoCao: string; tieuDe: string };

export default function EmailPreview({ baiLamId }: { baiLamId: string }) {
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function load(open: boolean) {
    if (!open || data || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/email-preview/${baiLamId}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Không tải được nội dung email");
      setData(body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không tải được nội dung email"); }
    finally { setLoading(false); }
  }
  return <Dialog onOpenChange={load}>
    <DialogTrigger aria-label="Xem trước nội dung email" className="group relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Eye className="h-4 w-4" aria-hidden="true" /><span role="tooltip" className="pointer-events-none absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Xem trước email</span></DialogTrigger>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" aria-hidden="true" />Xem trước email</DialogTitle><DialogDescription>Đây là nội dung phụ huynh sẽ nhận. Email không chứa đáp án hoặc thông tin đăng nhập.</DialogDescription></DialogHeader>
      {loading && <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin" /><span className="sr-only">Đang tải</span></div>}
      {error && <div role="alert" className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>}
      {data && <><dl className="grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-[90px_1fr]"><dt className="font-semibold text-muted-foreground">Đến</dt><dd className="break-all">{data.nguoiNhan}</dd><dt className="font-semibold text-muted-foreground">Tiêu đề</dt><dd className="font-medium">{data.tieuDe}</dd></dl><article className="space-y-4 rounded-xl border border-border bg-background p-5 leading-7 shadow-sm"><h2 className="text-xl font-bold text-teal-700">Kết quả thi thử</h2><p>Kính gửi Phụ huynh em <strong>{data.hoTen}</strong>,</p><p>Kết quả <strong>{data.dotThi}</strong> – môn <strong>{data.mon}</strong>: <strong>{data.diem.toFixed(2)}/10</strong>.</p><p>Nhóm năng lực: <strong>{data.nhom}</strong>.</p><div className="rounded-r-lg border-l-4 border-teal-600 bg-teal-50 p-3 text-slate-800">{data.nhanXet}</div><a href={data.lienKetBaoCao} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4">Xem báo cáo chi tiết <ExternalLink className="h-4 w-4" aria-hidden="true" /></a><p className="text-xs text-muted-foreground">Email tự động, không chứa đáp án hoặc thông tin đăng nhập.</p></article></>}
    </DialogContent>
  </Dialog>;
}
