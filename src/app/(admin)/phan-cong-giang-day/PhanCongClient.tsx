"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Download, Eye, Pencil, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importPhanCong, luuPhanCong } from "./actions";

type GiaoVien = {
  tai_khoan_id: string;
  ma_so: string;
  ho_ten: string;
  mon_id: string | null;
  mon: { ten_mon: string } | null;
};
type Lop = { lop_id: string; ten_lop: string; khoi: string };
type Mon = { mon_id: string; ten_mon: string };
type Assignment = { id: string; giao_vien_tai_khoan_id: string; lop_id: string };

export default function PhanCongClient({ giaoVienList, lopList, monList, initialAssignments }: {
  giaoVienList: GiaoVien[];
  lopList: Lop[];
  monList: Mon[];
  initialAssignments: Assignment[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<GiaoVien | null>(null);
  const [editing, setEditing] = useState<GiaoVien | null>(null);
  const [editMonId, setEditMonId] = useState("");
  const [editLopIds, setEditLopIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ dong: number; maLoi: string; chiTiet: string }[]>([]);

  const assignmentsByTeacher = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const item of initialAssignments) {
      if (!result.has(item.giao_vien_tai_khoan_id)) result.set(item.giao_vien_tai_khoan_id, new Set());
      result.get(item.giao_vien_tai_khoan_id)!.add(item.lop_id);
    }
    return result;
  }, [initialAssignments]);
  const lopById = useMemo(() => new Map(lopList.map(item => [item.lop_id, item])), [lopList]);
  const visible = useMemo(() => giaoVienList.filter(giaoVien =>
    `${giaoVien.ma_so} ${giaoVien.ho_ten} ${giaoVien.mon?.ten_mon || ""}`.toLowerCase().includes(search.toLowerCase())
  ), [giaoVienList, search]);

  const classNames = (teacherId: string) => {
    const names = [...(assignmentsByTeacher.get(teacherId) || [])]
      .map(id => lopById.get(id)?.ten_lop)
      .filter(Boolean);
    return names.length ? names.join(", ") : "Chưa phân công lớp";
  };
  const openEdit = (giaoVien: GiaoVien) => {
    setEditing(giaoVien);
    setEditMonId(giaoVien.mon_id || "");
    setEditLopIds(new Set(assignmentsByTeacher.get(giaoVien.tai_khoan_id) || []));
  };
  const toggleLop = (lopId: string) => setEditLopIds(current => {
    const next = new Set(current);
    if (next.has(lopId)) next.delete(lopId);
    else next.add(lopId);
    return next;
  });
  const save = async () => {
    if (!editing) return;
    if (!editMonId) return toast.error("Vui lòng chọn môn dạy");
    if (!editLopIds.size) return toast.error("Vui lòng chọn ít nhất một lớp");
    setSaving(true);
    const result = await luuPhanCong(editing.tai_khoan_id, editMonId, [...editLopIds]);
    setSaving(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Đã cập nhật phân công giảng dạy");
    setEditing(null);
    router.refresh();
  };
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const book = XLSX.read(await file.arrayBuffer());
      const firstSheet = book.SheetNames[0];
      if (!firstSheet || !book.Sheets[firstSheet]) throw new Error("File không có sheet dữ liệu");
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(book.Sheets[firstSheet], { defval: "" });
      const rows = raw.map((row, index) => ({
        dong: index + 2,
        maGiaoVien: String(row.ma_giao_vien || row["Mã giáo viên"] || row.ma_so || ""),
        tenLop: String(row.ten_lop || row["Tên lớp"] || row.lop || ""),
      }));
      const result = await importPhanCong(rows);
      setErrors(result.loi);
      toast.success(`Đã import ${result.thanhCong}/${rows.length} phân công hợp lệ`);
      router.refresh();
    } catch {
      toast.error("Không đọc được file Excel");
    } finally {
      event.target.value = "";
    }
  };
  const downloadTemplate = () => {
    const rows = [{
      ma_giao_vien: giaoVienList[0]?.ma_so || "GV001",
      ten_lop: lopList[0]?.ten_lop || "12A1",
    }];
    const book = XLSX.utils.book_new();
    const dataSheet = XLSX.utils.json_to_sheet(rows, { header: ["ma_giao_vien", "ten_lop"] });
    dataSheet["!cols"] = [{ wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(book, dataSheet, "PhanCong");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["Cột", "Bắt buộc", "Hướng dẫn"],
      ["ma_giao_vien", "Có", "Mã số của giáo viên đang hoạt động"],
      ["ten_lop", "Có", "Tên lớp đang hoạt động, phải khớp danh mục lớp"],
      ["Lưu ý", "", "Môn dạy lấy từ môn phụ trách của giáo viên. Có thể đổi môn bằng thao tác Sửa trên màn hình."],
    ]), "HuongDan");
    XLSX.writeFile(book, "mau-import-phan-cong-giang-day.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <Input className="max-w-sm" placeholder="Tìm mã, tên giáo viên hoặc môn..." value={search} onChange={event => setSearch(event.target.value)} />
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" />Tải file mẫu</Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import Excel</Button>
        </div>
      </div>

      {errors.length > 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
        <p className="font-semibold text-amber-900 dark:text-amber-200">Các dòng bị bỏ qua</p>
        {errors.map((error, index) => <p key={`${error.dong}-${index}`} className="text-amber-800 dark:text-amber-300">Dòng {error.dong || "hệ thống"} · {error.maLoi}: {error.chiTiet}</p>)}
      </div>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Mã giáo viên</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Môn dạy</TableHead>
            <TableHead>Lớp phụ trách</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {visible.length === 0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có giáo viên phù hợp.</TableCell></TableRow>
              : visible.map(giaoVien => <TableRow key={giaoVien.tai_khoan_id}>
                <TableCell className="font-mono font-medium">{giaoVien.ma_so}</TableCell>
                <TableCell>{giaoVien.ho_ten}</TableCell>
                <TableCell>{giaoVien.mon?.ten_mon || "Chưa chọn môn"}</TableCell>
                <TableCell className="max-w-md">{classNames(giaoVien.tai_khoan_id)}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button size="icon" className="h-9 w-9" variant="outline" title="Xem" onClick={() => setViewing(giaoVien)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" className="h-9 w-9" variant="outline" title="Sửa" onClick={() => openEdit(giaoVien)}><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết phân công giảng dạy</DialogTitle></DialogHeader>
          {viewing && <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Mã giáo viên</p><p className="font-medium">{viewing.ma_so}</p></div>
            <div><p className="text-muted-foreground">Họ tên</p><p className="font-medium">{viewing.ho_ten}</p></div>
            <div><p className="text-muted-foreground">Môn dạy</p><p className="font-medium">{viewing.mon?.ten_mon || "Chưa chọn môn"}</p></div>
            <div><p className="text-muted-foreground">Lớp phụ trách</p><p className="font-medium">{classNames(viewing.tai_khoan_id)}</p></div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto p-6 sm:p-8"
          style={{ width: "min(1100px, calc(100vw - 48px))", maxWidth: "1100px" }}
        >
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Sửa phân công giảng dạy</DialogTitle></DialogHeader>
          {editing && <div className="grid gap-8 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.65fr)]">
            <div className="space-y-6">
              <div className="rounded-xl border bg-muted/40 p-5">
                <p className="text-lg font-semibold">{editing.ho_ten}</p>
                <p className="mt-1 text-sm text-muted-foreground">Mã giáo viên: {editing.ma_so}</p>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Môn dạy</Label>
                <Select value={editMonId} onValueChange={value => value && setEditMonId(value)}>
                  <SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue placeholder="Chọn môn">{monList.find(mon => mon.mon_id === editMonId)?.ten_mon}</SelectValue></SelectTrigger>
                  <SelectContent>{monList.map(mon => <SelectItem key={mon.mon_id} value={mon.mon_id}>{mon.ten_mon}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label className="text-base font-semibold">Lớp phụ trách</Label><span className="text-sm text-muted-foreground">Đã chọn {editLopIds.size} lớp</span></div>
              <div className="grid min-h-52 max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {lopList.map(lop => <label key={lop.lop_id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${editLopIds.has(lop.lop_id) ? "border-primary bg-primary/5" : "bg-card hover:bg-muted"}`}>
                  <input type="checkbox" className="h-5 w-5 accent-primary" checked={editLopIds.has(lop.lop_id)} onChange={() => toggleLop(lop.lop_id)} />
                  <span className="font-medium">{lop.ten_lop}</span>
                </label>)}
              </div>
            </div>
          </div>}
          <DialogFooter className="mt-2">
            <Button className="h-11 px-6 text-base" type="button" variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button className="h-11 px-6 text-base" type="button" disabled={saving} onClick={save}><Save className="mr-2 h-5 w-5" />{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">File Excel phân công cần hai cột: <code>ma_giao_vien</code> và <code>ten_lop</code>. Môn dạy có thể chọn hoặc thay đổi bằng thao tác Sửa.</p>
    </div>
  );
}
