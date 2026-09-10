"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ketThucLuotDemo, layTrangThaiLuotDemo, taoLuotThiDemo, xuLyJobDemo } from "./actions";
import type { BaiTheoDoiDemo, CaThiBypass, DotThiBypass, LuotThiDemo } from "./types";

const CO_THE_CHON = new Set(["ChuaDangNhap", "VangMat", "BiKhoaChoXuLy"]);
const NHAN_TRANG_THAI: Record<string, string> = { ChuaVaoThi: "Chưa vào thi", DangLamBai: "Đang làm bài", DaNopBai: "Đã nộp bài", ChoXuLy: "Chờ xử lý", DangTaoNhanXet: "Đang tạo nhận xét", DangGuiEmail: "Đang gửi email", HoanTat: "Hoàn tất", ThieuEmail: "Thiếu email", ThatBaiTamThoi: "Thất bại tạm thời", CanXuLy: "Cần xử lý" };

function localDate(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default function MoThiNgayClient({ cacDotThi, luotDemoHienTai }: { cacDotThi: DotThiBypass[]; luotDemoHienTai: LuotThiDemo | null }) {
  const [luot, setLuot] = useState(luotDemoHienTai);
  const [dotThiId, setDotThiId] = useState(cacDotThi[0]?.dotThiId ?? "");
  const dot = cacDotThi.find((x) => x.dotThiId === dotThiId);
  const caDauId = dot?.cacCa[0]?.caThiId ?? "";
  const [caThiId, setCaThiId] = useState(dot?.cacCa[0]?.caThiId ?? "");
  const ca = dot?.cacCa.find((x) => x.caThiId === caThiId) ?? dot?.cacCa[0];
  const [timKiem, setTimKiem] = useState("");
  const [duocChon, setDuocChon] = useState<string[]>([]);
  const [trangThai, setTrangThai] = useState<"VaoThi" | "SapDienRa">("VaoThi");
  const [gioBatDau, setGioBatDau] = useState(() => localDate(new Date()));
  const [gioKetThuc, setGioKetThuc] = useState(() => localDate(new Date(Date.now() + 90 * 60_000)));
  const [lyDo, setLyDo] = useState("Demo theo danh sách học sinh được chọn");
  const [xacNhan, setXacNhan] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => { setCaThiId(caDauId); setDuocChon([]); }, [dotThiId, caDauId]);
  useEffect(() => { setDuocChon([]); }, [caThiId]);
  const luotDemoId = luot?.demoLuotThiId;
  const trangThaiLuot = luot?.trangThai;
  useEffect(() => {
    if (!luotDemoId || trangThaiLuot !== "DangXuLy") return;
    let daHuy = false;
    const tick = async () => {
      const xuLy = await xuLyJobDemo({ demoLuotThiId: luotDemoId });
      const status = await layTrangThaiLuotDemo({ demoLuotThiId: luotDemoId });
      if (!daHuy && status.success) setLuot(status.data);
      if (!daHuy && !xuLy.success) toast.error("Xử lý demo cần kiểm tra", { description: xuLy.error });
    };
    void tick();
    const id = window.setInterval(() => void tick(), 5000);
    return () => { daHuy = true; window.clearInterval(id); };
  }, [luotDemoId, trangThaiLuot]);

  const hocSinh = useMemo(() => {
    const q = timKiem.trim().toLocaleLowerCase("vi");
    return (ca?.hocSinh ?? []).filter((x) => CO_THE_CHON.has(x.trangThaiBai)).filter((x) => !q || `${x.maSo} ${x.hoTen} ${x.tenLop}`.toLocaleLowerCase("vi").includes(q));
  }, [ca, timKiem]);
  const soBaiDaNop = luot?.cacBai.filter((x) => x.trangThaiBai === "DaNopBai" && x.diemTong !== null).length ?? 0;

  const tao = () => startTransition(async () => {
    const result = await taoLuotThiDemo({ dotThiId, baiLamIds: duocChon, trangThaiHienThi: trangThai, gioBatDau: new Date(gioBatDau).toISOString(), gioKetThuc: new Date(gioKetThuc).toISOString(), lyDo, daXacNhan: true });
    if (!result.success) { toast.error("Không tạo được lượt demo", { description: result.error }); return; }
    const status = await layTrangThaiLuotDemo({ demoLuotThiId: result.demoLuotThiId });
    if (status.success) setLuot(status.data);
    setConfirmCreate(false); toast.success(`Đã mở demo cho ${result.soHocSinh} học sinh.`);
  });
  const ketThuc = () => startTransition(async () => {
    if (!luot) return;
    const result = await ketThucLuotDemo({ demoLuotThiId: luot.demoLuotThiId });
    if (!result.success) { toast.error("Chưa thể kết thúc", { description: result.error }); return; }
    const status = await layTrangThaiLuotDemo({ demoLuotThiId: luot.demoLuotThiId });
    if (status.success) setLuot(status.data);
    setConfirmEnd(false);
    if (result.soHocSinh > 0) {
      toast.success(`Đã chuyển ${result.soHocSinh} bài đã nộp sang phân tích, tạo nhận xét và gửi email.${result.soBaiKhongXuLy ? ` ${result.soBaiKhongXuLy} bài chưa nộp được bỏ qua.` : ""}`);
    } else {
      toast.success(`Đã kết thúc lượt demo. ${result.soBaiKhongXuLy} học sinh đã được gỡ khỏi lượt demo, bài làm giữ nguyên.`);
    }
  });

  if (luot) return <><TheoDoiLuot luot={luot} pending={pending} soBaiDaNop={soBaiDaNop} onEnd={() => setConfirmEnd(true)} onReset={() => setLuot(null)} />
    <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}><DialogContent><DialogHeader><DialogTitle>Kết thúc lượt thi demo?</DialogTitle><DialogDescription>{soBaiDaNop > 0 ? `${soBaiDaNop} bài đã nộp sẽ được phân tích, tạo nhận xét AI và gửi email. ${luot.cacBai.length - soBaiDaNop ? `${luot.cacBai.length - soBaiDaNop} học sinh chưa nộp sẽ được gỡ khỏi demo, bài làm không bị chấm vắng.` : ""}` : `Hiện chưa có học sinh nào nộp bài. Toàn bộ ${luot.cacBai.length} học sinh sẽ được gỡ khỏi lượt demo, bài làm được giữ nguyên (không bị chấm vắng) và lượt demo sẽ được đóng lại.`}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmEnd(false)}>Hủy</Button><Button variant={soBaiDaNop > 0 ? "default" : "destructive"} disabled={pending} onClick={ketThuc}>{pending ? "Đang kết thúc..." : soBaiDaNop > 0 ? "Kết thúc và xử lý bài đã nộp" : "Xác nhận kết thúc lượt demo"}</Button></DialogFooter></DialogContent></Dialog>
  </>;
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-foreground">Thi thử demo theo học sinh</h1><p className="mt-1 text-sm text-muted-foreground">Chỉ học sinh được chọn mới nhận lịch demo; lịch thi thật của các học sinh khác không thay đổi.</p></header>
    {!cacDotThi.length ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có đợt thi để tạo lượt demo.</div> : <section className="space-y-5 rounded-xl border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="dot">Đợt thi</Label><select id="dot" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={dotThiId} onChange={(e) => setDotThiId(e.target.value)}>{cacDotThi.map((x) => <option value={x.dotThiId} key={x.dotThiId}>{x.tenDotThi} · {x.namHoc}</option>)}</select></div><div className="space-y-2"><Label htmlFor="ca">Ca thi</Label><select id="ca" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={ca?.caThiId ?? ""} onChange={(e) => setCaThiId(e.target.value)}>{dot?.cacCa.map((x) => <option value={x.caThiId} key={x.caThiId}>Ca {x.soThuTuCa} · {x.hocSinh.length} học sinh</option>)}</select></div></div>
      <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Hiển thị cho học sinh</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={trangThai} onChange={(e) => setTrangThai(e.target.value as typeof trangThai)}><option value="VaoThi">Vao thi</option><option value="SapDienRa">Sắp diễn ra</option></select></div><div className="space-y-2"><Label htmlFor="start">Bắt đầu</Label><Input id="start" type="datetime-local" value={gioBatDau} onChange={(e) => setGioBatDau(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="end">Kết thúc</Label><Input id="end" type="datetime-local" value={gioKetThuc} onChange={(e) => setGioKetThuc(e.target.value)} /></div></div>
      <div className="space-y-2"><Label htmlFor="reason">Lý do</Label><Input id="reason" value={lyDo} maxLength={500} onChange={(e) => setLyDo(e.target.value)} /></div>
      <div className="space-y-3 border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Học sinh áp dụng</h2><p className="text-sm text-muted-foreground">Không chọn mặc định. Chỉ hiển thị bài có thể mở lại để demo.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{duocChon.length} đã chọn</span></div><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Tìm mã HS, họ tên hoặc lớp" value={timKiem} onChange={(e) => setTimKiem(e.target.value)} /></div><div className="max-h-72 divide-y overflow-auto rounded-lg border">{hocSinh.map((x) => <label key={x.baiLamId} className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-muted/50"><input type="checkbox" checked={duocChon.includes(x.baiLamId)} onChange={() => setDuocChon((ids) => ids.includes(x.baiLamId) ? ids.filter((id) => id !== x.baiLamId) : [...ids, x.baiLamId])}/><span className="min-w-0 flex-1"><strong>{x.hoTen}</strong> <span className="text-muted-foreground">· {x.maSo} · {x.tenLop}</span></span><span className="text-muted-foreground">{x.tenMon}</span></label>)}{!hocSinh.length && <p className="p-4 text-sm text-muted-foreground">Không có học sinh phù hợp.</p>}</div></div>
      <div className="flex justify-end"><Button disabled={!duocChon.length || lyDo.trim().length < 5 || new Date(gioKetThuc) <= new Date(gioBatDau)} onClick={() => setConfirmCreate(true)}><Users className="h-4 w-4"/>Tạo lượt demo</Button></div>
    </section>}
    <Dialog open={confirmCreate} onOpenChange={setConfirmCreate}><DialogContent><DialogHeader><DialogTitle>Tạo lượt thi demo?</DialogTitle><DialogDescription>Chỉ {duocChon.length} học sinh đã chọn được áp dụng lịch demo này.</DialogDescription></DialogHeader><label className="flex gap-2 text-sm"><input type="checkbox" checked={xacNhan} onChange={(e) => setXacNhan(e.target.checked)}/>Tôi xác nhận đây là dữ liệu demo.</label><DialogFooter><Button variant="outline" onClick={() => setConfirmCreate(false)}>Hủy</Button><Button disabled={!xacNhan || pending} onClick={tao}>{pending ? "Đang tạo..." : "Xác nhận tạo"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function TheoDoiLuot({ luot, pending, soBaiDaNop, onEnd, onReset }: { luot: LuotThiDemo; pending: boolean; soBaiDaNop: number; onEnd: () => void; onReset: () => void }) {
  const xong = luot.cacBai.filter((x) => x.trangThai === "HoanTat" || x.trangThai === "ThieuEmail").length;
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold">Lượt thi demo đang {luot.trangThai === "DangMo" ? "diễn ra" : luot.trangThai === "HoanTat" ? "hoàn tất" : "được xử lý"}</h1><p className="mt-1 text-sm text-muted-foreground">{luot.cacBai.length} học sinh · {luot.lyDo}</p></header><section className="rounded-xl border bg-card p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Tiến trình</h2><p className="text-sm text-muted-foreground">{luot.trangThai === "DangXuLy" ? `${xong}/${soBaiDaNop} bài hoàn tất · ${luot.soJobConLai} job còn lại` : luot.trangThai === "DangMo" ? `${luot.cacBai.length - soBaiDaNop} học sinh chưa nộp · ${soBaiDaNop} đã nộp` : "Đã hoàn thành toàn bộ tiến trình"}</p></div>
    <div className="flex items-center gap-2">
      {luot.trangThai === "DangMo" && (
        <Button variant={soBaiDaNop > 0 ? "default" : "destructive"} disabled={pending} onClick={onEnd}>
          {soBaiDaNop > 0 ? `Kết thúc và xử lý ${soBaiDaNop} bài đã nộp` : "Kết thúc lượt demo"}
        </Button>
      )}
      {luot.trangThai === "HoanTat" && (
        <>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 mr-2"><CheckCircle2 className="h-4 w-4"/>Hoàn tất</span>
          <Button variant="outline" size="sm" onClick={onReset}>Tạo lượt demo mới</Button>
        </>
      )}
      {luot.trangThai === "CanXuLy" && (
        <Button variant="outline" size="sm" onClick={onReset}>Tạo lượt demo mới</Button>
      )}
    </div>
  </div><BangBai rows={luot.cacBai}/></section></div>;
}

function BangBai({ rows }: { rows: BaiTheoDoiDemo[] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-y bg-muted/40 text-muted-foreground"><tr><th className="p-3">Học sinh</th><th className="p-3">Lớp</th><th className="p-3">Môn</th><th className="p-3">Điểm</th><th className="p-3">Email</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{rows.map((x) => <tr className="border-b" key={x.baiLamId}><td className="p-3 font-medium">{x.hoTen}<span className="ml-2 text-xs font-normal text-muted-foreground">{x.maSo}</span></td><td className="p-3">{x.tenLop}</td><td className="p-3">{x.tenMon}</td><td className="p-3">{x.diemTong ?? "—"}</td><td className="p-3">{x.coEmail ? "Có" : "Thiếu"}</td><td className="p-3">{NHAN_TRANG_THAI[x.trangThai] ?? x.trangThai}</td></tr>)}</tbody></table></div>; }
