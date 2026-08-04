"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Download, Eye, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  capNhatTaiKhoan, doiTrangThaiTaiKhoan, importTaiKhoan, resetMatKhau, taoTaiKhoan, xoaTaiKhoan, type TaiKhoanInput,
} from "./actions";

type TaiKhoan = {
  tai_khoan_id: string; ma_so: string; ho_ten: string; vai_tro: "Admin" | "GiaoVien" | "HocSinh";
  trang_thai: "HoatDong" | "DinhChi"; nam_sinh: number | null; email_phu_huynh: string | null;
  lop_id: string | null; mon_id: string | null; mon_tu_chon_1_id: string | null; mon_tu_chon_2_id: string | null;
  phai_doi_mat_khau: boolean; lop: { ten_lop: string } | null; mon: { mon_id: string; ten_mon: string } | null;
};
type Lop = { lop_id: string; ten_lop: string; khoi: string };
type Mon = { mon_id: string; ten_mon: string; loai_mon: string; to_truong_tai_khoan_id: string | null };
type VaiTroUi = TaiKhoanInput["vai_tro"];
const vaiTroLabels: Record<VaiTroUi | "TatCa", string> = {
  TatCa: "Tất cả vai trò", Admin: "Admin", ToTruong: "Tổ trưởng",
  GiaoVien: "Giáo viên", HocSinh: "Học sinh",
};

const blank = (): TaiKhoanInput => ({
  ma_so: "", ho_ten: "", vai_tro: "HocSinh", nam_sinh: new Date().getFullYear() - 18,
  lop_id: null, mon_id: null, email_phu_huynh: null, mon_tu_chon_1_id: null, mon_tu_chon_2_id: null,
});

