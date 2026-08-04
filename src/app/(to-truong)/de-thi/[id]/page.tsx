import Link from "next/link";
import { ArrowLeft, CalendarDays, Files } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import RichContent from "@/components/RichContent";
import { buttonVariants } from "@/components/ui/button";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Part = "I" | "II" | "III";
type Snapshot = {
  snapshot_id: string;
  phan: Part;
  noi_dung: string;
  chi_tiet_cau_hoi_snapshot: { id: string; thu_tu: number; noi_dung: string }[];
};
type DisplayItem = { snapshot_id: string; phan: Part; thu_tu_phuong_an?: number[] };

export default async function XemDeThiPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") redirect("/dang-nhap");
  const { id } = await params;
  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase.from("mon").select("mon_id,ten_mon").eq("to_truong_tai_khoan_id", session.sub).maybeSingle();
  if (!mon) notFound();

  const [{ data: exam }, { data: snapshots }, { data: codes }] = await Promise.all([
    supabase.from("de_thi").select("de_thi_id,trang_thai,so_ma_de,created_at,ca_thi_mon!inner(mon_id,ca_thi(dot_thi(ten_dot_thi)))").eq("de_thi_id", id).eq("ca_thi_mon.mon_id", mon.mon_id).maybeSingle(),
    supabase.from("cau_hoi_snapshot").select("snapshot_id,phan,noi_dung,chi_tiet_cau_hoi_snapshot(id,thu_tu,noi_dung)").eq("de_thi_id", id),
    supabase.from("ma_de").select("ma_de_id,so_thu_tu_ma,thu_tu_hien_thi").eq("de_thi_id", id).order("so_thu_tu_ma"),
  ]);
  if (!exam) notFound();

  const caThiMon = Array.isArray(exam.ca_thi_mon) ? exam.ca_thi_mon[0] : exam.ca_thi_mon;
  const caThi = Array.isArray(caThiMon?.ca_thi) ? caThiMon.ca_thi[0] : caThiMon?.ca_thi;
  const dotThi = Array.isArray(caThi?.dot_thi) ? caThi.dot_thi[0] : caThi?.dot_thi;
  const examName = dotThi?.ten_dot_thi ?? "Đợt thi chưa xác định";
  const snapshotMap = new Map((snapshots ?? []).map((item) => [item.snapshot_id, item as Snapshot]));

  return <div className="space-y-6">
    <Link className={buttonVariants({ variant: "ghost", className: "-ml-3 min-h-11" })} href="/de-thi"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Quay lại danh sách đề</Link>

    <header className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-blue-600">Môn {mon.ten_mon}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950">{examName}</h1>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5"><Files className="h-4 w-4" aria-hidden="true" />{exam.so_ma_de} mã đề</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />Tạo lúc {formatDateTime(exam.created_at)}</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{statusLabel(exam.trang_thai)}</span>
      </div>
      <p className="mt-4 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-800">Đây là nội dung snapshot đã giao cho học sinh. Mọi thay đổi trong ngân hàng câu hỏi sau thời điểm tạo đề không ảnh hưởng đến bản này.</p>
    </header>

    <section className="space-y-4" aria-labelledby="codes-title">
      <div><h2 id="codes-title" className="font-bold">Nội dung các mã đề</h2><p className="mt-1 text-sm text-slate-600">Mở từng mã để xem đúng thứ tự câu hỏi và phương án đã giao.</p></div>
      {(codes ?? []).map((code, index) => {
        const display = (Array.isArray(code.thu_tu_hien_thi) ? code.thu_tu_hien_thi : []) as DisplayItem[];
        return <details key={code.ma_de_id} open={index === 0} className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <summary className="cursor-pointer px-5 py-4 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">Mã đề {String(code.so_thu_tu_ma).padStart(3, "0")} · {display.length} câu</summary>
          <div className="border-t bg-slate-100 p-3 sm:p-6">
            <article className="mx-auto max-w-4xl bg-white px-5 py-8 shadow-sm sm:px-10">
              <header className="mb-8 grid grid-cols-[1fr_auto] gap-5 border-b-2 border-slate-900 pb-5 text-center">
                <div><p className="text-sm font-semibold uppercase">Đề thi thử tốt nghiệp THPT</p><p className="mt-1 text-xs">Môn: <strong>{mon.ten_mon}</strong></p></div>
                <div className="rounded border-2 border-slate-900 px-5 py-2"><p className="text-xs uppercase">Mã đề</p><p className="text-xl font-bold tabular-nums">{String(code.so_thu_tu_ma).padStart(3, "0")}</p></div>
              </header>
              {(["I", "II", "III"] as Part[]).map((part) => <ExamPart key={part} part={part} items={display} snapshotMap={snapshotMap} />)}
            </article>
          </div>
        </details>;
      })}
    </section>
  </div>;
}

