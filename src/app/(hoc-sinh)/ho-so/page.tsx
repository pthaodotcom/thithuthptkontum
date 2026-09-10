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
  History,
  PlayCircle,
} from "lucide-react";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { apDungDemoBypassTheoBaiLam, demoBypassDangBat, type DemoBypassOverride } from "@/lib/demo/bypass";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Khong co dac ta rieng cho trang /ho-so trong FR/UC (chi duoc chot la dich redirect
// sau dang nhap o docs/legacy/walkthrough-phase-1.md#L69). Gia dinh noi dung: ho so co ban + lich
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

  const overrideTheoBaiLam = new Map<string, DemoBypassOverride>();
  if (demoBypassDangBat() && (baiLam?.length ?? 0) > 0) {
    const { data: overrideRows } = await supabase
      .from("demo_luot_thi_bai_lam")
      .select("bai_lam_id,trang_thai_hien_thi,gio_bat_dau,gio_ket_thuc,demo_luot_thi!inner(trang_thai)")
      .in("bai_lam_id", (baiLam ?? []).map((item) => item.bai_lam_id))
      .eq("demo_luot_thi.trang_thai", "DangMo");
    for (const row of overrideRows ?? []) {
      overrideTheoBaiLam.set(row.bai_lam_id, {
        trang_thai: row.trang_thai_hien_thi as DemoBypassOverride["trang_thai"],
        gio_bat_dau: row.gio_bat_dau,
        gio_ket_thuc: row.gio_ket_thuc,
      });
    }
  }

  const lich = (baiLam ?? [])
    .map((b) => {
      const ctm = Array.isArray(b.ca_thi_mon) ? b.ca_thi_mon[0] : b.ca_thi_mon;
      const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
      const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
      const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
      if (!mon || !ca) return null;
      const lichHieuLuc = apDungDemoBypassTheoBaiLam(
        {
          trangThai: ca.trang_thai as string,
          gioBatDau: ca.gio_bat_dau as string,
          gioKetThuc: ca.gio_ket_thuc as string,
        },
        overrideTheoBaiLam.get(b.bai_lam_id)
      );
      return {
        baiLamId: b.bai_lam_id,
        caThiMonId: b.ca_thi_mon_id,
        trangThaiBai: b.trang_thai,
        tenMon: mon.ten_mon as string,
        soThuTuCa: ca.so_thu_tu_ca as number,
        gioBatDau: lichHieuLuc.gioBatDau,
        gioKetThuc: lichHieuLuc.gioKetThuc,
        trangThaiCa: lichHieuLuc.trangThai,
        tenDotThi: dot?.ten_dot_thi as string | undefined,
        laDemoBypass: overrideTheoBaiLam.has(b.bai_lam_id),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => new Date(a.gioBatDau).getTime() - new Date(b.gioBatDau).getTime());

  const canThiNgay = lich
    .filter((item) => phanNhomLichThi(item) === "can-thi-ngay")
    .sort((a, b) => Number(b.trangThaiBai === "DangThi") - Number(a.trangThaiBai === "DangThi"));
  const sapDienRa = lich.filter((item) => phanNhomLichThi(item) === "sap-dien-ra");
  const daKetThuc = lich.filter((item) => phanNhomLichThi(item) === "da-ket-thuc").reverse();

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
            Xem lịch thi, giờ vào thi và tình trạng từng môn của bạn.
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

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lịch thi của bạn</h2>
        </div>
        {!lich.length ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Bạn chưa được phân công ca thi nào.
          </div>
        ) : (
          <div className="space-y-7">
            <NhomLichThi
              id="can-thi-ngay"
              title="Có thể vào thi"
              description="Vào thi hoặc tiếp tục bài đang làm trước khi hết giờ."
              items={canThiNgay}
              icon={PlayCircle}
              tone="primary"
            />
            <NhomLichThi
              id="sap-dien-ra"
              title="Sắp diễn ra"
              description="Các môn chưa đến giờ thi, xếp theo thời gian gần nhất."
              items={sapDienRa}
              icon={Clock}
              tone="muted"
            />
            <NhomLichThi
              id="da-ket-thuc"
              title="Đã thi hoặc vắng mặt"
              description="Các môn đã nộp bài, đã kết thúc hoặc bạn không tham dự."
              items={daKetThuc}
              icon={History}
              tone="muted"
            />
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
  laDemoBypass?: boolean;
};

type NhomLichThiId = "can-thi-ngay" | "sap-dien-ra" | "da-ket-thuc";

const TRANG_THAI_BAI_DA_KET_THUC = new Set(["DaNopBai", "VangMat", "KhongTheDuThi_LoiToChuc"]);

function phanNhomLichThi(item: LichItem): NhomLichThiId {
  if (TRANG_THAI_BAI_DA_KET_THUC.has(item.trangThaiBai) || item.trangThaiCa === "KetThuc") {
    return "da-ket-thuc";
  }
  if (item.trangThaiBai === "DangThi" || item.trangThaiCa === "DangMo") {
    return "can-thi-ngay";
  }
  return "sap-dien-ra";
}

function NhomLichThi({
  id,
  title,
  description,
  items,
  icon: Icon,
  tone,
}: {
  id: string;
  title: string;
  description: string;
  items: LichItem[];
  icon: LucideIcon;
  tone: "primary" | "muted";
}) {
  if (!items.length) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`${id}-heading`} className="font-semibold text-foreground">
              {title}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {items.length}
            </span>
          </div>
          <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={cn(
          "divide-y divide-border overflow-hidden rounded-xl border bg-card",
          tone === "primary" ? "border-primary/35 shadow-sm" : "border-border"
        )}
      >
        {items.map((item) => (
          <LichThiRow key={item.caThiMonId} item={item} />
        ))}
      </div>
    </section>
  );
}

function LichThiRow({ item }: { item: LichItem }) {
  const batDau = new Date(item.gioBatDau);
  const ketThuc = new Date(item.gioKetThuc);
  const ngay = (value: Date) => value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  const gio = (value: Date) => value.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
  const cungNgay = batDau.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }) === ketThuc.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

  let action: LichAction;
  if (item.trangThaiBai === "DaNopBai") {
    action = { kind: "badge", icon: CheckCircle2, text: "Đã nộp bài", tone: "success" };
  } else if (item.trangThaiBai === "VangMat") {
    action = { kind: "badge", icon: CircleSlash, text: "Vắng mặt", tone: "muted" };
  } else if (item.trangThaiBai === "KhongTheDuThi_LoiToChuc") {
    action = { kind: "badge", icon: AlertTriangle, text: "Lỗi tổ chức — liên hệ giám thị", tone: "destructive" };
  } else if (item.trangThaiBai === "DangThi") {
    action = { kind: "button", text: "Tiếp tục làm bài" };
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
            <h4 className="font-semibold text-foreground">{item.tenMon}</h4>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Ca {item.soThuTuCa}</span>
            {item.laDemoBypass && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                Lượt thi demo
              </span>
            )}
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
