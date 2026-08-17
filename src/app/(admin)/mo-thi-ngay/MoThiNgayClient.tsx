"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Layers3,
  PlayCircle,
  RotateCcw,
  ShieldOff,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { moCaThiNgay } from "./actions";
import type { CaThiBypass, DotThiBypass, KetQuaMoCaBypass } from "./types";

type TrangThaiForm = "MacDinh" | "VaoThi" | "SapDienRa";
type CauHinhCaForm = {
  caThiId: string;
  trangThai: TrangThaiForm;
  gioBatDau: string;
  gioKetThuc: string;
};

const NHAN_TRANG_THAI_CA: Record<string, string> = {
  SapDienRa: "Sắp diễn ra",
  DangMo: "Đang mở",
  KetThuc: "Đã kết thúc",
};

function datetimeLocal(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dinhDangThoiGian(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function taoCauHinhBanDau(dotThi?: DotThiBypass): Record<string, CauHinhCaForm> {
  return Object.fromEntries((dotThi?.cacCa ?? []).map((ca) => [
    ca.caThiId,
    {
      caThiId: ca.caThiId,
      trangThai: ca.override?.trangThai ?? "MacDinh",
      gioBatDau: datetimeLocal(ca.override?.gioBatDau ?? ca.gioBatDau),
      gioKetThuc: datetimeLocal(ca.override?.gioKetThuc ?? ca.gioKetThuc),
    },
  ]));
}

function caCoDuDe(ca: CaThiBypass) {
  return ca.mons.length > 0 && ca.mons.every((mon) => mon.coDeTaiSuDung);
}

export default function MoThiNgayClient({ cacDotThi }: { cacDotThi: DotThiBypass[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dotThiId, setDotThiId] = useState(cacDotThi[0]?.dotThiId ?? "");
  const dotThi = useMemo(() => cacDotThi.find((item) => item.dotThiId === dotThiId), [cacDotThi, dotThiId]);
  const cacCa = useMemo(() => dotThi?.cacCa ?? [], [dotThi]);
  const [cauHinh, setCauHinh] = useState<Record<string, CauHinhCaForm>>(() => taoCauHinhBanDau(cacDotThi[0]));
  const [lyDo, setLyDo] = useState("Chuẩn bị giao diện để chụp ảnh hoặc demo sản phẩm");
  const [daXacNhan, setDaXacNhan] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaMoCaBypass["data"] | null>(null);

  const thongKe = useMemo(() => {
    const values = Object.values(cauHinh);
    return {
      vaoThi: values.filter((item) => item.trangThai === "VaoThi").length,
      sapDienRa: values.filter((item) => item.trangThai === "SapDienRa").length,
      macDinh: values.filter((item) => item.trangThai === "MacDinh").length,
    };
  }, [cauHinh]);

  const formHopLe = useMemo(() => {
    if (!dotThi || lyDo.trim().length < 5 || cacCa.length === 0) return false;
    return cacCa.every((ca) => {
      const item = cauHinh[ca.caThiId];
      if (!item) return false;
      if (item.trangThai === "MacDinh") return true;
      const batDau = new Date(item.gioBatDau);
      const ketThuc = new Date(item.gioKetThuc);
      return Boolean(
        item.gioBatDau &&
        item.gioKetThuc &&
        ketThuc > batDau &&
        (item.trangThai !== "VaoThi" || caCoDuDe(ca))
      );
    });
  }, [cacCa, cauHinh, dotThi, lyDo]);

  function chonDotThi(id: string) {
    const dot = cacDotThi.find((item) => item.dotThiId === id);
    setDotThiId(id);
    setCauHinh(taoCauHinhBanDau(dot));
    setDaXacNhan(false);
    setKetQua(null);
  }

  function capNhatCa(caThiId: string, patch: Partial<CauHinhCaForm>) {
    setCauHinh((current) => {
      const previous = current[caThiId];
      if (!previous) return current;
      return { ...current, [caThiId]: { ...previous, ...patch } };
    });
    setDaXacNhan(false);
    setKetQua(null);
  }

  function doiTrangThai(ca: CaThiBypass, trangThai: TrangThaiForm) {
    if (trangThai === "MacDinh") {
      capNhatCa(ca.caThiId, {
        trangThai,
        gioBatDau: datetimeLocal(ca.gioBatDau),
        gioKetThuc: datetimeLocal(ca.gioKetThuc),
      });
      return;
    }
    const now = Date.now();
    const batDau = trangThai === "VaoThi" ? new Date(now - 60_000) : new Date(now + 30 * 60_000);
    const ketThuc = new Date(batDau.getTime() + 120 * 60_000);
    capNhatCa(ca.caThiId, {
      trangThai,
      gioBatDau: datetimeLocal(batDau),
      gioKetThuc: datetimeLocal(ketThuc),
    });
  }

  function submit() {
    if (!dotThi || !formHopLe || !daXacNhan) return;
    startTransition(async () => {
      const result = await moCaThiNgay({
        dotThiId: dotThi.dotThiId,
        lyDo,
        daXacNhan: true,
        cauHinhCa: cacCa.map((ca) => {
          const item = cauHinh[ca.caThiId]!;
          return {
            caThiId: ca.caThiId,
            trangThai: item.trangThai,
            gioBatDau: item.trangThai === "MacDinh" ? null : new Date(item.gioBatDau).toISOString(),
            gioKetThuc: item.trangThai === "MacDinh" ? null : new Date(item.gioKetThuc).toISOString(),
          };
        }),
      });
      if (!result.success) {
        toast.error("Chưa áp dụng được lịch demo", { description: result.error });
        return;
      }
      setKetQua(result.data);
      setConfirmOpen(false);
      setDaXacNhan(false);
      toast.success("Đã áp dụng lịch demo", { description: "Toàn bộ môn trong mỗi ca đã nhận cùng một lịch demo." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <SlidersHorizontal className="h-6 w-6 text-primary" aria-hidden="true" />
            Thiết lập lịch demo theo ca
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Chọn Ca 2, Ca 3 hoặc Ca 4 và đặt thời gian một lần. Tất cả môn thuộc ca được mở theo cùng cấu hình.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950">
          <ShieldOff className="h-4 w-4" aria-hidden="true" /> Chỉ dùng khi demo
        </span>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Lịch demo <strong>không sửa giờ ca thi thật</strong>. Chế độ này được phép dùng lại đề đã giao hoặc đã thi xong của đúng môn, kể cả đề ở đợt trước. Khi <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">DEMO_BYPASS_ENABLED=false</code>, menu và toàn bộ quyền bypass sẽ bị tắt.
        </p>
      </div>

      {!cacDotThi.length ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Chưa có đợt thi nào để cấu hình demo.
        </div>
      ) : (
        <>
          <section className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm lg:grid-cols-2 lg:items-end" aria-labelledby="cau-hinh-chung-heading">
            <div className="space-y-2">
              <Label id="cau-hinh-chung-heading" htmlFor="dot-thi">Đợt thi dùng để demo</Label>
              <select
                id="dot-thi"
                value={dotThiId}
                onChange={(event) => chonDotThi(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              >
                {cacDotThi.map((item) => <option key={item.dotThiId} value={item.dotThiId}>{item.tenDotThi} · {item.namHoc}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ly-do">Mục đích sử dụng</Label>
              <Input id="ly-do" value={lyDo} onChange={(event) => setLyDo(event.target.value)} maxLength={500} />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="danh-sach-ca-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="danh-sach-ca-heading" className="text-lg font-semibold text-foreground">Cấu hình theo ca thi</h2>
                <p className="mt-1 text-sm text-muted-foreground">Mỗi ca chỉ cần chọn trạng thái và giờ một lần; hệ thống tự áp dụng cho toàn bộ môn trong ca.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-primary px-2.5 py-1 text-primary-foreground">Vào thi {thongKe.vaoThi} ca</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Sắp diễn ra {thongKe.sapDienRa} ca</span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-muted-foreground">Lịch thật {thongKe.macDinh} ca</span>
              </div>
            </div>

            <div className="space-y-3">
              {cacCa.map((ca) => {
                const item = cauHinh[ca.caThiId];
                const coOverride = item?.trangThai !== "MacDinh";
                const thieuDe = ca.mons.filter((mon) => !mon.coDeTaiSuDung);
                const soHocSinh = ca.mons.reduce((total, mon) => total + mon.soHocSinh, 0);
                return (
                  <article key={ca.caThiId} className={cn("rounded-xl border bg-card p-4 shadow-sm sm:p-5", item?.trangThai === "VaoThi" ? "border-primary/40" : "border-border")}>
                    <div className="grid gap-5 xl:grid-cols-[minmax(15rem,0.9fr)_minmax(11rem,0.55fr)_minmax(13rem,0.75fr)_minmax(13rem,0.75fr)] xl:items-end">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">Ca {ca.soThuTuCa}</h3>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{ca.mons.length} môn</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> {soHocSinh} lượt dự thi</span>
                          <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" /> {thieuDe.length ? `${thieuDe.length} môn chưa có đề dùng lại` : "Đủ đề có thể dùng lại"}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Lịch thật: {NHAN_TRANG_THAI_CA[ca.trangThai] ?? ca.trangThai} · {dinhDangThoiGian(ca.gioBatDau)}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`trang-thai-${ca.caThiId}`}>Hiển thị cho học sinh</Label>
                        <select
                          id={`trang-thai-${ca.caThiId}`}
                          value={item?.trangThai ?? "MacDinh"}
                          onChange={(event) => doiTrangThai(ca, event.target.value as TrangThaiForm)}
                          className="h-11 w-full cursor-pointer rounded-xl border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                        >
                          <option value="MacDinh">Theo lịch thật</option>
                          <option value="VaoThi" disabled={!caCoDuDe(ca)}>Vào thi ngay</option>
                          <option value="SapDienRa">Sắp diễn ra</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`bat-dau-${ca.caThiId}`}>Giờ bắt đầu demo</Label>
                        <Input id={`bat-dau-${ca.caThiId}`} type="datetime-local" value={item?.gioBatDau ?? ""} disabled={!coOverride} onChange={(event) => capNhatCa(ca.caThiId, { gioBatDau: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`ket-thuc-${ca.caThiId}`}>Giờ kết thúc demo</Label>
                        <Input id={`ket-thuc-${ca.caThiId}`} type="datetime-local" value={item?.gioKetThuc ?? ""} disabled={!coOverride} onChange={(event) => capNhatCa(ca.caThiId, { gioKetThuc: event.target.value })} />
                      </div>
                    </div>

                    <div className="mt-4 border-t border-border pt-4">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Layers3 className="h-3.5 w-3.5" aria-hidden="true" /> Toàn bộ môn được áp dụng cùng lịch
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {ca.mons.map((mon) => (
                          <li key={mon.caThiMonId} className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
                            <span className="font-semibold">{mon.tenMon}</span>
                            <span className="ml-1 text-muted-foreground">· {mon.coDeTaiSuDung ? "có đề dùng lại" : "chưa có đề"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {ca.cauHinhCuKhongDongNhat && (
                      <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Ca này còn cấu hình cũ theo từng môn. Khi áp dụng, hệ thống sẽ đồng bộ toàn bộ môn theo giờ của ca.
                      </p>
                    )}
                    {thieuDe.length > 0 && item?.trangThai === "VaoThi" && (
                      <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-destructive">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Chưa thể mở ca vì thiếu đề có thể dùng lại cho: {thieuDe.map((mon) => mon.tenMon).join(", ")}.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Kiểm tra trạng thái và giờ của từng ca trước khi áp dụng.</p>
              <Button size="lg" disabled={!formHopLe || pending} onClick={() => setConfirmOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Xem lại và áp dụng
              </Button>
            </div>
          </section>
        </>
      )}

      {ketQua && (
        <section aria-live="polite" className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Đã áp dụng lịch demo cho {ketQua.tenDotThi}</h2>
              <p className="mt-1 text-sm leading-6">
                {ketQua.soCaVaoThi} ca vào thi · {ketQua.soCaSapDienRa} ca sắp diễn ra · {ketQua.soCaTheoLichThat} ca theo lịch thật. Đã áp dụng {ketQua.soMonDuocApDung} môn, trong đó {ketQua.soMonCoDeTaiSuDung} môn có thể dùng lại đề; khôi phục {ketQua.soBaiDuocKhoiPhuc} lượt và mở khóa mới {ketQua.soBaiDuocMoKhoa} lượt.
              </p>
            </div>
          </div>
        </section>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setDaXacNhan(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận áp dụng lịch demo theo ca</DialogTitle>
            <DialogDescription>
              Mỗi cấu hình sẽ áp dụng đồng thời cho tất cả môn thuộc ca đó. Dữ liệu lịch thi thật không bị sửa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/50 p-4 text-center text-sm">
              <div><PlayCircle className="mx-auto h-4 w-4 text-primary" aria-hidden="true" /><strong className="mt-1 block">{thongKe.vaoThi}</strong><span className="text-xs text-muted-foreground">Ca vào thi</span></div>
              <div><Clock3 className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" /><strong className="mt-1 block">{thongKe.sapDienRa}</strong><span className="text-xs text-muted-foreground">Ca sắp diễn ra</span></div>
              <div><RotateCcw className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden="true" /><strong className="mt-1 block">{thongKe.macDinh}</strong><span className="text-xs text-muted-foreground">Ca theo lịch thật</span></div>
            </div>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input type="checkbox" checked={daXacNhan} onChange={(event) => setDaXacNhan(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Tôi xác nhận đây là cấu hình phục vụ chụp giao diện hoặc demo, không phải lịch thi chính thức.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>Hủy</Button>
            <Button onClick={submit} disabled={!daXacNhan || pending}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> {pending ? "Đang áp dụng..." : "Áp dụng lịch demo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
