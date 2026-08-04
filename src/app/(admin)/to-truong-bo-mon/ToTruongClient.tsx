"use client";

import { useState, useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { boNhiemToTruong, goBoNhiemToTruong } from "./actions";

type Gv = { tai_khoan_id: string; ho_ten: string; ma_so: string; mon_id: string };
type Mon = { mon_id: string; ten_mon: string; to_truong_tai_khoan_id: string | null };

export default function ToTruongClient({ mon, giaoVien }: { mon: Mon[]; giaoVien: Gv[] }) {
  const [viewing, setViewing] = useState<Mon | null>(null);
  const [editing, setEditing] = useState<Mon | null>(null);
  const [selected, setSelected] = useState("");
  const [pending, startTransition] = useTransition();

  const teacher = (m: Mon) => giaoVien.find((g) => g.tai_khoan_id === m.to_truong_tai_khoan_id);
  const openEdit = (m: Mon) => {
    setEditing(m);
    setSelected(m.to_truong_tai_khoan_id ?? "");
  };
  const save = () =>
    editing &&
    selected &&
    startTransition(async () => {
      const r = await boNhiemToTruong({ monId: editing.mon_id, giaoVienId: selected });
      if (r.success) {
        toast.success("Đã cập nhật tổ trưởng");
        setEditing(null);
        location.reload();
      } else toast.error(r.error);
    });
  const remove = (m: Mon) => {
    if (!confirm(`Gỡ bổ nhiệm tổ trưởng môn ${m.ten_mon}?`)) return;
    startTransition(async () => {
      const r = await goBoNhiemToTruong(m.mon_id);
      if (r.success) {
        toast.success("Đã gỡ bổ nhiệm");
        location.reload();
      } else toast.error(r.error);
    });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Bổ nhiệm Tổ trưởng bộ môn</h1>
        <p className="text-sm text-muted-foreground">Quản lý giáo viên phụ trách tổ chuyên môn.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="p-3 text-left">Môn</th>
              <th className="p-3 text-left">Tổ trưởng hiện tại</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {mon.map((m) => (
              <tr key={m.mon_id} className="border-t border-border">
                <td className="p-3 font-medium text-foreground">{m.ten_mon}</td>
                <td className="p-3 text-foreground">
                  {teacher(m) ? `${teacher(m)!.ma_so} · ${teacher(m)!.ho_ten}` : <span className="text-muted-foreground">Chưa bổ nhiệm</span>}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" className="h-8 w-8" variant="outline" title="Xem" onClick={() => setViewing(m)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="h-8 w-8" variant="outline" title="Sửa bổ nhiệm" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      variant="outline"
                      title="Gỡ bổ nhiệm"
                      disabled={!m.to_truong_tai_khoan_id || pending}
                      onClick={() => remove(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết tổ chuyên môn</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Môn:</span> <strong className="text-foreground">{viewing.ten_mon}</strong></p>
              <p><span className="text-muted-foreground">Tổ trưởng:</span> <span className="text-foreground">{teacher(viewing)?.ho_ten || "Chưa bổ nhiệm"}</span></p>
              <p><span className="text-muted-foreground">Mã giáo viên:</span> <span className="text-foreground">{teacher(viewing)?.ma_so || "—"}</span></p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent
          className="p-6 sm:p-8"
          style={{ width: "min(900px, calc(100vw - 48px))", maxWidth: "900px" }}
        >
          <DialogHeader className="border-b pb-5">
            <DialogTitle className="text-2xl font-bold">Sửa bổ nhiệm môn {editing?.ten_mon}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-7">
              <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Giáo viên được bổ nhiệm</Label>
                  <select
                    className="h-14 w-full rounded-lg border border-input bg-background px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">Chọn giáo viên</option>
                    {giaoVien
                      .filter((g) => g.mon_id === editing.mon_id)
                      .map((g) => (
                        <option key={g.tai_khoan_id} value={g.tai_khoan_id}>
                          {g.ma_so} · {g.ho_ten}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="rounded-xl bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">Chỉ hiển thị các giáo viên đang phụ trách môn {editing.ten_mon}.</p>
              </div>
              <DialogFooter>
                <Button className="h-11 px-6 text-base" variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
                <Button className="h-11 px-6 text-base" disabled={!selected || pending} onClick={save}>Lưu bổ nhiệm</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
