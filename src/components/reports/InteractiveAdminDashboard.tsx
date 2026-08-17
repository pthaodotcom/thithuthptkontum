"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  GraduationCap,
  LayoutDashboard,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { ReportRow } from "@/lib/reports/data";

type ReportPage = "grade" | "subject" | "student";
type StudentSummary = { id: string; first: ReportRow; rows: ReportRow[]; average: number };

const PAGE_ITEMS = [
  { id: "grade" as const, label: "Toàn khối", description: "Kết quả tổng hợp", icon: Building2 },
  { id: "subject" as const, label: "Theo môn học", description: "Lọc và so sánh theo lớp", icon: BookOpenCheck },
  { id: "student" as const, label: "Từng học sinh", description: "Điểm và xếp hạng", icon: UserRound },
];

const PAGE_COPY: Record<ReportPage, { eyebrow: string; title: string; question: string }> = {
  grade: {
    eyebrow: "Kết quả toàn khối",
    title: "Tổng hợp kết quả toàn khối",
    question: "Xem điểm trung bình, tỷ lệ đạt và kết quả giữa các lớp.",
  },
  subject: {
    eyebrow: "Báo cáo theo môn học",
    title: "Chất lượng theo môn học",
    question: "So sánh kết quả môn học giữa các lớp và xác định phần cần cải thiện.",
  },
  student: {
    eyebrow: "Kết quả từng học sinh",
    title: "Điểm và tiến bộ của học sinh",
    question: "Xem kết quả qua các đợt thi và môn học cần được hỗ trợ thêm.",
  },
};

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const unique = (values: string[]) => [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
const percent = (part: number, total: number) => total ? part / total * 100 : 0;

function KpiCard({ label, value, detail, icon: Icon, tone = "blue" }: {
  label: string; value: string; detail: string; icon: typeof Users; tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };
  return <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p></div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
  </article>;
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
    <header className="border-b border-border/70 px-5 py-4"><h2 className="font-bold text-foreground">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</header>
    <div className="p-5">{children}</div>
  </section>;
}

function HorizontalBars({ items, max = 10, selected, onSelect }: {
  items: { label: string; value: number; detail?: string }[]; max?: number; selected?: string; onSelect?: (label: string) => void;
}) {
  if (!items.length) return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu phù hợp.</p>;
  return <div className="space-y-3">{items.map((item, index) => {
    const content = <><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span><strong className="truncate font-semibold">{item.label}</strong></span><span className="shrink-0 font-bold tabular-nums">{item.value.toFixed(2)}{item.detail && <small className="ml-1 font-normal text-muted-foreground">· {item.detail}</small>}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.min(100, item.value / max * 100)}%` }} /></div></>;
    return onSelect ? <button key={item.label} onClick={() => onSelect(item.label)} className={`block min-h-11 w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === item.label ? "bg-blue-50 ring-1 ring-blue-300 dark:bg-blue-950/30" : ""}`}>{content}</button> : <div key={item.label} className="px-2 py-1.5">{content}</div>;
  })}</div>;
}

function ScoreDistribution({ rows }: { rows: ReportRow[] }) {
  const bins = [
    { label: "0–<5", count: rows.filter((row) => row.diem < 5).length, color: "bg-rose-500" },
    { label: "5–<6.5", count: rows.filter((row) => row.diem >= 5 && row.diem < 6.5).length, color: "bg-amber-500" },
    { label: "6.5–<8", count: rows.filter((row) => row.diem >= 6.5 && row.diem < 8).length, color: "bg-sky-500" },
    { label: "8–10", count: rows.filter((row) => row.diem >= 8).length, color: "bg-emerald-500" },
  ];
  const max = Math.max(1, ...bins.map((bin) => bin.count));
  return <div className="flex h-64 items-end justify-around gap-3 border-b border-l border-border px-4 pt-5">{bins.map((bin) => <div key={bin.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-2 text-sm font-bold tabular-nums">{bin.count}</span><div className={`w-full max-w-20 rounded-t-md ${bin.color} transition-[height] duration-300 motion-reduce:transition-none`} style={{ height: `${Math.max(4, bin.count / max * 82)}%` }} /><span className="mt-2 whitespace-nowrap text-xs text-muted-foreground">{bin.label}</span></div>)}</div>;
}

function TrendChart({ rows, highlight }: { rows: ReportRow[]; highlight?: string }) {
  const batches = unique(rows.map((row) => row.dotThi));
  const points = batches.map((label) => ({ label, value: average(rows.filter((row) => row.dotThi === label).map((row) => row.diem)) }));
  if (!points.length) return <p className="py-20 text-center text-sm text-muted-foreground">Chưa có dữ liệu xu hướng.</p>;
  const coords = points.map((point, index) => ({ ...point, x: points.length === 1 ? 50 : 8 + index * 84 / (points.length - 1), y: 92 - point.value * 8.2 }));
  return <div className="relative h-64 overflow-hidden" role="img" aria-label={`Xu hướng điểm trung bình${highlight ? ` của ${highlight}` : ""}`}>
    <div className="absolute inset-y-3 left-0 flex flex-col justify-between text-[10px] text-muted-foreground"><span>10</span><span>5</span><span>0</span></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ml-6 h-[calc(100%-28px)] w-[calc(100%-24px)] overflow-visible">
      {[10, 51, 92].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="2 2" />)}
      <polyline points={coords.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {coords.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="1.7" fill="#2563eb" vectorEffect="non-scaling-stroke" />)}
    </svg>
    <div className="ml-6 flex justify-between gap-2 text-[10px] text-muted-foreground">{points.map((point) => <span key={point.label} className="max-w-24 truncate text-center">{point.label}</span>)}</div>
  </div>;
}

function SubjectComparison({ studentRows, benchmarkRows, studentLabel }: { studentRows: ReportRow[]; benchmarkRows: ReportRow[]; studentLabel: string }) {
  const subjects = unique([...studentRows, ...benchmarkRows].map((row) => row.mon));
  if (!subjects.length) return <p className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu môn học.</p>;
  return <div className="space-y-4">{subjects.map((subject) => {
    const own = average(studentRows.filter((row) => row.mon === subject).map((row) => row.diem));
    const benchmark = average(benchmarkRows.filter((row) => row.mon === subject).map((row) => row.diem));
    return <div key={subject}><div className="mb-2 flex justify-between gap-3 text-sm"><strong>{subject}</strong><span className="text-muted-foreground"><b className="text-blue-600">{own.toFixed(2)}</b> / {benchmark.toFixed(2)}</span></div><div className="space-y-1"><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-600" style={{ width: `${own * 10}%` }} /></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-slate-400" style={{ width: `${benchmark * 10}%` }} /></div></div></div>;
  })}<div className="flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-4 rounded bg-blue-600" />{studentLabel}</span><span><i className="mr-1 inline-block h-1.5 w-4 rounded bg-slate-400" />Trung bình lớp</span></div></div>;
}

export default function InteractiveAdminDashboard({ rows }: { rows: ReportRow[] }) {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState<ReportPage>("grade");
  const [filterOpen, setFilterOpen] = useState(false);
  const [batch, setBatch] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [draftBatch, setDraftBatch] = useState("");
  const [draftGrade, setDraftGrade] = useState("");
  const [draftClassName, setDraftClassName] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftStudentId, setDraftStudentId] = useState("");
  const [draftStudentSearch, setDraftStudentSearch] = useState("");

  const batches = useMemo(() => unique(rows.map((row) => row.dotThi)), [rows]);
  const grades = useMemo(() => unique(rows.map((row) => row.khoi || "Chưa xác định")), [rows]);
  const subjects = useMemo(() => unique(rows.map((row) => row.mon)), [rows]);
  const draftClasses = useMemo(() => unique(rows.filter((row) => (!draftGrade || row.khoi === draftGrade) && (!draftSubject || row.mon === draftSubject)).map((row) => row.lop)), [rows, draftGrade, draftSubject]);
  const baseRows = useMemo(() => rows.filter((row) => (!batch || row.dotThi === batch) && (!grade || row.khoi === grade)), [rows, batch, grade]);
  const draftBaseRows = useMemo(() => rows.filter((row) => (!draftBatch || row.dotThi === draftBatch) && (!draftGrade || row.khoi === draftGrade)), [rows, draftBatch, draftGrade]);
  const scopedRows = useMemo(() => baseRows.filter((row) => (!className || row.lop === className) && (!subject || row.mon === subject)), [baseRows, className, subject]);
  const students = useMemo<StudentSummary[]>(() => {
    const groups = new Map<string, ReportRow[]>();
    for (const row of baseRows) groups.set(row.hocSinhId, [...(groups.get(row.hocSinhId) || []), row]);
    return [...groups.entries()].map(([id, list]) => ({ id, first: list[0]!, rows: list, average: average(list.map((row) => row.diem)) })).sort((a, b) => a.first.hoTen.localeCompare(b.first.hoTen, "vi"));
  }, [baseRows]);
  const draftStudents = useMemo<StudentSummary[]>(() => {
    const groups = new Map<string, ReportRow[]>();
    for (const row of draftBaseRows) groups.set(row.hocSinhId, [...(groups.get(row.hocSinhId) || []), row]);
    return [...groups.entries()].map(([id, list]) => ({ id, first: list[0]!, rows: list, average: average(list.map((row) => row.diem)) })).sort((a, b) => a.first.hoTen.localeCompare(b.first.hoTen, "vi"));
  }, [draftBaseRows]);
  const draftFilteredStudents = draftStudents.filter((student) => !draftStudentSearch || `${student.first.hoTen} ${student.first.maSo} ${student.first.lop}`.toLocaleLowerCase("vi").includes(draftStudentSearch.toLocaleLowerCase("vi")));
  const selectedStudent = students.find((student) => student.id === studentId);
  const selectedSubject = subject;

  const activeFilterCount = [batch, grade, className, subject, studentId].filter(Boolean).length;
  const openFilters = () => {
    setDraftBatch(batch); setDraftGrade(grade); setDraftClassName(className); setDraftSubject(subject);
    setDraftStudentId(studentId); setDraftStudentSearch(studentSearch); setFilterOpen(true);
  };
  const resetDraftFilters = () => { setDraftBatch(""); setDraftGrade(""); setDraftClassName(""); setDraftSubject(""); setDraftStudentId(""); setDraftStudentSearch(""); };
  const applyFilters = () => {
    setBatch(draftBatch); setGrade(draftGrade); setClassName(draftClassName); setSubject(draftSubject);
    setStudentId(draftStudentId); setStudentSearch(draftStudentSearch); setFilterOpen(false);
  };
  const changePage = (next: ReportPage) => {
    setPage(next);
    if (next !== "subject") { setClassName(""); setSubject(""); }
    if (next !== "student") { setStudentId(""); setStudentSearch(""); }
  };

  useEffect(() => {
    if (!filterOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setFilterOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    const filterTrigger = filterButtonRef.current;
    document.body.style.overflow = "hidden";
    closeFilterButtonRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; filterTrigger?.focus(); };
  }, [filterOpen]);

  const exportHref = `/api/bao-cao/xuat?format=xlsx${subject ? `&monId=${encodeURIComponent(scopedRows[0]?.monId || "")}` : ""}${className ? `&lopId=${encodeURIComponent(scopedRows[0]?.lopId || "")}` : ""}`;

  return <div className="overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
    <header className="border-b border-border bg-card px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><LayoutDashboard className="h-4 w-4" />Báo cáo kết quả thi</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Tổng hợp kết quả thi</h1><p className="mt-1 text-sm text-muted-foreground">Xem theo toàn khối, môn học hoặc từng học sinh.</p></div>
        <div className="flex flex-wrap gap-2">
          <button ref={filterButtonRef} onClick={openFilters} className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"><Filter className="h-4 w-4" />Bộ lọc{activeFilterCount > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-blue-700">{activeFilterCount}</span>}</button>
          <a href={exportHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Download className="h-4 w-4" />Xuất báo cáo</a>
        </div>
      </div>
      {activeFilterCount > 0 && <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Bộ lọc đang áp dụng">
        <span className="text-xs font-semibold text-muted-foreground">Đang lọc:</span>
        {batch && <FilterChip label={batch} onRemove={() => setBatch("")} />}
        {grade && <FilterChip label={`Khối ${grade}`} onRemove={() => { setGrade(""); setClassName(""); }} />}
        {className && <FilterChip label={className} onRemove={() => setClassName("")} />}
        {subject && <FilterChip label={subject} onRemove={() => setSubject("")} />}
        {studentId && selectedStudent && <FilterChip label={selectedStudent.first.hoTen} onRemove={() => { setStudentId(""); setStudentSearch(""); }} />}
      </div>}
    </header>

    <nav aria-label="Các trang báo cáo" className="grid border-b border-border bg-card sm:grid-cols-3">{PAGE_ITEMS.map((item) => {
      const Icon = item.icon; const active = page === item.id;
      return <button key={item.id} onClick={() => changePage(item.id)} aria-current={active ? "page" : undefined} className={`relative flex min-h-16 cursor-pointer items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors hover:bg-muted focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:border-r xl:border-b-0 ${active ? "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200" : "bg-card"}`}><Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-600" : "text-muted-foreground"}`} /><span><strong className="block text-sm">{item.label}</strong><small className="text-xs text-muted-foreground">{item.description}</small></span>{active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />}</button>;
    })}</nav>

    <main className="min-w-0 space-y-5 p-4 sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">{PAGE_COPY[page].eyebrow}</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">{PAGE_COPY[page].title}</h2><p className="mt-1 text-sm text-muted-foreground">{PAGE_COPY[page].question}</p></div>
      {page === "grade" && <GradeDashboard rows={scopedRows} />}
      {page === "subject" && <SubjectDashboard rows={scopedRows} subject={selectedSubject} />}
      {page === "student" && <StudentDashboard rows={baseRows} student={selectedStudent} students={students} search={studentSearch} onSearchChange={setStudentSearch} onSelect={setStudentId} onBack={() => setStudentId("")} />}
    </main>

    {filterOpen && <div className="fixed inset-0 z-50" role="presentation">
      <button className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[1px]" onClick={() => setFilterOpen(false)} aria-label="Đóng bộ lọc" />
      <aside role="dialog" aria-modal="true" aria-labelledby="filter-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200 motion-reduce:animate-none">
        <header className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">Chọn dữ liệu muốn xem</p><h2 id="filter-title" className="mt-1 text-xl font-bold">Bộ lọc báo cáo</h2></div><button ref={closeFilterButtonRef} onClick={() => setFilterOpen(false)} aria-label="Đóng" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <FilterSelect label="Đợt thi" value={draftBatch} onChange={setDraftBatch} options={batches} allLabel="Tất cả đợt thi" />
          <FilterSelect label="Khối" value={draftGrade} onChange={(value) => { setDraftGrade(value); setDraftClassName(""); }} options={grades} allLabel="Tất cả khối" />
          {page === "subject" && <FilterSelect label="Môn học" value={draftSubject} onChange={(value) => { setDraftSubject(value); setDraftClassName(""); }} options={subjects} allLabel="Chọn môn" required />}
          {page === "subject" && <FilterSelect label="Lớp" value={draftClassName} onChange={setDraftClassName} options={draftClasses} allLabel="Tất cả lớp" />}
          {page === "student" && <label className="block text-xs font-semibold text-muted-foreground">Tìm học sinh<span className="relative mt-1.5 block"><Search className="absolute left-3 top-3.5 h-4 w-4" /><input value={draftStudentSearch} onChange={(event) => setDraftStudentSearch(event.target.value)} placeholder="Tên hoặc mã học sinh" className="min-h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></span></label>}
          {page === "student" && <label className="block text-xs font-semibold text-muted-foreground">Học sinh<select value={draftStudentId} onChange={(event) => setDraftStudentId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Chọn học sinh</option>{draftFilteredStudents.map((student) => <option key={student.id} value={student.id}>{student.first.hoTen} · {student.first.lop}</option>)}</select></label>}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><strong>Dữ liệu sẽ hiển thị</strong><br />{draftBatch || "Tất cả đợt thi"} · {draftGrade ? `Khối ${draftGrade}` : "Toàn trường"}{draftClassName ? ` · ${draftClassName}` : ""}{draftSubject ? ` · ${draftSubject}` : ""}</div>
        </div>
        <footer className="grid grid-cols-2 gap-3 border-t border-border bg-card p-5"><button onClick={resetDraftFilters} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="h-4 w-4" />Đặt lại</button><button onClick={applyFilters} className="min-h-11 cursor-pointer rounded-lg bg-blue-600 px-4 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Áp dụng</button></footer>
      </aside>
    </div>}
  </div>;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 pl-3 pr-1.5 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">{label}<button onClick={onRemove} aria-label={`Bỏ bộ lọc ${label}`} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-900"><X className="h-3.5 w-3.5" /></button></span>;
}

function FilterSelect({ label, value, onChange, options, allLabel, required }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel: string; required?: boolean }) {
  return <label className="block text-xs font-semibold text-muted-foreground">{label}{required && <span className="text-rose-600"> *</span>}<span className="relative mt-1.5 block"><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4" /></span></label>;
}

