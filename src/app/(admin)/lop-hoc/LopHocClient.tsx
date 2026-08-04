"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { taoLop, capNhatLop, doiTrangThaiLop, xoaLop } from "./actions";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";

const KHOI_LIST = ["10", "11", "12"];

type Lop = {
  lop_id: string;
  ten_lop: string;
  khoi: string;
  trang_thai: string;
};

export default function LopHocClient({ initialData }: { initialData: Lop[] }) {
  const [data] = useState(initialData);
  const [isOpenTao, setIsOpenTao] = useState(false);
  const [editingLop, setEditingLop] = useState<Lop | null>(null);
  const [viewingLop, setViewingLop] = useState<Lop | null>(null);
  const [loading, setLoading] = useState(false);

  const [newLop, setNewLop] = useState({ ten_lop: "", khoi: "12" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await taoLop(newLop.ten_lop, newLop.khoi);
    if (res.success) {
      toast.success("Tạo lớp thành công");
      setIsOpenTao(false);
      setNewLop({ ten_lop: "", khoi: "12" });
    } else {
      toast.error(res.error || "Lỗi tạo lớp");
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLop) return;
    setLoading(true);
    const res = await capNhatLop(editingLop.lop_id, editingLop.ten_lop, editingLop.khoi);
    if (res.success) {
      toast.success("Cập nhật lớp thành công");
      setEditingLop(null);
    } else {
      toast.error(res.error || "Lỗi cập nhật");
    }
    setLoading(false);
  };

  const toggleTrangThai = async (lop: Lop) => {
    const next = lop.trang_thai === "HoatDong" ? "NgungHoatDong" : "HoatDong";
    const res = await doiTrangThaiLop(lop.lop_id, next);
    if (res.success) toast.success("Đổi trạng thái thành công");
    else toast.error(res.error || "Lỗi");
  };
  const remove = async (lop: Lop) => {
    if (!confirm(`Xóa lớp ${lop.ten_lop}?`)) return;
    const res = await xoaLop(lop.lop_id);
    if (res.success) { toast.success("Đã xóa lớp"); window.location.reload(); }
    else toast.error(res.error || "Không thể xóa lớp");
  };

  // Group by khoi
  const grouped = KHOI_LIST.reduce((acc, k) => {
    acc[k] = data.filter(l => l.khoi === k);
    return acc;
  }, {} as Record<string, Lop[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsOpenTao(true)}>Thêm lớp học mới</Button>
      </div>

      {KHOI_LIST.map(khoi => (
        <div key={khoi} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{khoi}</span>
            <span className="font-semibold text-foreground">Khối {khoi}</span>
            <span className="ml-auto text-xs text-muted-foreground">{grouped[khoi]?.length || 0} lớp</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">STT</TableHead>
                <TableHead>Tên lớp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!grouped[khoi]?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic text-sm">
                    Chưa có lớp nào thuộc khối {khoi}.
                  </TableCell>
                </TableRow>
              ) : (
                grouped[khoi].map((lop, idx) => (
                  <TableRow key={lop.lop_id}>
                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{lop.ten_lop}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleTrangThai(lop)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          lop.trang_thai === "HoatDong"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {lop.trang_thai === "HoatDong" ? "Hoạt động" : "Ngưng"}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Xem" onClick={() => setViewingLop(lop)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" title="Sửa" onClick={() => setEditingLop({ ...lop })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Xóa" onClick={() => remove(lop)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={!!viewingLop} onOpenChange={open => !open && setViewingLop(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Chi tiết lớp học</DialogTitle></DialogHeader>
          {viewingLop && <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Tên lớp</p><p className="font-medium">{viewingLop.ten_lop}</p></div>
            <div><p className="text-muted-foreground">Khối</p><p className="font-medium">Khối {viewingLop.khoi}</p></div>
            <div><p className="text-muted-foreground">Trạng thái</p><p className="font-medium">{viewingLop.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}</p></div>
          </div>}
        </DialogContent>
      </Dialog>
      {/* Dialog Tạo mới */}
      <Dialog open={isOpenTao} onOpenChange={setIsOpenTao}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thêm lớp học mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên lớp</Label>
              <Input
                required
                placeholder="Vd: 12A1, 10B3..."
                value={newLop.ten_lop}
                onChange={e => setNewLop({ ...newLop, ten_lop: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Khối</Label>
              <Select value={newLop.khoi} onValueChange={val => val && setNewLop({ ...newLop, khoi: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KHOI_LIST.map(k => <SelectItem key={k} value={k}>Khối {k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsOpenTao(false)}>Hủy</Button>
              <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Tạo lớp"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Sửa */}
      <Dialog open={!!editingLop} onOpenChange={open => !open && setEditingLop(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sửa lớp học</DialogTitle>
          </DialogHeader>
          {editingLop && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên lớp</Label>
                <Input
                  required
                  value={editingLop.ten_lop}
                  onChange={e => setEditingLop({ ...editingLop, ten_lop: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Khối</Label>
                <Select value={editingLop.khoi} onValueChange={val => val && setEditingLop({ ...editingLop, khoi: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KHOI_LIST.map(k => <SelectItem key={k} value={k}>Khối {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setEditingLop(null)}>Hủy</Button>
                <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
