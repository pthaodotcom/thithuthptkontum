import Link from "next/link";
import { layBaoCao } from "@/lib/reports/data";

const nhanNhom: Record<string, string> = {
  CanOnTapGap: "Cần ôn tập gấp", TrungBinh: "Trung bình", Kha: "Khá", DaNamVung: "Đã nắm vững",
};

export default async function ReportOverview({ title, monId, lopId, caThiMonId }: { title: string; monId?: string; lopId?: string; caThiMonId?: string }) {
  const query = new URLSearchParams();
  if (monId) query.set("monId", monId);
  if (lopId) query.set("lopId", lopId);
  if (caThiMonId) query.set("caThiMonId", caThiMonId);

  const daChonDu = Boolean(monId && lopId && caThiMonId);
  const header = <div className="flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-2xl font-bold text-foreground">{title}</h1><p className="text-sm text-muted-foreground">Kết quả các bài thi đã nộp thuộc lớp và môn bạn được xem.</p></div>
    {daChonDu && <div className="flex gap-2">
      <Link className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted" href={`/api/bao-cao/xuat?format=xlsx&${query}`}>Xuất Excel</Link>
      <Link className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/80" href={`/api/bao-cao/xuat?format=pdf&${query}`}>Xuất PDF</Link>
    </div>}
  </div>;

  if (!daChonDu) {
    return <div className="space-y-6">
      {header}
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Chọn môn, lớp và ca thi ở trên để xem báo cáo.</div>
    </div>;
  }

  const report = await layBaoCao({ monId, lopId, caThiMonId });
  return <div className="space-y-6">
    {header}
    {report.rows.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Kết quả chưa sẵn sàng cho ca thi này.</div> : <>
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Số bài đã chấm</p><p className="text-3xl font-bold text-foreground">{report.rows.length}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Điểm trung bình</p><p className="text-3xl font-bold text-foreground">{report.diemTrungBinh.toFixed(2)}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Phổ điểm</p><p className="mt-2 text-sm text-foreground">{report.phoDiem.map(x => `${x.nhan}: ${x.soLuong}`).join(" · ")}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Tổng vi phạm</p><p className="text-3xl font-bold text-destructive">{report.tongViPham}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Bài có vi phạm</p><p className="text-3xl font-bold text-foreground">{report.soBaiCoViPham}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Bài bị thu do vi phạm</p><p className="text-3xl font-bold text-destructive">{report.soBaiTuDongThu}</p></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Kết quả theo 4 mức</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">{report.nhomNangLuc.map(x => <div key={x.nhom} className="rounded-lg bg-muted p-3"><p className="text-sm text-muted-foreground">{nhanNhom[x.nhom]}</p><p className="text-2xl font-bold text-foreground">{x.soLuong}</p></div>)}</div>
      </section>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm"><thead className="bg-muted/50 text-foreground"><tr><th className="p-3 text-left">Học sinh</th><th className="p-3 text-left">Lớp</th><th className="p-3 text-left">Môn/Đợt</th><th className="p-3 text-right">Điểm</th><th className="p-3 text-left">Nhóm</th><th className="p-3 text-left">Vi phạm</th></tr></thead>
          <tbody>{report.rows.map(row => <tr key={row.baiLamId} className="border-t border-border"><td className="p-3"><Link className="font-medium text-primary hover:underline" href={`/tra-cuu?baiLamId=${row.baiLamId}`}>{row.hoTen}</Link><div className="text-xs text-muted-foreground">{row.maSo}</div></td><td className="p-3 text-foreground">{row.lop}</td><td className="p-3 text-foreground">{row.mon}<div className="text-xs text-muted-foreground">{row.dotThi}</div></td><td className="p-3 text-right font-bold text-foreground">{row.diem.toFixed(2)}</td><td className="p-3 text-foreground">{nhanNhom[row.nhom]}</td><td className="p-3">{row.soViPham ? <span className="font-semibold text-destructive">{row.soViPham} lần{row.tuDongThuBaiDoViPham ? " · Bài đã bị thu" : ""}</span> : <span className="text-muted-foreground">Không có</span>}</td></tr>)}</tbody>
        </table>
      </div>
    </>}
  </div>;
}
