import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { kyRealtimeJwt } from "@/lib/auth/jwt";
import { laySessionHienHanh } from "@/lib/auth/session";

export async function GET() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    return apiLoi("KHONG_CO_QUYEN", "Không có quyền", 403);
  }

  const token = await kyRealtimeJwt({
    sub: session.sub,
    vai_tro: session.vai_tro,
    session_id: session.session_id,
    phai_doi_mat_khau: session.phai_doi_mat_khau,
  });

  return apiThanhCong({ token, expiresInSeconds: 300 });
}
