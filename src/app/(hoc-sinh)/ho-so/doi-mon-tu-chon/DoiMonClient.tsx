"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Loader2 } from "lucide-react";
import { doiMonTuChon } from "./actions";
import { Button } from "@/components/ui/button";

type Mon = { mon_id: string; ten_mon: string };
type Dot = {
  dot_thi_id: string;
  ten_dot_thi: string;
  han_doi: string;
  so_lan_tc1: number;
  so_lan_tc2: number;
};

export default function DoiMonClient({
  mon,
  tc1,
  tc2,
  dot,
}: {
  mon: Mon[];
  tc1: string | null;
  tc2: string | null;
  dot: Dot[];
}) {
  const router = useRouter();
  const [selectedDot, setSelectedDot] = useState(dot[0]?.dot_thi_id ?? "");
  const [m1, setM1] = useState(tc1 ?? "");
  const [m2, setM2] = useState(tc2 ?? "");
  const [msg, setMsg] = useState("");
  const [warning, setWarning] = useState("");
  const [pending, startTransition] = useTransition();
  const dotDangChon = dot.find((item) => item.dot_thi_id === selectedDot);

  const submit = (viTri: "TC1" | "TC2", monMoiId: string) =>
    startTransition(async () => {
      setMsg("");
      setWarning("");
      const result = await doiMonTuChon({
        dotThiId: selectedDot,
        viTri,
        monMoiId,
      });

      if (!result.success) {
        setMsg(result.error ?? "Không thể đổi môn tự chọn");
        return;
      }

      setMsg(
        result.daGiuLichSuMonCu || result.monCuDaCoDe
          ? "Đã đổi môn. Các bài thi trước đây của môn cũ vẫn được giữ lại."
          : "Đã đổi môn và cập nhật danh sách dự thi.",
      );
      if (result.monMoiChuaCoDe) {
        setWarning(
          "Lịch thi cho môn mới chưa sẵn sàng. Vui lòng kiểm tra lại gần ngày thi.",
        );
      }
      router.refresh();
    });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Đổi môn tự chọn</h1>
        <p className="mt-1 text-sm text-muted-foreground">Mỗi môn tự chọn được đổi tối đa 2 lần trong một đợt thi.</p>
      </div>

      {!dot.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Hiện chưa có đợt thi nào dành cho lớp của bạn.
        </div>
      ) : (
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Đợt thi</span>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={selectedDot}
              onChange={(event) => setSelectedDot(event.target.value)}
            >
              {dot.map((item) => (
                <option value={item.dot_thi_id} key={item.dot_thi_id}>
                  {item.ten_dot_thi}
                </option>
              ))}
            </select>
          </label>

          {dotDangChon && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Hạn đổi: <b className="text-foreground">{new Date(dotDangChon.han_doi).toLocaleString("vi-VN")}</b>.
              {" "}Số lần đã đổi: Môn 1 — {dotDangChon.so_lan_tc1}/2, Môn 2 — {dotDangChon.so_lan_tc2}/2.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["TC1", m1, setM1],
                ["TC2", m2, setM2],
              ] as const
            ).map(([viTri, value, setter]) => {
              const heetLuot = (viTri === "TC1" ? dotDangChon?.so_lan_tc1 : dotDangChon?.so_lan_tc2) === 2;
              return (
                <section className="space-y-3 rounded-xl border border-border bg-card p-4" key={viTri}>
                  <h2 className="font-semibold text-foreground">Tự chọn {viTri === "TC1" ? "1" : "2"}</h2>
                  <select
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                  >
                    {mon.map((item) => (
                      <option value={item.mon_id} key={item.mon_id}>
                        {item.ten_mon}
                      </option>
                    ))}
                  </select>
                  <Button
                    disabled={pending || !selectedDot || heetLuot}
                    className="w-full"
                    onClick={() => submit(viTri, value)}
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                    {heetLuot ? "Đã hết lượt đổi" : "Xác nhận đổi"}
                  </Button>
                </section>
              );
            })}
          </div>
        </>
      )}

      {warning && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
      {msg && (
        <div role="status" className="flex items-start gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}
