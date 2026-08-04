"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonOption, LopOption, CaThiOption } from "@/lib/reports/tuy-chon";

function nhanCaThi(ca: CaThiOption) {
  const gio = new Date(ca.gio_bat_dau).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return `${ca.ten_dot_thi} (${ca.nam_hoc}) — Ca ${ca.so_thu_tu_ca} — ${gio}`;
}

export default function BoLocBaoCao({
  monOptions, lopOptions, caThiOptions, monId, lopId, caThiMonId,
}: {
  monOptions: MonOption[];
  lopOptions: LopOption[];
  caThiOptions: CaThiOption[];
  monId?: string;
  lopId?: string;
  caThiMonId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const dieuHuong = (params: { monId?: string; lopId?: string; caThiMonId?: string }) => {
    const query = new URLSearchParams();
    if (params.monId) query.set("monId", params.monId);
    if (params.lopId) query.set("lopId", params.lopId);
    if (params.caThiMonId) query.set("caThiMonId", params.caThiMonId);
    router.push(`${pathname}?${query.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Môn</label>
        <Select value={monId || ""} onValueChange={(val) => val && dieuHuong({ monId: val })}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Chọn môn">{monOptions.find((m) => m.mon_id === monId)?.ten_mon}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {monOptions.map((m) => <SelectItem key={m.mon_id} value={m.mon_id}>{m.ten_mon}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Lớp</label>
        <Select
          value={lopId || ""}
          onValueChange={(val) => val && dieuHuong({ monId, lopId: val })}
          disabled={!monId || lopOptions.length === 0}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder={monId ? "Chọn lớp" : "Chọn môn trước"}>
              {(() => { const l = lopOptions.find((x) => x.lop_id === lopId); return l ? `${l.ten_lop} (${l.khoi})` : undefined; })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {lopOptions.map((l) => <SelectItem key={l.lop_id} value={l.lop_id}>{l.ten_lop} ({l.khoi})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Ca thi</label>
        <Select
          value={caThiMonId || ""}
          onValueChange={(val) => val && dieuHuong({ monId, lopId, caThiMonId: val })}
          disabled={!lopId || caThiOptions.length === 0}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder={lopId ? "Chọn ca thi" : "Chọn lớp trước"}>
              {(() => { const c = caThiOptions.find((x) => x.ca_thi_mon_id === caThiMonId); return c ? nhanCaThi(c) : undefined; })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {caThiOptions.map((c) => <SelectItem key={c.ca_thi_mon_id} value={c.ca_thi_mon_id}>{nhanCaThi(c)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
