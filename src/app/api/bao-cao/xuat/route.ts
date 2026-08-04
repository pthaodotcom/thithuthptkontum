import React from "react";
import path from "node:path";
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { layBaoCao } from "@/lib/reports/data";

Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-400-normal.woff"), fontWeight: 400 },
    { src: path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-700-normal.woff"), fontWeight: 700 },
  ],
});
const labels: Record<string, string> = {
  CanOnTapGap: "Cần ôn tập gấp", TrungBinh: "Trung bình", Kha: "Khá", DaNamVung: "Đã nắm vững",
};
const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "NotoSans", color: "#172033" },
  title: { fontSize: 18, marginBottom: 6, color: "#0f766e" },
  muted: { color: "#64748b", marginBottom: 12 },
  kpis: { flexDirection: "row", gap: 8, marginBottom: 14 },
  card: { border: "1 solid #cbd5e1", padding: 8, flexGrow: 1 },
  row: { flexDirection: "row", borderBottom: "1 solid #e2e8f0", paddingVertical: 5 },
  h: { fontWeight: 700, backgroundColor: "#f1f5f9" },
  c1: { width: "28%" }, c2: { width: "15%" }, c3: { width: "27%" }, c4: { width: "12%", textAlign: "right" }, c5: { width: "18%" },
});

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format") || "xlsx";
    const report = await layBaoCao({
      lopId: request.nextUrl.searchParams.get("lopId") || undefined,
      monId: request.nextUrl.searchParams.get("monId") || undefined,
      caThiMonId: request.nextUrl.searchParams.get("caThiMonId") || undefined,
    });
    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const overview = XLSX.utils.aoa_to_sheet([
        ["BÁO CÁO KẾT QUẢ THI THỬ"],
        ["Số bài hợp lệ", report.rows.length],
        ["Điểm trung bình", report.diemTrungBinh],
        [],
        ["Nhóm năng lực", "Số lượng"],
        ...report.nhomNangLuc.map((x) => [labels[x.nhom], x.soLuong]),
      ]);
      const detail = XLSX.utils.json_to_sheet(report.rows.map((row) => ({
        "Mã số": row.maSo, "Họ tên": row.hoTen, "Lớp": row.lop, "Môn": row.mon,
        "Đợt thi": row.dotThi, "Điểm": row.diem, "Số câu đúng": row.soCauDung,
        "Số câu sai": row.soCauSai, "Nhóm năng lực": labels[row.nhom],
      })));
      overview["!cols"] = [{ wch: 24 }, { wch: 18 }];
      detail["!cols"] = [12, 24, 12, 18, 22, 10, 14, 14, 22].map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(wb, overview, "Tong quan");
      XLSX.utils.book_append_sheet(wb, detail, "Chi tiet");
      const body = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new Response(body, { headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": 'attachment; filename="bao-cao-thi-thu.xlsx"',
      } });
    }
    const doc = React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(Text, { style: styles.title }, "BÁO CÁO KẾT QUẢ THI THỬ"),
        React.createElement(Text, { style: styles.muted }, `Xuất lúc ${new Date().toLocaleString("vi-VN")} - dữ liệu đúng phạm vi phân quyền`),
        React.createElement(View, { style: styles.kpis },
          React.createElement(View, { style: styles.card }, React.createElement(Text, null, `Số bài: ${report.rows.length}`)),
          React.createElement(View, { style: styles.card }, React.createElement(Text, null, `Điểm trung bình: ${report.diemTrungBinh.toFixed(2)}`)),
        ),
        React.createElement(View, { style: [styles.row, styles.h] },
          React.createElement(Text, { style: styles.c1 }, "Học sinh"), React.createElement(Text, { style: styles.c2 }, "Lớp"),
          React.createElement(Text, { style: styles.c3 }, "Môn / Đợt thi"), React.createElement(Text, { style: styles.c4 }, "Điểm"),
          React.createElement(Text, { style: styles.c5 }, "Nhóm"),
        ),
        ...report.rows.map((row) => React.createElement(View, { key: row.baiLamId, style: styles.row },
          React.createElement(Text, { style: styles.c1 }, `${row.hoTen} (${row.maSo})`),
          React.createElement(Text, { style: styles.c2 }, row.lop),
          React.createElement(Text, { style: styles.c3 }, `${row.mon} / ${row.dotThi}`),
          React.createElement(Text, { style: styles.c4 }, row.diem.toFixed(2)),
          React.createElement(Text, { style: styles.c5 }, labels[row.nhom]),
        )),
        React.createElement(Text, { fixed: true, render: ({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`, style: { position: "absolute", bottom: 15, right: 32, color: "#64748b" } }),
      ),
    );
    const body = await renderToBuffer(doc);
    return new Response(new Uint8Array(body), { headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="bao-cao-thi-thu.pdf"',
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the xuat bao cao";
    return Response.json({ success: false, error: message }, { status: message.startsWith("KHONG_CO_QUYEN") ? 403 : 500 });
  }
}
