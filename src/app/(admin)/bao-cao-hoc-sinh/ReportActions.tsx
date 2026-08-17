"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, LoaderCircle, RefreshCw } from "lucide-react";
import { sinhLaiNhanXet, type ReportActionState } from "./actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ActionButton({ baiLamIds }: { baiLamIds: string[] }) {
  const [state, formAction, pending] = useActionState(sinhLaiNhanXet, null);
  const label = "Tạo lại nhận xét cho toàn bộ môn trong đợt thi";

  return <div className="space-y-1.5">
    <form action={formAction}>
      {baiLamIds.map((baiLamId) => <input key={baiLamId} type="hidden" name="baiLamId" value={baiLamId} />)}
      <button disabled={pending} aria-label={label} title={label} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      </button>
    </form>
    {state && <p role="status" className={`max-w-64 text-xs ${state.ok ? "text-emerald-700" : "text-amber-700"}`}>{state.message}</p>}
  </div>;
}

export type MonHocPreview = {
  baiLamId: string;
  mon: string;
  diem: number;
  nguon: string;
  noiDung: string;
  sinhLuc: string | null;
  nopLuc: string | null;
};

export type ReportPreview = {
  hoTen: string;
  maSo: string;
  lop: string;
  dotThi: string;
  monHoc: MonHocPreview[];
};

export default function ReportActions({ preview }: { preview: ReportPreview }) {
  const [open, setOpen] = useState(false);
  const baiLamIds = preview.monHoc.map((item) => item.baiLamId);
  const diemTrungBinh = preview.monHoc.reduce((tong, item) => tong + item.diem, 0) / preview.monHoc.length;
  const soMonCoNhanXet = preview.monHoc.filter((item) => item.noiDung).length;

  return <>
    <div className="flex flex-wrap items-start gap-2">
      <button type="button" onClick={() => setOpen(true)} aria-label="Xem báo cáo theo đợt thi" title="Xem báo cáo theo đợt thi" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Eye className="h-4 w-4" />
      </button>
      <ActionButton baiLamIds={baiLamIds} />
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Báo cáo đợt thi của {preview.hoTen}</DialogTitle>
          <DialogDescription>{preview.maSo} · {preview.lop} · {preview.dotThi}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Số môn đã thi</p><p className="mt-1 text-3xl font-bold tabular-nums">{preview.monHoc.length}</p></div>
          <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Điểm trung bình</p><p className="mt-1 text-3xl font-bold tabular-nums">{diemTrungBinh.toFixed(2)}</p></div>
          <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Đã có nhận xét</p><p className="mt-1 text-3xl font-bold tabular-nums">{soMonCoNhanXet}/{preview.monHoc.length}</p></div>
        </div>

        <section className="space-y-3">
          <h3 className="font-semibold">Kết quả và nhận xét theo môn</h3>
          {preview.monHoc.map((item) => <article key={item.baiLamId} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold">{item.mon}</h4>
                <p className="mt-1 text-xs text-muted-foreground">Cách tạo nhận xét: {item.nguon === "AI" ? "Tạo tự động" : "Theo mẫu có sẵn"}</p>
              </div>
              <div className="text-right"><p className="text-2xl font-bold tabular-nums">{item.diem.toFixed(2)}</p><p className="text-xs text-muted-foreground">điểm</p></div>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">{item.noiDung || "Chưa có nhận xét."}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{item.sinhLuc ? `Tạo lúc ${new Date(item.sinhLuc).toLocaleString("vi-VN")}` : "Chưa tạo nhận xét"}</span>
              <Link href={`/tra-cuu?baiLamId=${item.baiLamId}`} className="inline-flex min-h-9 items-center gap-1 font-semibold text-primary hover:underline">Xem chi tiết bài thi <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </article>)}
        </section>
      </DialogContent>
    </Dialog>
  </>;
}
