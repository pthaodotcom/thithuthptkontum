/**
 * UC-REPORT-03/UC-REPORT-06 buoc 1-2: tuy chon Mon/Lop/Ca thi de chon truoc khi
 * xem bao cao, loc theo dung pham vi quyen (Admin khong gioi han; Giao vien
 * dung to hop Phan cong giang day; To truong moi Lop cho Mon minh phu trach).
 */
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { cache } from "react";

export type MonOption = { mon_id: string; ten_mon: string };
export type LopOption = { lop_id: string; ten_lop: string; khoi: string };
export type CaThiOption = {
  ca_thi_mon_id: string;
  ten_dot_thi: string;
  nam_hoc: string;
  so_thu_tu_ca: number;
  gio_bat_dau: string;
  trang_thai: string;
};

type PhamViBaoCao = {
  monBatBuoc: string | null; // null = khong gioi han (Admin)
  lopDuocXem: Set<string> | null; // null = khong gioi han (Admin hoac To truong)
};

export const layPhamViBaoCao = cache(async function layPhamViBaoCao(): Promise<PhamViBaoCao> {
  const session = await laySessionHienHanh();
  if (!session || !["Admin", "GiaoVien"].includes(session.vai_tro)) throw new Error("KHONG_CO_QUYEN");
  if (session.vai_tro === "Admin") return { monBatBuoc: null, lopDuocXem: null };

  const supabase = taoSupabaseServiceRole();
  const [{ data: gv }, { data: boNhiem }] = await Promise.all([
    supabase.from("tai_khoan").select("mon_id").eq("tai_khoan_id", session.sub).single(),
    supabase.from("mon").select("mon_id").eq("to_truong_tai_khoan_id", session.sub).maybeSingle(),
  ]);
  const monBatBuoc = boNhiem?.mon_id || gv?.mon_id || null;
  let lopDuocXem: Set<string> | null = null;
  if (!boNhiem) {
    const { data: phanCong } = await supabase.from("phan_cong_giang_day").select("lop_id").eq("giao_vien_tai_khoan_id", session.sub);
    lopDuocXem = new Set((phanCong || []).map((x) => x.lop_id));
  }
  return { monBatBuoc, lopDuocXem };
});

export async function layDanhSachMonChoBaoCao(): Promise<MonOption[]> {
  const phamVi = await layPhamViBaoCao();
  const supabase = taoSupabaseServiceRole();
  let query = supabase.from("mon").select("mon_id,ten_mon").order("ten_mon");
  if (phamVi.monBatBuoc) query = query.eq("mon_id", phamVi.monBatBuoc);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function layDanhSachLopChoMon(monId: string): Promise<LopOption[]> {
  const phamVi = await layPhamViBaoCao();
  if (phamVi.monBatBuoc && phamVi.monBatBuoc !== monId) return [];
  if (phamVi.lopDuocXem && phamVi.lopDuocXem.size === 0) return [];

  const supabase = taoSupabaseServiceRole();
  let query = supabase.from("lop").select("lop_id,ten_lop,khoi").order("khoi").order("ten_lop");
  if (phamVi.lopDuocXem) query = query.in("lop_id", Array.from(phamVi.lopDuocXem));
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function layDanhSachCaThiChoLopMon(monId: string, lopId: string): Promise<CaThiOption[]> {
  const phamVi = await layPhamViBaoCao();
  if (phamVi.monBatBuoc && phamVi.monBatBuoc !== monId) return [];
  if (phamVi.lopDuocXem && !phamVi.lopDuocXem.has(lopId)) return [];

  const supabase = taoSupabaseServiceRole();
  const { data: dotThiLop, error: errDot } = await supabase.from("dot_thi_lop").select("dot_thi_id").eq("lop_id", lopId);
  if (errDot) throw new Error(errDot.message);
  const dotThiIds = [...new Set((dotThiLop || []).map((x) => x.dot_thi_id))];
  if (dotThiIds.length === 0) return [];

  const { data: caThiList, error: errCaThi } = await supabase
    .from("ca_thi")
    .select("ca_thi_id,so_thu_tu_ca,gio_bat_dau,trang_thai,dot_thi_id,dot_thi(ten_dot_thi,nam_hoc),ca_thi_mon!inner(id,mon_id)")
    .in("dot_thi_id", dotThiIds)
    .eq("ca_thi_mon.mon_id", monId);
  if (errCaThi) throw new Error(errCaThi.message);
  const out: CaThiOption[] = [];
  for (const ca of caThiList || []) {
    const dot = Array.isArray(ca.dot_thi) ? ca.dot_thi[0] : ca.dot_thi;
    for (const ctm of ca.ca_thi_mon || []) {
      out.push({
        ca_thi_mon_id: ctm.id,
        ten_dot_thi: dot?.ten_dot_thi ?? "",
        nam_hoc: dot?.nam_hoc ?? "",
        so_thu_tu_ca: ca.so_thu_tu_ca,
        gio_bat_dau: ca.gio_bat_dau,
        trang_thai: ca.trang_thai,
      });
    }
  }
  return out.sort((a, b) => a.gio_bat_dau.localeCompare(b.gio_bat_dau));
}
