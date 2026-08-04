import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoUrlKetNoiGmail } from "@/lib/email/gmail-oauth";

export async function GET() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") return NextResponse.json({ error: "KHONG_CO_QUYEN" }, { status: 403 });
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(taoUrlKetNoiGmail(state));
  response.cookies.set("gmail_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}

