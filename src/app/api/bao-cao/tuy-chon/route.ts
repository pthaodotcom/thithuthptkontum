import { NextResponse } from "next/server";
import { layDanhSachCaThiChoLopMon, layDanhSachLopChoMon } from "@/lib/reports/tuy-chon";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const monId = url.searchParams.get("monId");
  const lopId = url.searchParams.get("lopId");
  if (!monId) return NextResponse.json({ error: "THIEU_MON" }, { status: 400 });
  try {
    if (!lopId) return NextResponse.json({ lopOptions: await layDanhSachLopChoMon(monId) });
    return NextResponse.json({ caThiOptions: await layDanhSachCaThiChoLopMon(monId, lopId) });
  } catch { return NextResponse.json({ error: "KHONG_TAI_DUOC_TUY_CHON" }, { status: 403 }); }
}
