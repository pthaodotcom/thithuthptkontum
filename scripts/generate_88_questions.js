const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const questions = [];

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

const CD1 = "Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số";
const CD2 = "Chương 2: Vectơ và hệ trục tọa độ trong không gian";
const CD3 = "Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm";
const CD4 = "Chương 4: Nguyên hàm và Tích phân";
const CD5 = "Chương 5: Phương pháp tọa độ trong không gian (Hình học Giải tích)";
const CD6 = "Chương 6: Xác suất có điều kiện và các quy tắc tính xác suất";

// ============================================================================
// PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN (48 CÂU - MỖI CHƯƠNG 8 CÂU)
// ============================================================================

// --- CHƯƠNG 1 (8 CÂU PHẦN I) ---
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào dưới đây?", "(-∞; -1) và (1; +∞)", "(-1; 1)", "(0; 2)", "(-∞; 1)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Điểm cực tiểu của đồ thị hàm số y = x^3 - 3x^2 + 4 là:", "(2; 0)", "(0; 4)", "(1; 2)", "(-1; 0)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", "Tìm điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 - 1.", "(0; -1)", "(2; 3)", "(1; 1)", "(-1; 3)", 2);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Van dung", "Tìm tất cả giá trị m để hàm số y = x^3 - 3mx^2 + 3(m^2 - 1)x đạt cực tiểu tại x = 2.", "m = 1", "m = 3", "m = 0", "m = 2", 1);

addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Nhan biet", "Giá trị lớn nhất của hàm số f(x) = x^4 - 2x^2 + 3 trên đoạn [0; 2] bằng:", "3", "2", "11", "15", 3);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Thong hieu", "Giá trị nhỏ nhất của hàm số y = x + 4/x trên khoảng (0; +∞) bằng bao nhiêu?", "4", "2", "5", "0", 1);

addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Nhan biet", "Tiệm cận đứng của đồ thị hàm số y = (2x + 1)/(x - 1) là đường thẳng:", "x = 1", "x = 2", "y = 2", "y = 1", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Tổng số đường tiệm cận đứng và ngang của đồ thị y = (x - 1)/(x^2 - 1) là:", "1", "2", "3", "0", 1);

// --- CHƯƠNG 2 (8 CÂU PHẦN I) ---
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Cho hai vectơ u và v không cùng phương. Điều kiện để u, v, w đồng phẳng là:", "Tồn tại cặp (m,n) sao cho w = m.u + n.v", "u.v = 0", "w = u + v", "u + v + w = 0", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Trong hình hộp ABCD.A'B'C'D', vectơ AB + AD + AA' bằng vectơ nào?", "AC'", "A'C", "BD'", "DB'", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Thong hieu", "Cho tứ diện ABCD. Vectơ AB - AC bằng vectơ nào sau đây?", "CB", "BC", "CA", "BA", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Van dung", "Cho góc giữa hai vectơ u và v là 60 độ, |u|=2, |v|=3. Tích vô hướng u.v bằng:", "3", "6", "3 căn 3", "1", 1);

addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, tọa độ của vectơ u = 2i - 3j + k là:", "(2; -3; 1)", "(2; 3; 1)", "(1; -3; 2)", "(-3; 2; 1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, cho A(1; 2; 3) và B(-1; 0; 1). Tọa độ vectơ AB là:", "(-2; -2; -2)", "(0; 2; 4)", "(2; 2; 2)", "(-1; -2; -1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho A(1; 2; -1) và B(3; 0; 3). Tọa độ trung điểm M của đoạn AB là:", "(2; 1; 1)", "(4; 2; 2)", "(1; -1; 2)", "(2; 2; 1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho u = (1; 2; 3) và v = (2; -1; 0). Tích vô hướng u.v bằng:", "0", "4", "2", "-1", 1);

// --- CHƯƠNG 3 (8 CÂU PHẦN I) ---
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Khoảng biến thiên R của mẫu số liệu ghép nhóm là hiệu số giữa:", "Cận trên nhóm cuối và cận dưới nhóm đầu", "Giá trị lớn nhất và giá trị nhỏ nhất", "Tần số lớn nhất và tần số nhỏ nhất", "Q3 và Q1", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Khoảng tứ phân vị IQR của mẫu số liệu được tính theo công thức:", "IQR = Q3 - Q1", "IQR = Q3 + Q1", "IQR = Q2 - Q1", "IQR = R / 2", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Khoảng biến thiên của mẫu số liệu ghép nhóm càng lớn chứng tỏ:", "Số liệu càng phân tán rộng", "Số liệu càng tập trung", "Số liệu có trung bình lớn", "Số liệu có phương sai bé", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung", "Cho mẫu số liệu có Q1 = 15 và Q3 = 35. Khoảng tứ phân vị IQR là:", "20", "50", "10", "25", 1);

addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Phương sai là đại lượng dùng để đo:", "Mức độ phân tán của mẫu số liệu quanh số trung bình", "Độ tập trung tuyệt đối của số liệu", "Tần số của giá trị trung tâm", "Khoảng giữa của dãy số", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Độ lệch chuẩn s liên hệ với phương sai s^2 theo công thức:", "s = căn bậc hai của s^2", "s = s^2", "s = 2 * s^2", "s^2 = căn(s)", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Nếu tất cả các số liệu trong mẫu tăng lên 3 đơn vị thì phương sai:", "Không thay đổi", "Tăng 3 đơn vị", "Tăng 9 đơn vị", "Giảm 3 đơn vị", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Nếu tất cả các số liệu trong mẫu nhân thêm 2 thì độ lệch chuẩn mới:", "Gấp 2 lần độ lệch chuẩn cũ", "Gấp 4 lần độ lệch chuẩn cũ", "Không đổi", "Bằng một nửa", 1);

// --- CHƯƠNG 4 (8 CÂU PHẦN I) ---
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = 3x^2 + sin(x) là:", "x^3 - cos(x) + C", "x^3 + cos(x) + C", "6x + cos(x) + C", "x^3/3 - cos(x) + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của f(x) = e^x - 2x là:", "e^x - x^2 + C", "e^x - 2 + C", "e^x + x^2 + C", "e^x - 2x^2 + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "F(x) là một nguyên hàm của f(x) = 1/(2x + 1) và F(0) = 1. Giá trị F(1) bằng:", "1/2 * ln(3) + 1", "ln(3) + 1", "ln(3)", "2.ln(3) + 1", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Van dung", "Cho integral f(x) dx = F(x) + C. Nguyên hàm integral f(2x) dx bằng:", "1/2 * F(2x) + C", "F(2x) + C", "2 * F(2x) + C", "F(x/2) + C", 1);

addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tích phân I = integral_0^1 (e^x) dx có giá trị bằng:", "e - 1", "e", "e + 1", "1 - e", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tích phân integral_1^2 2x dx bằng:", "3", "4", "2", "1", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_1^2 f(x)dx = 3 và integral_1^2 g(x)dx = -2. Tính integral_1^2 [2f(x) - g(x)]dx:", "8", "4", "7", "1", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Nếu integral_0^3 f(x)dx = 6 thì integral_0^3 5f(x)dx bằng:", "30", "11", "1", "6/5", 1);

// --- CHƯƠNG 5 (8 CÂU PHẦN I) ---
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Mặt phẳng (P): 2x - 3y + z - 5 = 0 có một vectơ pháp tuyến là:", "n = (2; -3; 1)", "n = (2; 3; 1)", "n = (2; -3; -5)", "n = (-3; 1; -5)", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Phương trình mặt phẳng qua A(1; 0; 0), B(0; 2; 0), C(0; 0; 3) là:", "x/1 + y/2 + z/3 = 1", "x + 2y + 3z = 1", "x/1 + y/2 + z/3 = 0", "x + y + z = 6", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Thong hieu", "Khoảng cách từ gốc tọa độ O đến mặt phẳng (P): 3x + 4z - 10 = 0 bằng:", "2", "10", "5", "10/3", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Van dung", "Phương trình mặt phẳng qua M(1; 2; 3) song song với (P): x - 2y + z + 1 = 0 là:", "x - 2y + z = 0", "x - 2y + z - 2 = 0", "x + 2y + z - 8 = 0", "x - 2y - z + 4 = 0", 1);

addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Phương trình mặt cầu tâm I(1; -2; 3) bán kính R = 4 là:", "(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16", "(x + 1)^2 + (y - 2)^2 + (z + 3)^2 = 16", "(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 4", "(x - 1)^2 + (y - 2)^2 + (z - 3)^2 = 16", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Đường thẳng d: (x-1)/2 = (y+2)/(-1) = z/3 có một vectơ chỉ phương là:", "u = (2; -1; 3)", "u = (1; -2; 0)", "u = (-1; 2; 3)", "u = (2; 1; 3)", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Tâm I và bán kính R của mặt cầu x^2 + y^2 + z^2 - 2x + 4y - 6z - 2 = 0 là:", "I(1; -2; 3), R = 4", "I(-1; 2; -3), R = 4", "I(1; -2; 3), R = 16", "I(2; -4; 6), R = 2", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Giao điểm của đường thẳng d: x = 1+t, y = 2-t, z = 3t với mặt phẳng (Oxy) là:", "(1; 2; 0)", "(0; 3; 0)", "(1; 2; 3)", "(2; 1; 3)", 1);

// --- CHƯƠNG 6 (8 CÂU PHẦN I) ---
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Ký hiệu P(A|B) đại diện cho:", "Xác suất của biến cố A với điều kiện biến cố B đã xảy ra", "Xác suất biến cố B với điều kiện A xảy ra", "Xác suất của biến cố giao A và B", "Xác suất của biến cố hợp A hoặc B", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Công thức tính xác suất có điều kiện P(A|B) khi P(B) > 0 là:", "P(A|B) = P(AB) / P(B)", "P(A|B) = P(AB) / P(A)", "P(A|B) = P(A) . P(B)", "P(A|B) = P(A) + P(B)", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Biết P(B) = 0,4 và P(AB) = 0,16. Giá trị P(A|B) bằng:", "0,4", "0,064", "0,56", "0,24", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Van dung", "Cho hai biến cố độc lập A và B với P(A) = 0,5 và P(B) = 0,6. Giá trị P(A|B) bằng:", "0,5", "0,6", "0,3", "0,1", 1);

addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức nhân xác suất cho hai biến cố bất kỳ A và B là:", "P(AB) = P(B) . P(A|B)", "P(AB) = P(A) + P(B)", "P(AB) = P(A) / P(B)", "P(AB) = P(A) - P(B)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức xác suất toàn phần áp dụng cho hệ biến cố đầy đủ B1, B2 là:", "P(A) = P(B1).P(A|B1) + P(B2).P(A|B2)", "P(A) = P(B1) + P(B2)", "P(A) = P(A|B1) + P(A|B2)", "P(A) = P(B1).P(B2)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho P(A) = 0,3; P(B|A) = 0,8. Giá trị P(AB) bằng:", "0,24", "0,5", "0,38", "1,1", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Công thức Bayes dùng để xác định:", "Xác suất nguyên nhân P(Bk|A) sau khi biết biến cố A đã xảy ra", "Xác suất hợp hai biến cố xung khắc", "Số phần tử không gian mẫu", "Kỳ vọng của biến ngẫu nhiên", 1);


// ============================================================================
// PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (16 CÂU - 4 MÃ ĐỀ x 4 CÂU)
// ============================================================================

addQ("II", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", 
  "Cho hàm số y = f(x) = x^4 - 4x^2 + 3. Xét tính đúng/sai của các phát biểu sau:",
  "a) Hàm số đã cho là hàm số chẵn.",
  "b) Hàm số có 3 điểm cực trị.",
  "c) Giá trị cực tiểu của hàm số bằng 3.",
  "d) Hàm số đồng biến trên khoảng (-2; 0) và (2; +∞).",
  "Đ;Đ;S;S"
);

addQ("II", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Van dung", 
  "Cho hàm số y = (2x - 1)/(x + 1) có đồ thị (C). Xét các mệnh đề sau:",
  "a) Tiệm cận đứng của (C) là đường thẳng x = -1.",
  "b) Tiệm cận ngang của (C) là đường thẳng y = 2.",
  "c) Tâm đối xứng của đồ thị (C) là I(-1; 2).",
  "d) Đường thẳng y = x + 1 cắt đồ thị (C) tại 2 điểm phân biệt.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Van dung cao", 
  "Cho hàm số f(x) = x^3 - 3x + 1 trên đoạn [0; 2]. Xét các phát biểu:",
  "a) Giá trị nhỏ nhất của hàm số trên đoạn [0; 2] bằng -1.",
  "b) Giá trị lớn nhất của hàm số trên đoạn [0; 2] bằng 3.",
  "c) Hàm số đạt cực tiểu tại điểm x = 1.",
  "d) Tổng giá trị lớn nhất và giá trị nhỏ nhất bằng 2.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", 
  "Trong không gian Oxyz, cho tam giác ABC có A(1; 0; 0), B(0; 2; 0), C(0; 0; 3). Các mệnh đề sau đúng hay sai?",
  "a) Tọa độ trọng tâm G của tam giác ABC là (1/3; 2/3; 1).",
  "b) Vectơ AB có tọa độ là (-1; 2; 0).",
  "c) Độ dài cạnh AB bằng 5.",
  "d) Phương trình mặt phẳng (ABC) là x/1 + y/2 + z/3 = 1.",
  "Đ;Đ;S;Đ"
);

