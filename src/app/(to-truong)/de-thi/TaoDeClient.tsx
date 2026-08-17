"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { CalendarDays, Check, Eye, FileSearch, Files, Grid3X3, RotateCcw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import RichContent from "@/components/RichContent";
import type { OMaTran } from "@/lib/rules/ma-tran-de-thi";
import { chuanBiPreview, hoanDoiCau, hoanTatDe, kiemTraSucChua, type CauHoiPreview } from "./actions";

type Phan = "I" | "II" | "III";
type Mon = { ten_mon: string; loai_mon: "BatBuoc" | "TuChon"; phan1_so_cau: number | null; phan2_so_cau: number | null; phan3_so_cau: number | null };
type CD = { chuyen_de_id: string; ten_chuyen_de: string };
type MD = { muc_do_id: string; ten_muc: string };
type DotThi = { dot_thi_id: string; ten_dot_thi: string };
type De = { de_thi_id: string; trang_thai: string; so_ma_de: number; ten_dot_thi: string; created_at: string };
type CauHoiKhaDung = { id: string; phan: Phan; chuyenDeId: string; mucDoId: string; noiDung: string };

export default function TaoDeClient({ mon, chuyenDe, mucDo, dotThi, deThi, cauHoiKhaDung }: {
  mon: Mon; chuyenDe: CD[]; mucDo: MD[]; dotThi: DotThi[]; deThi: De[]; cauHoiKhaDung: CauHoiKhaDung[];
}) {
  const router = useRouter();
  const parts = (["I", "II", "III"] as const).filter((phan) => requiredFor(mon, phan) !== null);
  const [matrix, setMatrix] = useState<OMaTran[]>(() => parts.flatMap((phan) =>
    chuyenDe.flatMap((cd) => mucDo.map((md) => ({
      phan, chuyenDeId: cd.chuyen_de_id, mucDoId: md.muc_do_id, soLuong: 0,
    }))),
  ));
  const [dotThiId, setDotThiId] = useState(dotThi[0]?.dot_thi_id ?? "");
  const [codes, setCodes] = useState(4);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<CauHoiPreview[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const selectedDotThi = dotThi.find((item) => item.dot_thi_id === dotThiId);

  const totals = useMemo(() => Object.fromEntries(parts.map((phan) => [
    phan,
    matrix.filter((cell) => cell.phan === phan).reduce((sum, cell) => sum + cell.soLuong, 0),
  ])), [matrix, parts]);

  const setQuantity = (phan: Phan, chuyenDeId: string, mucDoId: string, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    setMatrix((old) => old.map((cell) =>
      cell.phan === phan && cell.chuyenDeId === chuyenDeId && cell.mucDoId === mucDoId
        ? { ...cell, soLuong: safeValue }
        : cell,
    ));
    setErrors([]);
  };

  const clearPart = (phan: Phan) => {
    setMatrix((old) => old.map((cell) => cell.phan === phan ? { ...cell, soLuong: 0 } : cell));
    setErrors([]);
  };

  const validate = () => start(async () => {
    const result = await kiemTraSucChua(matrix);
    if (result.success && "hopLe" in result && result.hopLe) {
      const draft = await chuanBiPreview(matrix, codes);
      if (draft.success && "maDe" in draft && draft.maDe) { setErrors([]); setPreview(draft.maDe); setStep(3); }
      else setErrors([draft.error ?? "Chưa chọn được câu hỏi. Vui lòng kiểm tra ma trận đề."]);
    } else if ("thieu" in result) {
      setErrors([
        ...result.thieu.map((item) => `Phần ${item.phan}: thiếu ${item.thieu} câu`),
        ...result.saiTong.map((item) => `Phần ${item.phan}: cần ${item.batBuoc}, đang chọn ${item.thucTe}`),
      ]);
    } else {
      setErrors([result.error ?? "Chưa hoàn tất được đề thi. Vui lòng thử lại."]);
    }
  });

  const create = () => start(async () => {
    const result = await hoanTatDe({ dotThiId, maTran: matrix, maDe: preview });
    if (result.success) {
      toast.success("Đã tạo và giao đề vào ca thi");
      setStep(4);
      router.refresh();
    } else toast.error(result.error);
  });

  const swap = (codeIndex:number,questionIndex:number) => start(async()=>{
    const used=preview.flat().map(q=>q.id);const current=preview[codeIndex]![questionIndex]!;
    const groups=preview[codeIndex]!.filter((_,i)=>i!==questionIndex).map(q=>q.nhomId).filter((id):id is string=>Boolean(id));
    const result=await hoanDoiCau(current,used,groups);
    if(result.success&&"cau" in result&&result.cau){const replacement=result.cau;setPreview(old=>old.map((code,i)=>i===codeIndex?code.map((q,j)=>j===questionIndex?replacement:q):code));}
    else toast.error(result.error);
  });

  return <div className="space-y-6">
    <header>
      <p className="text-sm font-semibold text-blue-600">Môn {mon.ten_mon}</p>
      <h1 className="text-2xl font-bold">Tạo đề thi</h1>
      <p className="text-sm">{step <= 3 ? `Bước ${step}/3` : "Đã hoàn tất"}</p>
    </header>

    {step<=3&&<ol className="grid gap-2 sm:grid-cols-3" aria-label="Tiến trình tạo đề">
      {[{n:1,t:"Thiết lập",I:Settings2},{n:2,t:"Ma trận đề",I:Grid3X3},{n:3,t:"Xem trước",I:FileSearch}].map(({n,t,I})=><li key={n} className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${step===n?"border-blue-500 bg-blue-50 text-blue-800":step>n?"border-emerald-200 bg-emerald-50 text-emerald-800":"bg-white text-slate-500"}`} aria-current={step===n?"step":undefined}>{step>n?<Check className="h-4 w-4"/>:<I className="h-4 w-4"/>}{n}. {t}</li>)}
    </ol>}

    {step === 1 && <section className="space-y-5 rounded-xl border bg-white p-5">
      <div><label className="mb-2 block text-sm font-semibold" htmlFor="dot-thi">Đợt thi áp dụng</label>
      <select id="dot-thi" className="h-11 w-full rounded-lg border bg-white px-3" aria-label="Chọn đợt thi" value={dotThiId} onChange={(event) => setDotThiId(event.target.value)}>
        {dotThi.map((item) => <option key={item.dot_thi_id} value={item.dot_thi_id}>{item.ten_dot_thi}</option>)}
      </select></div>
      <fieldset><legend className="mb-2 text-sm font-semibold">Số mã đề</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[1,2,3,4].map(count=><button type="button" key={count} onClick={()=>setCodes(count)} className={`min-h-11 cursor-pointer rounded-lg border px-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${codes===count?"border-blue-600 bg-blue-600 text-white":"bg-white hover:bg-slate-50"}`} aria-pressed={codes===count}>{count} mã đề</button>)}</div>{codes===1&&<p className="mt-2 text-sm text-amber-700">Chỉ có một mã đề. Hãy cân nhắc dùng nhiều mã để hạn chế trao đổi bài.</p>}</fieldset>
      <p className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-800">Bộ đề được tạo một lần cho môn {mon.ten_mon} trong đợt này và dùng chung cho mọi ca có học sinh đăng ký môn.</p>
      <div className="flex justify-end"><Button disabled={!dotThiId} onClick={()=>codes===1&&!confirm("Chỉ tạo một mã đề. Tiếp tục?")?undefined:setStep(2)}>Tiếp tục lập ma trận</Button></div>
    </section>}

    {step === 2 && <section className="space-y-5 rounded-xl border bg-white p-5">
      <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Cấu trúc này áp dụng cho cả {codes} mã đề. Mỗi mã đề sẽ dùng một bộ câu khác nhau.
      </p>

      {parts.map((phan) => <MatrixSection
        key={phan}
        phan={phan}
        required={requiredFor(mon, phan) ?? 0}
        matrix={matrix}
        chuyenDe={chuyenDe}
        mucDo={mucDo}
        cauHoiKhaDung={cauHoiKhaDung}
        onChange={setQuantity}
        onClear={() => clearPart(phan)}
      />)}

      {errors.length > 0 && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
        {errors.map((error, index) => <p key={index} className="text-sm text-red-700">{error}</p>)}
      </div>}
      <div className="flex justify-between gap-2"><Button variant="outline" onClick={()=>setStep(1)}>Quay lại</Button><Button disabled={pending} onClick={validate}>{pending?"Đang chọn câu…":"Chọn câu tự động và xem trước"}</Button></div>
    </section>}

    {step === 3 && <section className="space-y-5 rounded-xl border bg-white p-5">
      <div><h2 className="font-bold">Xem trước các mã đề</h2><p className="text-sm text-slate-600">Kiểm tra và hoán đổi câu trước khi hoàn tất. Sau khi giao, nội dung sẽ bị khóa.</p></div>
      {preview.map((questions,codeIndex)=><ExamPaperPreview key={codeIndex} monName={mon.ten_mon} codeIndex={codeIndex} questions={questions} pending={pending} onSwap={(questionIndex)=>swap(codeIndex,questionIndex)} />)}
      <div className="flex justify-between gap-2"><Button variant="outline" onClick={()=>setStep(2)}>Điều chỉnh ma trận</Button><Button disabled={pending} onClick={create}>{pending?"Đang hoàn tất…":"Hoàn tất và giao đề"}</Button></div>
    </section>}

    {step === 4 && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
      <div className="flex items-start gap-3">
        <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-bold">Đã tạo và giao đề thành công</h2>
          <p className="mt-1 text-sm">Đợt thi: <strong>{selectedDotThi?.ten_dot_thi}</strong> · {codes} mã đề</p>
          <p className="mt-1 text-sm text-emerald-800">Đề và cách tính điểm đã được lưu đúng như lúc giao cho học sinh. Bạn có thể xem lại trong danh sách bên dưới.</p>
        </div>
      </div>
    </section>}

    <section className="space-y-3">
      <div>
        <h2 className="font-bold">Đề thi đã giao</h2>
        <p className="mt-1 text-sm text-slate-600">Xem lại nội dung từng mã đề theo đợt thi.</p>
      </div>
      {deThi.length === 0 && <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-600">Chưa có đề thi nào được giao.</div>}
      {deThi.map((de) => <article key={de.de_thi_id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-950">{de.ten_dot_thi}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><Files className="h-4 w-4" aria-hidden="true" />{de.so_ma_de} mã đề</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />Tạo lúc {formatDateTime(de.created_at)}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{statusLabel(de.trang_thai)}</span>
          </div>
        </div>
        <Link className={buttonVariants({ variant: "outline", className: "min-h-11 shrink-0" })} href={`/de-thi/${de.de_thi_id}`}><Eye className="mr-2 h-4 w-4" aria-hidden="true" />Xem lại đề</Link>
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

function ExamPaperPreview({ monName, codeIndex, questions, pending, onSwap }: {
  monName: string; codeIndex: number; questions: CauHoiPreview[]; pending: boolean; onSwap: (questionIndex: number) => void;
}) {
  const partMeta: Record<Phan, { title: string; instruction: string }> = {
    I: { title: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn", instruction: "Thí sinh trả lời từ câu 1 đến hết phần. Mỗi câu hỏi chỉ chọn một phương án." },
    II: { title: "PHẦN II. Câu trắc nghiệm đúng sai", instruction: "Trong mỗi ý a), b), c), d), thí sinh chọn Đúng hoặc Sai." },
    III: { title: "PHẦN III. Câu trắc nghiệm trả lời ngắn", instruction: "Thí sinh ghi đáp án vào ô trả lời tương ứng." },
  };

  return <details open={codeIndex === 0} className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
    <summary className="cursor-pointer border-b bg-slate-50 px-5 py-4 font-bold text-slate-900">Mã đề {codeIndex + 1} · {questions.length} câu</summary>
    <div className="bg-slate-100 p-3 sm:p-6">
      <article className="mx-auto max-w-4xl rounded-sm bg-white px-5 py-8 text-slate-950 shadow-md sm:px-10 sm:py-10">
        <header className="mb-8 grid grid-cols-[1fr_auto] gap-6 border-b-2 border-slate-900 pb-5 text-center">
          <div><p className="text-sm font-semibold uppercase">Đề thi thử tốt nghiệp THPT</p><p className="mt-1 text-xs">Môn: <strong>{monName}</strong></p></div>
          <div className="rounded border-2 border-slate-900 px-5 py-2"><p className="text-xs uppercase">Mã đề</p><p className="text-xl font-bold tabular-nums">{String(codeIndex + 1).padStart(3, "0")}</p></div>
        </header>

        {(["I", "II", "III"] as Phan[]).map((part) => {
          const partQuestions = questions.filter((question) => question.phan === part);
          if (!partQuestions.length) return null;
          return <section key={part} className="mb-9 last:mb-0">
            <h3 className="text-sm font-bold uppercase leading-6">{partMeta[part].title}</h3>
            <p className="mb-5 text-sm italic leading-6 text-slate-700">{partMeta[part].instruction}</p>
            <div className="space-y-6">{partQuestions.map((question, partIndex) => {
              const questionIndex = questions.findIndex((item) => item.id === question.id);
              return <section key={question.id} className="group relative border-b border-dashed border-slate-200 pb-6 last:border-0">
                <div className="pr-0 sm:pr-28"><div className="flex items-start gap-2 text-[15px] leading-7"><strong className="shrink-0">Câu {partIndex + 1}.</strong><RichContent value={boSoThuTuCau(question.noiDung)} className="min-w-0 flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0" /></div>
                {part !== "III" ? <div className={part === "I" ? "mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2" : "mt-3 space-y-2"}>{question.chiTiet.map((detail, detailIndex) => <div key={detail.thuTu} className="flex items-start gap-2 text-sm leading-6"><span className="shrink-0 font-semibold">{String.fromCharCode((part === "I" ? 65 : 97) + detailIndex)}.</span><RichContent value={detail.noiDung} className="min-w-0" /></div>)}</div> : <div className="mt-4 flex items-center gap-3"><span className="text-sm font-medium">Đáp án:</span><span className="h-9 w-40 rounded border border-slate-400 bg-white" aria-hidden="true" /></div>}</div>
                <Button className="mt-3 min-h-10 sm:absolute sm:right-0 sm:top-0 sm:mt-0" size="sm" variant="outline" disabled={pending} onClick={() => onSwap(questionIndex)}>Hoán đổi</Button>
              </section>;
            })}</div>
          </section>;
        })}
      </article>
    </div>
  </details>;
}

function boSoThuTuCau(value: string) {
  return value.replace(/^\s*(<p[^>]*>\s*)?(<(strong|b)[^>]*>\s*)?Câu\s+\d+\s*[.:)]?\s*(<\/(strong|b)>\s*)?/i, "$1");
}

function MatrixSection({ phan, required, matrix, chuyenDe, mucDo, cauHoiKhaDung, onChange, onClear }: {
  phan: Phan;
  required: number;
  matrix: OMaTran[];
  chuyenDe: CD[];
  mucDo: MD[];
  cauHoiKhaDung: CauHoiKhaDung[];
  onChange: (phan: Phan, chuyenDeId: string, mucDoId: string, value: number) => void;
  onClear: () => void;
}) {
  const [focused, setFocused] = useState<{ row: number; col: number } | null>(null);
  const cells = matrix.filter((cell) => cell.phan === phan);
  const total = cells.reduce((sum, cell) => sum + cell.soLuong, 0);
  const overLimit = total > required;
  const complete = total === required;
  const progress = required > 0 ? Math.min(100, (total / required) * 100) : 0;
  const levelTotals = mucDo.map((level) => cells
    .filter((cell) => cell.mucDoId === level.muc_do_id)
    .reduce((sum, cell) => sum + cell.soLuong, 0));

  const moveFocus = (event: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [row, col - 1], ArrowRight: [row, col + 1],
      ArrowUp: [row - 1, col], ArrowDown: [row + 1, col],
    };
    const next = moves[event.key];
    if (!next) return;
    const target = event.currentTarget.closest("table")?.querySelector<HTMLInputElement>(`input[data-row="${next[0]}"][data-col="${next[1]}"]`);
    if (target) {
      event.preventDefault();
      target.focus();
      target.select();
    }
  };

  return <section className={`overflow-hidden rounded-xl border ${overLimit ? "border-red-300" : complete ? "border-emerald-300" : "border-slate-200"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-slate-50 px-4 py-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold">Phần {phan}: Ma trận đề thi</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${overLimit ? "bg-red-100 text-red-700" : complete ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
            {total}/{required} câu
          </span>
        </div>
        <p className={`mt-1 text-xs ${overLimit ? "font-semibold text-red-600" : "text-slate-500"}`}>
          {overLimit ? `Đã nhập vượt ${total - required} câu. Vui lòng giảm số lượng.` : complete ? "Đã chọn đủ số câu." : `Còn ${required - total} câu cần chọn.`}
        </p>
      </div>
      <Button type="button" size="sm" variant="ghost" disabled={total === 0} onClick={onClear}>
        <RotateCcw className="mr-1.5 h-4 w-4" />Xóa số lượng đã nhập
      </Button>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200" aria-label={`Tiến độ Phần ${phan}: ${total} trên ${required} câu`} role="progressbar" aria-valuemin={0} aria-valuemax={required} aria-valuenow={total}>
        <div className={`h-full rounded-full transition-[width] ${overLimit ? "bg-red-500" : complete ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${overLimit ? 100 : progress}%` }} />
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-white">
            <th scope="col" className="sticky left-0 z-10 min-w-64 bg-white px-4 py-3 text-left font-semibold">Tên chương</th>
            {mucDo.map((level, col) => <th scope="col" key={level.muc_do_id} className={`min-w-32 px-3 py-3 text-center font-semibold transition-colors ${focused?.col === col ? "bg-blue-50 text-blue-700" : ""}`}>{level.ten_muc}</th>)}
            <th scope="col" className="min-w-28 bg-slate-50 px-3 py-3 text-center font-semibold">Tổng</th>
          </tr>
        </thead>
        <tbody>
          {chuyenDe.map((chapter, row) => {
            const rowCells = mucDo.map((level) => cells.find((cell) => cell.chuyenDeId === chapter.chuyen_de_id && cell.mucDoId === level.muc_do_id));
            const rowTotal = rowCells.reduce((sum, cell) => sum + (cell?.soLuong ?? 0), 0);
            const rowFocused = focused?.row === row;
            return <tr key={chapter.chuyen_de_id} className={`border-b transition-colors ${rowFocused ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
              <th scope="row" className={`sticky left-0 z-10 max-w-80 px-4 py-3 text-left font-medium transition-colors ${rowFocused ? "bg-blue-50" : "bg-white"}`} title={chapter.ten_chuyen_de}>{chapter.ten_chuyen_de}</th>
              {rowCells.map((cell, col) => {
                const soCau = cell?.soLuong ?? 0;
                const cauTrongNganHang = cauHoiKhaDung.filter((item) => item.phan === phan && item.chuyenDeId === chapter.chuyen_de_id && item.mucDoId === mucDo[col]!.muc_do_id);
                const tooltipId = `so-cau-${phan}-${row}-${col}`;
                return <td key={mucDo[col]!.muc_do_id} className={`group relative px-3 py-2 transition-colors hover:bg-blue-100/70 ${focused?.col === col ? "bg-blue-50/50" : ""}`}>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={cell?.soLuong || ""}
                  data-row={row}
                  data-col={col}
                  aria-label={`${chapter.ten_chuyen_de}, ${mucDo[col]!.ten_muc}`}
                  aria-describedby={tooltipId}
                  title={`${chapter.ten_chuyen_de} · ${mucDo[col]!.ten_muc}: ${cauTrongNganHang.length} câu khả dụng`}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-center font-semibold outline-none transition-colors [appearance:textfield] placeholder:font-normal placeholder:text-slate-300 group-hover:border-blue-400 group-hover:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  onFocus={() => setFocused({ row, col })}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(event) => moveFocus(event, row, col)}
                  onChange={(event) => onChange(phan, chapter.chuyen_de_id, mucDo[col]!.muc_do_id, Number(event.target.value))}
                />
                <span id={tooltipId} role="tooltip" className="pointer-events-none absolute left-1/2 top-[calc(100%-0.15rem)] z-30 hidden w-80 -translate-x-1/2 rounded-lg bg-slate-900 p-3 text-left text-xs text-white shadow-xl group-hover:block group-focus-within:block">
                  <span className="mb-2 block font-bold">Ngân hàng có {cauTrongNganHang.length} câu khả dụng</span>
                  {cauTrongNganHang.length ? <span className="block max-h-52 space-y-1.5 overflow-hidden font-normal leading-5 text-slate-200">
                    {cauTrongNganHang.slice(0, 6).map((cau, index) => <span key={cau.id} className="block border-t border-slate-700 pt-1.5"><b className="text-white">Câu {index + 1}:</b> {rutGonNoiDung(cau.noiDung)}</span>)}
                    {cauTrongNganHang.length > 6 && <span className="block border-t border-slate-700 pt-1.5 italic">Và {cauTrongNganHang.length - 6} câu khác…</span>}
                  </span> : <span className="block font-normal text-amber-300">Không có câu phù hợp trong ngân hàng.</span>}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" aria-hidden="true" />
                </span>
              </td>;
              })}
              <td className="bg-slate-50 px-3 py-2 text-center font-bold tabular-nums">{rowTotal}</td>
            </tr>;
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 font-bold">
            <th scope="row" className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-left">Tổng theo mức độ</th>
            {levelTotals.map((value, index) => <td key={mucDo[index]!.muc_do_id} className="px-3 py-3 text-center tabular-nums">{value}</td>)}
            <td className={`px-3 py-3 text-center tabular-nums ${overLimit ? "text-red-700" : complete ? "text-emerald-700" : "text-blue-700"}`}>{total}/{required}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>;
}

function requiredFor(mon: Mon, phan: Phan) {
  return phan === "I" ? mon.phan1_so_cau : phan === "II" ? mon.phan2_so_cau : mon.phan3_so_cau;
}

function rutGonNoiDung(value: string) {
  const plainText = value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return plainText.length > 115 ? `${plainText.slice(0, 115)}…` : plainText;
}
