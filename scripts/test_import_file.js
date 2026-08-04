const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'CauHoi_40Cau.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log(`Tong so dong doc duoc: ${rows.length}`);

const kyTuPhan3 = /^[0-9,-]{4}$/;

let invalidCount = 0;

rows.forEach((row, index) => {
  const phan = String(row.Phan).trim();
  const dapAnDung = String(row.DapAnDung).trim();
  const lineNo = index + 2;

  if (phan === "III") {
    if (!kyTuPhan3.test(dapAnDung)) {
      console.log(`Loi Dong ${lineNo}: Phần III đáp án "${dapAnDung}" không đúng 4 ký tự 0-9,-`);
      invalidCount++;
    }
  }
});

if (invalidCount === 0) {
  console.log("=== THÀNH CÔNG: Tất cả 40 câu hỏi đều vượt qua kiểm tra định dạng và chuẩn 4 ký tự cho Phần III! ===");
} else {
  console.log(`Có ${invalidCount} câu bị lỗi.`);
}