export default function TaiKhoanClient({ initialData, lopList, monList, initialFilter = "TatCa" }: {
  initialData: TaiKhoan[]; lopList: Lop[]; monList: Mon[]; initialFilter?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<TaiKhoanInput>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TaiKhoan | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [subjectFilter, setSubjectFilter] = useState("TatCa");
  const [search, setSearch] = useState("");
  const [importErrors, setImportErrors] = useState<{ dong: number; maLoi: string; chiTiet: string }[]>([]);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const vaiTroUi = useCallback((tk: TaiKhoan): VaiTroUi =>
    tk.vai_tro === "GiaoVien" && monList.some(m => m.to_truong_tai_khoan_id === tk.tai_khoan_id)
      ? "ToTruong" : tk.vai_tro, [monList]);
  const filtered = useMemo(() => initialData.filter(tk => {
    const role = vaiTroUi(tk);
    const matchesRole = filter === "TatCa"
      || role === filter
      || (filter === "GiaoVien" && role === "ToTruong");
    const matchesSubject = subjectFilter === "TatCa"
      || tk.mon_id === subjectFilter
      || tk.mon_tu_chon_1_id === subjectFilter
      || tk.mon_tu_chon_2_id === subjectFilter;
    return matchesRole
      && matchesSubject
      && `${tk.ma_so} ${tk.ho_ten}`.toLowerCase().includes(search.toLowerCase());
  }), [initialData, filter, subjectFilter, search, vaiTroUi]);
  const monTuChon = monList.filter(m => m.loai_mon === "TuChon");

  const edit = (tk: TaiKhoan) => {
    setEditingId(tk.tai_khoan_id);
    setForm({
      ma_so: tk.ma_so, ho_ten: tk.ho_ten, vai_tro: vaiTroUi(tk),
      nam_sinh: tk.nam_sinh || new Date().getFullYear() - 30, lop_id: tk.lop_id, mon_id: tk.mon_id,
      email_phu_huynh: tk.email_phu_huynh, mon_tu_chon_1_id: tk.mon_tu_chon_1_id,
      mon_tu_chon_2_id: tk.mon_tu_chon_2_id,
    });
    setOpen(true);
  };
  const close = () => { setOpen(false); setEditingId(null); setForm(blank()); };
  const refresh = () => router.refresh();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const res = editingId ? await capNhatTaiKhoan(editingId, form) : await taoTaiKhoan(form);
    setLoading(false);
    if (!res.success) return toast.error(res.error || "Không thể lưu tài khoản");
    if ("matKhau" in res && res.matKhau) toast.success(`Đã tạo. Mật khẩu mặc định: ${res.matKhau}`, { duration: 10000 });
    else toast.success("Đã cập nhật tài khoản");
    close(); refresh();
  };

  const toggle = async (tk: TaiKhoan) => {
    const next = tk.trang_thai === "HoatDong" ? "DinhChi" : "HoatDong";
    let lyDo = "";
    if (next === "DinhChi") {
      const input = window.prompt(`Nhập lý do đình chỉ tài khoản ${tk.ma_so}:`);
      if (input === null) return;
      lyDo = input.trim();
      if (lyDo.length < 3) {
        toast.error("Lý do là bắt buộc");
        return;
      }
    }
    const res = await doiTrangThaiTaiKhoan(tk.tai_khoan_id, next, lyDo);
    if (res.success) {
      toast.success(
        res.dangLamBai
          ? "Đã đình chỉ; học sinh được tiếp tục bài đang làm và bị chặn từ lần đăng nhập sau"
          : next === "DinhChi" ? "Đã đình chỉ" : "Đã gỡ đình chỉ",
      );
      refresh();
    }
    else toast.error(res.error);
  };

  const doReset = async (tk: TaiKhoan) => {
    if (!window.confirm(`Reset mật khẩu của ${tk.ma_so} về mã số + năm sinh?`)) return;
    const res = await resetMatKhau(tk.tai_khoan_id);
    if (res.success) toast.success(`Mật khẩu mới: ${res.matKhau}`, { duration: 10000 });
    else toast.error(res.error);
  };
  const remove = async (tk: TaiKhoan) => {
    if (!window.confirm(`Xóa tài khoản ${tk.ma_so}?`)) return;
    const res = await xoaTaiKhoan(tk.tai_khoan_id);
    if (res.success) { toast.success("Đã xóa tài khoản"); refresh(); }
    else toast.error(res.error);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const book = XLSX.read(await file.arrayBuffer());
      const firstSheet = book.SheetNames[0];
      if (!firstSheet || !book.Sheets[firstSheet]) throw new Error("File không có sheet dữ liệu");
      const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(book.Sheets[firstSheet], { defval: "" });
      const lopByName = new Map(lopList.map(l => [l.ten_lop.toLowerCase(), l.lop_id]));
      const monByName = new Map(monList.map(m => [m.ten_mon.toLowerCase(), m.mon_id]));
      const rows = raw.map((r, index) => ({
        dong: index + 2,
        ma_so: String(r.ma_so || r["Mã số"] || ""),
        ho_ten: String(r.ho_ten || r["Họ tên"] || ""),
        vai_tro: String(r.vai_tro || r["Vai trò"] || "HocSinh") as VaiTroUi,
        nam_sinh: Number(r.nam_sinh || r["Năm sinh"]),
        lop_id: lopByName.get(String(r.lop || r["Lớp"] || "").toLowerCase()) || null,
        mon_id: monByName.get(String(r.mon || r["Môn"] || "").toLowerCase()) || null,
        email_phu_huynh: String(r.email_phu_huynh || r["Email phụ huynh"] || "").trim().toLowerCase() || null,
        mon_tu_chon_1_id: monByName.get(String(r.mon_tu_chon_1 || r["Môn tự chọn 1"] || "").toLowerCase()) || null,
        mon_tu_chon_2_id: monByName.get(String(r.mon_tu_chon_2 || r["Môn tự chọn 2"] || "").toLowerCase()) || null,
      }));
      setLoading(true);
      const result = await importTaiKhoan(rows);
      setImportErrors(result.loi);
      toast.success(`Import thành công ${result.thanhCong}/${rows.length} dòng`);
      refresh();
    } catch {
      toast.error("Không đọc được file Excel");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };
  const downloadTemplate = () => {
    const book = XLSX.utils.book_new();
    const headers = [
      "ma_so", "ho_ten", "vai_tro", "nam_sinh", "lop", "mon",
      "email_phu_huynh", "mon_tu_chon_1", "mon_tu_chon_2",
    ];
    const example = {
      ma_so: "HS0001", ho_ten: "Nguyễn Văn Mẫu", vai_tro: "HocSinh",
      nam_sinh: new Date().getFullYear() - 18,
      lop: lopList[0]?.ten_lop || "12A1", mon: "",
      email_phu_huynh: "phuhuynh@example.com",
      mon_tu_chon_1: monTuChon[0]?.ten_mon || "",
      mon_tu_chon_2: monTuChon[1]?.ten_mon || "",
    };
    const dataSheet = XLSX.utils.json_to_sheet([example], { header: headers });
    dataSheet["!cols"] = headers.map(header => ({ wch: Math.max(14, header.length + 2) }));
    XLSX.utils.book_append_sheet(book, dataSheet, "TaiKhoan");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["Vai trò", "Cột cần nhập"],
      ["HocSinh", "ma_so, ho_ten, vai_tro, nam_sinh, lop, mon_tu_chon_1, mon_tu_chon_2; email_phu_huynh không bắt buộc"],
      ["GiaoVien", "ma_so, ho_ten, vai_tro, nam_sinh, mon"],
      ["ToTruong", "Như GiaoVien; hệ thống bổ nhiệm tổ trưởng cho môn đã chọn"],
      ["Admin", "ma_so, ho_ten, vai_tro, nam_sinh"],
      ["Lưu ý", "Tên lớp và tên môn phải khớp chính xác với danh mục đang dùng."],
    ]), "HuongDan");
    XLSX.writeFile(book, "mau-import-tai-khoan.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <Button type="button" variant="ghost" disabled={loading} onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" />Tải file mẫu</Button>
        <Button variant="outline" disabled={loading} onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import Excel</Button>
        <Button onClick={() => { setForm({ ...blank(), vai_tro: initialFilter === "GiaoVien" ? "GiaoVien" : "HocSinh" }); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Thêm {initialFilter === "GiaoVien" ? "giáo viên" : initialFilter === "HocSinh" ? "học sinh" : "tài khoản"}</Button>
      </div>
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <Input className="max-w-xs" placeholder="Tìm mã số hoặc họ tên..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={filter} onValueChange={value => value && setFilter(value)}>
          <SelectTrigger className="w-44"><SelectValue>{vaiTroLabels[filter as VaiTroUi | "TatCa"]}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="TatCa">Tất cả vai trò</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem><SelectItem value="ToTruong">Tổ trưởng</SelectItem>
            <SelectItem value="GiaoVien">Giáo viên</SelectItem><SelectItem value="HocSinh">Học sinh</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={value => value && setSubjectFilter(value)}>
          <SelectTrigger className="w-52" aria-label="Lọc theo môn">
            <SelectValue placeholder="Tất cả môn">
              {subjectFilter === "TatCa"
                ? "Tất cả môn"
                : monList.find(mon => mon.mon_id === subjectFilter)?.ten_mon}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TatCa">Tất cả môn</SelectItem>
            {monList.map(mon => <SelectItem key={mon.mon_id} value={mon.mon_id}>{mon.ten_mon}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {importErrors.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Các dòng bị bỏ qua</p>
          {importErrors.map(e => <p key={`${e.dong}-${e.maLoi}`} className="text-amber-800 dark:text-amber-300">Dòng {e.dong} · {e.maLoi}: {e.chiTiet}</p>)}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Mã số</TableHead><TableHead>Họ tên</TableHead><TableHead>Vai trò</TableHead>
            <TableHead>Lớp / Môn</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Không có tài khoản phù hợp.</TableCell></TableRow>
              : filtered.map(tk => <TableRow key={tk.tai_khoan_id}>
                <TableCell className="font-mono font-medium">{tk.ma_so}</TableCell><TableCell>{tk.ho_ten}</TableCell>
                <TableCell>{({ Admin: "Admin", ToTruong: "Tổ trưởng", GiaoVien: "Giáo viên", HocSinh: "Học sinh" } as const)[vaiTroUi(tk)]}</TableCell>
                <TableCell>{tk.lop?.ten_lop || tk.mon?.ten_mon || "—"}</TableCell>
                <TableCell><button onClick={() => toggle(tk)} className={`rounded px-2 py-1 text-xs font-medium ${tk.trang_thai === "HoatDong" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>{tk.trang_thai === "HoatDong" ? "Hoạt động" : "Đình chỉ"}</button></TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button size="icon" className="h-8 w-8" variant="outline" title="Xem" onClick={() => setViewing(tk)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" className="h-8 w-8" variant="outline" title="Sửa" onClick={() => edit(tk)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" className="h-8 w-8" variant="outline" title="Reset mật khẩu" onClick={() => doReset(tk)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" variant="outline" title="Xóa" onClick={() => remove(tk)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!viewing} onOpenChange={value => !value && setViewing(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Chi tiết tài khoản</DialogTitle></DialogHeader>
          {viewing && <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Mã số</p><p className="font-medium">{viewing.ma_so}</p></div>
            <div><p className="text-muted-foreground">Họ tên</p><p className="font-medium">{viewing.ho_ten}</p></div>
            <div><p className="text-muted-foreground">Vai trò</p><p className="font-medium">{vaiTroLabels[vaiTroUi(viewing)]}</p></div>
            <div><p className="text-muted-foreground">Lớp / Môn</p><p className="font-medium">{viewing.lop?.ten_lop || viewing.mon?.ten_mon || "—"}</p></div>
            <div><p className="text-muted-foreground">Năm sinh</p><p className="font-medium">{viewing.nam_sinh || "—"}</p></div>
            <div><p className="text-muted-foreground">Trạng thái</p><p className="font-medium">{viewing.trang_thai === "HoatDong" ? "Hoạt động" : "Đình chỉ"}</p></div>
          </div>}
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={value => !value && close()}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto p-6 sm:p-8"
          style={{ width: "min(1000px, calc(100vw - 48px))", maxWidth: "1000px" }}
        >
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">{editingId ? "Cập nhật tài khoản" : "Thêm tài khoản"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-2.5"><Label className="text-base font-semibold">Mã số</Label><Input className="h-12 px-4 text-base md:text-base" required minLength={4} maxLength={20} value={form.ma_so} onChange={e => setForm({ ...form, ma_so: e.target.value })} /></div>
            <div className="space-y-2.5"><Label className="text-base font-semibold">Họ tên</Label><Input className="h-12 px-4 text-base md:text-base" required maxLength={100} value={form.ho_ten} onChange={e => setForm({ ...form, ho_ten: e.target.value })} /></div>
            <div className="space-y-2.5"><Label className="text-base font-semibold">Vai trò</Label><Select value={form.vai_tro} onValueChange={v => v && setForm({ ...form, vai_tro: v as VaiTroUi })}><SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue>{vaiTroLabels[form.vai_tro]}</SelectValue></SelectTrigger><SelectContent>
              <SelectItem value="Admin">Admin</SelectItem><SelectItem value="ToTruong">Tổ trưởng</SelectItem><SelectItem value="GiaoVien">Giáo viên</SelectItem><SelectItem value="HocSinh">Học sinh</SelectItem>
            </SelectContent></Select></div>
            <div className="space-y-2.5"><Label className="text-base font-semibold">Năm sinh</Label><Input className="h-12 px-4 text-base md:text-base" required type="number" min={1900} max={new Date().getFullYear()} value={form.nam_sinh} onChange={e => setForm({ ...form, nam_sinh: Number(e.target.value) })} /></div>
            {form.vai_tro === "HocSinh" && <>
              <div className="space-y-2.5"><Label className="text-base font-semibold">Lớp</Label><Select value={form.lop_id || ""} onValueChange={v => setForm({ ...form, lop_id: v })}><SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue placeholder="Chọn lớp">{lopList.find(l => l.lop_id === form.lop_id)?.ten_lop}</SelectValue></SelectTrigger><SelectContent>{lopList.map(l => <SelectItem key={l.lop_id} value={l.lop_id}>{l.ten_lop}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2.5"><Label className="text-base font-semibold">Email phụ huynh</Label><Input className="h-12 px-4 text-base md:text-base" type="email" placeholder="phuhuynh@example.com" value={form.email_phu_huynh || ""} onChange={e => setForm({ ...form, email_phu_huynh: e.target.value || null })} /><p className="text-sm leading-5 text-muted-foreground">Không bắt buộc; thiếu email sẽ được ghi nhận và không tính là lỗi gửi.</p></div>
              {[1, 2].map(pos => { const selectedId = pos === 1 ? form.mon_tu_chon_1_id : form.mon_tu_chon_2_id; return <div key={pos} className="space-y-2.5"><Label className="text-base font-semibold">Môn tự chọn {pos}</Label><Select required value={selectedId || ""} onValueChange={v => setForm({ ...form, [pos === 1 ? "mon_tu_chon_1_id" : "mon_tu_chon_2_id"]: v })}><SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue placeholder="Chọn môn">{monTuChon.find(m => m.mon_id === selectedId)?.ten_mon}</SelectValue></SelectTrigger><SelectContent>{monTuChon.map(m => <SelectItem key={m.mon_id} value={m.mon_id}>{m.ten_mon}</SelectItem>)}</SelectContent></Select></div>; })}
            </>}
            {(form.vai_tro === "GiaoVien" || form.vai_tro === "ToTruong") && <div className="space-y-2.5 sm:col-span-2"><Label className="text-base font-semibold">Môn phụ trách</Label><Select value={form.mon_id || ""} onValueChange={v => setForm({ ...form, mon_id: v })}><SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue placeholder="Chọn môn">{monList.find(m => m.mon_id === form.mon_id)?.ten_mon}</SelectValue></SelectTrigger><SelectContent>{monList.map(m => <SelectItem key={m.mon_id} value={m.mon_id}>{m.ten_mon}</SelectItem>)}</SelectContent></Select></div>}
            <p className="rounded-lg bg-muted/60 p-4 text-sm leading-6 text-muted-foreground sm:col-span-2">Mật khẩu mặc định = mã số + năm sinh và hết hiệu lực sau 15 ngày nếu chưa đăng nhập.</p>
            <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-2"><Button className="h-11 px-6 text-base" type="button" variant="outline" onClick={close}>Hủy</Button><Button className="h-11 px-6 text-base" disabled={loading} type="submit">{loading ? "Đang lưu..." : "Lưu tài khoản"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