addQ("II", "CD2", CD2, "B1", "Vectơ trong không gian", "Van dung", 
  "Trong không gian, cho hai vectơ u và v thỏa mãn |u| = 2, |v| = 3 và góc giữa u, v bằng 60 độ. Mệnh đề nào đúng/sai?",
  "a) Tích vô hướng u.v = 3.",
  "b) Độ dài vectơ u + v bằng căn(19).",
  "c) Vectơ u và v vuông góc với nhau.",
  "d) Bình phương vô hướng u^2 = 4.",
  "Đ;Đ;S;Đ"
);

addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", 
  "Cho hai điểm A(2; 1; -1) và B(0; 3; 1). Xét các phát biểu sau:",
  "a) Trung điểm I của AB có tọa độ (1; 2; 0).",
  "b) Vectơ AB = (-2; 2; 2).",
  "c) Độ dài đoạn AB = 2 căn 3.",
  "d) Mặt phẳng trung trực AB đi qua gốc tọa độ O(0;0;0).",
  "Đ;Đ;Đ;S"
);

addQ("II", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", 
  "Một mẫu số liệu ghép nhóm có phương sai s^2 = 16 và số trung bình x_bar = 25. Xét các phát biểu sau:",
  "a) Độ lệch chuẩn của mẫu số liệu là s = 4.",
  "b) Nếu mỗi số liệu tăng thêm 5 đơn vị thì phương sai mới bằng 21.",
  "c) Nếu mỗi số liệu nhân thêm 2 thì phương sai mới bằng 64.",
  "d) Độ lệch chuẩn đo mức độ phân tán của số liệu cùng đơn vị với số liệu gốc.",
  "Đ;S;Đ;Đ"
);

addQ("II", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", 
  "Cho mẫu số liệu ghép nhóm có Q1 = 12, Q2 = 18, Q3 = 26. Xét tính đúng/sai:",
  "a) Khoảng tứ phân vị IQR = 14.",
  "b) Nửa khoảng tứ phân vị bằng 7.",
  "c) Trung vị của mẫu số liệu là 18.",
  "d) 50% số liệu trung tâm nằm trong khoảng từ 12 đến 26.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Van dung", 
  "Cho hàm số f(x) = 2x + e^x. Xét tính đúng/sai của các mệnh đề sau:",
  "a) Họ nguyên hàm F(x) của f(x) là x^2 + e^x + C.",
  "b) F(0) = 1 khi C = 0.",
  "c) Integral_0^1 f(x) dx = e.",
  "d) Hàm số F(x) đồng biến trên R với mọi C.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD4", CD4, "B2", "Tích phân", "Van dung cao", 
  "Cho tích phân I = integral_0^1 x.e^x dx. Mệnh đề nào đúng/sai?",
  "a) Sử dụng phương pháp tích phân từng phần với u = x, dv = e^x dx.",
  "b) Kết quả v = e^x và du = dx.",
  "c) Giá trị tích phân I = 1.",
  "d) Tích phân I có giá trị lớn hơn 0,5.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Thong hieu", 
  "Cho hình phẳng H giới hạn bởi đường cong y = x^2 và đường thẳng y = 2x. Xét các phát biểu sau:",
  "a) Hoành độ giao điểm của hai đường là x = 0 và x = 2.",
  "b) Diện tích hình phẳng H bằng 4/3.",
  "c) Khi quay H quanh trục Ox thu được khối tròn xoay.",
  "d) Thể tích khối tròn xoay thu được là 64pi/15.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", 
  "Cho hai mặt phẳng (P): x + 2y - z + 1 = 0 và (Q): 2x + 4y - 2z + 5 = 0. Mệnh đề đúng/sai:",
  "a) Vectơ pháp tuyến của (P) là n1 = (1; 2; -1).",
  "b) Hai mặt phẳng (P) và (Q) song song với nhau.",
  "c) Điểm A(0; 0; 1) thuộc mặt phẳng (P).",
  "d) Khoảng cách giữa hai mặt phẳng (P) và (Q) bằng 3/(2 căn 6).",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD5", CD5, "B2", "Đường thẳng và mặt cầu", "Van dung", 
  "Cho mặt cầu (S): (x-1)^2 + (y-2)^2 + (z+1)^2 = 9. Mệnh đề nào đúng/sai?",
  "a) Mặt cầu có tâm I(1; 2; -1).",
  "b) Bán kính mặt cầu R = 3.",
  "c) Gốc tọa độ O(0;0;0) nằm bên trong mặt cầu (S).",
  "d) Mặt phẳng (Oxy) cắt mặt cầu theo một đường tròn bán kính r = 2 căn 2.",
  "Đ;Đ;Đ;Đ"
);

