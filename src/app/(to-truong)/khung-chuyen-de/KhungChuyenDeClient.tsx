"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  doiTrangThaiBaiHoc, doiTrangThaiChuyenDe, suaBaiHoc, suaChuyenDe,
  taoBaiHoc, taoChuyenDe, xoaBaiHoc, xoaChuyenDe,
} from "./actions";

type BaiHoc = {
  bai_hoc_id: string; ten_bai_hoc: string; ma_bai_hoc: string; trang_thai: "DangDung" | "VoHieuHoa";
  cau_hoi: { count: number }[];
};
type ChuyenDe = {
  chuyen_de_id: string; ten_chuyen_de: string; ma_chuyen_de: string; trang_thai: "DangDung" | "VoHieuHoa"; bai_hoc: BaiHoc[];
};
type Editor = { loai: "chuyen-de" | "bai-hoc"; id?: string; parentId?: string; ten: string; ma: string };

function goiYMaTiepTheo(tienTo: string, maDaCo: string[]) {
  const soLon = maDaCo.reduce((max, ma) => {
    const khop = ma.match(new RegExp(`^${tienTo}(\\d+)$`, "i"));
    return khop ? Math.max(max, Number(khop[1])) : max;
  }, 0);
  return `${tienTo}${soLon + 1}`;
}

