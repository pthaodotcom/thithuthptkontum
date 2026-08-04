import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi } from "@/lib/api/response";
import { payloadHash } from "@/lib/api/idempotency";

/**
 * POST /api/bai-thi/nop-bai - FR-M5-01 + FR-M5-04.
 *
 * RPC `nop_va_cham_bai` locks the attempt, reads the immutable answer/scoring
 * snapshots, grades, updates the attempt and writes its audit entry in one
 * database transaction. Repeated/concurrent submissions are idempotent.
 */
const schema = z.object({
  baiLamId: z.string().uuid(),
  lyDo: z.enum(["TuNop", "HetGio", "ViPham"]),
  canhBaoLuuCuoi: z.boolean().default(false),
});

const loiNghiepVu: Record<string, { code: string; message: string; status: number }> = {
  KHONG_TIM_THAY_BAI: {
    code: "KHONG_TIM_THAY_BAI",
    message: "Không tìm thấy bài làm",
    status: 404,
  },
  BAI_KHONG_HOAT_DONG: {
    code: "BAI_KHONG_HOAT_DONG",
    message: "Bài thi không thể nộp ở trạng thái hiện tại",
    status: 409,
  },
  CHUA_DU_VI_PHAM: {
    code: "CHUA_DU_VI_PHAM",
    message: "Chưa đủ ba lần vi phạm để tự động thu bài",
    status: 409,
  },
  LY_DO_NOP_KHONG_HOP_LE: {
    code: "DU_LIEU_KHONG_HOP_LE",
    message: "Lý do nộp bài không hợp lệ",
    status: 422,
  },
};

export async function POST(req: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") {
    return apiLoi("KHONG_CO_QUYEN", "Không có quyền nộp bài", 403);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiLoi(
      "DU_LIEU_KHONG_HOP_LE",
      "Yêu cầu nộp bài không hợp lệ",
      422,
      parsed.error.flatten(),
    );
  }

  const key = req.headers.get("idempotency-key");
  if (!key || !z.string().uuid().safeParse(key).success)
    return apiLoi("THIEU_IDEMPOTENCY_KEY", "Idempotency-Key phai la UUID", 400);
  const supabase = taoSupabaseServiceRole();
  const { data, error } = await supabase.rpc("nop_bai_idempotent", {
    p_bai_lam_id: parsed.data.baiLamId,
    p_hoc_sinh_id: session.sub,
    p_idempotency_key: key,
    p_payload_hash: payloadHash(parsed.data),
    p_ly_do: parsed.data.lyDo,
    p_canh_bao_luu_cuoi: parsed.data.canhBaoLuuCuoi,
  });

  if (error) {
    if (error.message.includes("IDEMPOTENCY_CONFLICT"))
      return apiLoi("IDEMPOTENCY_CONFLICT", "Khoa da duoc dung voi payload khac", 409);
    const mapped = loiNghiepVu[error.message];
    if (mapped) return apiLoi(mapped.code, mapped.message, mapped.status);
    console.error("nop_va_cham_bai failed", {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return apiLoi("NOP_BAI_THAT_BAI", "Không thể nộp bài", 500);
  }

  const ketQua = Array.isArray(data) ? data[0] : data;
  if (!ketQua?.response_body) {
    return apiLoi("NOP_BAI_THAT_BAI", "Không nhận được kết quả chấm bài", 500);
  }
  return NextResponse.json(ketQua.idempotency_replay
    ? { ...ketQua.response_body, idempotencyReplay: true }
    : ketQua.response_body);
}
