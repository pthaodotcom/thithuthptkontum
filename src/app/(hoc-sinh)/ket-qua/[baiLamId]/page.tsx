import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSearch,
  Sparkles,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { lamSachNhanXet } from "@/lib/ai/gemini";
import { laySessionHienHanh } from "@/lib/auth/session";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const nhanMucKetQua = {
  CanOnTapGap: "Cần ôn tập thêm",
  TrungBinh: "Đạt mức trung bình",
  Kha: "Kết quả khá",
  DaNamVung: "Đã nắm vững",
} as const;

export default async function KetQuaBaiThiPage({
  params,
}: {
  params: Promise<{ baiLamId: string }>;
}) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const { baiLamId } = await params;
  const supabase = taoSupabaseServiceRole();
  const { data: baiLam } = await supabase
    .from("bai_lam_thi")
    .select(
      "bai_lam_id,ca_thi_mon_id,trang_thai,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_vao_thi,thoi_diem_nop,ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(so_thu_tu_ca,dot_thi!inner(ten_dot_thi))),nhan_xet_ai(noi_dung)",
    )
    .eq("bai_lam_id", baiLamId)
    .eq("hoc_sinh_tai_khoan_id", session.sub)
    .maybeSingle();

  if (!baiLam) notFound();
  if (baiLam.trang_thai !== "DaNopBai") redirect("/ky-thi");

  const caThiMon = Array.isArray(baiLam.ca_thi_mon) ? baiLam.ca_thi_mon[0] : baiLam.ca_thi_mon;
  const mon = Array.isArray(caThiMon?.mon) ? caThiMon.mon[0] : caThiMon?.mon;
  const caThi = Array.isArray(caThiMon?.ca_thi) ? caThiMon.ca_thi[0] : caThiMon?.ca_thi;
  const dotThi = Array.isArray(caThi?.dot_thi) ? caThi.dot_thi[0] : caThi?.dot_thi;
  const nhanXet = Array.isArray(baiLam.nhan_xet_ai) ? baiLam.nhan_xet_ai[0] : baiLam.nhan_xet_ai;
  const diem = Number(baiLam.diem_tong ?? 0);
  const soCauDung = baiLam.so_cau_dung ?? 0;
  const soCauSai = baiLam.so_cau_sai ?? 0;
  const tongSoCau = soCauDung + soCauSai;
  const tyLeDung = tongSoCau ? Math.round((soCauDung / tongSoCau) * 100) : 0;
  const soPhut = baiLam.thoi_diem_vao_thi && baiLam.thoi_diem_nop
    ? Math.max(0, Math.round(
        (new Date(baiLam.thoi_diem_nop).getTime() - new Date(baiLam.thoi_diem_vao_thi).getTime()) / 60_000,
      ))
    : 0;
  const mucKetQua = nhanMucKetQua[xepNhomNangLuc(diem)];
  const noiDungNhanXet = lamSachNhanXet(nhanXet?.noi_dung ?? "");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-primary/[0.03] px-5 py-8 text-center sm:px-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-semibold text-emerald-700">Đã nộp bài thành công</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Kết quả bài thi {mon?.ten_mon}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dotThi?.ten_dot_thi} · Ca {caThi?.so_thu_tu_ca}
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(220px,0.8fr)_1.5fr]">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-primary px-6 py-8 text-primary-foreground">
            <p className="text-sm font-medium text-primary-foreground/75">Điểm bài thi</p>
            <p className="mt-2 text-6xl font-bold tabular-nums">{diem.toFixed(2)}</p>
            <p className="mt-1 text-sm text-primary-foreground/75">trên thang điểm 10</p>
            <span className="mt-5 rounded-full bg-primary-foreground/15 px-3 py-1 text-sm font-semibold">
              {mucKetQua}
            </span>
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Số câu đúng", value: String(soCauDung), icon: Target },
                { label: "Tỷ lệ đúng", value: `${tyLeDung}%`, icon: BarChart3 },
                { label: "Thời gian làm", value: `${soPhut} phút`, icon: Clock3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-border p-4">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xl font-bold tabular-nums">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Mức điểm đạt được</span>
                <span className="tabular-nums text-muted-foreground">{diem.toFixed(2)}/10</span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`Điểm ${diem.toFixed(2)} trên 10`}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={diem}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, diem * 10)}%` }} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Đúng {soCauDung} câu · Sai {soCauSai} câu
              {baiLam.thoi_diem_nop
                ? ` · Nộp lúc ${new Date(baiLam.thoi_diem_nop).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold">Nhận xét sau bài thi</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {noiDungNhanXet || "Hệ thống đang tổng hợp nhận xét cho bài thi này. Bạn vẫn có thể xem lại bài làm và báo cáo cá nhân."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={`/tra-cuu?baiLamId=${baiLam.bai_lam_id}`}
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 justify-center")}
        >
          <FileSearch className="h-4 w-4" aria-hidden="true" /> Xem lại bài làm
        </Link>
        <Link
          href="/bao-cao-nang-luc"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-h-11 justify-center")}
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" /> Báo cáo năng lực
        </Link>
        <Link
          href="/ky-thi"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-h-11 justify-center")}
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" /> Về lịch thi
        </Link>
      </div>

      <Link href="/ket-qua" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
        Xem tất cả kết quả <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
