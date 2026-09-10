const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const questions = [];

// Helper to add question
function addQ(phan, maCD, tenCD, maBH, tenBH, mucDo, noiDung, a1, a2, a3, a4, dapAnDung) {
  questions.push({
    Phan: phan,
    MaChuyenDe: maCD,
    ChuyenDe: tenCD,
    MaBaiHoc: maBH,
    BaiHoc: tenBH,
    MucDo: mucDo,
    NoiDung: noiDung,
    DapAn1: a1 || "",
    DapAn2: a2 || "",
    DapAn3: a3 || "",
    DapAn4: a4 || "",
    DapAnDung: String(dapAnDung)
  });
}

// Chuyên đề và bài học chuẩn trong DB
const CD1_TEN = "Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số";
const CD1_B1 = "Tính đơn điệu và cực trị của hàm số";
const CD1_B2 = "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số";
const CD1_B3 = "Đường tiệm cận của đồ thị hàm số";
const CD1_B4 = "Khảo sát sự biến thiên và vẽ đồ thị của hàm số";

const CD2_TEN = "Chương 2: Vectơ và hệ trục tọa độ trong không gian";
const CD2_B1 = "Vectơ và các phép toán vectơ trong không gian";
const CD2_B2 = "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)";

const CD3_TEN = "Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm";
const CD3_B1 = "Khoảng biến thiên và khoảng tứ phân vị";
const CD3_B2 = "Phương sai và độ lệch chuẩn";

const CD4_TEN = "Chương 4: Nguyên hàm và Tích phân";
const CD4_B1 = "Nguyên hàm và các tính chất";
const CD4_B2 = "Tích phân";
const CD4_B3 = "Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)";

// ==========================================
// PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN (24 CÂU)
// ==========================================

addQ("I", "CD1", CD1_TEN, "B1", CD1_B1, "Nhận biết", "Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào dưới đây?", "(-∞; -1) và (1; +∞)", "(-1; 1)", "(0; 2)", "(-∞; 1)", 1);
addQ("I", "CD1", CD1_TEN, "B1", CD1_B1, "Thông hiểu", "Tìm điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 - 1.", "(0; -1)", "(2; 3)", "(1; 1)", "(-1; 3)", 2);
addQ("I", "CD1", CD1_TEN, "B1", CD1_B1, "Vận dụng", "Tìm tất cả các giá trị thực của m để hàm số y = x^3 - 3mx^2 + 3(m^2 - 1)x đạt cực tiểu tại x = 2.", "m = 1", "m = 3", "m = 0", "m = 2", 1);
addQ("I", "CD1", CD1_TEN, "B1", CD1_B1, "Nhận biết", "Cho hàm số y = f(x) có bảng biến thiên. Hàm số đạt cực tiểu tại điểm nào?", "x = 1", "x = -1", "y = 2", "y = 0", 1);

addQ("I", "CD1", CD1_TEN, "B2", CD1_B2, "Nhận biết", "Giá trị lớn nhất của hàm số f(x) = x^4 - 2x^2 + 3 trên đoạn [0; 2] bằng:", "3", "2", "11", "15", 3);
addQ("I", "CD1", CD1_TEN, "B2", CD1_B2, "Thông hiểu", "Giá trị nhỏ nhất của hàm số y = x + 4/x trên khoảng (0; +∞) bằng bao nhiêu?", "4", "2", "5", "0", 1);
addQ("I", "CD1", CD1_TEN, "B2", CD1_B2, "Vận dụng", "Tìm giá trị lớn nhất M của hàm số y = sin(x) + cos(x) trên R.", "M = 1", "M = 2", "M = căn(2)", "M = 0", 3);

addQ("I", "CD1", CD1_TEN, "B3", CD1_B3, "Nhận biết", "Tiệm cận đứng của đồ thị hàm số y = (2x + 1)/(x - 1) là đường thẳng:", "x = 1", "x = 2", "y = 2", "y = 1", 1);
addQ("I", "CD1", CD1_TEN, "B3", CD1_B3, "Thông hiểu", "Tổng số đường tiệm cận đứng và tiệm cận ngang của đồ thị hàm số y = (x - 1)/(x^2 - 1) là:", "1", "2", "3", "0", 1);