export default function KhungChuyenDeClient({ initialData }: { initialData: ChuyenDe[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialData.map(x => x.chuyen_de_id)));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = () => router.refresh();

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    setLoading(true);
    const result = editor.loai === "chuyen-de"
      ? editor.id ? await suaChuyenDe(editor.id, editor.ten, editor.ma) : await taoChuyenDe(editor.ten, editor.ma)
      : editor.id ? await suaBaiHoc(editor.id, editor.ten, editor.ma) : await taoBaiHoc(editor.parentId!, editor.ten, editor.ma);
    setLoading(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Đã lưu thành công");
    setEditor(null); refresh();
  };
  const toggleExpand = (id: string) => setExpanded(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleChuyenDe = async (item: ChuyenDe) => {
    const next = item.trang_thai === "DangDung" ? "VoHieuHoa" : "DangDung";
    if (next === "VoHieuHoa" && !confirm("Vô hiệu hóa chuyên đề sẽ vô hiệu hóa toàn bộ bài học bên trong. Tiếp tục?")) return;
    const result = await doiTrangThaiChuyenDe(item.chuyen_de_id, next);
    if (result.success) { toast.success("Đã đổi trạng thái"); refresh(); } else toast.error(result.error);
  };
  const toggleBaiHoc = async (item: BaiHoc) => {
    const next = item.trang_thai === "DangDung" ? "VoHieuHoa" : "DangDung";
    const result = await doiTrangThaiBaiHoc(item.bai_hoc_id, next);
    if (result.success) { toast.success("Đã đổi trạng thái"); refresh(); } else toast.error(result.error);
  };
  const removeChuyenDe = async (item: ChuyenDe) => {
    if (!confirm(`Xóa chuyên đề “${item.ten_chuyen_de}”? Chỉ thực hiện được khi chưa có câu hỏi.`)) return;
    const result = await xoaChuyenDe(item.chuyen_de_id);
    if (result.success) { toast.success("Đã xóa chuyên đề"); refresh(); } else toast.error(result.error);
  };
  const removeBaiHoc = async (item: BaiHoc) => {
    if (!confirm(`Xóa bài học “${item.ten_bai_hoc}”?`)) return;
    const result = await xoaBaiHoc(item.bai_hoc_id);
    if (result.success) { toast.success("Đã xóa bài học"); refresh(); } else toast.error(result.error);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditor({ loai: "chuyen-de", ten: "", ma: goiYMaTiepTheo("CD", initialData.map(c => c.ma_chuyen_de)) })}><Plus className="mr-2 h-4 w-4" />Thêm chuyên đề</Button>
      </div>
      {initialData.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">Chưa có chuyên đề</p>
          <p className="text-sm text-slate-400">Hãy tạo chuyên đề đầu tiên cho môn học.</p>
        </div>
      ) : initialData.map(chuyenDe => {
        const isOpen = expanded.has(chuyenDe.chuyen_de_id);
        const questionCount = chuyenDe.bai_hoc.reduce((sum, b) => sum + (b.cau_hoi[0]?.count || 0), 0);
        return <section key={chuyenDe.chuyen_de_id} className={`overflow-hidden rounded-xl border bg-white ${chuyenDe.trang_thai === "VoHieuHoa" ? "opacity-65" : ""}`}>
          <div className="flex items-center gap-3 border-b bg-slate-50 px-4 py-3">
            <button onClick={() => toggleExpand(chuyenDe.chuyen_de_id)}>{isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-600">{chuyenDe.ma_chuyen_de}</span>
                <p className="truncate font-semibold">{chuyenDe.ten_chuyen_de}</p>
              </div>
              <p className="text-xs text-slate-500">{chuyenDe.bai_hoc.length} bài học · {questionCount} câu hỏi</p>
            </div>
            <button onClick={() => toggleChuyenDe(chuyenDe)} className={`rounded px-2 py-1 text-xs font-medium ${chuyenDe.trang_thai === "DangDung" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{chuyenDe.trang_thai === "DangDung" ? "Đang dùng" : "Vô hiệu hóa"}</button>
            <Button size="sm" variant="outline" onClick={() => setEditor({ loai: "chuyen-de", id: chuyenDe.chuyen_de_id, ten: chuyenDe.ten_chuyen_de, ma: chuyenDe.ma_chuyen_de })}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" onClick={() => removeChuyenDe(chuyenDe)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
          </div>
          {isOpen && <div className="divide-y">
            {chuyenDe.bai_hoc.map(baiHoc => <div key={baiHoc.bai_hoc_id} className={`flex items-center gap-3 px-6 py-3 ${baiHoc.trang_thai === "VoHieuHoa" ? "bg-slate-50 text-slate-500" : ""}`}>
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-600">{baiHoc.ma_bai_hoc}</span>
              <span className="flex-1 truncate text-sm font-medium">{baiHoc.ten_bai_hoc}</span>
              <span className="text-xs text-slate-400">{baiHoc.cau_hoi[0]?.count || 0} câu hỏi</span>
              <button disabled={chuyenDe.trang_thai === "VoHieuHoa"} onClick={() => toggleBaiHoc(baiHoc)} className={`rounded px-2 py-1 text-xs ${baiHoc.trang_thai === "DangDung" ? "bg-green-50 text-green-700" : "bg-slate-200 text-slate-600"}`}>{baiHoc.trang_thai === "DangDung" ? "Đang dùng" : "Vô hiệu hóa"}</button>
              <Button size="sm" variant="outline" onClick={() => setEditor({ loai: "bai-hoc", id: baiHoc.bai_hoc_id, parentId: chuyenDe.chuyen_de_id, ten: baiHoc.ten_bai_hoc, ma: baiHoc.ma_bai_hoc })}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => removeBaiHoc(baiHoc)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
            </div>)}
            <button disabled={chuyenDe.trang_thai === "VoHieuHoa"} onClick={() => setEditor({ loai: "bai-hoc", parentId: chuyenDe.chuyen_de_id, ten: "", ma: goiYMaTiepTheo("B", chuyenDe.bai_hoc.map(b => b.ma_bai_hoc)) })} className="flex w-full items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-white"><Plus className="h-4 w-4" />Thêm bài học</button>
          </div>}
        </section>;
      })}
      <Dialog open={!!editor} onOpenChange={value => !value && setEditor(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editor?.id ? "Đổi tên" : "Thêm"} {editor?.loai === "chuyen-de" ? "chuyên đề" : "bài học"}</DialogTitle></DialogHeader>
          {editor && <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Mã {editor.loai === "chuyen-de" ? "chuyên đề" : "bài học"}</Label>
              <Input autoFocus required maxLength={20} pattern="[A-Za-z0-9_-]+" title="Chỉ gồm chữ, số, gạch ngang, gạch dưới" placeholder={editor.loai === "chuyen-de" ? "VD: CD1" : "VD: B1"} value={editor.ma} onChange={e => setEditor({ ...editor, ma: e.target.value })} />
              <p className="text-xs text-slate-400">Dùng để đối chiếu nhanh khi import câu hỏi từ Excel — không dấu, không khoảng trắng.</p>
            </div>
            <div className="space-y-2"><Label>Tên {editor.loai === "chuyen-de" ? "chuyên đề" : "bài học"}</Label><Input required maxLength={150} value={editor.ten} onChange={e => setEditor({ ...editor, ten: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditor(null)}>Hủy</Button><Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button></div>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
