import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Clock,
  GraduationCap,
} from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Khong co dac ta rieng cho trang /ho-so trong FR/UC (chi duoc chot la dich redirect
// sau dang nhap o walkthrough-phase-1.md#L69). Gia dinh noi dung: ho so co ban + lich
// thi duoc phan cong (tu bai_lam_thi), moi hang tra theo dung trang_thai DB (khong tu
// suy doan "dang mo hay khong" tu gio he thong client). Bao lai neu can dac ta khac.
export default async function HoSoPage() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const supabase = taoSupabaseServiceRole();
  const [{ data: taiKhoan }, { data: baiLam }] = await Promise.all([
    supabase
      .from("tai_khoan")
      .select("ho_ten, ma_so, lop:lop_id(ten_lop, khoi), monTuChon1:mon_tu_chon_1_id(ten_mon), monTuChon2:mon_tu_chon_2_id(ten_mon)")
      .eq("tai_khoan_id", session.sub)
      .maybeSingle(),
    supabase
      .from("bai_lam_thi")
      .select(
        "bai_lam_id,trang_thai,ca_thi_mon_id,ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(so_thu_tu_ca,gio_bat_dau,gio_ket_thuc,trang_thai,dot_thi!inner(ten_dot_thi)))"
      )
      .eq("hoc_sinh_tai_khoan_id", session.sub),
  ]);

  const lop = Array.isArray(taiKhoan?.lop) ? taiKhoan.lop[0] : taiKhoan?.lop;
  const tc1 = Array.isArray(taiKhoan?.monTuChon1) ? taiKhoan.monTuChon1[0] : taiKhoan?.monTuChon1;
  const tc2 = Array.isArray(taiKhoan?.monTuChon2) ? taiKhoan.monTuChon2[0] : taiKhoan?.monTuChon2;

  const lich = (baiLam ?? [])
    .map((b) => {
      const ctm = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
      const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
      const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
      const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
      if (!mon || !ca) return null;
      return {
        baiLamId: b.bai_lam_id,
        caThiMonId: b.ca_thi_mon_id,
        trangThaiBai: b.trang_thai,
        tenMon: mon.ten_mon as string,
        soThuTuCa: ca.so_thu_tu_ca as number,
        gioBatDau: ca.gio_bat_dau as string,
        gioKetThuc: ca.gio_ket_thuc as string,
        trangThaiCa: ca.trang_thai as string,
        tenDotThi: dot?.ten_dot_thi as string | undefined,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => new Date(a.gioBatDau).getTime() - new Date(b.gioBatDau).getTime());

  const dangThi = lich.filter((x) => x.trangThaiBai === "DangThi");
  const conLai = lich.filter((x) => x.trangThaiBai !== "DangThi");

  return (
    <div className="space-y-8">
      <header className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
        <div className="flex min-w-0 flex-col justify-center rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chào {taiKhoan?.ho_ten ?? "bạn"}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {taiKhoan?.ma_so ?? "Chưa có mã số"}
            {lop?.ten_lop ? ` · Lớp ${lop.ten_lop} · Khối ${lop.khoi}` : ""}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Theo dõi lịch thi và trạng thái từng môn đã được phân công cho bạn.
          </p>
        </div>

        <section aria-labelledby="mon-tu-chon-heading" className="rounded-xl border border-border bg-muted/50 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            <h2 id="mon-tu-chon-heading" className="text-xs font-semibold uppercase tracking-wide">
              Môn thi tự chọn
            </h2>
          </div>
          <ul className="mt-4 space-y-2">
            {[tc1?.ten_mon, tc2?.ten_mon].map((tenMon, index) => (
              <li key={`${tenMon ?? "chua-chon"}-${index}`} className="flex items-start gap-2.5 text-sm font-medium text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span className="leading-5">{tenMon ?? "Chưa chọn"}</span>
              </li>
            ))}
          </ul>
          <Link href="/ho-so/doi-mon-tu-chon" className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Quản lý môn tự chọn <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </header>

      {dangThi.length > 0 && (
        <section className="space-y-3">
          {dangThi.map((item) => (
            <div
              key={item.caThiMonId}
              className="flex flex-col items-stretch gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <AlertTriangle aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{item.tenMon} đang diễn ra</p>
                  <p className="text-sm text-muted-foreground">Bạn có bài làm chưa nộp — tiếp tục ngay để không bị tính hết giờ.</p>
                </div>
              </div>
              <Link href={`/lam-bai/${item.caThiMonId}`} className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full sm:w-auto")}>
                Tiếp tục làm bài <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lịch thi của bạn</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lich.length} môn thi trong lịch hiện tại</p>
        </div>
        {!conLai.length ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Bạn chưa được phân công ca thi nào.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {conLai.map((item) => (
              <LichThiRow key={item.caThiMonId} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type LichItem = {
  baiLamId: string;
  caThiMonId: string;
  trangThaiBai: string;
  tenMon: string;
  soThuTuCa: number;
  gioBatDau: string;
  gioKetThuc: string;
  trangThaiCa: string;
  tenDotThi?: string;
};

function LichThiRow({ item }: { item: LichItem }) {
  const batDau = new Date(item.gioBatDau);
  const ketThuc = new Date(item.gioKetThuc);
  const ngay = (value: Date) => value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const gio = (value: Date) => value.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const cungNgay = batDau.toLocaleDateString("en-CA") === ketThuc.toLocaleDateString("en-CA");

  let action: LichAction;
  if (item.trangThaiBai === "DaNopBai") {
    action = { kind: "badge", icon: CheckCircle2, text: "Đã nộp bài", tone: "success" };
  } else if (item.trangThaiBai === "VangMat") {
    action = { kind: "badge", icon: CircleSlash, text: "Vắng mặt", tone: "muted" };
  } else if (item.trangThaiBai === "KhongTheDuThi_LoiToChuc") {
    action = { kind: "badge", icon: AlertTriangle, text: "Lỗi tổ chức — liên hệ giám thị", tone: "destructive" };
  } else if (item.trangThaiCa === "DangMo") {
    action = { kind: "button", text: "Vào thi" };
  } else if (item.trangThaiCa === "KetThuc") {
    action = { kind: "badge", icon: CircleSlash, text: "Đã kết thúc", tone: "muted" };
  } else {
    action = { kind: "badge", icon: Clock, text: "Sắp diễn ra", tone: "muted" };
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{item.tenMon}</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Ca {item.soThuTuCa}</span>
            {item.tenDotThi && <span className="text-xs font-medium text-muted-foreground">{item.tenDotThi}</span>}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              {cungNgay ? ngay(batDau) : `${ngay(batDau)} → ${ngay(ketThuc)}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {gio(batDau)} – {gio(ketThuc)}
            </span>
          </div>
        </div>
      </div>
      {action.kind === "button" ? (
        <Link href={`/lam-bai/${item.caThiMonId}`} className={cn(buttonVariants({ size: "sm" }), "min-h-11 w-full sm:w-auto")}>
          {action.text} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className={cn(
            "inline-flex min-h-9 w-fit shrink-0 items-center gap-1.5 self-end rounded-full px-3 py-1 text-xs font-medium sm:self-auto",
            action.tone === "success" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
            action.tone === "destructive" && "bg-destructive/10 text-destructive",
            action.tone === "muted" && "bg-muted text-muted-foreground"
          )}
        >
          <action.icon className="h-3.5 w-3.5" />
          {action.text}
        </span>
      )}
    </div>
  );
}

type LichAction =
  | { kind: "button"; text: string }
  | { kind: "badge"; icon: LucideIcon; text: string; tone: "success" | "destructive" | "muted" };
