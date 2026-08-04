import { SignJWT, jwtVerify } from "jose";

/**
 * Ky/xac minh JWT tuong thich Supabase RLS ("bring your own auth" - xem
 * ke-hoach-trien-khai-webapp.md muc 2). Dung CHUNG SUPABASE_JWT_SECRET voi
 * project Supabase (Project Settings > API > JWT Settings) de auth.jwt() /
 * jwt_claim() trong RLS doc duoc dung claim.
 *
 * Claim chuan bat buoc: `sub` (tai_khoan_id), `role: "authenticated"`.
 * Claim tuy bien: `vai_tro` (Admin | GiaoVien | HocSinh), `session_id` (de
 * doi chieu voi tai_khoan.phien_hien_hanh - enforce 1 phien lam bai duy nhat,
 * FR-M5-01).
 */

export type VaiTro = "Admin" | "GiaoVien" | "HocSinh";

export interface SessionClaims {
  sub: string; // tai_khoan_id
  role: "authenticated";
  vai_tro: VaiTro;
  session_id: string;
  phai_doi_mat_khau: boolean;
}

const THOI_HAN_SESSION = "12h";
const THOI_HAN_REALTIME = "5m";

function laySecretKey(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Thieu SUPABASE_JWT_SECRET - lay tai Supabase Dashboard > Project Settings > API > JWT Settings"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function kySessionJwt(claims: Omit<SessionClaims, "role">): Promise<string> {
  return new SignJWT({ ...claims, role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 30)
    .setExpirationTime(THOI_HAN_SESSION)
    .sign(laySecretKey());
}

export async function kyRealtimeJwt(
  claims: Omit<SessionClaims, "role">
): Promise<string> {
  return new SignJWT({ ...claims, role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 30)
    .setExpirationTime(THOI_HAN_REALTIME)
    .sign(laySecretKey());
}

export async function xacMinhSessionJwt(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, laySecretKey());
    if (!payload.sub || !payload.vai_tro || !payload.session_id || payload.phai_doi_mat_khau === undefined) return null;
    return payload as unknown as SessionClaims;
  } catch {
    // Het han, sai chu ky, hoac token khong hop le
    return null;
  }
}