addQ("I", "CD1", CD1_TEN, "B4", CD1_B4, "Nhận biết", "Đồ thị hàm số y = (ax + b)/(cx + d) có tâm đối xứng là giao điểm của:", "Hai trục tọa độ", "Hai đường tiệm cận", "Đồ thị với trục hoành", "Đồ thị với trục tung", 2);
addQ("I", "CD1", CD1_TEN, "B4", CD1_B4, "Thông hiểu", "Số giao điểm của đồ thị hàm số y = x^3 - 3x^2 + 2 và đường thẳng y = 2 là:", "1", "2", "3", "0", 3);

addQ("I", "CD2", CD2_TEN, "B1", CD2_B1, "Nhận biết", "Trong không gian, cho hai vectơ u và v không cùng phương. Điều kiện để ba vectơ u, v, w đồng phẳng là:", "Tồn tại duy nhất cặp số (m,n) sao cho w = m.u + n.v", "u.v = 0", "w = u + v", "u + v + w = 0", 1);
addQ("I", "CD2", CD2_TEN, "B1", CD2_B1, "Thông hiểu", "Cho hình hộp ABCD.A'B'C'D'. Vectơ AB + AD + AA' bằng vectơ nào sau đây?", "AC'", "A'C", "BD'", "DB'", 1);

addQ("I", "CD2", CD2_TEN, "B2", CD2_B2, "Nhận biết", "Trong không gian Oxyz, tọa độ của vectơ u = 2i - 3j + k là:", "(2; -3; 1)", "(2; 3; 1)", "(1; -3; 2)", "(-3; 2; 1)", 1);
addQ("I", "CD2", CD2_TEN, "B2", CD2_B2, "Thông hiểu", "Trong không gian Oxyz, cho A(1; 2; -1) và B(3; 0; 3). Tọa độ trung điểm M của đoạn thẳng AB là:", "(2; 1; 1)", "(4; 2; 2)", "(1; -1; 2)", "(2; 2; 1)", 1);
addQ("I", "CD2", CD2_TEN, "B2", CD2_B2, "Vận dụng", "Trong không gian Oxyz, tích vô hướng của u(1; 2; 3) và v(2; -1; 0) bằng:", "0", "4", "2", "-1", 1);

addQ("I", "CD3", CD3_TEN, "B1", CD3_B1, "Nhận biết", "Khoảng biến thiên R của mẫu số liệu ghép nhóm là hiệu số giữa:", "Giá trị lớn nhất và giá trị nhỏ nhất", "Cận trên của nhóm cuối và cận dưới của nhóm đầu", "Tần số lớn nhất và tần số nhỏ nhất", "Tứ phân vị Q3 và Q1", 2);
addQ("I", "CD3", CD3_TEN, "B1", CD3_B1, "Thông hiểu", "Khoảng tứ phân vị IQR được tính theo công thức nào?", "IQR = Q3 - Q1", "IQR = Q3 + Q1", "IQR = Q2 - Q1", "IQR = R / 2", 1);

addQ("I", "CD3", CD3_TEN, "B2", CD3_B2, "Nhận biết", "Phương sai là đại lượng dùng để:", "Đo độ tập trung của mẫu số liệu", "Đo mức độ phân tán của mẫu số liệu quanh số trung bình", "Xác định giá trị xuất hiện nhiều nhất", "Xác định khoảng giữa của dãy số", 2);
addQ("I", "CD3", CD3_TEN, "B2", CD3_B2, "Thông hiểu", "Mối liên hệ giữa độ lệch chuẩn s và phương sai s^2 là:", "s = căn bậc hai của s^2", "s = s^2", "s = 2 * s^2", "s^2 = căn bậc hai của s", 1);

addQ("I", "CD4", CD4_TEN, "B1", CD4_B1, "Nhận biết", "Họ nguyên hàm của hàm số f(x) = 3x^2 + sin(x) là:", "x^3 - cos(x) + C", "x^3 + cos(x) + C", "6x + cos(x) + C", "x^3/3 - cos(x) + C", 1);
addQ("I", "CD4", CD4_TEN, "B1", CD4_B1, "Thông hiểu", "Biết F(x) là một nguyên hàm của f(x) = 1/(2x + 1) và F(0) = 1. Giá trị F(1) bằng:", "ln(3) + 1", "1/2 * ln(3) + 1", "ln(3)", "2.ln(3) + 1", 2);

