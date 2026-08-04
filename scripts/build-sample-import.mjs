import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";
const out = new URL("../test-data/", import.meta.url);
await fs.mkdir(out, { recursive: true });
const wb=Workbook.create(),ws=wb.worksheets.add("CauHoi");
ws.showGridLines=false;
ws.getRange("A1:J4").values=[
 ["Phan","ChuyenDe","BaiHoc","MucDo","NoiDung","DapAn1","DapAn2","DapAn3","DapAn4","DapAnDung"],
 ["I","Hàm số","Đạo hàm","Nhận biết","Cho $f(x)=x^2$. Tính $f'(x)$.","$x$","$2x$","$x^2$","2","2"],
 ["II","Hàm số","Đạo hàm","Thông hiểu","Xét tính đúng sai của các mệnh đề.","Ý a","Ý b","Ý c","Ý d","Đ;S;Đ;S"],
 ["III","Hàm số","Đạo hàm","Vận dụng","Điền bốn ký tự của kết quả.","","","","","-1,2"],
];
ws.getRange("A1:J1").format={fill:"#1D4ED8",font:{bold:true,color:"#FFFFFF"},wrapText:true};
ws.getRange("A2:J4").format={fill:"#FFFFFF",font:{color:"#0F172A"},wrapText:true,borders:{preset:"inside",style:"thin",color:"#E2E8F0"}};
ws.getRange("A1:J4").format.autofitColumns();ws.getRange("A1:J4").format.autofitRows();
ws.getRange("B1:E4").format.columnWidth=22;ws.getRange("F1:J4").format.columnWidth=15;ws.freezePanes.freezeRows(1);
const inspect=await wb.inspect({kind:"table",range:"CauHoi!A1:J4",include:"values",tableMaxRows:5,tableMaxCols:10});
console.log(inspect.ndjson);
const preview=await wb.render({sheetName:"CauHoi",range:"A1:J4",scale:1,format:"png"});
await fs.writeFile(new URL("mau-import-cau-hoi.png",out),new Uint8Array(await preview.arrayBuffer()));
const file=await SpreadsheetFile.exportXlsx(wb);await file.save(new URL("mau-import-cau-hoi.xlsx",out).pathname.slice(1));