function GradeDashboard({ rows }: { rows: ReportRow[] }) {
  const totalStudents = new Set(rows.map((row) => row.hocSinhId)).size;
  const classStats = unique(rows.map((row) => row.lop)).map((label) => ({ label, value: average(rows.filter((row) => row.lop === label).map((row) => row.diem)) })).sort((a, b) => b.value - a.value);
  const studentMap = new Map<string, ReportRow[]>(); rows.forEach((row) => studentMap.set(row.hocSinhId, [...(studentMap.get(row.hocSinhId) || []), row]));
  const topStudents = [...studentMap.values()].map((list) => ({ first: list[0]!, average: average(list.map((row) => row.diem)), count: list.length })).sort((a, b) => b.average - a.average).slice(0, 10);
  const passRate = percent(rows.filter((row) => row.diem >= 5).length, rows.length);
  const weakRate = percent(rows.filter((row) => row.diem < 5).length, rows.length);
  return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Học sinh tham gia" value={totalStudents.toLocaleString("vi-VN")} detail={`${rows.length} lượt bài thi`} icon={Users} /><KpiCard label="Điểm trung bình" value={average(rows.map((row) => row.diem)).toFixed(2)} detail="Trên thang điểm 10" icon={TrendingUp} tone="green" /><KpiCard label="Tỷ lệ đạt" value={`${passRate.toFixed(1)}%`} detail="Điểm từ 5.0 trở lên" icon={CheckCircle2} tone="blue" /><KpiCard label="Tỷ lệ dưới 5" value={`${weakRate.toFixed(1)}%`} detail="Số bài dưới 5 điểm" icon={AlertTriangle} tone="red" /></section>
    <section className="grid gap-5 xl:grid-cols-2"><Panel title="Điểm trung bình qua các đợt" subtitle="So sánh kết quả giữa các đợt thi"><TrendChart rows={rows} /></Panel><Panel title="Điểm trung bình theo lớp" subtitle="Sắp xếp từ cao xuống thấp"><HorizontalBars items={classStats} /></Panel></section>
    {weakRate >= 20 && <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Kết quả cần lưu ý</strong><p className="mt-1">Có {weakRate.toFixed(1)}% bài thi dưới 5 điểm. Hãy xem thêm các lớp và môn có kết quả thấp.</p></div></div>}
    <Panel title="10 học sinh có điểm trung bình cao nhất" subtitle="Tính theo dữ liệu đang chọn"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3">Hạng</th><th className="pb-3">Học sinh</th><th className="pb-3">Lớp</th><th className="pb-3 text-right">Số bài</th><th className="pb-3 text-right">Điểm TB</th></tr></thead><tbody>{topStudents.map((student, index) => <tr key={student.first.hocSinhId} className="border-b border-border/60 last:border-0"><td className="py-3 font-bold text-blue-700">#{index + 1}</td><td className="py-3"><strong>{student.first.hoTen}</strong><span className="ml-2 text-xs text-muted-foreground">{student.first.maSo}</span></td><td className="py-3">{student.first.lop}</td><td className="py-3 text-right tabular-nums">{student.count}</td><td className="py-3 text-right text-base font-bold tabular-nums">{student.average.toFixed(2)}</td></tr>)}</tbody></table></div></Panel></>;
}