addQ("I", "CD4", CD4_TEN, "B2", CD4_B2, "Nhận biết", "Tích phân I = integral_0^1 (e^x) dx có giá trị bằng:", "e - 1", "e", "e + 1", "1 - e", 1);
addQ("I", "CD4", CD4_TEN, "B2", CD4_B2, "Thông hiểu", "Cho tích phân integral_1^2 f(x) dx = 3 và integral_1^2 g(x) dx = -2. Tính I = integral_1^2 [2f(x) - g(x)] dx.", "8", "4", "7", "1", 1);

// ==========================================
// PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (8 CÂU)
// ==========================================

addQ("II", "CD1", CD1_TEN, "B1", CD1_B1, "Thông hiểu", 
  "Cho hàm số y = f(x) = x^4 - 4x^2 + 3. Xét tính đúng/sai của các phát biểu sau:",
  "a) Hàm số đã cho là hàm số chẵn.",
  "b) Hàm số có 3 điểm cực trị.",
  "c) Giá trị cực tiểu của hàm số bằng 3.",
  "d) Hàm số đồng biến trên khoảng (-2; 0) và (2; +∞).",
  "Đ;Đ;S;S"
);

addQ("II", "CD1", CD1_TEN, "B3", CD1_B3, "Vận dụng", 
  "Cho hàm số y = (2x - 1)/(x + 1) có đồ thị (C). Xét các mệnh đề sau:",
  "a) Tiệm cận đứng của (C) là đường thẳng x = -1.",
  "b) Tiệm cận ngang của (C) là đường thẳng y = 2.",
  "c) Tâm đối xứng của đồ thị (C) là I(-1; 2).",
  "d) Đường thẳng y = x + 1 cắt đồ thị (C) tại 2 điểm phân biệt.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD2", CD2_TEN, "B2", CD2_B2, "Thông hiểu", 
  "Trong không gian Oxyz, cho tam giác ABC có A(1; 0; 0), B(0; 2; 0), C(0; 0; 3). Các mệnh đề sau đúng hay sai?",
  "a) Tọa độ trọng tâm G của tam giác ABC là (1/3; 2/3; 1).",
  "b) Vectơ AB có tọa độ là (-1; 2; 0).",
  "c) Độ dài cạnh AB bằng 5.",
  "d) Phương trình mặt phẳng (ABC) là x/1 + y/2 + z/3 = 1.",
  "Đ;Đ;S;Đ"
);

addQ("II", "CD3", CD3_TEN, "B2", CD3_B2, "Thông hiểu", 
  "Một mẫu số liệu ghép nhóm có phương sai s^2 = 16 và số trung bình x_bar = 25. Xét các phát biểu sau:",
  "a) Độ lệch chuẩn của mẫu số liệu là s = 4.",
  "b) Nếu mỗi số liệu tăng thêm 5 đơn vị thì phương sai mới bằng 21.",
  "c) Nếu mỗi số liệu nhân thêm 2 thì phương sai mới bằng 64.",
  "d) Độ lệch chuẩn đo mức độ phân tán của số liệu cùng đơn vị với số liệu gốc.",
  "Đ;S;Đ;Đ"
);

addQ("II", "CD4", CD4_TEN, "B1", CD4_B1, "Vận dụng", 
  "Cho hàm số f(x) = 2x + e^x. Xét tính đúng/sai của các mệnh đề sau:",
  "a) Họ nguyên hàm F(x) của f(x) là x^2 + e^x + C.",
  "b) F(0) = 1 khi C = 0.",
  "c) Integral_0^1 f(x) dx = e.",
  "d) Hàm số F(x) đồng biến trên R với mọi C.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD4", CD4_TEN, "B2", CD4_B2, "Vận dụng cao", 
  "Cho tích phân I = integral_0^1 x.e^x dx. Mệnh đề nào đúng/sai?",
  "a) Sử dụng phương pháp tích phân từng phần với u = x, dv = e^x dx.",
  "b) Kết quả v = e^x và du = dx.",
  "c) Giá trị tích phân I = 1.",
  "d) Tích phân I có giá trị lớn hơn 0,5.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD4", CD4_TEN, "B3", CD4_B3, "Thông hiểu", 
  "Cho hình phẳng H giới hạn bởi đường cong y = x^2 và đường thẳng y = 2x. Xét các phát biểu sau:",
  "a) Hoành độ giao điểm của hai đường là x = 0 và x = 2.",
  "b) Diện tích hình phẳng H bằng 4/3.",
  "c) Khi quay H quanh trục Ox thu được khối tròn xoay.",
  "d) Thể tích khối tròn xoay thu được là 64pi/15.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD2", CD2_TEN, "B1", CD2_B1, "Vận dụng", 
  "Trong không gian, cho hai vectơ u và v thỏa mãn |u| = 2, |v| = 3 và góc giữa u, v bằng 60 độ. Mệnh đề nào đúng/sai?",
  "a) Tích vô hướng u.v = 3.",
  "b) Độ dài vectơ u + v bằng căn(19).",
  "c) Vectơ u và v vuông góc với nhau.",
  "d) Bình phương vô hướng u^2 = 4.",
  "Đ;Đ;S;Đ"
);

