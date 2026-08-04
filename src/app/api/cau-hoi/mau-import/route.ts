import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { laySessionHienHanh } from "@/lib/auth/session";

export async function GET() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const rows = [
    { Phan: "I", MaChuyenDe: "CD1", MaBaiHoc: "B1", MucDo: "Nhận biết", NoiDung: "Nội dung câu hỏi", DapAn1: "A", DapAn2: "B", DapAn3: "C", DapAn4: "D", DapAnDung: "2" },
    { Phan: "II", MaChuyenDe: "CD1", MaBaiHoc: "B2", MucDo: "Thông hiểu", NoiDung: "Nội dung câu hỏi", DapAn1: "Ý a", DapAn2: "Ý b", DapAn3: "Ý c", DapAn4: "Ý d", DapAnDung: "Đ;S;Đ;S" },
    { Phan: "III", MaChuyenDe: "CD2", MaBaiHoc: "B1", MucDo: "Vận dụng", NoiDung: "Nội dung câu hỏi", DapAn1: "", DapAn2: "", DapAn3: "", DapAn4: "", DapAnDung: "-1,2" },
  ];
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [8, 14, 14, 16, 42, 18, 18, 18, 18, 18].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, sheet, "CauHoi");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mau-import-cau-hoi.xlsx"',
    },
  });
}

