import { describe,expect,it } from "vitest";
import { parseDongImport } from "@/lib/rules/import-cau-hoi";
const id1="11111111-1111-4111-8111-111111111111",id2="22222222-2222-4222-8222-222222222222";
const meta={baiHoc:[{id:id1,chuyenDe:"Hàm số",baiHoc:"Đạo hàm"}],mucDo:[{id:id2,ten:"Nhận biết"}]};
describe("parser import câu hỏi",()=>{
 it("đọc dòng Phần I hợp lệ",()=>{const r=parseDongImport({Phan:"I",ChuyenDe:"Hàm số",BaiHoc:"Đạo hàm",MucDo:"Nhận biết",NoiDung:"Câu?",DapAn1:"A",DapAn2:"B",DapAn3:"C",DapAn4:"D",DapAnDung:"2"},meta);expect(r.data?.chiTiet[1]?.laDapAnDung).toBe(true)});
 it("trả mã lỗi ổn định cho dòng sai",()=>{expect(parseDongImport({Phan:"I"},meta).code).toBe("THIEU_COT")});
 it("hỗ trợ file hỗn hợp đúng sai theo từng dòng",()=>{const rows=[{Phan:"III",ChuyenDe:"Hàm số",BaiHoc:"Đạo hàm",MucDo:"Nhận biết",NoiDung:"x?",DapAnDung:"-1,2"},{Phan:"IV",ChuyenDe:"Hàm số",BaiHoc:"Đạo hàm",MucDo:"Nhận biết",NoiDung:"x?"}];expect(rows.map(x=>parseDongImport(x,meta)).filter(x=>x.data)).toHaveLength(1)});
});
