"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { capNhatDotThi, taoDotThi, xoaDotThi } from "./actions";

type Lop = { lop_id: string; ten_lop: string; khoi: number };
type Dot = {
  dot_thi_id: string;
  ten_dot_thi: string;
  nam_hoc: string;
  ngay_thi_1: string;
  ngay_thi_2: string;
  ca_thi: Array<{ ca_thi_id: string; so_thu_tu_ca: number; trang_thai: string }>;
  dot_thi_lop?: Array<{ lop: { lop_id: string; ten_lop: string } | null }>;
};
type FieldErrors = { ten?: string; ngay1?: string; ngay2?: string; lopIds?: string; form?: string };

const statusMeta: Record<string, { label: string; className: string }> = {
  DangMo: { label: "Đang mở", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  SapDienRa: { label: "Sắp diễn ra", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  KetThuc: { label: "Đã kết thúc", className: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

function validate(ten: string, ngay1: string, ngay2: string, lopIds?: string[]) {
  const errors: FieldErrors = {};
  if (ten.trim().length < 3) errors.ten = "Tên đợt thi phải có ít nhất 3 ký tự.";
  if (!ngay1) errors.ngay1 = "Vui lòng chọn ngày thi thứ nhất.";
  if (!ngay2) errors.ngay2 = "Vui lòng chọn ngày thi thứ hai.";
  if (ngay1 && ngay2 && ngay2 <= ngay1) errors.ngay2 = "Ngày thi thứ hai phải sau ngày thi thứ nhất.";
  if (lopIds && !lopIds.length) errors.lopIds = "Vui lòng chọn ít nhất một lớp tham gia.";
  return errors;
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function DotThiClient({ cacLop, cacDot }: { cacLop: Lop[]; cacDot: Dot[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [ten, setTen] = useState("");
  const [ngay1, setNgay1] = useState("");
  const [ngay2, setNgay2] = useState("");
  const [lopIds, setLopIds] = useState<string[]>([]);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [editing, setEditing] = useState<Dot | null>(null);
  const [editTen, setEditTen] = useState("");
  const [editNgay1, setEditNgay1] = useState("");
  const [editNgay2, setEditNgay2] = useState("");
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const filteredClasses = useMemo(() => cacLop.filter(lop =>
    `${lop.ten_lop} ${lop.khoi}`.toLowerCase().includes(classSearch.trim().toLowerCase())
  ), [cacLop, classSearch]);

  const resetCreate = () => {
    setTen(""); setNgay1(""); setNgay2(""); setLopIds([]);
    setClassSearch(""); setClassPickerOpen(false); setCreateErrors({});
  };
  const closeCreate = () => { setCreating(false); resetCreate(); };
  const toggleClass = (id: string) => {
    setLopIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setCreateErrors(current => ({ ...current, lopIds: undefined, form: undefined }));
  };
  const create = () => {
    const errors = validate(ten, ngay1, ngay2, lopIds);
    setCreateErrors(errors);
    if (Object.keys(errors).length) return;
    startTransition(async () => {
      const result = await taoDotThi({ ten, ngay1, ngay2, lopIds });
      if (!result.success) {
        setCreateErrors({ form: result.error || "Không thể tạo đợt thi." });
        return;
      }
      toast.success("Đã tạo đợt thi và bốn ca thi.");
      closeCreate();
      router.refresh();
    });
  };
  const openEdit = (dot: Dot) => {
    setEditing(dot); setEditTen(dot.ten_dot_thi);
    setEditNgay1(dot.ngay_thi_1); setEditNgay2(dot.ngay_thi_2); setEditErrors({});
  };
  const saveEdit = () => {
    if (!editing) return;
    const errors = validate(editTen, editNgay1, editNgay2);
    setEditErrors(errors);
    if (Object.keys(errors).length) return;
    startTransition(async () => {
      const result = await capNhatDotThi({ dotThiId: editing.dot_thi_id, ten: editTen, ngay1: editNgay1, ngay2: editNgay2 });
      if (!result.success) return setEditErrors({ form: result.error || "Không thể cập nhật đợt thi." });
      toast.success("Đã cập nhật đợt thi.");
      setEditing(null);
      router.refresh();
    });
  };
  const remove = (dot: Dot) => {
    if (!confirm(`Xóa vĩnh viễn đợt thi "${dot.ten_dot_thi}" và bốn ca thi?`)) return;
    startTransition(async () => {
      const result = await xoaDotThi({ dotThiId: dot.dot_thi_id });
      if (result.success) { toast.success("Đã xóa đợt thi."); router.refresh(); }
      else toast.error(result.error ?? "Không thể xóa đợt thi.");
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đợt thi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý thời gian, lớp tham gia và trạng thái các ca thi.</p>
        </div>
        <Button className="h-11 px-5 text-base" onClick={() => setCreating(true)}><Plus className="mr-2 h-5 w-5" />Tạo đợt thi</Button>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Danh sách đợt thi</h2>
          <p className="text-sm text-muted-foreground">{cacDot.length} đợt thi trong hệ thống</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="min-w-56">Tên đợt thi</TableHead>
              <TableHead className="min-w-44">Thời gian</TableHead>
              <TableHead className="min-w-52">Lớp tham gia</TableHead>
              <TableHead className="min-w-72">Các ca thi</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!cacDot.length ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Chưa có đợt thi nào.</TableCell></TableRow>
                : cacDot.map(dot => {
                  const locked = dot.ca_thi?.some(ca => ca.trang_thai !== "SapDienRa");
                  const classes = dot.dot_thi_lop?.map(item => item.lop?.ten_lop).filter(Boolean) || [];
                  return <TableRow key={dot.dot_thi_id}>
                    <TableCell><p className="font-semibold text-foreground">{dot.ten_dot_thi}</p><p className="mt-1 text-xs text-muted-foreground">Năm học {dot.nam_hoc}</p></TableCell>
                    <TableCell><p className="font-medium">{formatDate(dot.ngay_thi_1)}</p><p className="mt-1 text-sm text-muted-foreground">đến {formatDate(dot.ngay_thi_2)}</p></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1.5">{classes.length ? classes.map(name => <span key={name} className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{name}</span>) : <span className="text-sm text-muted-foreground">Chưa có lớp</span>}</div></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1.5">{dot.ca_thi?.slice().sort((a, b) => a.so_thu_tu_ca - b.so_thu_tu_ca).map(ca => {
                      const meta = statusMeta[ca.trang_thai] || { label: ca.trang_thai, className: "bg-muted text-muted-foreground" };
                      return <span key={ca.ca_thi_id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>Ca {ca.so_thu_tu_ca} · {meta.label}</span>;
                    })}</div></TableCell>
                    <TableCell><div className="flex justify-end gap-1">
                      <Button size="icon" className="h-9 w-9" variant="ghost" disabled={pending || locked} title={locked ? "Không thể sửa khi ca thi đã mở hoặc kết thúc" : "Sửa"} onClick={() => openEdit(dot)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" variant="ghost" disabled={pending || locked} title="Xóa" onClick={() => remove(dot)}><Trash2 className="h-4 w-4" /></Button>
                    </div></TableCell>
                  </TableRow>;
                })}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={creating} onOpenChange={open => !open && closeCreate()}>
        <DialogContent className="p-6 sm:p-8" style={{ width: "min(1000px, calc(100vw - 48px))", maxWidth: "1000px" }}>
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Tạo đợt thi mới</DialogTitle></DialogHeader>
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Tên đợt thi" error={createErrors.ten} className="md:col-span-2">
              <Input className="h-12 px-4 text-base md:text-base" placeholder="Ví dụ: Thi thử lần 1" value={ten} onChange={e => { setTen(e.target.value); setCreateErrors(current => ({ ...current, ten: undefined, form: undefined })); }} />
            </Field>
            <Field label="Ngày thi thứ nhất" error={createErrors.ngay1}><Input className="h-12 px-4 text-base md:text-base" type="date" value={ngay1} onChange={e => { setNgay1(e.target.value); setCreateErrors(current => ({ ...current, ngay1: undefined, form: undefined })); }} /></Field>
            <Field label="Ngày thi thứ hai" error={createErrors.ngay2}><Input className="h-12 px-4 text-base md:text-base" type="date" value={ngay2} onChange={e => { setNgay2(e.target.value); setCreateErrors(current => ({ ...current, ngay2: undefined, form: undefined })); }} /></Field>
            <Field label="Lớp tham gia" error={createErrors.lopIds} className="relative md:col-span-2">
              <button type="button" className={`flex h-12 w-full items-center justify-between rounded-lg border bg-background px-4 text-left text-base ${createErrors.lopIds ? "border-destructive" : "border-input"}`} onClick={() => setClassPickerOpen(open => !open)}>
                <span className={lopIds.length ? "text-foreground" : "text-muted-foreground"}>{lopIds.length ? `Đã chọn ${lopIds.length} lớp` : "Chọn lớp tham gia"}</span><ChevronDown className="h-4 w-4" />
              </button>
              {lopIds.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{lopIds.map(id => {
                const lop = cacLop.find(item => item.lop_id === id);
                return <span key={id} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">{lop?.ten_lop}<button type="button" aria-label={`Bỏ lớp ${lop?.ten_lop}`} onClick={() => toggleClass(id)}><X className="h-3.5 w-3.5" /></button></span>;
              })}</div>}
              {classPickerOpen && <div className="absolute top-full z-20 mt-2 w-full rounded-xl border bg-popover p-3 shadow-xl">
                <div className="relative mb-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" autoFocus placeholder="Tìm tên lớp hoặc khối..." value={classSearch} onChange={e => setClassSearch(e.target.value)} /></div>
                <div className="max-h-64 overflow-y-auto">{filteredClasses.length ? filteredClasses.map(lop => {
                  const selected = lopIds.includes(lop.lop_id);
                  return <button type="button" key={lop.lop_id} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-muted" onClick={() => toggleClass(lop.lop_id)}><span>{lop.ten_lop} <span className="text-sm text-muted-foreground">· Khối {lop.khoi}</span></span><span className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{selected && <Check className="h-3.5 w-3.5" />}</span></button>;
                }) : <p className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy lớp phù hợp.</p>}</div>
              </div>}
            </Field>
          </div>
          {createErrors.form && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{createErrors.form}</p>}
          <DialogFooter><Button className="h-11 px-6 text-base" variant="outline" onClick={closeCreate}>Hủy</Button><Button className="h-11 px-6 text-base" disabled={pending} onClick={create}><Plus className="mr-2 h-4 w-4" />{pending ? "Đang tạo..." : "Tạo đợt thi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="p-6 sm:p-8" style={{ width: "min(850px, calc(100vw - 48px))", maxWidth: "850px" }}>
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Sửa đợt thi</DialogTitle></DialogHeader>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Tên đợt thi" error={editErrors.ten} className="md:col-span-2"><Input className="h-12 px-4 text-base md:text-base" value={editTen} onChange={e => { setEditTen(e.target.value); setEditErrors(current => ({ ...current, ten: undefined, form: undefined })); }} /></Field>
            <Field label="Ngày thi thứ nhất" error={editErrors.ngay1}><Input className="h-12 px-4 text-base md:text-base" type="date" value={editNgay1} onChange={e => { setEditNgay1(e.target.value); setEditErrors(current => ({ ...current, ngay1: undefined, form: undefined })); }} /></Field>
            <Field label="Ngày thi thứ hai" error={editErrors.ngay2}><Input className="h-12 px-4 text-base md:text-base" type="date" value={editNgay2} onChange={e => { setEditNgay2(e.target.value); setEditErrors(current => ({ ...current, ngay2: undefined, form: undefined })); }} /></Field>
          </div>
          {editErrors.form && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{editErrors.form}</p>}
          <DialogFooter><Button className="h-11 px-6 text-base" variant="outline" onClick={() => setEditing(null)}>Hủy</Button><Button className="h-11 px-6 text-base" disabled={pending} onClick={saveEdit}>{pending ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={`space-y-2 ${className}`}><Label className="text-base font-semibold">{label}</Label>{children}{error && <p className="text-sm font-medium text-destructive">{error}</p>}</div>;
}
