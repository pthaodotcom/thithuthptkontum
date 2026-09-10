import { notFound } from "next/navigation";

import { demoBypassDangBat } from "@/lib/demo/bypass";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { layTrangThaiLuotDemo } from "./actions";
import MoThiNgayClient from "./MoThiNgayClient";
import type { DotThiBypass, HocSinhDemo } from "./types";

export const dynamic = "force-dynamic";

export default async function MoThiNgayPage() {
  if (!demoBypassDangBat()) notFound();
  const supabase = taoSupabaseServiceRole();
  const [{ data: dots }, { data: cas }, { data: baiLam }, { data: active }] = await Promise.all([
    supabase.from("dot_thi").select("dot_thi_id,ten_dot_thi,nam_hoc,created_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("ca_thi").select("ca_thi_id,dot_thi_id,so_thu_tu_ca,gio_bat_dau,gio_ket_thuc").order("gio_bat_dau", { ascending: false }),
    supabase.from("bai_lam_thi").select("bai_lam_id,trang_thai,diem_tong,hoc_sinh_tai_khoan_id,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,ma_so,email_phu_huynh,lop:lop_id(ten_lop)),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(ca_thi_id,dot_thi_id,so_thu_tu_ca))"),
    supabase.from("demo_luot_thi").select("demo_luot_thi_id").in("trang_thai", ["DangMo", "DangXuLy"]).maybeSingle(),
  ]);
  const hocSinhTheoCa = new Map<string, HocSinhDemo[]>();
  for (const row of baiLam ?? []) {
    const tk = Array.isArray(row.tai_khoan) ? row.tai_khoan[0] : row.tai_khoan;
    const lop = Array.isArray(tk?.lop) ? tk?.lop[0] : tk?.lop;
    const ctm = Array.isArray(row.ca_thi_mon) ? row.ca_thi_mon[0] : row.ca_thi_mon;
    const mon = Array.isArray(ctm?.mon) ? ctm?.mon[0] : ctm?.mon;
    const ca = Array.isArray(ctm?.ca_thi) ? ctm?.ca_thi[0] : ctm?.ca_thi;
    if (!ca) continue;
    const item: HocSinhDemo = { baiLamId: row.bai_lam_id, caThiId: ca.ca_thi_id, hoTen: tk?.ho_ten ?? "Học sinh", maSo: tk?.ma_so ?? "", tenLop: lop?.ten_lop ?? "", tenMon: mon?.ten_mon ?? "", soThuTuCa: ca.so_thu_tu_ca, trangThaiBai: row.trang_thai, diemTong: row.diem_tong === null ? null : Number(row.diem_tong), coEmail: Boolean(tk?.email_phu_huynh) };
    hocSinhTheoCa.set(ca.ca_thi_id, [...(hocSinhTheoCa.get(ca.ca_thi_id) ?? []), item]);
  }
  const cacDotThi: DotThiBypass[] = (dots ?? []).map((dot) => ({
    dotThiId: dot.dot_thi_id, tenDotThi: dot.ten_dot_thi, namHoc: dot.nam_hoc,
    cacCa: (cas ?? []).filter((ca) => ca.dot_thi_id === dot.dot_thi_id).sort((a, b) => a.so_thu_tu_ca - b.so_thu_tu_ca).map((ca) => ({
      caThiId: ca.ca_thi_id, soThuTuCa: ca.so_thu_tu_ca, gioBatDau: ca.gio_bat_dau, gioKetThuc: ca.gio_ket_thuc,
      hocSinh: (hocSinhTheoCa.get(ca.ca_thi_id) ?? []).sort((a, b) => a.maSo.localeCompare(b.maSo, "vi")),
    })),
  })).filter((dot) => dot.cacCa.length > 0);
  let luotDemoHienTai = null;
  if (active?.demo_luot_thi_id) {
    const ketQua = await layTrangThaiLuotDemo({ demoLuotThiId: active.demo_luot_thi_id });
    if (ketQua.success) luotDemoHienTai = ketQua.data;
  }
  return <MoThiNgayClient cacDotThi={cacDotThi} luotDemoHienTai={luotDemoHienTai} />;
}
