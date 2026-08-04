import { NextRequest, NextResponse } from "next/server";
import { xacMinhSessionJwt } from "@/lib/auth/jwt";

/**
 * Middleware guard: xac minh JWT session, chan route theo vai_tro, va bat buoc
 * redirect sang /doi-mat-khau neu phai_doi_mat_khau=true (FR-M2-02).
 *
 * Luu y quan trong: "To truong bo mon" KHONG PHAI mot vai_tro trong bang
 * tai_khoan (chi co Admin/GiaoVien/HocSinh - FR-M2-01) - no la mot su BO NHIEM
 * theo Mon (FR-M2-03, xem mon.to_truong_tai_khoan_id). Vi vay middleware chi
 * loc duoc toi muc "vai_tro = GiaoVien" cho cac route danh cho To truong; con
 * viec "GV nay co dung la To truong cua dung Mon dang thao tac khong" LA MOT
 * QUYET DINH THEO DU LIEU, phai kiem tra lai o server (API route / Server
 * Component) bang la_to_truong_cua_mon() (xem 0002_rls_policies.sql) - RLS se
 * tu chan neu sai, day chi la loc UX o middleware, KHONG phai lop bao mat.
 *
 * Day la lop phong thu THU HAI. Lop chinh la RLS o Postgres (xem
 * supabase/migrations/0002_rls_policies.sql) - khong bao gio chi dua vao
 * middleware de "an" du lieu nhay cam, vi request goi thang Supabase tu client
 * van phai bi RLS chan.
 *
 * TODO: implement xac minh JWT that (lib/auth/jwt.ts: xacMinhSessionJwt), doc
 * claim vai_tro tu cookie session, ap dung bang route-prefix -> vai_tro duoi day.
 */

const ROUTE_PREFIX_VAI_TRO: Record<string, string[]> = {
  "/mon-hoc": ["Admin"],
  "/khung-gio-ca-thi": ["Admin"],
  "/lop-hoc": ["Admin"],
  "/tai-khoan": ["Admin"],
  "/to-truong-bo-mon": ["Admin"],
  "/phan-cong-giang-day": ["Admin"],
  "/dot-thi": ["Admin"],
  "/giam-sat-ca-thi": ["Admin"],
  "/bao-cao": ["Admin"],
  "/bao-cao-hoc-sinh": ["Admin"],
  "/bao-cao-ca-nhan": ["Admin"],
  "/thong-bao-zns": ["Admin"],
  // Cac route duoi day danh cho To truong - loc o middleware theo vai_tro
  // GiaoVien, con "co dung la To truong cua Mon nay khong" kiem tra o server/RLS.
  "/khung-chuyen-de": ["GiaoVien"],
  "/duyet-cau-hoi": ["GiaoVien"],
  "/ngan-hang-cau-hoi": ["GiaoVien"],
  "/de-thi": ["GiaoVien"],
  "/bao-cao-mon": ["GiaoVien"],
  "/soan-cau-hoi": ["GiaoVien"],
  "/yeu-cau-chinh-sua": ["GiaoVien"],
  "/bao-cao-lop": ["GiaoVien"],
  "/ho-so": ["HocSinh"],
  "/lam-bai": ["HocSinh"],
  "/ket-qua": ["HocSinh"],
  "/tra-cuu": ["HocSinh"],
};

export async function middleware(_req: NextRequest) {
  const token = _req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/dang-nhap", _req.url));
  }

  const claims = await xacMinhSessionJwt(token);
  if (!claims) {
    return NextResponse.redirect(new URL("/dang-nhap", _req.url));
  }

  const { vai_tro, phai_doi_mat_khau } = claims;
  const pathname = _req.nextUrl.pathname;

  if (phai_doi_mat_khau && pathname !== "/doi-mat-khau" && !pathname.startsWith("/api/auth/doi-mat-khau")) {
    return NextResponse.redirect(new URL("/doi-mat-khau", _req.url));
  }

  let allowed = true;
  for (const [prefix, allowedRoles] of Object.entries(ROUTE_PREFIX_VAI_TRO)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(vai_tro)) {
        allowed = false;
      }
      break;
    }
  }

  if (!allowed) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|dang-nhap).*)"],
};
