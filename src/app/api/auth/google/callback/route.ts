import { NextRequest, NextResponse } from "next/server";
import { laySessionHienHanh } from "@/lib/auth/session";
import { doiCodeLayToken, luuKetNoiGmail } from "@/lib/email/gmail-oauth";

export async function GET(req: NextRequest) {
  const session = await laySessionHienHanh();
  const url = new URL("/thong-bao-email", req.url);
  if (!session || session.vai_tro !== "Admin") return NextResponse.redirect(new URL("/dang-nhap", req.url));
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("gmail_oauth_state")?.value;
  const code = req.nextUrl.searchParams.get("code");
  if (!state || !expected || state !== expected || !code) {
    url.searchParams.set("gmail", "loi-xac-thuc");
    return NextResponse.redirect(url);
  }
  try {
    await luuKetNoiGmail(await doiCodeLayToken(code));
    url.searchParams.set("gmail", "da-ket-noi");
  } catch {
    url.searchParams.set("gmail", "ket-noi-that-bai");
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete("gmail_oauth_state");
  return response;
}