function ExamPart({ part, items, snapshotMap }: { part: Part; items: DisplayItem[]; snapshotMap: Map<string, Snapshot> }) {
  const meta: Record<Part, { title: string; instruction: string }> = {
    I: { title: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn", instruction: "Mỗi câu hỏi chỉ chọn một phương án." },
    II: { title: "PHẦN II. Câu trắc nghiệm đúng sai", instruction: "Trong mỗi ý a), b), c), d), thí sinh chọn Đúng hoặc Sai." },
    III: { title: "PHẦN III. Câu trắc nghiệm trả lời ngắn", instruction: "Thí sinh ghi đáp án vào ô trả lời tương ứng." },
  };
  const questions = items.filter((item) => item.phan === part).map((item) => ({ item, snapshot: snapshotMap.get(item.snapshot_id) })).filter((entry): entry is { item: DisplayItem; snapshot: Snapshot } => Boolean(entry.snapshot));
  if (!questions.length) return null;
  return <section className="mb-9 last:mb-0">
    <h3 className="text-sm font-bold uppercase leading-6">{meta[part].title}</h3>
    <p className="mb-5 text-sm italic leading-6 text-slate-700">{meta[part].instruction}</p>
    <div className="space-y-6">{questions.map(({ item, snapshot }, questionIndex) => {
      const rank = new Map((item.thu_tu_phuong_an ?? []).map((value, order) => [value, order]));
      const details = [...(snapshot.chi_tiet_cau_hoi_snapshot ?? [])].sort((a, b) => (rank.get(a.thu_tu) ?? a.thu_tu) - (rank.get(b.thu_tu) ?? b.thu_tu));
      return <section key={snapshot.snapshot_id} className="border-b border-dashed border-slate-200 pb-6 last:border-0">
        <div className="flex items-start gap-2 text-[15px] leading-7"><strong className="shrink-0">Câu {questionIndex + 1}.</strong><RichContent value={removeQuestionNumber(snapshot.noi_dung)} className="min-w-0 flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0" /></div>
        {part !== "III" ? <div className={part === "I" ? "mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2" : "mt-3 space-y-2"}>{details.map((detail, detailIndex) => <div key={detail.id} className="flex items-start gap-2 text-sm leading-6"><span className="shrink-0 font-semibold">{String.fromCharCode((part === "I" ? 65 : 97) + detailIndex)}.</span><RichContent value={detail.noi_dung} className="min-w-0" /></div>)}</div> : <div className="mt-4 h-9 w-40 rounded border border-slate-400" aria-label="Ô trả lời" />}
      </section>;
    })}</div>
  </section>;
}

function removeQuestionNumber(value: string) {
  return value.replace(/^\s*(<p[^>]*>\s*)?(<(strong|b)[^>]*>\s*)?Câu\s+\d+\s*[.:)]?\s*(<\/(strong|b)>\s*)?/i, "$1");
}

function statusLabel(status: string) {
  return ({ DangSoan: "Đang soạn", DaGiaoChuaBatDau: "Đã giao", DangThi: "Đang thi", DaThiXong: "Đã thi xong" } as Record<string, string>)[status] ?? status;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}
