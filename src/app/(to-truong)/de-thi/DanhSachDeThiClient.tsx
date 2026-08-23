"use client";

import Link from "next/link";
import { CalendarDays, Eye, Files } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type De = { de_thi_id: string; trang_thai: string; so_ma_de: number; ten_dot_thi: string; created_at: string };

export default function DanhSachDeThiClient({ monName, deThi }: { monName: string; deThi: De[] }) {
  return <div className="space-y-6">
    <header>
      <p className="text-sm font-semibold text-blue-600">Môn {monName}</p>
      <h1 className="text-2xl font-bold">Đề thi</h1>
      <p className="mt-1 text-sm text-slate-600">Xem nội dung các đề thi do Tổ trưởng tạo và giao cho học sinh.</p>
    </header>

    <section className="space-y-3" aria-labelledby="teacher-exams-title">
      <div><h2 id="teacher-exams-title" className="font-bold">Đề thi đã tạo</h2><p className="mt-1 text-sm text-slate-600">Bạn chỉ có quyền xem, không thể chỉnh sửa hoặc giao đề.</p></div>
      {deThi.length === 0 && <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-600">Chưa có đề thi nào được Tổ trưởng giao.</div>}
      {deThi.map((de) => <article key={de.de_thi_id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-950">{de.ten_dot_thi}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Files className="h-4 w-4" aria-hidden="true" />{de.so_ma_de} mã đề</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />Tạo lúc {formatDateTime(de.created_at)}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{statusLabel(de.trang_thai)}</span>
          </div>
        </div>
        <Link className={buttonVariants({ variant: "outline", className: "min-h-11 shrink-0" })} href={`/de-thi/${de.de_thi_id}`}><Eye className="mr-2 h-4 w-4" aria-hidden="true" />Xem đề</Link>
      </article>)}
    </section>
  </div>;
}

function statusLabel(status: string) {
  return ({ DangSoan: "Đang soạn", DaGiaoChuaBatDau: "Đã giao", DangThi: "Đang thi", DaThiXong: "Đã thi xong" } as Record<string, string>)[status] ?? status;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}