function SubjectDashboard({ rows, subject }: { rows: ReportRow[]; subject: string }) {
  const subjectRows = rows.filter((row) => row.mon === subject);
  const scores = subjectRows.map((row) => row.diem);
  const classes = unique(subjectRows.map((row) => row.lop)).map((label) => ({ label, value: average(subjectRows.filter((row) => row.lop === label).map((row) => row.diem)), detail: `${subjectRows.filter((row) => row.lop === label).length} bài` })).sort((a, b) => b.value - a.value);
  if (!subject) return <EmptySelection text="Chọn một môn học trong Bộ lọc để xem báo cáo." />;
  return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Điểm trung bình" value={average(scores).toFixed(2)} detail={`${subjectRows.length} lượt bài thi`} icon={TrendingUp} tone="blue" /><KpiCard label="Điểm cao nhất" value={(Math.max(0, ...scores)).toFixed(2)} detail="Kết quả nổi bật" icon={GraduationCap} tone="green" /><KpiCard label="Điểm thấp nhất" value={(scores.length ? Math.min(...scores) : 0).toFixed(2)} detail="Mức cần lưu ý" icon={TrendingDown} tone="red" /><KpiCard label="Số điểm 10" value={String(scores.filter((score) => score === 10).length)} detail="Điểm tuyệt đối" icon={CheckCircle2} tone="amber" /></section>
    <section className="grid gap-5 xl:grid-cols-2"><Panel title={`Phổ điểm môn ${subject}`} subtitle="Xem điểm tập trung ở mức nào"><ScoreDistribution rows={subjectRows} /></Panel><Panel title="So sánh các lớp" subtitle="Xếp hạng điểm trung bình môn"><HorizontalBars items={classes} /></Panel></section>
    <Panel title="Điểm cần lưu ý" subtitle="Tính từ các bài thi đã có kết quả"><div className="grid gap-4 sm:grid-cols-3"><Insight label="Tỷ lệ dưới 5 điểm" value={`${percent(scores.filter((score) => score < 5).length, scores.length).toFixed(1)}%`} note="Tỷ lệ bài thi có điểm dưới 5." tone="red" /><Insight label="Tỷ lệ từ 6.5 điểm" value={`${percent(scores.filter((score) => score >= 6.5).length, scores.length).toFixed(1)}%`} note="Tỷ lệ bài thi có điểm từ 6.5 trở lên." tone="green" /><Insight label="Chênh lệch giữa các lớp" value={`${classes.length ? (classes[0]!.value - classes.at(-1)!.value).toFixed(2) : "0.00"} điểm`} note="Khoảng cách giữa lớp cao nhất và thấp nhất." tone="amber" /></div></Panel></>;
}