addQ("II", "CD5", CD5, "B2", "Đường thẳng trong Oxyz", "Thong hieu", 
  "Cho đường thẳng d: (x-1)/1 = (y-2)/2 = (z+1)/(-1). Mệnh đề đúng/sai:",
  "a) Điểm M(1; 2; -1) thuộc đường thẳng d.",
  "b) Vectơ chỉ phương u = (1; 2; -1).",
  "c) Đường thẳng d vuông góc với mặt phẳng (P): x + 2y - z + 3 = 0.",
  "d) Đường thẳng d cắt trục Oz.",
  "Đ;Đ;Đ;S"
);

addQ("II", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", 
  "Một hộp có 5 viên bi đỏ và 3 viên bi xanh. Lần lượt lấy ra 2 viên bi không hoàn lại. Xét mệnh đề:",
  "a) Xác suất bi đầu tiên màu đỏ là 5/8.",
  "b) Xác suất bi thứ hai màu xanh biết bi thứ nhất màu đỏ là 3/7.",
  "c) Xác suất cả hai bi đều màu đỏ là 5/14.",
  "d) Hai biến cố lấy bi lần 1 và lần 2 là hai biến cố độc lập.",
  "Đ;Đ;Đ;S"
);

addQ("II", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung", 
  "Có 2 xưởng sản xuất thiết bị. Xưởng I cung cấp 60% sản phẩm (tỷ lệ phế phẩm 2%). Xưởng II cung cấp 40% sản phẩm (tỷ lệ phế phẩm 3%). Chọn ngẫu nhiên 1 sản phẩm:",
  "a) Xác suất chọn sản phẩm của xưởng I là 0,6.",
  "b) Xác suất chọn phải phế phẩm là 0,024.",
  "c) Nếu chọn được phế phẩm, xác suất phế phẩm đó do xưởng I sản xuất là 0,5.",
  "d) Tổng tỷ lệ phế phẩm chung toàn bộ sản phẩm là 2,4%.",
  "Đ;Đ;Đ;Đ"
);


// ============================================================================
// PHẦN III: TRẢ LỜI NGẮN (24 CÂU - 4 MÃ ĐỀ x 6 CÂU)
// ============================================================================

