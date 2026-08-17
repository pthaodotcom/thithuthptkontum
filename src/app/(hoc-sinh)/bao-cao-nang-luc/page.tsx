import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Minus,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type KetQuaDaNop = {
  baiLamId: string;
  mon: string;
  dotThi: string;
  diem: number;
  soCauDung: number;
  soCauSai: number;
  nopLuc: string | null;
};

type TongHopMon = {
  mon: string;
  soBai: number;
  diemTrungBinh: number;
  diemGanNhat: number;
  tyLeDung: number;
  thayDoi: number | null;
};

function layMot<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function tongHopTheoMon(rows: KetQuaDaNop[]): TongHopMon[] {
  const groups = new Map<string, KetQuaDaNop[]>();
  for (const row of rows) groups.set(row.mon, [...(groups.get(row.mon) ?? []), row]);
  return [...groups.entries()].map(([mon, subjectRows]) => {
    const sorted = [...subjectRows].sort((a, b) => Date.parse(b.nopLuc ?? "") - Date.parse(a.nopLuc ?? ""));
    const tongDung = subjectRows.reduce((sum, row) => sum + row.soCauDung, 0);
    const tongCau = subjectRows.reduce((sum, row) => sum + row.soCauDung + row.soCauSai, 0);
    return {
      mon,
      soBai: subjectRows.length,
      diemTrungBinh: subjectRows.reduce((sum, row) => sum + row.diem, 0) / subjectRows.length,
      diemGanNhat: sorted[0]!.diem,
      tyLeDung: tongCau ? Math.round((tongDung / tongCau) * 100) : 0,
      thayDoi: sorted.length >= 2 ? sorted[0]!.diem - sorted[1]!.diem : null,
    };
  }).sort((a, b) => b.diemTrungBinh - a.diemTrungBinh || a.mon.localeCompare(b.mon, "vi"));
}

