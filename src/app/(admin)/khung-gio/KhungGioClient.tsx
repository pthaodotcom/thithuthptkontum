"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { capNhatKhungGio } from "./actions";
import { toast } from "sonner";
import { Clock } from "lucide-react";

const TEN_CA: Record<number, string> = {
  1: "Ngày 1 — Sáng",
  2: "Ngày 1 — Chiều",
  3: "Ngày 2 — Sáng",
  4: "Ngày 2 — Chiều",
};

type KhungGio = {
  so_thu_tu_ca: number;
  gio_bat_dau: string;
  thoi_luong_phut: number;
};

// Build a full map so missing CAs still render
const buildFull = (data: KhungGio[]): KhungGio[] => {
  const map: Record<number, KhungGio> = {
    1: { so_thu_tu_ca: 1, gio_bat_dau: "07:30", thoi_luong_phut: 90 },
    2: { so_thu_tu_ca: 2, gio_bat_dau: "14:00", thoi_luong_phut: 90 },
    3: { so_thu_tu_ca: 3, gio_bat_dau: "07:30", thoi_luong_phut: 90 },
    4: { so_thu_tu_ca: 4, gio_bat_dau: "14:00", thoi_luong_phut: 90 },
  };
  for (const item of data) map[item.so_thu_tu_ca] = item;
  return [map[1]!, map[2]!, map[3]!, map[4]!];
};

export default function KhungGioClient({ initialData }: { initialData: KhungGio[] }) {
  const [items, setItems] = useState(buildFull(initialData));
  const [saving, setSaving] = useState<number | null>(null);

  const handleChange = (ca: number, field: "gio_bat_dau" | "thoi_luong_phut", val: string) => {
    setItems(prev =>
      prev.map(item =>
        item.so_thu_tu_ca === ca
          ? { ...item, [field]: field === "thoi_luong_phut" ? Number(val) : val }
          : item
      )
    );
  };

  const handleSave = async (ca: KhungGio) => {
    setSaving(ca.so_thu_tu_ca);
    const res = await capNhatKhungGio(ca.so_thu_tu_ca, ca.gio_bat_dau, ca.thoi_luong_phut);
    if (res.success) {
      toast.success(`Đã lưu ${TEN_CA[ca.so_thu_tu_ca]}`);
    } else {
      toast.error(res.error || "Lỗi lưu khung giờ");
    }
    setSaving(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map(item => (
        <div key={item.so_thu_tu_ca} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
              ${item.so_thu_tu_ca <= 2 ? 'bg-gold text-gold-foreground' : 'bg-primary text-primary-foreground'}`}>
              C{item.so_thu_tu_ca}
            </div>
            <div>
              <p className="font-semibold text-foreground">{TEN_CA[item.so_thu_tu_ca]}</p>
              <p className="text-xs text-muted-foreground">Ca {item.so_thu_tu_ca}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Giờ bắt đầu
              </Label>
              <Input
                type="time"
                value={item.gio_bat_dau}
                onChange={e => handleChange(item.so_thu_tu_ca, "gio_bat_dau", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Thời lượng (phút)</Label>
              <Input
                type="number"
                min="1"
                max="480"
                value={item.thoi_luong_phut}
                onChange={e => handleChange(item.so_thu_tu_ca, "thoi_luong_phut", e.target.value)}
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            Kết thúc lúc:{" "}
            <span className="font-medium text-foreground">
              {(() => {
                const [h = 0, m = 0] = item.gio_bat_dau.split(":").map(Number);
                const end = new Date(0, 0, 0, h, m + item.thoi_luong_phut);
                return end.toTimeString().slice(0, 5);
              })()}
            </span>
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={saving === item.so_thu_tu_ca}
            onClick={() => handleSave(item)}
          >
            {saving === item.so_thu_tu_ca ? "Đang lưu..." : "Lưu Ca " + item.so_thu_tu_ca}
          </Button>
        </div>
      ))}
    </div>
  );
}
