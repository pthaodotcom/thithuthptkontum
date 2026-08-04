"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taoMonHoc, capNhatMonHoc, doiTrangThaiMon, xoaMonHoc } from "./actions";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";

const nhanLoaiMon: Record<string, string> = { BatBuoc: "Bắt buộc", TuChon: "Tự chọn" };
const nhanCaBatBuoc: Record<string, string> = { "1": "Ca 1", "2": "Ca 2" };

export default function MonHocClient({ initialData }: { initialData: any[] }) {
  const [data] = useState(initialData);
  const [isOpenTao, setIsOpenTao] = useState(false);
  const [isOpenSua, setIsOpenSua] = useState(false);
  const [isOpenXem, setIsOpenXem] = useState(false);
  const [editingMon, setEditingMon] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  // Form State (New)
  const [newMon, setNewMon] = useState({
    ten_mon: "", loai_mon: "BatBuoc", thu_tu_ca_bat_buoc: "1",
    phan1_so_cau: "", phan1_diem_moi_cau: "",
    phan2_so_cau: "", phan2_diem_1y: "", phan2_diem_2y: "", phan2_diem_3y: "", phan2_diem_4y: "",
    phan3_so_cau: "", phan3_diem_moi_cau: ""
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await taoMonHoc(newMon);
    if (res.success) {
      toast.success("Tạo môn học thành công");
      setIsOpenTao(false);
    } else {
      toast.error(res.error || "Lỗi tạo môn");
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await capNhatMonHoc(editingMon.mon_id, editingMon);
    if (res.success) {
      toast.success("Cập nhật môn học thành công");
      setIsOpenSua(false);
    } else {
      toast.error(res.error || "Lỗi cập nhật");
    }
    setLoading(false);
  };

  const toggleTrangThai = async (mon: any) => {
    const nextStatus = mon.trang_thai === "DangDung" ? "NgungDung" : "DangDung";
    if (confirm(`Bạn có chắc muốn ${nextStatus === "DangDung" ? "kích hoạt" : "ngưng dùng"} môn ${mon.ten_mon}?`)) {
      const res = await doiTrangThaiMon(mon.mon_id, nextStatus);
      if (res.success) toast.success("Đổi trạng thái thành công");
      else toast.error(res.error || "Lỗi đổi trạng thái");
    }
  };

  const handleDelete = async (mon: any) => {
    if (!confirm(`Xóa môn ${mon.ten_mon}?`)) return;
    const res = await xoaMonHoc(mon.mon_id);
    if (res.success) {
      toast.success("Đã xóa môn học");
      window.location.reload();
    } else toast.error(res.error || "Không thể xóa môn học");
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-muted/50 p-4">
        <h2 className="font-semibold text-foreground">Danh sách môn học</h2>
        <Button size="sm" onClick={() => setIsOpenTao(true)}>Thêm môn học mới</Button>
      </div>

      <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">STT</TableHead>
              <TableHead>Tên môn</TableHead>
              <TableHead>Loại môn</TableHead>
              <TableHead>Ca</TableHead>
              <TableHead>Tổ trưởng</TableHead>
              <TableHead>Barem</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Chưa có môn học nào.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow key={item.mon_id}>
                  <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.ten_mon}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.loai_mon === 'BatBuoc' ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'}`}>
                      {item.loai_mon === 'BatBuoc' ? 'Bắt buộc' : 'Tự chọn'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.thu_tu_ca_bat_buoc ? `Ca ${item.thu_tu_ca_bat_buoc}` : '-'}
                  </TableCell>
                  <TableCell>
                    {item.to_truong?.ho_ten || <span className="text-muted-foreground italic text-xs">Chưa có</span>}
                  </TableCell>
                  <TableCell className="text-xs space-y-1 text-muted-foreground">
                     {item.phan1_so_cau && <div>PI: {item.phan1_so_cau}c x {item.phan1_diem_moi_cau}đ</div>}
                     {item.phan2_so_cau && <div>PII: {item.phan2_so_cau}c (tối đa {item.phan2_diem_4y}đ)</div>}
                     {item.phan3_so_cau && <div>PIII: {item.phan3_so_cau}c x {item.phan3_diem_moi_cau}đ</div>}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleTrangThai(item)} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${item.trang_thai === 'DangDung' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>
                      {item.trang_thai === 'DangDung' ? 'Đang dùng' : 'Ngưng dùng'}
                    </button>
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    <Button variant="outline" size="icon" className="h-8 w-8" title="Xem chi tiết" aria-label={`Xem môn ${item.ten_mon}`} onClick={() => {
                      setEditingMon({...item});
                      setIsOpenXem(true);
                    }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" title="Sửa môn học" aria-label={`Sửa môn ${item.ten_mon}`} onClick={() => {
                      setEditingMon({...item});
                      setIsOpenSua(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Xóa môn" aria-label={`Xóa môn ${item.ten_mon}`} onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpenXem} onOpenChange={setIsOpenXem}>
        <DialogContent className="p-6 sm:p-8" style={{ width: "min(600px, calc(100vw - 48px))", maxWidth: "600px" }}>
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Chi tiết môn học</DialogTitle></DialogHeader>
          {editingMon && <div className="space-y-4 text-sm">
            <p><span className="text-muted-foreground">Tên môn:</span> <strong>{editingMon.ten_mon}</strong></p>
            <p><span className="text-muted-foreground">Loại môn:</span> {editingMon.loai_mon === "BatBuoc" ? "Bắt buộc" : "Tự chọn"}</p>
            <p><span className="text-muted-foreground">Tổ trưởng:</span> {editingMon.to_truong?.ho_ten || "Chưa có"}</p>
            <div className="rounded-lg border border-border bg-muted/60 p-4">
              <p>Phần I: {editingMon.phan1_so_cau || 0} câu × {editingMon.phan1_diem_moi_cau || 0} điểm</p>
              <p>Phần II: {editingMon.phan2_so_cau || 0} câu; tối đa {editingMon.phan2_diem_4y || 0} điểm/câu</p>
              <p>Phần III: {editingMon.phan3_so_cau || 0} câu × {editingMon.phan3_diem_moi_cau || 0} điểm</p>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={isOpenSua} onOpenChange={setIsOpenSua}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto p-6 sm:p-8"
          style={{ width: "min(1100px, calc(100vw - 48px))", maxWidth: "1100px" }}
        >
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Sửa môn học {editingMon?.ten_mon}</DialogTitle></DialogHeader>
          {editingMon && <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
            <div className="space-y-2.5">
              <Label className="text-base font-semibold">Tên môn</Label>
              <Input className="h-12 px-4 text-base" required value={editingMon.ten_mon} onChange={e => setEditingMon({...editingMon, ten_mon: e.target.value})} />
            </div>
            <div className="space-y-2.5">
              <Label className="text-base font-semibold">Loại môn</Label>
              <Select value={editingMon.loai_mon} onValueChange={(val) => val && setEditingMon({...editingMon, loai_mon: val, thu_tu_ca_bat_buoc: val === "BatBuoc" ? (editingMon.thu_tu_ca_bat_buoc ?? "1") : null})}>
                <SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue>{nhanLoaiMon[editingMon.loai_mon]}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BatBuoc">Bắt buộc</SelectItem>
                  <SelectItem value="TuChon">Tự chọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingMon.loai_mon === "BatBuoc" && (
              <div className="space-y-2.5">
                <Label className="text-base font-semibold">Ca bắt buộc</Label>
                <Select value={String(editingMon.thu_tu_ca_bat_buoc ?? "1")} onValueChange={(val) => val && setEditingMon({...editingMon, thu_tu_ca_bat_buoc: val})}>
                  <SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue>{nhanCaBatBuoc[String(editingMon.thu_tu_ca_bat_buoc ?? "1")]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ca 1</SelectItem>
                    <SelectItem value="2">Ca 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-6 sm:col-span-3">
              <h3 className="mb-4 text-base font-semibold text-foreground">Cấu trúc đề & Barem (Tổng = 10)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần I (4 lựa chọn)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={editingMon.phan1_so_cau ?? ""} onChange={e => setEditingMon({...editingMon, phan1_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm/câu</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan1_diem_moi_cau ?? ""} onChange={e => setEditingMon({...editingMon, phan1_diem_moi_cau: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần II (Đúng/Sai)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={editingMon.phan2_so_cau ?? ""} onChange={e => setEditingMon({...editingMon, phan2_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 1 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan2_diem_1y ?? ""} onChange={e => setEditingMon({...editingMon, phan2_diem_1y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 2 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan2_diem_2y ?? ""} onChange={e => setEditingMon({...editingMon, phan2_diem_2y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 3 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan2_diem_3y ?? ""} onChange={e => setEditingMon({...editingMon, phan2_diem_3y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 4 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan2_diem_4y ?? ""} onChange={e => setEditingMon({...editingMon, phan2_diem_4y: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần III (Trả lời ngắn)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={editingMon.phan3_so_cau ?? ""} onChange={e => setEditingMon({...editingMon, phan3_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm/câu</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={editingMon.phan3_diem_moi_cau ?? ""} onChange={e => setEditingMon({...editingMon, phan3_diem_moi_cau: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-3">
              <Button className="h-11 px-6 text-base" type="button" variant="outline" onClick={() => setIsOpenSua(false)}>Hủy</Button>
              <Button className="h-11 px-6 text-base" type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
            </div>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={isOpenTao} onOpenChange={setIsOpenTao}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto p-6 sm:p-8"
          style={{ width: "min(1100px, calc(100vw - 48px))", maxWidth: "1100px" }}
        >
          <DialogHeader className="border-b pb-5"><DialogTitle className="text-2xl font-bold">Thêm môn học mới</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
            <div className="space-y-2.5">
              <Label className="text-base font-semibold">Tên môn</Label>
              <Input className="h-12 px-4 text-base" required value={newMon.ten_mon} onChange={e => setNewMon({...newMon, ten_mon: e.target.value})} placeholder="Vd: Ngữ văn" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-base font-semibold">Loại môn</Label>
              <Select value={newMon.loai_mon} onValueChange={(val) => val && setNewMon({...newMon, loai_mon: val})}>
                <SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue>{nhanLoaiMon[newMon.loai_mon]}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BatBuoc">Bắt buộc</SelectItem>
                  <SelectItem value="TuChon">Tự chọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMon.loai_mon === "BatBuoc" && (
              <div className="space-y-2.5">
                <Label className="text-base font-semibold">Ca bắt buộc</Label>
                <Select value={newMon.thu_tu_ca_bat_buoc} onValueChange={(val) => val && setNewMon({...newMon, thu_tu_ca_bat_buoc: val})}>
                  <SelectTrigger className="h-12 w-full px-4 text-base"><SelectValue>{nhanCaBatBuoc[newMon.thu_tu_ca_bat_buoc]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ca 1</SelectItem>
                    <SelectItem value="2">Ca 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-6 sm:col-span-3">
              <h3 className="mb-4 text-base font-semibold text-foreground">Cấu trúc đề & Barem (Tổng = 10)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần I (4 lựa chọn)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={newMon.phan1_so_cau} onChange={e => setNewMon({...newMon, phan1_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm/câu</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan1_diem_moi_cau} onChange={e => setNewMon({...newMon, phan1_diem_moi_cau: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần II (Đúng/Sai)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={newMon.phan2_so_cau} onChange={e => setNewMon({...newMon, phan2_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 1 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan2_diem_1y} onChange={e => setNewMon({...newMon, phan2_diem_1y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 2 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan2_diem_2y} onChange={e => setNewMon({...newMon, phan2_diem_2y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 3 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan2_diem_3y} onChange={e => setNewMon({...newMon, phan2_diem_3y: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm 4 ý</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan2_diem_4y} onChange={e => setNewMon({...newMon, phan2_diem_4y: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/60 p-4">
                  <div className="font-semibold text-sm text-foreground">Phần III (Trả lời ngắn)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Số câu</Label>
                      <Input className="h-11" type="number" min="0" value={newMon.phan3_so_cau} onChange={e => setNewMon({...newMon, phan3_so_cau: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Điểm/câu</Label>
                      <Input className="h-11" type="number" step="0.01" min="0" value={newMon.phan3_diem_moi_cau} onChange={e => setNewMon({...newMon, phan3_diem_moi_cau: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-3">
              <Button className="h-11 px-6 text-base" variant="outline" type="button" onClick={() => setIsOpenTao(false)}>Hủy</Button>
              <Button className="h-11 px-6 text-base" type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Tạo Môn học"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
