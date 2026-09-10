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
      {data && <><dl className="grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-[90px_1fr]"><dt className="font-semibold text-muted-foreground">Đến</dt><dd className="break-all">{data.nguoiNhan}</dd><dt className="font-semibold text-muted-foreground">Tiêu đề</dt><dd className="font-medium">{data.tieuDe}</dd></dl><article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="bg-[#0f4c5c] px-6 py-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200">Hệ thống Thi thử THPT</p><h2 className="mt-2 text-xl font-bold">Kết quả học tập của học sinh</h2></header><div className="space-y-5 p-6 leading-7 text-slate-700"><p>Kính gửi Phụ huynh em <strong>{data.hoTen}</strong>,</p><p>Nhà trường gửi kết quả <strong>{data.dotThi}</strong> của em để gia đình cùng theo dõi và hỗ trợ việc ôn tập.</p><div className="grid overflow-hidden rounded-xl border border-slate-200 text-center sm:grid-cols-3"><div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Môn thi</p><p className="mt-1 font-bold text-slate-900">{data.mon}</p></div><div className="border-b border-slate-200 p-4 sm:border-b-0 sm:border-r"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Điểm số</p><p className="mt-1 text-xl font-bold text-teal-700">{data.diem.toFixed(2)}<span className="text-sm">/10</span></p></div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nhóm năng lực</p><p className="mt-1 font-bold text-slate-900">{data.nhom}</p></div></div><div className="rounded-r-lg border-l-4 border-teal-600 bg-teal-50 p-4 text-slate-800"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Nhận xét</p><p className="mt-1 whitespace-pre-line leading-relaxed">{data.nhanXet}</p></div><a href={data.lienKetBaoCao} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800">Xem báo cáo chi tiết <ExternalLink className="h-4 w-4" aria-hidden="true" /></a></div><footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs leading-5 text-slate-500">Email tự động từ Hệ thống Thi thử THPT của nhà trường, không chứa đáp án hoặc thông tin đăng nhập.</footer></article></>}
    </DialogContent>
  </Dialog>;
}
