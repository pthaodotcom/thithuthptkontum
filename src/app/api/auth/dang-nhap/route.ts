import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dangNhap } from "@/lib/auth/session";

/**
 * POST /api/auth/dang-nhap - FR-M2-02
 * Body: { ma_so: string, mat_khau: string }
 * Logic that nam trong lib/auth/session.ts (dangNhap) de tai su dung duoc
 * trong test/unit ma khong can goi qua HTTP.
 */

const BodySchema = z.object({
  ma_so: z.string().min(4).max(20),
  mat_khau: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Du lieu khong hop le" }, { status: 400 });
  }

  const ketQua = await dangNhap(parsed.data.ma_so, parsed.data.mat_khau);
  if (!ketQua.thanhCong) {
    const laLoiHaTang = ketQua.loi?.startsWith("Khong the ket noi");
    return NextResponse.json({ error: ketQua.loi }, { status: laLoiHaTang ? 503 : 401 });
  }

  return NextResponse.json({ phai_doi_mat_khau: ketQua.phaiDoiMatKhau });
}
