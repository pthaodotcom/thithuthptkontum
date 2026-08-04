import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi } from "@/lib/api/response";
import { payloadHash } from "@/lib/api/idempotency";

/**
 * POST /api/bai-thi/autosave - FR-M5-01
 * Goi tu client moi 30 giay. Ghi vao bang `tra_loi` (upsert theo bai_lam_id +
 * cau_hoi_snapshot_id + chi_tiet_thu_tu). Phai la thao tac nhanh, khong block UI.
 * TODO: implement day du, hien la stub tra ve 501.
 */
const traLoiSchema = z.object({
  cauHoiSnapshotId: z.string().uuid(),
  chiTietThuTu: z.number().int().min(0).max(4).default(0),
  dapAnLuaChonId: z.string().uuid().nullable().optional(),
  dapAnDungSai: z.boolean().nullable().optional(),
  // Autosave receives every intermediate keystroke. Accept a partially typed
  // short answer; the submission/grading flow remains responsible for deciding
  // whether the final answer is complete and correct.
  dapAnChuoi: z.string().regex(/^[0-9,.-]{0,4}$/).nullable().optional(),
});
const schema = z.object({ baiLamId: z.string().uuid(), traLoi: z.array(traLoiSchema).max(500) });

export async function POST(req: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") return apiLoi("KHONG_CO_QUYEN", "Không có quyền lưu bài", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiLoi("DU_LIEU_KHONG_HOP_LE", "Câu trả lời không hợp lệ", 422, parsed.error.flatten());
  const key = req.headers.get("idempotency-key");
  if (!key || !z.string().uuid().safeParse(key).success)
    return apiLoi("THIEU_IDEMPOTENCY_KEY", "Idempotency-Key phai la UUID", 400);
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase.rpc("luu_bai_idempotent", {
    p_bai_lam_id: parsed.data.baiLamId,
    p_hoc_sinh_id: session.sub,
    p_idempotency_key: key,
    p_payload_hash: payloadHash(parsed.data),
    p_tra_loi: parsed.data.traLoi,
  });
  if (error) {
    if (error.message.includes("IDEMPOTENCY_CONFLICT"))
      return apiLoi("IDEMPOTENCY_CONFLICT", "Khoa da duoc dung voi payload khac", 409);
    if (error.message.includes("KHONG_TIM_THAY_BAI"))
      return apiLoi("KHONG_TIM_THAY_BAI", "Không tìm thấy bài làm", 404);
    if (error.message.includes("BAI_DA_KHOA"))
      return apiLoi("BAI_DA_KHOA", "Bài làm không còn nhận câu trả lời", 409);
    return apiLoi("LUU_THAT_BAI", "Không thể lưu bài", 500);
  }
  const result = Array.isArray(data) ? data[0] : data;
  const body = result?.response_body ?? { data: { daLuu: 0 } };
  return NextResponse.json(result?.idempotency_replay
    ? { ...body, idempotencyReplay: true }
    : body);
}