export default async function BaoCaoNangLucPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const { data: attempts } = await supabase
    .from("bai_lam_thi")
    .select(
      "bai_lam_id,trang_thai,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_nop,ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi)))",
    )
    .eq("hoc_sinh_tai_khoan_id", session.sub);

  const ketQua: KetQuaDaNop[] = (attempts ?? []).flatMap((attempt) => {
    if (attempt.trang_thai !== "DaNopBai" || attempt.diem_tong === null) return [];
    const caThiMon = layMot(attempt.ca_thi_mon);
    const mon = layMot(caThiMon?.mon);
    const caThi = layMot(caThiMon?.ca_thi);
    const dotThi = layMot(caThi?.dot_thi);
    if (!mon) return [];
    return [{
      baiLamId: attempt.bai_lam_id,
      mon: mon.ten_mon,
      dotThi: dotThi?.ten_dot_thi ?? "Đợt thi",
      diem: Number(attempt.diem_tong),
      soCauDung: attempt.so_cau_dung ?? 0,
      soCauSai: attempt.so_cau_sai ?? 0,
      nopLuc: attempt.thoi_diem_nop,
    }];
  }).sort((a, b) => Date.parse(b.nopLuc ?? "") - Date.parse(a.nopLuc ?? ""));

  const tongSoBai = attempts?.length ?? 0;
  const soBaiDaThi = ketQua.length;
  const soBaiVang = (attempts ?? []).filter((attempt) => attempt.trang_thai === "VangMat").length;
  const tienDo = tongSoBai ? Math.round((soBaiDaThi / tongSoBai) * 100) : 0;
  const diemTrungBinh = soBaiDaThi
    ? ketQua.reduce((sum, row) => sum + row.diem, 0) / soBaiDaThi
    : 0;
  const diemCaoNhat = soBaiDaThi ? Math.max(...ketQua.map((row) => row.diem)) : 0;
  const theoMon = tongHopTheoMon(ketQua);
  const monTotNhat = theoMon[0];
  const monCanUuTien = theoMon.length > 1 ? theoMon[theoMon.length - 1] : null;

  return (
    <div className="space-y-6">
      <header>
        <p className="flex items-center gap-2 text-sm font-semibold text-accent">
          <TrendingUp className="h-4 w-4" aria-hidden="true" /> Báo cáo cá nhân
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Báo cáo năng lực và tiến độ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Tổng hợp từ các bài thi bạn đã nộp trong hệ thống. Báo cáo giúp theo dõi tiến độ và xác định môn cần ưu tiên ôn tập.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Đã hoàn thành", value: `${soBaiDaThi}/${tongSoBai} bài`, icon: BookOpenCheck },
          { label: "Điểm trung bình", value: diemTrungBinh.toFixed(2), icon: Target },
          { label: "Điểm cao nhất", value: diemCaoNhat.toFixed(2), icon: Trophy },
          { label: "Bài vắng mặt", value: String(soBaiVang), icon: CalendarClock },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-bold">Tiến độ hoàn thành lịch thi</h2>
            <p className="mt-1 text-sm text-muted-foreground">Đã nộp {soBaiDaThi} trong tổng số {tongSoBai} bài được xếp lịch.</p>
          </div>
          <p className="text-3xl font-bold tabular-nums text-primary">{tienDo}%</p>
        </div>
        <div
          className="mt-5 h-4 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`Đã hoàn thành ${tienDo}% lịch thi`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tienDo}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${tienDo}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {soBaiDaThi} đã hoàn thành</span>
          <span>{Math.max(0, tongSoBai - soBaiDaThi - soBaiVang)} chưa hoàn thành</span>
          <span>{soBaiVang} vắng mặt</span>
        </div>
      </section>

      {!ketQua.length ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 font-bold">Chưa có kết quả để phân tích</h2>
          <p className="mt-2 text-sm text-muted-foreground">Hoàn thành ít nhất một bài thi để bắt đầu theo dõi tiến độ.</p>
          <Link href="/ky-thi" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Xem lịch thi <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Kết quả theo môn</h2>
              <p className="mt-1 text-sm text-muted-foreground">So sánh điểm trung bình và tỷ lệ trả lời đúng của từng môn.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {theoMon.map((item) => (
                <article key={item.mon} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{item.mon}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{item.soBai} bài đã thi · Đúng {item.tyLeDung}%</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{item.diemTrungBinh.toFixed(2)}</p>
                  </div>
                  <div
                    className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${item.mon}: điểm trung bình ${item.diemTrungBinh.toFixed(2)} trên 10`}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-valuenow={item.diemTrungBinh}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.diemTrungBinh * 10)}%` }} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gần nhất: <strong className="text-foreground">{item.diemGanNhat.toFixed(2)}</strong></span>
                    {item.thayDoi === null ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3.5 w-3.5" aria-hidden="true" /> Chưa đủ dữ liệu xu hướng</span>
                    ) : item.thayDoi >= 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /> +{item.thayDoi.toFixed(2)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-destructive"><ArrowDownRight className="h-4 w-4" aria-hidden="true" /> {item.thayDoi.toFixed(2)}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {monTotNhat && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <p className="text-sm font-semibold text-emerald-700">Môn đang có kết quả tốt nhất</p>
                <h2 className="mt-2 text-xl font-bold">{monTotNhat.mon}</h2>
                <p className="mt-2 text-sm leading-6">Điểm trung bình {monTotNhat.diemTrungBinh.toFixed(2)} qua {monTotNhat.soBai} bài đã thi.</p>
              </div>
            )}
            {monCanUuTien && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <p className="text-sm font-semibold text-amber-800">Môn nên ưu tiên ôn tập</p>
                <h2 className="mt-2 text-xl font-bold">{monCanUuTien.mon}</h2>
                <p className="mt-2 text-sm leading-6">Điểm trung bình hiện tại là {monCanUuTien.diemTrungBinh.toFixed(2)}. Nhận định này chỉ dựa trên các bài đã nộp.</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold">Tiến trình gần đây</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tối đa 8 bài gần nhất, sắp xếp theo thời gian nộp.</p>
            </div>
            <div className="mt-5 space-y-4">
              {ketQua.slice(0, 8).map((row) => (
                <Link
                  key={row.baiLamId}
                  href={`/ket-qua/${row.baiLamId}`}
                  className="group block rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{row.mon} · {row.dotThi}</span>
                    <span className="shrink-0 font-bold tabular-nums">{row.diem.toFixed(2)}/10</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted group-hover:bg-background" role="img" aria-label={`${row.mon}: ${row.diem.toFixed(2)} trên 10`}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, row.diem * 10)}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
