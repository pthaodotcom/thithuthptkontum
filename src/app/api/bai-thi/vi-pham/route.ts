import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { coTuDongThuBai, hopLeViPham } from "@/lib/rules/ky-thi";

/**
 * POST /api/bai-thi/vi-pham - FR-M5-01
 * Ghi nhan 1 su kien vi pham: copy noi dung man hinh thi, chuyen tab/ung dung khac
 * > 10 giay lien tuc, hoac mat ket noi/thoat giao dien > 30 giay lien tuc. Tai lai
 * trang hoac mat mang < 30 giay KHONG tinh la vi pham (xu ly o client truoc khi goi).
 * Du 3 lan vi pham (dem trong bang `vi_pham` theo bai_lam_id) -> trigger tu dong thu bai.
 * TODO: implement day du, hien la stub tra ve 501.
 */
const schema = z.object({
  baiLamId: z.string().uuid(),
  loai: z.enum(["Copy", "ChuyenTab", "MatKetNoi"]),
  thoiLuongGiay: z.number().nonnegative().max(86400).optional(),
  eventId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") return apiLoi("KHONG_CO_QUYEN", "Không có quyền ghi nhận sự kiện", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiLoi("DU_LIEU_KHONG_HOP_LE", "Sự kiện không hợp lệ", 422, parsed.error.flatten());
  if (!hopLeViPham(parsed.data.loai, parsed.data.thoiLuongGiay)) return apiThanhCong({ daGhiNhan: false, soViPham: 0, tuDongThuBai: false });
  const supabase = taoSupabaseServiceRole();
  const { data: baiLam } = await supabase.from("bai_lam_thi").select("trang_thai").eq("bai_lam_id", parsed.data.baiLamId).eq("hoc_sinh_tai_khoan_id", session.sub).maybeSingle();
  if (!baiLam || baiLam.trang_thai !== "DangThi") return apiLoi("BAI_KHONG_HOAT_DONG", "Bài thi không còn hoạt động", 409);
  const { error } = await supabase.from("vi_pham").insert({
    id: parsed.data.eventId,
    bai_lam_id: parsed.data.baiLamId,
    loai_vi_pham: parsed.data.loai,
  });
  if (error && error.code !== "23505") return apiLoi("GHI_NHAN_THAT_BAI", "Chưa ghi nhận được sự kiện. Bài làm của bạn vẫn được giữ lại.", 500);
  const { count } = await supabase.from("vi_pham").select("id", { count: "exact", head: true }).eq("bai_lam_id", parsed.data.baiLamId);
  const soViPham = count ?? 0;
  return apiThanhCong({ daGhiNhan: !error, soViPham, tuDongThuBai: coTuDongThuBai(soViPham) });
}
