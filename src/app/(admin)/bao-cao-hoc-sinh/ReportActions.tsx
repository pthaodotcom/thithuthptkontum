"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, LoaderCircle, RefreshCw } from "lucide-react";
import { sinhLaiNhanXet, type ReportActionState } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ActionButton({ action, baiLamId, label, icon, disabled }: { action: (_state: ReportActionState, data: FormData) => Promise<ReportActionState>; baiLamId: string; label: string; icon: React.ReactNode; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(action, null);
  return <div className="space-y-1.5">
    <form action={formAction}><input type="hidden" name="baiLamId" value={baiLamId} /><button disabled={disabled || pending} aria-label={label} title={label} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}</button></form>
    {state && <p role="status" className={`max-w-56 text-xs ${state.ok ? "text-emerald-700" : "text-amber-700"}`}>{state.message}</p>}
  </div>;
}

type ReportPreview = { hoTen: string; maSo: string; lop: string; mon: string; dotThi: string; diem: number; nguon: string; noiDung: string; sinhLuc: string | null; nopLuc: string | null };

export default function ReportActions({ baiLamId, preview }: { baiLamId: string; preview: ReportPreview }) {
  const [open, setOpen] = useState(false);
  return <><div className="flex flex-wrap items-start gap-2">
    <button type="button" onClick={() => setOpen(true)} aria-label="Xem báo cáo" title="Xem báo cáo" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Eye className="h-4 w-4" /></button>
    <ActionButton action={sinhLaiNhanXet} baiLamId={baiLamId} label="Tạo lại nhận xét bằng AI" icon={<RefreshCw className="h-4 w-4" />} />
  </div>
  <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Báo cáo của {preview.hoTen}</DialogTitle><DialogDescription>{preview.maSo} · {preview.lop} · {preview.mon} · {preview.dotThi}</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Điểm</p><p className="mt-1 text-3xl font-bold tabular-nums">{preview.diem.toFixed(2)}</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Nguồn nhận xét</p><p className="mt-2 font-semibold">{preview.nguon}</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Nộp bài</p><p className="mt-2 font-medium">{preview.nopLuc ? new Date(preview.nopLuc).toLocaleString("vi-VN") : "—"}</p></div></div>
      <section className="rounded-xl border border-border p-4"><h3 className="font-semibold">Nội dung nhận xét</h3><p className="mt-2 whitespace-pre-wrap leading-7 text-muted-foreground">{preview.noiDung || "Chưa có nhận xét."}</p>{preview.sinhLuc && <p className="mt-3 text-xs text-muted-foreground">Tạo lúc {new Date(preview.sinhLuc).toLocaleString("vi-VN")}</p>}</section>
      <div className="flex justify-end"><Link href={`/tra-cuu?baiLamId=${baiLamId}`} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Xem dữ liệu đối chiếu</Link></div>
    </DialogContent>
  </Dialog></>;
}
