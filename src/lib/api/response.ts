import { NextResponse } from "next/server";

export function apiThanhCong<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiLoi(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { code, message, ...(details === undefined ? {} : { details }) },
    { status },
  );
}
