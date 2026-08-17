import Link from "next/link";
import { layBaoCao, tongHopMonTheoLop } from "@/lib/reports/data";

export default async function SubjectOverview({ monId }: { monId?: string }) {
  if (!monId) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Chọn môn để so sánh kết quả giữa các lớp.</div>;
  const report = await layBaoCao({ monId });
  const classes = tongHopMonTheoLop(report.rows);
  if (!classes.length) return <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Chưa có bài đã nộp của môn này.</div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-foreground">Kết quả môn học toàn trường</h1><p className="text-sm text-muted-foreground">So sánh kết quả giữa các lớp bạn được xem.</p></div>
      <div className="flex gap-2">
        <Link className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted" href={`/api/bao-cao/xuat?format=xlsx&monId=${encodeURIComponent(monId)}`}>Xuất Excel</Link>
        <Link className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/80" href={`/api/bao-cao/xuat?format=pdf&monId=${encodeURIComponent(monId)}`}>Xuất PDF</Link>
      </div>
    </div>
    <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Số lớp</p><p className="text-3xl font-bold">{classes.length}</p></div>
      <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Tổng số bài</p><p className="text-3xl font-bold">{report.rows.length}</p></div>
      <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Điểm trung bình môn</p><p className="text-3xl font-bold">{report.diemTrungBinh.toFixed(2)}</p></div>
      <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Tổng vi phạm</p><p className="text-3xl font-bold text-destructive">{report.tongViPham}</p></div>
      <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Bài bị thu do vi phạm</p><p className="text-3xl font-bold text-destructive">{report.soBaiTuDongThu}</p></div>
    </section>
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full text-sm">
      <thead className="bg-muted/50"><tr><th className="p-3 text-left">Lớp</th><th className="p-3 text-right">Số bài</th><th className="p-3 text-right">Điểm trung bình</th><th className="p-3 text-right">Tỷ lệ đạt</th><th className="p-3 text-left">Kết quả theo mức</th></tr></thead>
      <tbody>{classes.map((item) => <tr key={item.lopId ?? item.lop} className="border-t border-border"><td className="p-3 font-medium">{item.lop}</td><td className="p-3 text-right">{item.soBai}</td><td className="p-3 text-right font-bold">{item.diemTrungBinh.toFixed(2)}</td><td className="p-3 text-right">{item.tyLeDat.toFixed(2)}%</td><td className="p-3 text-muted-foreground">Cần ôn {item.nhomNangLuc.CanOnTapGap} · Trung bình {item.nhomNangLuc.TrungBinh} · Khá {item.nhomNangLuc.Kha} · Đã nắm vững {item.nhomNangLuc.DaNamVung}</td></tr>)}</tbody>
    </table></div>
  </div>;
}
