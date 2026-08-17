import MoThiNgayClient from "./MoThiNgayClient";
import type { DotThiBypass } from "./types";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { demoBypassDangBat } from "@/lib/demo/bypass";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type MonRelation = { ten_mon: string } | Array<{ ten_mon: string }> | null;

export default async function MoThiNgayPage() {
  if (!demoBypassDangBat()) notFound();

  const supabase = taoSupabaseServiceRole();
  const { data: dotRows } = await supabase
    .from("dot_thi")
    .select("dot_thi_id,ten_dot_thi,nam_hoc,created_at")
    .order("created_at", { ascending: false })
    .limit(12);
  const dotIds = (dotRows ?? []).map((row) => row.dot_thi_id);
  if (!dotIds.length) return <MoThiNgayClient cacDotThi={[]} />;

  const { data: caRows } = await supabase
    .from("ca_thi")
    .select("ca_thi_id,dot_thi_id,so_thu_tu_ca,gio_bat_dau,gio_ket_thuc,trang_thai")
    .in("dot_thi_id", dotIds)
    .gte("so_thu_tu_ca", 2)
    .lte("so_thu_tu_ca", 4)
    .order("gio_bat_dau", { ascending: false });
  const caIds = (caRows ?? []).map((row) => row.ca_thi_id);
  if (!caIds.length) return <MoThiNgayClient cacDotThi={[]} />;

  const { data: caMonRows } = await supabase
    .from("ca_thi_mon")
    .select("id,ca_thi_id,mon_id,mon(ten_mon)")
    .in("ca_thi_id", caIds);

  const caThiMonIds = (caMonRows ?? []).map((row) => row.id);
  const { data: overrideRows } = caThiMonIds.length
    ? await supabase
        .from("demo_bypass_ca_thi_mon")
        .select("ca_thi_mon_id,trang_thai,gio_bat_dau,gio_ket_thuc")
        .in("ca_thi_mon_id", caThiMonIds)
    : { data: [] };
  const overrideTheoCaMon = new Map((overrideRows ?? []).map((row) => [row.ca_thi_mon_id, row]));

  const { data: deRows } = await supabase
    .from("de_thi")
    .select("de_thi_id,trang_thai,ma_de(ma_de_id),ca_thi_mon!inner(mon_id)")
    .in("trang_thai", ["DaGiaoChuaBatDau", "DangThi", "DaThiXong"]);
  const monCoDeTaiSuDung = new Set<string>();
  for (const de of deRows ?? []) {
    const ctm = Array.isArray(de.ca_thi_mon) ? de.ca_thi_mon[0] : de.ca_thi_mon;
    if (ctm?.mon_id && (de.ma_de?.length ?? 0) > 0) monCoDeTaiSuDung.add(ctm.mon_id);
  }

  const countEntries = await Promise.all(
    (caMonRows ?? []).map(async (row) => {
      const { count } = await supabase
        .from("bai_lam_thi")
        .select("bai_lam_id", { count: "exact", head: true })
        .eq("ca_thi_mon_id", row.id);
      return [row.id, count ?? 0] as const;
    })
  );
  const soHocSinhTheoCaMon = new Map(countEntries);

  const cacDotThi: DotThiBypass[] = (dotRows ?? []).map((dot) => ({
    dotThiId: dot.dot_thi_id,
    tenDotThi: dot.ten_dot_thi,
    namHoc: dot.nam_hoc,
    cacCa: (caRows ?? [])
      .filter((ca) => ca.dot_thi_id === dot.dot_thi_id)
      .sort((a, b) => a.so_thu_tu_ca - b.so_thu_tu_ca)
      .map((ca) => {
        const monRows = (caMonRows ?? []).filter((row) => row.ca_thi_id === ca.ca_thi_id);
        const cacOverride = monRows.map((row) => overrideTheoCaMon.get(row.id)).filter((row) => Boolean(row));
        const overrideDau = cacOverride[0];
        const overrideDongNhat = Boolean(
          overrideDau &&
          cacOverride.length === monRows.length &&
          cacOverride.every((row) =>
            row?.trang_thai === overrideDau.trang_thai &&
            row?.gio_bat_dau === overrideDau.gio_bat_dau &&
            row?.gio_ket_thuc === overrideDau.gio_ket_thuc
          )
        );
        return {
          caThiId: ca.ca_thi_id,
          dotThiId: ca.dot_thi_id,
          soThuTuCa: ca.so_thu_tu_ca,
          gioBatDau: ca.gio_bat_dau,
          gioKetThuc: ca.gio_ket_thuc,
          trangThai: ca.trang_thai,
          override: overrideDau
            ? {
                trangThai: overrideDau.trang_thai as "VaoThi" | "SapDienRa",
                gioBatDau: overrideDau.gio_bat_dau,
                gioKetThuc: overrideDau.gio_ket_thuc,
              }
            : null,
          cauHinhCuKhongDongNhat: cacOverride.length > 0 && !overrideDongNhat,
          mons: monRows
            .map((row) => {
              const mon = row.mon as MonRelation;
              return {
                caThiMonId: row.id,
                monId: row.mon_id,
                tenMon: (Array.isArray(mon) ? mon[0]?.ten_mon : mon?.ten_mon) ?? "Môn chưa xác định",
                soHocSinh: soHocSinhTheoCaMon.get(row.id) ?? 0,
                coDeTaiSuDung: monCoDeTaiSuDung.has(row.mon_id),
              };
            })
            .sort((a, b) => a.tenMon.localeCompare(b.tenMon, "vi")),
        };
      }),
  }));

  return <MoThiNgayClient cacDotThi={cacDotThi} />;
}