function StudentDashboard({ rows, student, students, search, onSearchChange, onSelect, onBack }: {
  rows: ReportRow[];
  student?: StudentSummary;
  students: StudentSummary[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (studentId: string) => void;
  onBack: () => void;
}) {
  if (!student) {
    const keyword = search.trim().toLocaleLowerCase("vi");
    const visibleStudents = students
      .filter((item) => !keyword || `${item.first.hoTen} ${item.first.maSo} ${item.first.lop}`.toLocaleLowerCase("vi").includes(keyword))
      .sort((a, b) => b.average - a.average || a.first.hoTen.localeCompare(b.first.hoTen, "vi"));

    return <Panel title="Danh sách học sinh" subtitle={`${visibleStudents.length} học sinh trong dữ liệu đang chọn`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Tìm học sinh</span>
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm theo tên, mã học sinh hoặc lớp..." className="min-h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        <p className="text-sm text-muted-foreground">Chọn một học sinh để xem điểm chi tiết</p>
      </div>
      {visibleStudents.length ? <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3">Học sinh</th><th className="pb-3">Mã số</th><th className="pb-3">Lớp</th><th className="pb-3 text-right">Số bài</th><th className="pb-3 text-right">Điểm TB</th><th className="pb-3">Xếp loại</th><th className="pb-3 text-right"><span className="sr-only">Thao tác</span></th></tr></thead>
          <tbody>{visibleStudents.map((item) => {
            const classification = item.average >= 8 ? "Giỏi" : item.average >= 6.5 ? "Khá" : item.average >= 5 ? "Trung bình" : "Cần quan tâm";
            return <tr key={item.id} tabIndex={0} role="button" aria-label={`Xem hồ sơ ${item.first.hoTen}`} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.id); } }} className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:hover:bg-blue-950/20">
              <td className="py-3.5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{item.first.hoTen.trim().charAt(0).toUpperCase()}</span><strong className="text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">{item.first.hoTen}</strong></div></td>
              <td className="py-3.5 text-muted-foreground">{item.first.maSo}</td><td className="py-3.5">{item.first.lop}</td><td className="py-3.5 text-right tabular-nums">{item.rows.length}</td><td className="py-3.5 text-right text-base font-bold tabular-nums">{item.average.toFixed(2)}</td>
              <td className="py-3.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.average < 5 ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>{classification}</span></td>
              <td className="py-3.5 text-right"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300"><ArrowRight className="h-4 w-4" aria-hidden="true" /></span></td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">Không tìm thấy học sinh</p><p className="mt-1 text-sm text-muted-foreground">Thử từ khóa khác hoặc thay đổi lựa chọn trong Bộ lọc.</p></div>}
    </Panel>;
  }
  const studentRows = student.rows;
  const classStudents = students.filter((item) => item.first.lop === student.first.lop).sort((a, b) => b.average - a.average);
  const rankClass = classStudents.findIndex((item) => item.id === student.id) + 1;
  const rankedAll = [...students].sort((a, b) => b.average - a.average);
  const rankAll = rankedAll.findIndex((item) => item.id === student.id) + 1;
  const weakest = unique(studentRows.map((row) => row.mon)).map((name) => ({ name, value: average(studentRows.filter((row) => row.mon === name).map((row) => row.diem)) })).sort((a, b) => a.value - b.value)[0];
  return <><button onClick={onBack} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="h-4 w-4" />Quay lại danh sách học sinh</button><section className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{student.first.hoTen.trim().charAt(0).toUpperCase()}</span><div><h3 className="text-xl font-bold">{student.first.hoTen}</h3><p className="text-sm text-muted-foreground">{student.first.maSo} · Lớp {student.first.lop}</p></div><span className="ml-auto rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Đang theo học</span></section>
    <section className="grid gap-3 sm:grid-cols-3"><KpiCard label="Điểm trung bình" value={student.average.toFixed(2)} detail={`${studentRows.length} lượt bài thi`} icon={TrendingUp} tone="blue" /><KpiCard label="Xếp hạng lớp" value={`${rankClass}/${classStudents.length}`} detail={`Trong lớp ${student.first.lop}`} icon={Users} tone="green" /><KpiCard label="Xếp hạng khối" value={`${rankAll}/${rankedAll.length}`} detail="Theo dữ liệu đang chọn" icon={Building2} tone="amber" /></section>
    <section className="grid gap-5 xl:grid-cols-2"><Panel title="Điểm qua các đợt thi" subtitle="Điểm trung bình của học sinh theo từng đợt"><TrendChart rows={studentRows} highlight={student.first.hoTen} /></Panel><Panel title="Điểm theo môn" subtitle="Học sinh (xanh) so với trung bình lớp (xám)"><SubjectComparison studentRows={studentRows} benchmarkRows={rows.filter((row) => row.lop === student.first.lop)} studentLabel="Học sinh" /></Panel></section>
    {weakest && <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><GraduationCap className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Môn cần ôn thêm</strong><p className="mt-1">{weakest.name} đang có điểm trung bình thấp nhất ({weakest.value.toFixed(2)}). Học sinh nên dành thêm thời gian ôn môn này.</p></div></div>}
    <Panel title="Chi tiết điểm hiện tại" subtitle="Từ 5 điểm trở lên được tính là đạt."><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="pb-3">Môn học</th><th className="pb-3">Đợt thi</th><th className="pb-3 text-right">Điểm</th><th className="pb-3">Kết quả</th></tr></thead><tbody>{studentRows.map((row) => <tr key={row.baiLamId} className="border-b border-border/60 last:border-0"><td className="py-3 font-semibold">{row.mon}</td><td className="py-3 text-muted-foreground">{row.dotThi}</td><td className="py-3 text-right text-base font-bold">{row.diem.toFixed(2)}</td><td className="py-3">{row.diem >= 5 ? <span className="text-emerald-700 dark:text-emerald-300">Đạt</span> : <span className="text-rose-700 dark:text-rose-300">Chưa đạt</span>}</td></tr>)}</tbody></table></div></Panel></>;
}

function Insight({ label, value, note, tone }: { label: string; value: string; note: string; tone: "red" | "green" | "amber" }) {
  const styles = { red: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20", green: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20", amber: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20" };
  return <div className={`rounded-lg border p-4 ${styles[tone]}`}><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p></div>;
}

function EmptySelection({ text }: { text: string }) {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center"><BarChart3 className="h-10 w-10 text-muted-foreground" /><p className="mt-4 max-w-md font-semibold">{text}</p><p className="mt-1 text-sm text-muted-foreground">Chọn nút Bộ lọc ở phía trên để chọn dữ liệu muốn xem.</p></div>;
}
