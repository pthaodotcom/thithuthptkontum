import { NextRequest, NextResponse } from "next/server";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi, apiThanhCong } from "@/lib/api/response";

/**
 * GET /api/cron/kiem-tra-san-sang - UC-BATCH-05 / FR-M4-03
 * Vercel Cron goi moi 1 phut (xem vercel.json). Xac thuc bang header
 * `Authorization: Bearer ${CRON_SECRET}` truoc khi chay.
 * Logic: quet ca_thi co gio_bat_dau - now() ~ 30 phut va chua kiem tra; doi chieu
 * ca_thi_mon nao chua co de_thi -> canh bao Admin + To truong cua Mon do; danh dau
 * hoc sinh cua Mon thieu de la "Khong the du thi - loi to chuc" (KHONG phai Vang mat,
 * chi chan o muc Mon trong Ca, khong chan ca Ca).
 * TODO: implement day du, hien la stub tra ve 501.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiLoi("KHONG_CO_QUYEN", "Cron secret không hợp lệ", 401);
  }
  const supabase = taoSupabaseServiceRole();
  const {data:chuyenTrangThai,error:loiTrangThai}=await supabase.rpc("chuyen_trang_thai_ca_tu_dong");
  if(loiTrangThai)return apiLoi("CHUYEN_TRANG_THAI_THAT_BAI",loiTrangThai.message,500);
  const hienTai = Date.now();
  const tu = new Date(hienTai + 29 * 60_000).toISOString();
  const den = new Date(hienTai + 31 * 60_000).toISOString();
  const { data: cacCa, error } = await supabase
    .from("ca_thi")
    .select("ca_thi_id,dot_thi_id,ca_thi_mon(id,mon_id,de_thi(de_thi_id,trang_thai))")
    .eq("trang_thai", "SapDienRa")
    .gte("gio_bat_dau", tu)
    .lte("gio_bat_dau", den);
  if (error) return apiLoi("KIEM_TRA_THAT_BAI", error.message, 500);
  const thieu: Array<{ caThiId: string; caThiMonId: string; monId: string }> = [];
  for (const ca of cacCa ?? []) {
    for (const ctm of ca.ca_thi_mon ?? []) {
      let coDe = ctm.de_thi?.some((de: { trang_thai: string }) => de.trang_thai !== "DangSoan");
      if (!coDe) {
        const { count } = await supabase
          .from("de_thi")
          .select("de_thi_id,ca_thi_mon!inner(mon_id,ca_thi!inner(dot_thi_id))", { count: "exact", head: true })
          .eq("ca_thi_mon.mon_id", ctm.mon_id)
          .eq("ca_thi_mon.ca_thi.dot_thi_id", ca.dot_thi_id)
          .neq("trang_thai", "DangSoan");
        coDe = Boolean(count);
      }
      if (!coDe) {
        thieu.push({ caThiId: ca.ca_thi_id, caThiMonId: ctm.id, monId: ctm.mon_id });
        await supabase.from("bai_lam_thi").update({ trang_thai: "KhongTheDuThi_LoiToChuc" }).eq("ca_thi_mon_id", ctm.id).eq("trang_thai", "ChuaDangNhap");
      }
    }
  }
  return apiThanhCong({ chuyenTrangThai,soCaDaKiemTra: cacCa?.length ?? 0, monThieuDe: thieu });
}
