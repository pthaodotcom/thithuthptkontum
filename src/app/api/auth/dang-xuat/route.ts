import { NextRequest, NextResponse } from "next/server";
import { dangXuat } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  await dangXuat();
  return NextResponse.json({ success: true });
}
