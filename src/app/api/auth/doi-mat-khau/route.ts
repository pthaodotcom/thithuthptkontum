import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { laySessionHienHanh } from "@/lib/auth/session";
import { xacMinhMatKhau, bamMatKhau, validateMatKhauMoi } from "@/lib/auth/password";
import { kySessionJwt, type VaiTro } from "@/lib/auth/jwt";

const BodySchema = z.object({
  mat_khau_cu: z.string().min(1),
  mat_khau_moi: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { mat_khau_cu, mat_khau_moi } = parsed.data;

  const valid = validateMatKhauMoi(mat_khau_moi);
  if (!valid.hopLe) {
    return NextResponse.json({ error: valid.loi }, { status: 400 });
  }

  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan, error } = await supabase
    .from("tai_khoan")
    .select("mat_khau_hash")
    .eq("tai_khoan_id", session.sub)
    .single();

  if (error || !taiKhoan) {
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }

  const dungMatKhauCu = await xacMinhMatKhau(mat_khau_cu, taiKhoan.mat_khau_hash);
  if (!dungMatKhauCu) {
    return NextResponse.json({ error: "Mật khẩu cũ không đúng" }, { status: 400 });
  }

  const matKhauHashMoi = await bamMatKhau(mat_khau_moi);

  const { error: updateError } = await supabase
    .from("tai_khoan")
    .update({
      mat_khau_hash: matKhauHashMoi,
      phai_doi_mat_khau: false,
      mat_khau_mac_dinh_het_han_luc: null,
    })
    .eq("tai_khoan_id", session.sub);

  if (updateError) {
    return NextResponse.json({ error: "Lỗi khi cập nhật mật khẩu" }, { status: 500 });
  }

  // Cap nhat lai JWT cookie voi phai_doi_mat_khau = false de khong bi redirect nua
  const newJwt = await kySessionJwt({
    sub: session.sub,
    vai_tro: session.vai_tro as VaiTro,
    session_id: session.session_id,
    phai_doi_mat_khau: false,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", newJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // localhost không hỗ trợ Secure cookie
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ success: true });
}
