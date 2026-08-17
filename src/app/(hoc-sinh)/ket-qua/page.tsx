import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, BookOpenCheck, FileSearch, Sparkles, TrendingUp, Trophy } from "lucide-react";

import { lamSachNhanXet } from "@/lib/ai/gemini";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function KetQuaPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");
  const supabase = taoSupabaseServiceRole();
  const { data } = await supabase.from("bai_lam_thi")
    .select("bai_lam_id,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_vao_thi,thoi_diem_nop,ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),nhan_xet_ai(noi_dung,nguon),phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de))")
    .eq("hoc_sinh_tai_khoan_id", session.sub).eq("trang_thai", "DaNopBai")
    .order("thoi_diem_nop", { ascending: false });
  const scores = (data || []).map((item) => Number(item.diem_tong));
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const latest = scores[0] || 0;
  const personalMetrics = [
    { label: "Số bài đã thi", value: String(scores.length), icon: BookOpenCheck },
    { label: "Điểm trung bình", value: average.toFixed(2), icon: TrendingUp },
    { label: "Điểm cao nhất", value: best.toFixed(2), icon: Trophy },
    { label: "Kết quả gần nhất", value: latest.toFixed(2), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-accent"><BarChart3 className="h-4 w-4" />Kết quả của bạn</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Điểm và nhận xét</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem điểm, phần kiến thức cần ôn và nhận xét của từng bài thi.</p>
      </div>

      {!!scores.length && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{personalMetrics.map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{item.label}</p><Icon className="h-5 w-5 text-primary" /></div><p className="mt-3 text-3xl font-bold tabular-nums">{item.value}</p></div>; })}</section>
<section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">Điểm các lần thi gần đây</h2><div className="mt-4 space-y-3">{(data || []).slice(0, 8).map((item) => { const ctm = Array.isArray(item.ca_thi_mon) ? item.ca_thi_mon[0] : item.ca_thi_mon; const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon; const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi; const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi; const score = Number(item.diem_tong); return <div key={item.bai_lam_id}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate font-medium">{mon?.ten_mon} · {dot?.ten_dot_thi}</span><span className="tabular-nums text-muted-foreground">{score.toFixed(2)}/10</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${mon?.ten_mon}: ${score.toFixed(2)} trên 10`}><div className="h-full rounded-full bg-primary" style={{ width: `${score * 10}%` }} /></div></div>; })}</div></section>
      </>}

      {!data?.length && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Hoàn thành ít nhất một bài thi để xem điểm và nhận xét.
        </div>
      )}

      <div className="grid gap-4">
        {(data ?? []).map((b) => {
          const c = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
          const m = Array.isArray(c?.mon) ? c.mon[0] : c?.mon;
          const ca = Array.isArray(c?.ca_thi) ? c.ca_thi[0] : c?.ca_thi;
          const d = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
          const nx = Array.isArray(b.nhan_xet_ai) ? b.nhan_xet_ai[0] : b.nhan_xet_ai;
          const phut = b.thoi_diem_vao_thi && b.thoi_diem_nop
            ? Math.max(0, Math.round((new Date(b.thoi_diem_nop).getTime() - new Date(b.thoi_diem_vao_thi).getTime()) / 60000))
            : 0;
          return (
            <article key={b.bai_lam_id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{d?.ten_dot_thi}</p>
                  <h2 className="text-lg font-semibold text-foreground">{m?.ten_mon}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Đúng {b.so_cau_dung} · Sai {b.so_cau_sai} · {phut} phút
                  </p>
                </div>
                <div className="rounded-lg bg-primary/5 px-4 py-2 text-center">
                  <p className="text-3xl font-bold tabular-nums text-primary">{Number(b.diem_tong).toFixed(2)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Điểm</p>
                </div>
              </div>

              {!!b.phan_tich_chuyen_de?.length && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {b.phan_tich_chuyen_de.map((p) => {
                    const cd = Array.isArray(p.chuyen_de) ? p.chuyen_de[0] : p.chuyen_de;
                    return (
                      <div key={cd?.ten_chuyen_de} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                        <span className="text-foreground">{cd?.ten_chuyen_de}</span>
                        <strong className="tabular-nums text-foreground">{Number(p.ty_le_dung).toFixed(0)}%</strong>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex gap-3 rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm text-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  {lamSachNhanXet(nx?.noi_dung || "") || "Kết quả đang được phân tích."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-muted-foreground">
                <span>Nộp lúc {b.thoi_diem_nop ? new Date(b.thoi_diem_nop).toLocaleString("vi-VN") : "—"}</span>
                <Link href={`/ket-qua/${b.bai_lam_id}`} className="inline-flex min-h-11 items-center gap-1 font-medium text-primary hover:underline">
                  <FileSearch className="h-4 w-4" /> Xem kết quả bài thi <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