// --- CHƯƠNG 1 (4 CÂU PHẦN III) ---
addQ("III", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Van dung", "Tìm giá trị cực đại của hàm số y = -x^3 + 3x + 1.", "", "", "", "", "0003");
addQ("III", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Van dung cao", "Tấm tôn hình vuông cạnh 12 cm cắt 4 góc 4 hình vuông x cm để gập thành hộp không nắp. Tìm x (cm) để thể tích lớn nhất.", "", "", "", "", "0002");
addQ("III", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Tìm hoành độ giao điểm của đường tiệm cận đứng x = -1,5 của đồ thị hàm số y = (x+1)/(2x+3) với trục hoành.", "", "", "", "", "-1,5");
addQ("III", "CD1", CD1, "B4", "Khảo sát và vẽ đồ thị hàm số", "Van dung", "Số giao điểm của đồ thị hàm số y = x^3 - 3x^2 + 2 với đường thẳng y = -2 là bao nhiêu?", "", "", "", "", "0001");

// --- CHƯƠNG 2 (4 CÂU PHẦN III) ---
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Trong không gian Oxyz, cho A(2; 4; -1), B(0; 2; 3). Tìm hoành độ trung điểm I của đoạn thẳng AB.", "", "", "", "", "0001");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho u = (2; 1; -2). Tính độ dài của vectơ u.", "", "", "", "", "0003");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Cho A(1; 1; 1) và B(3; 3; 3). Tính tung độ của vectơ AB.", "", "", "", "", "0002");
addQ("III", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 2. Tính tích vô hướng AB.AD.", "", "", "", "", "0000");

// --- CHƯƠNG 3 (4 CÂU PHẦN III) ---
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung cao", "Khoảng biến thiên của mẫu số liệu {1,2; 2,5; 3,8; 4,7; 0,45} là bao nhiêu? (Làm tròn 2 chữ số thập phân).", "", "", "", "", "4,25");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Van dung", "Tính độ lệch chuẩn s biết phương sai s^2 = 0,64.", "", "", "", "", "0,80");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Tính khoảng tứ phân vị IQR biết Q1 = 15,5 và Q3 = 28,5.", "", "", "", "", "13,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Tính phương sai s^2 biết độ lệch chuẩn s = 1,5.", "", "", "", "", "2,25");

// --- CHƯƠNG 4 (4 CÂU PHẦN III) ---
addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính giá trị của tích phân I = integral_0^2 (2x + 1) dx.", "", "", "", "", "0006");
addQ("III", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Tính diện tích hình phẳng giới hạn bởi y = x^2, y = 0, x = 0, x = 1. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "0,33");
addQ("III", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "Biết F(x) = x^2 + 3x là một nguyên hàm của f(x). Tính f(1).", "", "", "", "", "0005");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Van dung", "Tính tích phân I = integral_0^1 e^(2x) dx. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "3,19");

// --- CHƯƠNG 5 (4 CÂU PHẦN III) ---
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Tính khoảng cách từ A(1; 2; 3) đến mặt phẳng (Oxy).", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B2", "Mặt cầu trong Oxyz", "Thong hieu", "Tính bán kính R của mặt cầu x^2 + y^2 + z^2 - 4x + 2y - 4 = 0.", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Van dung", "Tìm cao độ giao điểm của mặt phẳng 2x + 3y + z - 6 = 0 với trục Oz.", "", "", "", "", "0006");
addQ("III", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Tính tung độ của giao điểm giữa đường thẳng x = 1+t, y = 2+2t, z = 3t với mặt phẳng (Oxz).", "", "", "", "", "0000");

// --- CHƯƠNG 6 (4 CÂU PHẦN III) ---
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(B) = 0,5 và P(AB) = 0,25. Tính P(A|B). (Điền dạng thập phân).", "", "", "", "", "0,50");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung", "Cho A, B độc lập với P(A) = 0,4; P(B) = 0,5. Tính P(AB).", "", "", "", "", "0,20");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,6 và P(AB) = 0,18. Tính P(B|A).", "", "", "", "", "0,30");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung cao", "Tỷ lệ phế phẩm xưởng 1 là 1%, xưởng 2 là 2%. Hộp chứa 60% hàng xưởng 1, 40% hàng xưởng 2. Lấy 1 sản phẩm, tính xác suất là phế phẩm (%).", "", "", "", "", "1,40");

// Tạo workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(questions);

ws['!cols'] = [
  { wch: 8 },  // Phan
  { wch: 14 }, // MaChuyenDe
  { wch: 45 }, // ChuyenDe
  { wch: 12 }, // MaBaiHoc
  { wch: 45 }, // BaiHoc
  { wch: 16 }, // MucDo
  { wch: 75 }, // NoiDung
  { wch: 30 }, // DapAn1
  { wch: 30 }, // DapAn2
  { wch: 30 }, // DapAn3
  { wch: 30 }, // DapAn4
  { wch: 18 }  // DapAnDung
];

XLSX.utils.book_append_sheet(wb, ws, "CauHoi_88Cau_4MaDe");

const artifactDir = path.join(__dirname, '..', 'artifacts', 'reference-data');
fs.mkdirSync(artifactDir, { recursive: true });
const outputPath = path.join(artifactDir, 'CauHoi_88Cau_4MaDe.xlsx');
const csvTarget = path.join(artifactDir, 'CauHoiToanHoc.csv');

XLSX.writeFile(wb, outputPath);

// Tạo file CSV song song
const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync(csvTarget, csvContent, 'utf-8');

console.log(`Successfully generated 88 questions Excel & CSV files! Total questions: ${questions.length}`);
console.log(`- Excel: ${outputPath}`);
console.log(`- CSV: ${csvTarget}`);