// ==========================================
// PHẦN III: TRẢ LỜI NGẮN (8 CÂU) - YÊU CẦU ĐÚNG 4 KÝ TỰ (0-9, dấu trừ, dấu phẩy)
// ==========================================

addQ("III", "CD1", CD1_TEN, "B1", CD1_B1, "Vận dụng", 
  "Tìm giá trị cực đại của hàm số y = -x^3 + 3x + 1.",
  "", "", "", "",
  "0003"
);

addQ("III", "CD1", CD1_TEN, "B2", CD1_B2, "Vận dụng cao", 
  "Một tấm tôn hình vuông cạnh 12 cm được cắt 4 góc 4 hình vuông cạnh x cm để gập thành hộp không nắp. Tìm x (cm) để thể tích hộp lớn nhất.",
  "", "", "", "",
  "0002"
);

addQ("III", "CD1", CD1_TEN, "B3", CD1_B3, "Thông hiểu", 
  "Tìm hoành độ giao điểm của đường tiệm cận đứng x = -1,5 với trục hoành.",
  "", "", "", "",
  "-1,5"
);

addQ("III", "CD2", CD2_TEN, "B2", CD2_B2, "Vận dụng", 
  "Trong không gian Oxyz, cho A(2; 4; -1), B(0; 2; 3). Tìm hoành độ trung điểm I của đoạn thẳng AB.",
  "", "", "", "",
  "0001"
);

addQ("III", "CD4", CD4_TEN, "B2", CD4_B2, "Thông hiểu", 
  "Tính giá trị của tích phân I = integral_0^2 (2x + 1) dx.",
  "", "", "", "",
  "0006"
);

addQ("III", "CD4", CD4_TEN, "B3", CD4_B3, "Vận dụng", 
  "Tính diện tích hình phẳng giới hạn bởi y = x^2, y = 0, x = 0, x = 1. Kết quả làm tròn đến 2 chữ số thập phân.",
  "", "", "", "",
  "0,33"
);

addQ("III", "CD3", CD3_TEN, "B1", CD3_B1, "Vận dụng cao", 
  "Khoảng biến thiên của mẫu số liệu {1,2; 2,5; 3,8; 4,7; 0,45} là bao nhiêu? (Làm tròn 2 chữ số thập phân).",
  "", "", "", "",
  "4,25"
);

addQ("III", "CD3", CD3_TEN, "B2", CD3_B2, "Vận dụng", 
  "Tính độ lệch chuẩn s biết phương sai s^2 = 0,64.",
  "", "", "", "",
  "0,80"
);

// Write Excel File
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(questions);

// Column widths for beautiful formatting
ws['!cols'] = [
  { wch: 8 },  // Phan
  { wch: 14 }, // MaChuyenDe
  { wch: 45 }, // ChuyenDe
  { wch: 12 }, // MaBaiHoc
  { wch: 45 }, // BaiHoc
  { wch: 16 }, // MucDo
  { wch: 65 }, // NoiDung
  { wch: 25 }, // DapAn1
  { wch: 25 }, // DapAn2
  { wch: 25 }, // DapAn3
  { wch: 25 }, // DapAn4
  { wch: 18 }  // DapAnDung
];

XLSX.utils.book_append_sheet(wb, ws, "CauHoi_40Cau");

const artifactDir = path.join(__dirname, '..', 'artifacts', 'reference-data');
fs.mkdirSync(artifactDir, { recursive: true });
const outputPath = path.join(artifactDir, 'CauHoi_40Cau.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`Successfully generated updated 40 questions Excel file at:\n- ${outputPath}`);
