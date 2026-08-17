"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { BookOpen, FileSpreadsheet, Loader2, Pencil, PlusCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichContentEditor from "@/components/RichContentEditor";
import { guiLaiCauHoi, importCauHoi, taoCauHoi, type KetQuaImport } from "./actions";

type Phan = "I" | "II" | "III";
type ChuyenDe = { chuyen_de_id: string; ten_chuyen_de: string; bai_hoc: { bai_hoc_id: string; ten_bai_hoc: string }[] };
type Props = {
  mon: string;
  phanChoPhep: Phan[];
  chuyenDe: ChuyenDe[];
  mucDo: { muc_do_id: string; ten_muc: string }[];
  cauHoiGanDay: { cau_hoi_id: string; phan: Phan; noi_dung: string; dap_an_phan3: string|null; muc_do_id: string; ly_do_duyet: string|null; trang_thai_duyet: string; created_at: string; chi_tiet_cau_hoi:{thu_tu:number;noi_dung:string;la_dap_an_dung:boolean}[];bai_hoc:{bai_hoc_id:string;chuyen_de:{chuyen_de_id:string}} }[];
  initialEditingId?: string;
};

export default function SoanCauHoiClient({ mon, phanChoPhep, chuyenDe, mucDo, cauHoiGanDay, initialEditingId }: Props) {
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");
  const [phan, setPhan] = useState<Phan>(phanChoPhep[0] || "I");
  const [chuyenDeId, setChuyenDeId] = useState(chuyenDe[0]?.chuyen_de_id || "");
  const [baiHocId, setBaiHocId] = useState(chuyenDe[0]?.bai_hoc[0]?.bai_hoc_id || "");
  const [mucDoId, setMucDoId] = useState(mucDo[0]?.muc_do_id || "");
  const [noiDung, setNoiDung] = useState("");
  const [chiTiet, setChiTiet] = useState(["", "", "", ""]);
  const [dungPhan1, setDungPhan1] = useState(0);
  const [dungPhan2, setDungPhan2] = useState([true, true, true, true]);
  const [dapAnPhan3, setDapAnPhan3] = useState(["", "", "", ""]);
  const [importResult, setImportResult] = useState<KetQuaImport | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const baiHoc = useMemo(() => chuyenDe.find((item) => item.chuyen_de_id === chuyenDeId)?.bai_hoc || [], [chuyenDe, chuyenDeId]);

  function doiChuyenDe(id: string) {
    setChuyenDeId(id);
    setBaiHocId(chuyenDe.find((item) => item.chuyen_de_id === id)?.bai_hoc[0]?.bai_hoc_id || "");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const payload = {
        phan,
        baiHocId,
        mucDoId,
        noiDung,
        chiTiet: phan === "III" ? [] : chiTiet.map((item, index) => ({ noiDung: item, laDapAnDung: phan === "I" ? index === dungPhan1 : dungPhan2[index] ?? false })),
        dapAnPhan3: phan === "III" ? dapAnPhan3.join("") : null,
      };
      const result = editingId ? await guiLaiCauHoi(editingId, payload) : await taoCauHoi(payload);
      if (!result.success) { toast.error(result.error); return; }
      toast.success(editingId ? "Đã sửa và gửi lại câu hỏi để duyệt" : "Đã gửi câu hỏi, đang chờ Tổ trưởng duyệt");
      setEditingId(null);
      setNoiDung(""); setChiTiet(["", "", "", ""]); setDapAnPhan3(["", "", "", ""]);
    });
  }

  function chinhSuaCauHoi(cau: Props["cauHoiGanDay"][number]) {
    const chiTietMoi=[...(cau.chi_tiet_cau_hoi||[])].sort((a,b)=>a.thu_tu-b.thu_tu);
    const chuyenDeMoi=cau.bai_hoc?.chuyen_de?.chuyen_de_id||"";
    setEditingId(cau.cau_hoi_id);
    setActiveTab("manual");
    setPhan(cau.phan);
    setChuyenDeId(chuyenDeMoi);
    setBaiHocId(cau.bai_hoc?.bai_hoc_id||"");
    setMucDoId(cau.muc_do_id);
    setNoiDung(cau.noi_dung);
    setChiTiet(chiTietMoi.map(x=>x.noi_dung).concat(["","",""]).slice(0,4));
    setDungPhan1(Math.max(0,chiTietMoi.findIndex(x=>x.la_dap_an_dung)));
    setDungPhan2(chiTietMoi.map(x=>x.la_dap_an_dung).concat([false,false,false]).slice(0,4));
    setDapAnPhan3((cau.dap_an_phan3||"").split("").concat(["","",""]).slice(0,4));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  useEffect(() => {
    if (!initialEditingId) return;
    const cau = cauHoiGanDay.find((item) => item.cau_hoi_id === initialEditingId && item.trang_thai_duyet === "CanChinhSua");
    if (cau) chinhSuaCauHoi(cau);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditingId]);

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await importCauHoi(data);
        setImportResult(result);
        result.success ? toast.success(`Đã nhập ${result.daNhap}/${result.tong} câu hỏi`) : toast.error(result.error);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Chưa đọc được file. Vui lòng kiểm tra file rồi thử lại.";
        setImportResult({ success: false, error: message, daNhap: 0, tong: 0, loi: [] });
        toast.error(message);
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-blue-600">Môn {mon}</p><h1 className="text-2xl font-bold">Soạn câu hỏi</h1><p className="mt-1 text-sm text-slate-500">Sau khi gửi, câu hỏi sẽ được Tổ trưởng xem và duyệt.</p></div>
          <Link href="/yeu-cau-chinh-sua" className="text-sm font-semibold text-blue-600 hover:underline">Yêu cầu chỉnh sửa câu đã duyệt →</Link>
        </header>

        <div className="flex gap-1 rounded-xl border bg-white p-1.5 shadow-sm">
          <button type="button" onClick={() => setActiveTab("manual")} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors ${activeTab === "manual" ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
            <PlusCircle className="h-5 w-5" />Tạo từng câu
          </button>
          <button type="button" onClick={() => setActiveTab("import")} className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors ${activeTab === "import" ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
            <FileSpreadsheet className="h-5 w-5" />Nhập từ Excel / Word
          </button>
        </div>

        {!chuyenDe.length || !mucDo.length ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Chưa có chuyên đề, bài học hoặc mức độ nhận thức để chọn. Vui lòng liên hệ Tổ trưởng bộ môn.</div> : activeTab === "manual" ? (
            <form onSubmit={submit} className="space-y-7 rounded-xl border bg-white p-7 shadow-sm lg:p-8">
              {editingId&&<div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Đang chỉnh sửa câu hỏi theo yêu cầu của Tổ trưởng</p><p className="mt-1">Hoàn thiện nội dung rồi gửi lại để duyệt.</p></div>}
              <div className="flex items-center justify-between gap-4 border-b pb-5">
                <div><h2 className="text-xl font-bold">Tạo một câu hỏi</h2><p className="mt-1 text-sm text-slate-500">Điền nội dung và chọn đáp án đúng trước khi gửi duyệt.</p></div>
                <div className="flex gap-2">{phanChoPhep.map((item) => <Button key={item} type="button" variant={phan === item ? "default" : "outline"} onClick={() => setPhan(item)}>Phần {item}</Button>)}</div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[2fr_2fr_1fr]">
                <SelectField label="Chuyên đề" value={chuyenDeId} onChange={doiChuyenDe} options={chuyenDe.map((item) => [item.chuyen_de_id, item.ten_chuyen_de])} />
                <SelectField label="Bài học" value={baiHocId} onChange={setBaiHocId} options={baiHoc.map((item) => [item.bai_hoc_id, item.ten_bai_hoc])} />
                <SelectField label="Mức độ" value={mucDoId} onChange={setMucDoId} options={mucDo.map((item) => [item.muc_do_id, item.ten_muc])} />
              </div>
              <div className="grid gap-2.5"><Label className="text-base font-semibold">Nội dung câu hỏi</Label><RichContentEditor value={noiDung} onChange={setNoiDung} placeholder="Nhập nội dung câu hỏi…" minHeightClass="min-h-64" /></div>
              {phan === "III" ? (
                <div className="space-y-3"><Label className="text-base font-semibold">Đáp án Phần III — đúng 4 ô</Label><div className="flex gap-3">{dapAnPhan3.map((value, index) => <Input key={index} aria-label={`Ký tự ${index + 1}`} className="h-14 w-14 text-center text-xl" maxLength={1} pattern="[0-9,-]" value={value} onChange={(e) => { if (/^[0-9,-]?$/.test(e.target.value)) setDapAnPhan3((old) => old.map((item, i) => i === index ? e.target.value : item)); }} />)}</div><p className="text-sm text-slate-500">Mỗi ô chỉ nhận 0–9, dấu trừ hoặc dấu phẩy.</p></div>
              ) : (
                <div className="space-y-3"><Label className="text-base font-semibold">{phan === "I" ? "4 phương án — chọn đúng 1 đáp án" : "4 ý — đánh dấu Đúng/Sai độc lập"}</Label>{chiTiet.map((value, index) => <div key={index} className={`grid grid-cols-[28px_28px_minmax(0,1fr)] items-center gap-3 rounded-lg border p-3 transition-colors ${phan === "I" ? (dungPhan1 === index ? "border-primary bg-primary/5" : "hover:bg-slate-50") : (dungPhan2[index] ? "border-emerald-400 bg-emerald-50/60" : "hover:bg-slate-50")}`}>
                  <input className="h-5 w-5 accent-primary" type={phan === "I" ? "radio" : "checkbox"} name={phan === "I" ? "dapAnDung" : undefined} checked={phan === "I" ? dungPhan1 === index : dungPhan2[index]} onChange={() => phan === "I" ? setDungPhan1(index) : setDungPhan2((old) => old.map((item, i) => i === index ? !item : item))} />
                  <span className="text-base font-bold">{phan === "I" ? String.fromCharCode(65 + index) : String.fromCharCode(97 + index)}</span>
                  <Input className="h-11 px-4 text-base md:text-base" value={value} onChange={(e) => setChiTiet((old) => old.map((item, i) => i === index ? e.target.value : item))} placeholder={phan === "I" ? `Nhập phương án ${String.fromCharCode(65 + index)}` : `Nhập ý ${String.fromCharCode(97 + index)}`} />
                </div>)}</div>
              )}
              <div className="flex justify-end gap-2 border-t pt-5">{editingId&&<Button type="button" variant="ghost" onClick={()=>setEditingId(null)}>Hủy chỉnh sửa</Button>}<Button type="submit" disabled={isPending || !baiHocId} className="h-11 px-7 text-base"><Send className="mr-2 h-4 w-4" />{isPending ? "Đang gửi…" : editingId?"Sửa và gửi lại":"Gửi duyệt"}</Button></div>
            </form>
        ) : (
            <form onSubmit={submitImport} className="space-y-7 rounded-xl border bg-white p-7 shadow-sm lg:p-8">
              <div className="border-b pb-5"><div className="flex items-center gap-2"><FileSpreadsheet className="h-6 w-6 text-emerald-600" /><h2 className="text-xl font-bold">Nhập nhiều câu hỏi từ Excel / Word</h2></div><p className="mt-2 text-sm text-slate-600">Tải file mẫu để xem các cột cần điền. File tải lên không được lớn hơn 10 MB.</p></div>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-3"><Label className="text-base font-semibold">Chọn file dữ liệu</Label><Input className="h-12 cursor-pointer px-4 py-2 text-base md:text-base" name="file" type="file" accept=".xlsx,.xls,.docx" required /></div>
                <div className="flex gap-3"><Button nativeButton={false} variant="outline" className="h-12 px-6" render={<a href="/api/cau-hoi/mau-import" />}>Tải file Excel mẫu</Button><Button type="submit" className="h-12 px-7" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Kiểm tra và nhập</Button></div>
              </div>
              {importResult && <ImportSummary result={importResult} />}
            </form>
        )}

        <section className="rounded-xl border bg-white p-6"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5" /><h2 className="font-bold">Câu hỏi vừa gửi</h2></div><div className="space-y-2">{cauHoiGanDay.length ? cauHoiGanDay.map((item) => <div key={item.cau_hoi_id} className={`rounded-lg p-3 text-sm ${item.trang_thai_duyet==="CanChinhSua"?"border border-amber-300 bg-amber-50":item.trang_thai_duyet==="TuChoi"?"border border-red-200 bg-red-50":"bg-slate-50"}`}><div className="flex flex-wrap items-start gap-3"><span className="rounded bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">Phần {item.phan}</span><p className="line-clamp-2 min-w-0 flex-1">{item.noi_dung}</p><span className="font-medium text-amber-700">{item.trang_thai_duyet === "ChoDuyet" ? "Chờ duyệt" : item.trang_thai_duyet==="CanChinhSua"?"Cần chỉnh sửa":item.trang_thai_duyet==="DaDuyet"?"Đã duyệt":"Từ chối"}</span></div>{item.trang_thai_duyet==="CanChinhSua"&&<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-3"><p className="text-amber-900"><b>Góp ý:</b> {item.ly_do_duyet}</p><Button type="button" size="sm" onClick={()=>chinhSuaCauHoi(item)}><Pencil className="h-3.5 w-3.5"/>Chỉnh sửa</Button></div>}{item.trang_thai_duyet==="TuChoi"&&<p className="mt-3 border-t border-red-200 pt-3 text-red-800"><b>Lý do từ chối:</b> {item.ly_do_duyet}</p>}</div>) : <p className="text-sm text-slate-500">Chưa có câu hỏi.</p>}</div></section>
      </div>
    </main>
  );
}

function SelectField({ label, options, name, value, onChange }: { label: string; options: [string, string][]; name?: string; value?: string; onChange?: (value: string) => void }) {
  return <div className="grid min-w-0 gap-2"><Label className="text-base font-semibold">{label}</Label><select title={options.find(([id]) => id === value)?.[1]} name={name} className="h-12 min-w-0 w-full truncate rounded-lg border border-slate-300 bg-white px-4 text-base" value={value} onChange={(e) => onChange?.(e.target.value)}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></div>;
}

function ImportSummary({ result }: { result: KetQuaImport }) {
  return <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}><p className="font-semibold">{result.success ? `Đã nhập ${result.daNhap}/${result.tong} câu` : result.error}</p>{result.loi.length > 0 && <div className="mt-2 max-h-48 overflow-auto"><table className="w-full text-xs"><tbody>{result.loi.map((item, index) => <tr key={`${item.dong}-${index}`} className="border-t"><td className="py-1 pr-2">Dòng {item.dong}</td><td>{item.noiDung}</td></tr>)}</tbody></table></div>}</div>;
}
