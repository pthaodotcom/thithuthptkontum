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
// BỘ 176 CÂU BAN ĐẦU (1 -> 176)
// ============================================================================

// --- CHƯƠNG 1 ---
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào dưới đây?", "(-∞; -1) và (1; +∞)", "(-1; 1)", "(0; 2)", "(-∞; 1)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Điểm cực tiểu của đồ thị hàm số y = x^3 - 3x^2 + 4 là:", "(2; 0)", "(0; 4)", "(1; 2)", "(-1; 0)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", "Tìm điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 - 1.", "(0; -1)", "(2; 3)", "(1; 1)", "(-1; 3)", 2);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Van dung", "Tìm tất cả giá trị m để hàm số y = x^3 - 3mx^2 + 3(m^2 - 1)x đạt cực tiểu tại x = 2.", "m = 1", "m = 3", "m = 0", "m = 2", 1);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Nhan biet", "Giá trị lớn nhất của hàm số f(x) = x^4 - 2x^2 + 3 trên đoạn [0; 2] bằng:", "3", "2", "11", "15", 3);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Thong hieu", "Giá trị nhỏ nhất của hàm số y = x + 4/x trên khoảng (0; +∞) bằng bao nhiêu?", "4", "2", "5", "0", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Nhan biet", "Tiệm cận đứng của đồ thị hàm số y = (2x + 1)/(x - 1) là đường thẳng:", "x = 1", "x = 2", "y = 2", "y = 1", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Tổng số đường tiệm cận đứng và ngang của đồ thị y = (x - 1)/(x^2 - 1) là:", "1", "2", "3", "0", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Hàm số y = -x^4 + 2x^2 + 1 nghịch biến trên khoảng nào dưới đây?", "(1; +∞)", "(-∞; -1)", "(0; 1)", "(-1; 0)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Số điểm cực trị của hàm số y = x^4 - 4x^2 + 5 là:", "3", "1", "2", "0", 1);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Nhan biet", "Giá trị lớn nhất của hàm số y = (x - 1)/(x + 1) trên đoạn [0; 2] là:", "1/3", "-1", "0", "3", 1);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Thong hieu", "Cho hàm số f(x) = x^3 - 3x + 2. Giá trị nhỏ nhất của f(x) trên đoạn [0; 2] bằng:", "0", "2", "4", "1", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Nhan biet", "Tiệm cận ngang của đồ thị hàm số y = (3x - 2)/(x + 1) là đường thẳng:", "y = 3", "x = -1", "y = -2", "x = 3", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Đồ thị hàm số y = (x + 2)/(x^2 - 4) có bao nhiêu đường tiệm cận?", "2", "3", "1", "0", 1);
addQ("I", "CD1", CD1, "B4", "Khảo sát sự biến thiên và vẽ đồ thị của hàm số", "Nhan biet", "Đồ thị hàm số y = x^3 - 3x^2 có dạng hình chữ N có bao nhiêu điểm cực trị?", "2", "1", "3", "0", 1);
addQ("I", "CD1", CD1, "B4", "Khảo sát sự biến thiên và vẽ đồ thị của hàm số", "Thong hieu", "Tìm m để đồ thị hàm số y = x^3 - 3x + m cắt trục hoành tại 3 điểm phân biệt.", "-2 < m < 2", "m > 2", "m < -2", "m = 0", 1);

// --- CHƯƠNG 2 ---
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Cho hai vectơ u và v không cùng phương. Điều kiện để u, v, w đồng phẳng là:", "Tồn tại cặp (m,n) sao cho w = m.u + n.v", "u.v = 0", "w = u + v", "u + v + w = 0", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Trong hình hộp ABCD.A'B'C'D', vectơ AB + AD + AA' bằng vectơ nào?", "AC'", "A'C", "BD'", "DB'", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Thong hieu", "Cho tứ diện ABCD. Vectơ AB - AC bằng vectơ nào sau đây?", "CB", "BC", "CA", "BA", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Van dung", "Cho góc giữa hai vectơ u và v là 60 độ, |u|=2, |v|=3. Tích vô hướng u.v bằng:", "3", "6", "3 căn 3", "1", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, tọa độ của vectơ u = 2i - 3j + k là:", "(2; -3; 1)", "(2; 3; 1)", "(1; -3; 2)", "(-3; 2; 1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, cho A(1; 2; 3) và B(-1; 0; 1). Tọa độ vectơ AB là:", "(-2; -2; -2)", "(0; 2; 4)", "(2; 2; 2)", "(-1; -2; -1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho A(1; 2; -1) và B(3; 0; 3). Tọa độ trung điểm M của đoạn AB là:", "(2; 1; 1)", "(4; 2; 2)", "(1; -1; 2)", "(2; 2; 1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho u = (1; 2; 3) và v = (2; -1; 0). Tích vô hướng u.v bằng:", "0", "4", "2", "-1", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Trong không gian, điều kiện để hai vectơ u và v cùng phương là:", "Tồn tại số k sao cho u = k.v", "u.v = 0", "|u| = |v|", "u + v = 0", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Cho hình lập phương ABCD.A'B'C'D'. Vectơ AB + BC bằng vectơ nào?", "AC", "AC'", "BD", "A'C", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, tọa độ điểm H là hình chiếu của A(1; 2; 3) trên mặt phẳng (Oxy) là:", "(1; 2; 0)", "(1; 0; 3)", "(0; 2; 3)", "(0; 0; 3)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, khoảng cách từ A(3; 4; 0) đến gốc tọa độ O bằng:", "5", "7", "12", "25", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho hai vectơ u = (1; -2; 2) và v = (2; 1; -1). Tích vô hướng u.v bằng:", "-2", "0", "4", "2", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Độ dài của vectơ u = (2; 1; -2) bằng:", "3", "9", "5", "1", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Van dung", "Cho A(1; 0; 2) và B(3; 2; 4). Tọa độ vectơ 2AB là:", "(4; 4; 4)", "(2; 2; 2)", "(8; 8; 8)", "(1; 1; 1)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Van dung", "Tọa độ trọng tâm G của tam giác ABC với A(1;2;3), B(2;3;1), C(3;1;2) là:", "(2; 2; 2)", "(6; 6; 6)", "(3; 3; 3)", "(1; 1; 1)", 1);

// --- CHƯƠNG 3 ---
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Khoảng biến thiên R của mẫu số liệu ghép nhóm là hiệu số giữa:", "Cận trên nhóm cuối và cận dưới nhóm đầu", "Giá trị lớn nhất và giá trị nhỏ nhất", "Tần số lớn nhất và tần số nhỏ nhất", "Q3 và Q1", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Khoảng tứ phân vị IQR của mẫu số liệu được tính theo công thức:", "IQR = Q3 - Q1", "IQR = Q3 + Q1", "IQR = Q2 - Q1", "IQR = R / 2", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Khoảng biến thiên của mẫu số liệu ghép nhóm càng lớn chứng tỏ:", "Số liệu càng phân tán rộng", "Số liệu càng tập trung", "Số liệu có trung bình lớn", "Số liệu có phương sai bé", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung", "Cho mẫu số liệu có Q1 = 15 và Q3 = 35. Khoảng tứ phân vị IQR là:", "20", "50", "10", "25", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Phương sai là đại lượng dùng để đo:", "Mức độ phân tán của mẫu số liệu quanh số trung bình", "Độ tập trung tuyệt đối của số liệu", "Tần số của giá trị trung tâm", "Khoảng giữa của dãy số", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Độ lệch chuẩn s liên hệ với phương sai s^2 theo công thức:", "s = căn bậc hai của s^2", "s = s^2", "s = 2 * s^2", "s^2 = căn(s)", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Nếu tất cả các số liệu trong mẫu tăng lên 3 đơn vị thì phương sai:", "Không thay đổi", "Tăng 3 đơn vị", "Tăng 9 đơn vị", "Giảm 3 đơn vị", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Nếu tất cả các số liệu trong mẫu nhân thêm 2 thì độ lệch chuẩn mới:", "Gấp 2 lần độ lệch chuẩn cũ", "Gấp 4 lần độ lệch chuẩn cũ", "Không đổi", "Bằng một nửa", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Nếu khoảng biến thiên của mẫu số liệu ghép nhóm bằng 0 thì:", "Tất cả các số liệu trong mẫu bằng nhau", "Số trung bình bằng 0", "Phương sai cực đại", "Độ lệch chuẩn bằng 1", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Tứ phân vị thứ hai Q2 của mẫu số liệu chính là:", "Số trung vị", "Số trung bình", "Mốt", "Khoảng biến thiên", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Khoảng tứ phân vị IQR phản ánh mức độ phân tán của:", "50% số liệu trung tâm mẫu", "25% số liệu nhỏ nhất", "25% số liệu lớn nhất", "100% toàn bộ mẫu", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung", "Một mẫu số liệu có Q1 = 10, Q2 = 20, Q3 = 30. Giá trị IQR bằng:", "20", "10", "30", "40", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Khi phương sai s^2 = 0 thì độ lệch chuẩn s bằng:", "0", "1", "0,5", "Không xác định", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Mẫu số liệu nào sau đây có mức độ phân tán nhỏ nhất?", "Phương sai bằng 1", "Phương sai bằng 4", "Phương sai bằng 9", "Phương sai bằng 16", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Đơn vị đo của độ lệch chuẩn s so với đơn vị đo của mẫu số liệu là:", "Cùng đơn vị", "Bình phương đơn vị", "Căn bậc hai đơn vị", "Không có đơn vị", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Mẫu số liệu A có s = 2, mẫu số liệu B có s = 5. Kết luận nào đúng?", "Mẫu B phân tán hơn mẫu A", "Mẫu A phân tán hơn mẫu B", "Hai mẫu có độ phân tán như nhau", "Mẫu B có trung bình lớn hơn", 1);

// --- CHƯƠNG 4 ---
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = 3x^2 + sin(x) là:", "x^3 - cos(x) + C", "x^3 + cos(x) + C", "6x + cos(x) + C", "x^3/3 - cos(x) + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của f(x) = e^x - 2x là:", "e^x - x^2 + C", "e^x - 2 + C", "e^x + x^2 + C", "e^x - 2x^2 + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "F(x) là một nguyên hàm của f(x) = 1/(2x + 1) và F(0) = 1. Giá trị F(1) bằng:", "1/2 * ln(3) + 1", "ln(3) + 1", "ln(3)", "2.ln(3) + 1", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Van dung", "Cho integral f(x) dx = F(x) + C. Nguyên hàm integral f(2x) dx bằng:", "1/2 * F(2x) + C", "F(2x) + C", "2 * F(2x) + C", "F(x/2) + C", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tích phân I = integral_0^1 (e^x) dx có giá trị bằng:", "e - 1", "e", "e + 1", "1 - e", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tích phân integral_1^2 2x dx bằng:", "3", "4", "2", "1", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_1^2 f(x)dx = 3 và integral_1^2 g(x)dx = -2. Tính integral_1^2 [2f(x) - g(x)]dx:", "8", "4", "7", "1", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Nếu integral_0^3 f(x)dx = 6 thì integral_0^3 5f(x)dx bằng:", "30", "11", "1", "6/5", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = cos(x) là:", "sin(x) + C", "-sin(x) + C", "cos(x) + C", "-cos(x) + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = 1/x (x > 0) là:", "ln(x) + C", "-1/x^2 + C", "e^x + C", "x + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "Cho integral f(x) dx = x^3 + C. Hàm số f(x) là:", "f(x) = 3x^2", "f(x) = x^4/4", "f(x) = 6x", "f(x) = x^3", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Van dung", "F(x) là nguyên hàm của f(x) = 2x - 1 thỏa mãn F(1) = 2. Công thức F(x) là:", "F(x) = x^2 - x + 2", "F(x) = x^2 - x", "F(x) = x^2 - x + 1", "F(x) = 2x^2 - x + 1", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tính tích phân I = integral_1^2 3 dx.", "3", "6", "1", "2", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Nếu integral_0^1 f(x)dx = 2 và integral_1^3 f(x)dx = 5 thì integral_0^3 f(x)dx bằng:", "7", "3", "10", "-3", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tích phân I = integral_0^(pi/2) sin(x) dx có giá trị bằng:", "1", "0", "-1", "2", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính tích phân I = integral_1^e (1/x) dx.", "1", "e", "0", "e - 1", 1);

// --- CHƯƠNG 5 ---
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Mặt phẳng (P): 2x - 3y + z - 5 = 0 có một vectơ pháp tuyến là:", "n = (2; -3; 1)", "n = (2; 3; 1)", "n = (2; -3; -5)", "n = (-3; 1; -5)", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Phương trình mặt phẳng qua A(1; 0; 0), B(0; 2; 0), C(0; 0; 3) là:", "x/1 + y/2 + z/3 = 1", "x + 2y + 3z = 1", "x/1 + y/2 + z/3 = 0", "x + y + z = 6", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Thong hieu", "Khoảng cách từ gốc tọa độ O đến mặt phẳng (P): 3x + 4z - 10 = 0 bằng:", "2", "10", "5", "10/3", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Van dung", "Phương trình mặt phẳng qua M(1; 2; 3) song song với (P): x - 2y + z + 1 = 0 là:", "x - 2y + z = 0", "x - 2y + z - 2 = 0", "x + 2y + z - 8 = 0", "x - 2y - z + 4 = 0", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Phương trình mặt cầu tâm I(1; -2; 3) bán kính R = 4 là:", "(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16", "(x + 1)^2 + (y - 2)^2 + (z + 3)^2 = 16", "(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 4", "(x - 1)^2 + (y - 2)^2 + (z - 3)^2 = 16", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Đường thẳng d: (x-1)/2 = (y+2)/(-1) = z/3 có một vectơ chỉ phương là:", "u = (2; -1; 3)", "u = (1; -2; 0)", "u = (-1; 2; 3)", "u = (2; 1; 3)", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Tâm I và bán kính R của mặt cầu x^2 + y^2 + z^2 - 2x + 4y - 6z - 2 = 0 là:", "I(1; -2; 3), R = 4", "I(-1; 2; -3), R = 4", "I(1; -2; 3), R = 16", "I(2; -4; 6), R = 2", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Giao điểm của đường thẳng d: x = 1+t, y = 2-t, z = 3t với mặt phẳng (Oxy) là:", "(1; 2; 0)", "(0; 3; 0)", "(1; 2; 3)", "(2; 1; 3)", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Phương trình mặt phẳng (Oxy) trong không gian Oxyz là:", "z = 0", "x = 0", "y = 0", "x + y = 0", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Vectơ nào sau đây vuông góc với mặt phẳng (P): x - y + 2z - 3 = 0?", "n = (1; -1; 2)", "n = (1; 1; 2)", "n = (-1; 1; 2)", "n = (1; -1; -3)", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Thong hieu", "Khoảng cách từ A(1; 1; 1) đến mặt phẳng (P): x + 2y + 2z + 1 = 0 bằng:", "2", "6", "3", "1", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Van dung", "Phương trình mặt phẳng đi qua A(1; 2; 3) và vuông góc với đường thẳng d: x/1 = y/2 = z/3 là:", "x + 2y + 3z - 14 = 0", "x + 2y + 3z = 0", "x - 2y + 3z - 6 = 0", "3x + 2y + z - 10 = 0", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Tâm I của mặt cầu (x - 2)^2 + (y + 1)^2 + z^2 = 9 có tọa độ là:", "(2; -1; 0)", "(-2; 1; 0)", "(2; -1; 9)", "(2; 1; 0)", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Đường thẳng d đi qua M(1; 2; 3) và có u = (3; 2; 1) có phương trình chính tắc là:", "(x-1)/3 = (y-2)/2 = (z-3)/1", "(x-3)/1 = (y-2)/2 = (z-1)/3", "(x+1)/3 = (y+2)/2 = (z+3)/1", "x/1 = y/2 = z/3", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Bán kính R của mặt cầu x^2 + y^2 + z^2 - 4x + 6y - 2z - 2 = 0 là:", "4", "16", "căn 12", "2", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Giao điểm của đường thẳng d: x = t, y = 1+t, z = 2-t với mặt phẳng (P): x + y + z - 6 = 0 là:", "(3; 4; -1)", "(1; 2; 1)", "(2; 3; 1)", "(0; 1; 2)", 1);

// --- CHƯƠNG 6 ---
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Ký hiệu P(A|B) đại diện cho:", "Xác suất của biến cố A với điều kiện biến cố B đã xảy ra", "Xác suất biến cố B với điều kiện A xảy ra", "Xác suất của biến cố giao A và B", "Xác suất của biến cố hợp A hoặc B", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Công thức tính xác suất có điều kiện P(A|B) khi P(B) > 0 là:", "P(A|B) = P(AB) / P(B)", "P(A|B) = P(AB) / P(A)", "P(A|B) = P(A) . P(B)", "P(A|B) = P(A) + P(B)", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Biết P(B) = 0,4 và P(AB) = 0,16. Giá trị P(A|B) bằng:", "0,4", "0,064", "0,56", "0,24", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Van dung", "Cho hai biến cố độc lập A và B với P(A) = 0,5 và P(B) = 0,6. Giá trị P(A|B) bằng:", "0,5", "0,6", "0,3", "0,1", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức nhân xác suất cho hai biến cố bất kỳ A và B là:", "P(AB) = P(B) . P(A|B)", "P(AB) = P(A) + P(B)", "P(AB) = P(A) / P(B)", "P(AB) = P(A) - P(B)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức xác suất toàn phần áp dụng cho hệ biến cố đầy đủ B1, B2 là:", "P(A) = P(B1).P(A|B1) + P(B2).P(A|B2)", "P(A) = P(B1) + P(B2)", "P(A) = P(A|B1) + P(A|B2)", "P(A) = P(B1).P(B2)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho P(A) = 0,3; P(B|A) = 0,8. Giá trị P(AB) bằng:", "0,24", "0,5", "0,38", "1,1", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Công thức Bayes dùng để xác định:", "Xác suất nguyên nhân P(Bk|A) sau khi biết biến cố A đã xảy ra", "Xác suất hợp hai biến cố xung khắc", "Số phần tử không gian mẫu", "Kỳ vọng của biến ngẫu nhiên", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Nếu hai biến cố A và B xung khắc thì P(AB) bằng:", "0", "1", "P(A).P(B)", "P(A)+P(B)", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Nếu A và B độc lập thì công thức nào sau đây đúng?", "P(A|B) = P(A)", "P(A|B) = P(B)", "P(A|B) = 0", "P(A|B) = 1", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,4; P(B) = 0,5; P(AB) = 0,2. Xác suất P(B|A) bằng:", "0,5", "0,4", "0,2", "0,8", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Van dung", "Gieo 2 con súc sắc cân đối. Xác suất tổng số chấm bằng 7 biết con thứ nhất xuất hiện mặt 3 chấm là:", "1/6", "1/36", "1/12", "1/3", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức cộng xác suất P(A ∪ B) = P(A) + P(B) áp dụng khi:", "A và B là hai biến cố xung khắc", "A và B độc lập", "A và B đồng khả năng", "A và B là biến cố đối", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Tổng xác suất của biến cố A và biến cố đối A_bar của nó bằng:", "1", "0", "0,5", "P(A)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho hai biến cố độc lập A và B với P(A) = 0,2 và P(B) = 0,3. Xác suất P(A ∪ B) bằng:", "0,44", "0,5", "0,06", "0,1", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Xác suất bắn trúng mục tiêu của 2 xạ thủ độc lập là 0,7 và 0,8. Xác suất cả 2 đều trúng là:", "0,56", "0,96", "0,14", "0,50", 1);

// PHẦN II (32 CÂU SET 1 & 2)
addQ("II", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", "Cho hàm số y = f(x) = x^4 - 4x^2 + 3. Xét tính đúng/sai của các phát biểu sau:", "a) Hàm số đã cho là hàm số chẵn.", "b) Hàm số có 3 điểm cực trị.", "c) Giá trị cực tiểu của hàm số bằng 3.", "d) Hàm số đồng biến trên khoảng (-2; 0) và (2; +∞).", "Đ;Đ;S;S");
addQ("II", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Van dung", "Cho hàm số y = (2x - 1)/(x + 1) có đồ thị (C). Xét các mệnh đề sau:", "a) Tiệm cận đứng của (C) là đường thẳng x = -1.", "b) Tiệm cận ngang của (C) là đường thẳng y = 2.", "c) Tâm đối xứng của đồ thị (C) là I(-1; 2).", "d) Đường thẳng y = x + 1 cắt đồ thị (C) tại 2 điểm phân biệt.", "Đ;Đ;Đ;Đ");
addQ("II", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Van dung cao", "Cho hàm số f(x) = x^3 - 3x + 1 trên đoạn [0; 2]. Xét các phát biểu:", "a) Giá trị nhỏ nhất của hàm số trên đoạn [0; 2] bằng -1.", "b) Giá trị lớn nhất của hàm số trên đoạn [0; 2] bằng 3.", "c) Hàm số đạt cực tiểu tại điểm x = 1.", "d) Tổng giá trị lớn nhất và giá trị nhỏ nhất bằng 2.", "Đ;Đ;Đ;Đ");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Trong không gian Oxyz, cho tam giác ABC có A(1; 0; 0), B(0; 2; 0), C(0; 0; 3). Các mệnh đề sau đúng hay sai?", "a) Tọa độ trọng tâm G của tam giác ABC là (1/3; 2/3; 1).", "b) Vectơ AB có tọa độ là (-1; 2; 0).", "c) Độ dài cạnh AB bằng 5.", "d) Phương trình mặt phẳng (ABC) là x/1 + y/2 + z/3 = 1.", "Đ;Đ;S;Đ");
addQ("II", "CD2", CD2, "B1", "Vectơ trong không gian", "Van dung", "Trong không gian, cho hai vectơ u và v thỏa mãn |u| = 2, |v| = 3 và góc giữa u, v bằng 60 độ. Mệnh đề nào đúng/sai?", "a) Tích vô hướng u.v = 3.", "b) Độ dài vectơ u + v bằng căn(19).", "c) Vectơ u và v vuông góc với nhau.", "d) Bình phương vô hướng u^2 = 4.", "Đ;Đ;S;Đ");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho hai điểm A(2; 1; -1) và B(0; 3; 1). Xét các phát biểu sau:", "a) Trung điểm I của AB có tọa độ (1; 2; 0).", "b) Vectơ AB = (-2; 2; 2).", "c) Độ dài đoạn AB = 2 căn 3.", "d) Mặt phẳng trung trực AB đi qua gốc tọa độ O(0;0;0).", "Đ;Đ;Đ;S");
addQ("II", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Một mẫu số liệu ghép nhóm có phương sai s^2 = 16 và số trung bình x_bar = 25. Xét các phát biểu sau:", "a) Độ lệch chuẩn của mẫu số liệu là s = 4.", "b) Nếu mỗi số liệu tăng thêm 5 đơn vị thì phương sai mới bằng 21.", "c) Nếu mỗi số liệu nhân thêm 2 thì phương sai mới bằng 64.", "d) Độ lệch chuẩn đo mức độ phân tán của số liệu cùng đơn vị với số liệu gốc.", "Đ;S;Đ;Đ");
addQ("II", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Cho mẫu số liệu ghép nhóm có Q1 = 12, Q2 = 18, Q3 = 26. Xét tính đúng/sai:", "a) Khoảng tứ phân vị IQR = 14.", "b) Nửa khoảng tứ phân vị bằng 7.", "c) Trung vị của mẫu số liệu là 18.", "d) 50% số liệu trung tâm nằm trong khoảng từ 12 đến 26.", "Đ;Đ;Đ;Đ");
addQ("II", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Van dung", "Cho hàm số f(x) = 2x + e^x. Xét tính đúng/sai của các mệnh đề sau:", "a) Họ nguyên hàm F(x) của f(x) là x^2 + e^x + C.", "b) F(0) = 1 khi C = 0.", "c) Integral_0^1 f(x) dx = e.", "d) Hàm số F(x) đồng biến trên R với mọi C.", "Đ;Đ;Đ;Đ");
addQ("II", "CD4", CD4, "B2", "Tích phân", "Van dung cao", "Cho tích phân I = integral_0^1 x.e^x dx. Mệnh đề nào đúng/sai?", "a) Sử dụng phương pháp tích phân từng phần với u = x, dv = e^x dx.", "b) Kết quả v = e^x và du = dx.", "c) Giá trị tích phân I = 1.", "d) Tích phân I có giá trị lớn hơn 0,5.", "Đ;Đ;Đ;Đ");
addQ("II", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Thong hieu", "Cho hình phẳng H giới hạn bởi đường cong y = x^2 và đường thẳng y = 2x. Xét các phát biểu sau:", "a) Hoành độ giao điểm của hai đường là x = 0 và x = 2.", "b) Diện tích hình phẳng H bằng 4/3.", "c) Khi quay H quanh trục Ox thu được khối tròn xoay.", "d) Thể tích khối tròn xoay thu được là 64pi/15.", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Cho hai mặt phẳng (P): x + 2y - z + 1 = 0 và (Q): 2x + 4y - 2z + 5 = 0. Mệnh đề đúng/sai:", "a) Vectơ pháp tuyến của (P) là n1 = (1; 2; -1).", "b) Hai mặt phẳng (P) và (Q) song song với nhau.", "c) Điểm A(0; 0; 1) thuộc mặt phẳng (P).", "d) Khoảng cách giữa hai mặt phẳng (P) và (Q) bằng 3/(2 căn 6).", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B2", "Đường thẳng và mặt cầu", "Van dung", "Cho mặt cầu (S): (x-1)^2 + (y-2)^2 + (z+1)^2 = 9. Mệnh đề nào đúng/sai?", "a) Mặt cầu có tâm I(1; 2; -1).", "b) Bán kính mặt cầu R = 3.", "c) Gốc tọa độ O(0;0;0) nằm bên trong mặt cầu (S).", "d) Mặt phẳng (Oxy) cắt mặt cầu theo một đường tròn bán kính r = 2 căn 2.", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B2", "Đường thẳng trong Oxyz", "Thong hieu", "Cho đường thẳng d: (x-1)/1 = (y-2)/2 = (z+1)/(-1). Mệnh đề đúng/sai:", "a) Điểm M(1; 2; -1) thuộc đường thẳng d.", "b) Vectơ chỉ phương u = (1; 2; -1).", "c) Đường thẳng d vuông góc với mặt phẳng (P): x + 2y - z + 3 = 0.", "d) Đường thẳng d cắt trục Oz.", "Đ;Đ;Đ;S");
addQ("II", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Một hộp có 5 viên bi đỏ và 3 viên bi xanh. Lần lượt lấy ra 2 viên bi không hoàn lại. Xét mệnh đề:", "a) Xác suất bi đầu tiên màu đỏ là 5/8.", "b) Xác suất bi thứ hai màu xanh biết bi thứ nhất màu đỏ là 3/7.", "c) Xác suất cả hai bi đều màu đỏ là 5/14.", "d) Hai biến cố lấy bi lần 1 và lần 2 là hai biến cố độc lập.", "Đ;Đ;Đ;S");
addQ("II", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung", "Có 2 xưởng sản xuất thiết bị. Xưởng I cung cấp 60% sản phẩm (tỷ lệ phế phẩm 2%). Xưởng II cung cấp 40% sản phẩm (tỷ lệ phế phẩm 3%). Chọn ngẫu nhiên 1 sản phẩm:", "a) Xác suất chọn sản phẩm của xưởng I là 0,6.", "b) Xác suất chọn phải phế phẩm là 0,024.", "c) Nếu chọn được phế phẩm, xác suất phế phẩm đó do xưởng I sản xuất là 0,5.", "d) Tổng tỷ lệ phế phẩm chung toàn bộ sản phẩm là 2,4%.", "Đ;Đ;Đ;Đ");
addQ("II", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", "Cho hàm số y = f(x) = x^3 - 3x^2 + 2. Xét tính đúng/sai:", "a) Đồ thị hàm số đi qua điểm A(0; 2).", "b) Hàm số đạt cực đại tại x = 0.", "c) Hàm số đạt cực tiểu tại x = 2.", "d) Giá trị cực tiểu của hàm số bằng -2.", "Đ;Đ;Đ;Đ");
addQ("II", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Thong hieu", "Cho hàm số y = x + 1/x trên đoạn [1; 3]. Xét các phát biểu:", "a) Hàm số liên tục trên [1; 3].", "b) Giá trị nhỏ nhất của hàm số trên [1; 3] bằng 2.", "c) Giá trị lớn nhất của hàm số trên [1; 3] bằng 10/3.", "d) Hàm số đạt giá trị nhỏ nhất tại x = 1.", "Đ;Đ;Đ;S");
addQ("II", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Cho hàm số y = (x - 2)/(x - 1). Mệnh đề đúng/sai:", "a) Tiệm cận đứng là x = 1.", "b) Tiệm cận ngang là y = 1.", "c) Đồ thị cắt trục tung tại (0; 2).", "d) Đồ thị cắt trục hoành tại (2; 0).", "Đ;Đ;Đ;Đ");
addQ("II", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho tam giác ABC có A(1;1;1), B(2;3;0), C(0;1;2). Xét các phát biểu:", "a) Vectơ AB = (1; 2; -1).", "b) Vectơ AC = (-1; 0; 1).", "c) Tích vô hướng AB.AC = -2.", "d) Tam giác ABC vuông tại A.", "Đ;Đ;Đ;S");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho A(1; 2; 3), B(3; 4; 1). Xét tính đúng/sai:", "a) Tọa độ trung điểm I của AB là (2; 3; 2).", "b) Độ dài AB = 2 căn 3.", "c) Vectơ AB = (2; 2; -2).", "d) Điểm M(2; 3; 0) là hình chiếu của I lên mặt phẳng (Oxy).", "Đ;Đ;Đ;Đ");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Cho u = (1; 0; 1) và v = (0; 1; 1). Mệnh đề đúng/sai:", "a) Độ dài |u| = căn 2.", "b) Tích vô hướng u.v = 1.", "c) Góc giữa u và v bằng 60 độ.", "d) Vectơ u + v = (1; 1; 2).", "Đ;Đ;Đ;Đ");
addQ("II", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Cho mẫu số liệu ghép nhóm có khoảng biến thiên R = 20 và IQR = 8. Xét tính đúng/sai:", "a) Khoảng cách giữa giá trị lớn nhất và nhỏ nhất là 20.", "b) 50% số liệu ở giữa nằm trong khoảng có độ rộng 8.", "c) Nửa khoảng tứ phân vị bằng 4.", "d) Phương sai mẫu chắc chắn bằng 64.", "Đ;Đ;Đ;S");
addQ("II", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Mẫu số liệu X có phương sai s^2 = 9. Xét mệnh đề:", "a) Độ lệch chuẩn s = 3.", "b) Nếu tăng mọi số liệu lên 2 lần thì phương sai mới bằng 36.", "c) Nếu cộng mọi số liệu thêm 5 thì độ lệch chuẩn mới bằng 8.", "d) Mức độ phân tán của số liệu bằng 3 đơn vị.", "Đ;Đ;S;Đ");
addQ("II", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "Cho f(x) = 3x^2 - 2x. Xét tính đúng/sai:", "a) Họ nguyên hàm F(x) = x^3 - x^2 + C.", "b) Nếu F(0) = 5 thì C = 5.", "c) F'(x) = f(x).", "d) Integral_0^1 f(x) dx = 0.", "Đ;Đ;Đ;Đ");
addQ("II", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_0^2 f(x)dx = 4. Mệnh đề đúng/sai:", "a) Integral_0^2 3f(x)dx = 12.", "b) Integral_0^2 [f(x) + 1]dx = 6.", "c) Integral_2^0 f(x)dx = -4.", "d) Integral_0^1 f(2x)dx = 2.", "Đ;Đ;Đ;Đ");
addQ("II", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Cho hình phẳng giới hạn bởi y = x, y = 0, x = 2. Mệnh đề đúng/sai:", "a) Diện tích hình phẳng S = 2.", "b) Thể tích khối tròn xoay khi quay quanh Ox là V = 8pi/3.", "c) Đường thẳng x = 1 chia hình phẳng thành 2 phần diện tích bằng nhau.", "d) Đường thẳng y = 1 cắt hình phẳng.", "Đ;Đ;S;Đ");
addQ("II", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Cho (P): 2x - y + 2z - 6 = 0. Mệnh đề đúng/sai:", "a) Vectơ pháp tuyến n = (2; -1; 2).", "b) Điểm A(3; 0; 0) thuộc (P).", "c) Khoảng cách từ O(0;0;0) đến (P) bằng 2.", "d) Mặt phẳng (P) song song với 2x - y + 2z + 1 = 0.", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B2", "Mặt cầu Oxyz", "Thong hieu", "Cho mặt cầu (S): x^2 + y^2 + z^2 = 25. Mệnh đề đúng/sai:", "a) Tâm mặt cầu là O(0;0;0).", "b) Bán kính R = 5.", "c) Điểm A(3; 4; 0) nằm trên mặt cầu (S).", "d) Thể tích khối cầu V = 500pi/3.", "Đ;Đ;Đ;S");
addQ("II", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Cho d: x = 1+2t, y = 2-t, z = 3t. Mệnh đề đúng/sai:", "a) Vectơ chỉ phương u = (2; -1; 3).", "b) Điểm M(1; 2; 0) thuộc d.", "c) Điểm N(3; 1; 3) thuộc d.", "d) d vuông góc với mặt phẳng 2x - y + 3z = 0.", "Đ;Đ;Đ;S");
addQ("II", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Chọn 1 lá bài từ bộ bài 52 lá. Gọi A là 'chọn lá Át', B là 'chọn lá Đen'. Xét mệnh đề:", "a) P(A) = 4/52 = 1/13.", "b) P(B) = 26/52 = 1/2.", "c) P(AB) = 2/52 = 1/26.", "d) A và B là hai biến cố độc lập.", "Đ;Đ;Đ;Đ");
addQ("II", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Gieo 2 con súc sắc cân đối. Gọi A là biến cố 'tổng chấm bằng 8'. Mệnh đề đúng/sai:", "a) Có 5 khả năng thuận lợi cho A.", "b) P(A) = 5/36.", "c) Xác suất để tổng số chấm lẻ là 1/2.", "d) Biến cố tổng chấm bằng 8 và tổng chấm bằng 7 là hai biến cố xung khắc.", "Đ;Đ;Đ;Đ");

// PHẦN III (48 CÂU SET 1 & 2)
addQ("III", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Van dung", "Tìm giá trị cực đại của hàm số y = -x^3 + 3x + 1.", "", "", "", "", "0003");
addQ("III", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Van dung cao", "Tấm tôn hình vuông cạnh 12 cm cắt 4 góc 4 hình vuông x cm để gập thành hộp không nắp. Tìm x (cm) để thể tích lớn nhất.", "", "", "", "", "0002");
addQ("III", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Tìm hoành độ giao điểm của đường tiệm cận đứng x = -1,5 của đồ thị hàm số y = (x+1)/(2x+3) với trục hoành.", "", "", "", "", "-1,5");
addQ("III", "CD1", CD1, "B4", "Khảo sát và vẽ đồ thị hàm số", "Van dung", "Số giao điểm của đồ thị hàm số y = x^3 - 3x^2 + 2 với đường thẳng y = -2 là bao nhiêu?", "", "", "", "", "0001");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Trong không gian Oxyz, cho A(2; 4; -1), B(0; 2; 3). Tìm hoành độ trung điểm I của đoạn thẳng AB.", "", "", "", "", "0001");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho u = (2; 1; -2). Tính độ dài của vectơ u.", "", "", "", "", "0003");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Cho A(1; 1; 1) và B(3; 3; 3). Tính tung độ của vectơ AB.", "", "", "", "", "0002");
addQ("III", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho hình lập phương ABCD.A'B'C'D' có cạnh bằng 2. Tính tích vô hướng AB.AD.", "", "", "", "", "0000");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung cao", "Khoảng biến thiên của mẫu số liệu {1,2; 2,5; 3,8; 4,7; 0,45} là bao nhiêu? (Làm tròn 2 chữ số thập phân).", "", "", "", "", "4,25");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Van dung", "Tính độ lệch chuẩn s biết phương sai s^2 = 0,64.", "", "", "", "", "0,80");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Tính khoảng tứ phân vị IQR biết Q1 = 15,5 và Q3 = 28,5.", "", "", "", "", "13,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Tính phương sai s^2 biết độ lệch chuẩn s = 1,5.", "", "", "", "", "2,25");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính giá trị của tích phân I = integral_0^2 (2x + 1) dx.", "", "", "", "", "0006");
addQ("III", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Tính diện tích hình phẳng giới hạn bởi y = x^2, y = 0, x = 0, x = 1. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "0,33");
addQ("III", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "Biết F(x) = x^2 + 3x là một nguyên hàm của f(x). Tính f(1).", "", "", "", "", "0005");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Van dung", "Tính tích phân I = integral_0^1 e^(2x) dx. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "3,19");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Tính khoảng cách từ A(1; 2; 3) đến mặt phẳng (Oxy).", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B2", "Mặt cầu trong Oxyz", "Thong hieu", "Tính bán kính R của mặt cầu x^2 + y^2 + z^2 - 4x + 2y - 4 = 0.", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Van dung", "Tìm cao độ giao điểm của mặt phẳng 2x + 3y + z - 6 = 0 với trục Oz.", "", "", "", "", "0006");
addQ("III", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Tính tung độ của giao điểm giữa đường thẳng x = 1+t, y = 2+2t, z = 3t với mặt phẳng (Oxz).", "", "", "", "", "0000");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(B) = 0,5 và P(AB) = 0,25. Tính P(A|B). (Điền dạng thập phân).", "", "", "", "", "0,50");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung", "Cho A, B độc lập với P(A) = 0,4; P(B) = 0,5. Tính P(AB).", "", "", "", "", "0,20");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,6 và P(AB) = 0,18. Tính P(B|A).", "", "", "", "", "0,30");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung cao", "Tỷ lệ phế phẩm xưởng 1 là 1%, xưởng 2 là 2%. Hộp chứa 60% hàng xưởng 1, 40% hàng xưởng 2. Lấy 1 sản phẩm, tính xác suất là phế phẩm (%).", "", "", "", "", "1,40");
addQ("III", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Van dung", "Tìm hoành độ điểm cực đại của hàm số y = x^3 - 3x + 2.", "", "", "", "", "-1,0");
addQ("III", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Thong hieu", "Tính giá trị lớn nhất của hàm số y = -x^2 + 4x - 1 trên đoạn [0; 3].", "", "", "", "", "0003");
addQ("III", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Tìm tung độ giao điểm của tiệm cận ngang y = 2 của đồ thị y = (2x-1)/(x+1) với trục tung.", "", "", "", "", "0002");
addQ("III", "CD1", CD1, "B4", "Khảo sát và vẽ đồ thị hàm số", "Thong hieu", "Đồ thị hàm số y = x^4 - 2x^2 cắt trục hoành tại bao nhiêu điểm?", "", "", "", "", "0003");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho A(1; 0; 0) và B(0; 2; 0). Tính độ dài đoạn thẳng AB. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "2,24");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Thong hieu", "Cho u = (1; 2; 2). Tính độ dài |u|.", "", "", "", "", "0003");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ trong không gian", "Van dung", "Cho A(2; 3; 4) và B(1; 1; 1). Tính cao độ của vectơ AB.", "", "", "", "", "-3,0");
addQ("III", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho u và v vuông góc với nhau, |u|=3, |v|=4. Tính độ dài vectơ u + v.", "", "", "", "", "0005");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Tính khoảng biến thiên R của mẫu số liệu {3, 7, 12, 18, 25}.", "", "", "", "", "22,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Cho độ lệch chuẩn s = 2,5. Tính phương sai s^2.", "", "", "", "", "6,25");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Mẫu số liệu ghép nhóm có Q1 = 20 và Q3 = 45. Tính khoảng tứ phân vị IQR.", "", "", "", "", "25,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Tính độ lệch chuẩn s biết phương sai s^2 = 1,44.", "", "", "", "", "1,20");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính tích phân I = integral_0^3 2x dx.", "", "", "", "", "0009");
addQ("III", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Tính diện tích hình phẳng giới hạn bởi y = x^3, y = 0, x = 0, x = 2.", "", "", "", "", "0004");
addQ("III", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "Cho f(x) = 4x^3. Tính F(1) biết F(x) là nguyên hàm của f(x) và F(0) = 2.", "", "", "", "", "0003");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_1^2 f(x)dx = 5. Tính integral_1^2 3f(x)dx.", "", "", "", "", "0015");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Tính khoảng cách từ M(2; 3; 4) đến mặt phẳng (Oxz).", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B2", "Mặt cầu trong Oxyz", "Thong hieu", "Tính đường kính D của mặt cầu x^2 + y^2 + z^2 = 16.", "", "", "", "", "0008");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Cho mặt phẳng (P): x + 2y + 3z - 12 = 0. Tìm hoành độ giao điểm của (P) với trục Ox.", "", "", "", "", "0012");
addQ("III", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Cho d: x = 2t, y = 1+t, z = 3. Tìm cao độ điểm thuộc d khi t = 5.", "", "", "", "", "0003");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,8 và P(AB) = 0,4. Tính P(B|A).", "", "", "", "", "0,50");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Xác suất 2 người độc lập cùng thi đỗ là 0,8 và 0,9. Tính xác suất cả 2 cùng đỗ.", "", "", "", "", "0,72");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(B) = 0,6 và P(A|B) = 0,5. Tính xác suất P(AB).", "", "", "", "", "0,30");
addQ("III", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho hai biến cố xung khắc A và B có P(A) = 0,35 và P(B) = 0,45. Tính P(A ∪ B).", "", "", "", "", "0,80");

// ============================================================================
// ĐỢT 3: 100 CÂU BỔ SUNG MỚI (177 -> 276)
// ============================================================================

// --- PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN (BỔ SUNG 54 CÂU MỚI) ---
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Nhan biet", "Hàm số y = x^4 + 2x^2 - 1 đồng biến trên khoảng nào?", "(0; +∞)", "(-∞; 0)", "(-1; 1)", "(-∞; +∞)", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Thong hieu", "Hàm số y = (x - 1)/(x + 2) đồng biến trên khoảng nào?", "(-∞; -2) và (-2; +∞)", "R", "(-2; +∞)", "(-1; 2)", 1);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Nhan biet", "Giá trị lớn nhất của hàm số y = 3 - 2x^2 bằng bao nhiêu?", "3", "0", "-2", "5", 1);
addQ("I", "CD1", CD1, "B2", "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", "Thong hieu", "Giá trị nhỏ nhất của hàm số y = e^x - x trên đoạn [0; 1] bằng:", "1", "e - 1", "0", "e", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Nhan biet", "Đường tiệm cận đứng của đồ thị hàm số y = (x + 3)/(2x - 4) là:", "x = 2", "x = -3", "y = 1/2", "y = 2", 1);
addQ("I", "CD1", CD1, "B3", "Đường tiệm cận của đồ thị hàm số", "Thong hieu", "Giao điểm của tiệm cận đứng và tiệm cận ngang của đồ thị y = (x + 1)/(x - 2) là:", "I(2; 1)", "I(1; 2)", "I(-2; -1)", "I(0; 0)", 1);
addQ("I", "CD1", CD1, "B4", "Khảo sát sự biến thiên và vẽ đồ thị của hàm số", "Nhan biet", "Đồ thị hàm số y = ax^4 + bx^2 + c có dạng hình chữ W khi:", "a > 0 và b < 0", "a < 0 và b > 0", "a > 0 và b > 0", "a < 0 và b < 0", 1);
addQ("I", "CD1", CD1, "B4", "Khảo sát sự biến thiên và vẽ đồ thị của hàm số", "Thong hieu", "Số giao điểm của đồ thị y = x^4 - 2x^2 và đường thẳng y = -1 là:", "2", "4", "1", "3", 1);
addQ("I", "CD1", CD1, "B1", "Tính đơn điệu và cực trị của hàm số", "Van dung", "Tìm m để hàm số y = x^3 - 3x^2 + mx - 1 có 2 điểm cực trị nằm về 2 phía trục tung.", "m < 0", "m > 0", "m = 3", "m < 3", 1);

addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Nhan biet", "Trong hình lập phương ABCD.A'B'C'D', góc giữa hai đường thẳng AB và A'D' bằng:", "90 độ", "45 độ", "60 độ", "0 độ", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Thong hieu", "Cho tam giác ABC đều cạnh a. Tích vô hướng AB.AC bằng:", "a^2 / 2", "a^2", "a^2 căn 3 / 2", "0", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Trong không gian Oxyz, tọa độ điểm A đối xứng với M(1; -2; 3) qua trục Ox là:", "(1; 2; -3)", "(-1; -2; 3)", "(-1; 2; -3)", "(1; 2; 3)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Nhan biet", "Vectơ đơn vị trên trục Oy có tọa độ là:", "j = (0; 1; 0)", "i = (1; 0; 0)", "k = (0; 0; 1)", "u = (1; 1; 0)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho u = (2; -1; 1) và v = (m; 2; 4). Tìm m để u và v vuông góc với nhau.", "m = -1", "m = 1", "m = 2", "m = 0", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Thong hieu", "Cho A(2; 1; 0) và B(0; 3; -2). Tọa độ vectơ BA là:", "(2; -2; 2)", "(-2; 2; -2)", "(1; 2; -1)", "(2; 2; -2)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Van dung", "Cho A(1; 2; 3), B(2; 1; 0), C(0; 3; 1). Tọa độ điểm D để ABCD là hình bình hành là:", "(-1; 4; 4)", "(1; 0; -2)", "(3; 0; 2)", "(1; 4; 2)", 1);
addQ("I", "CD2", CD2, "B2", "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)", "Van dung", "Khoảng cách từ điểm A(1; 2; 2) đến mặt phẳng (Oyz) bằng:", "1", "2", "3", "0", 1);
addQ("I", "CD2", CD2, "B1", "Vectơ và các phép toán vectơ trong không gian", "Thong hieu", "Cho u = (1; 1; 0) và v = (0; 1; 1). Cosin của góc giữa u và v bằng:", "1/2", "căn 3 / 2", "căn 2 / 2", "0", 1);

addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Nhan biet", "Khoảng tứ phân vị IQR là khoảng đo độ phân tán của bao nhiêu phần trăm dữ liệu ở giữa?", "50%", "25%", "75%", "100%", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Mẫu số liệu {2, 4, 6, 8, 10} có khoảng biến thiên R bằng:", "8", "6", "10", "4", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Trung vị Q2 của mẫu số liệu {1, 3, 5, 7, 9} bằng:", "5", "3", "7", "6", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Công thức tính phương sai mẫu s^2 của dãy số liệu ghép nhóm phản ánh:", "Trung bình bình phương khoảng cách đến số trung bình", "Tổng độ lệch tuyệt đối", "Bình phương khoảng biến thiên", "Khoảng cách giữa Q3 và Q1", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Mẫu số liệu có s^2 = 25 thì độ lệch chuẩn s bằng:", "5", "25", "625", "12,5", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Nếu nhân tất cả các giá trị của mẫu số liệu với 3 thì phương sai mới bằng:", "9 lần phương sai cũ", "3 lần phương sai cũ", "Không thay đổi", "6 lần phương sai cũ", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Van dung", "Cho mẫu số liệu có số trung bình 10 và phương sai 4. Hệ số biến thiên bằng:", "0,2", "0,4", "2,5", "0,5", 1);
addQ("I", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Van dung", "Nếu thêm 1 giá trị bằng đúng số trung bình vào mẫu số liệu thì khoảng biến thiên R:", "Giữ nguyên hoặc không tăng", "Tăng lên", "Giảm đi một nửa", "Bằng 0", 1);
addQ("I", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Nhan biet", "Giá trị nào sau đây không thể là độ lệch chuẩn?", "-1,5", "0", "2,5", "10", 1);

addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = x^3 là:", "x^4/4 + C", "3x^2 + C", "x^3 + C", "x^4 + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Nhan biet", "Họ nguyên hàm của hàm số f(x) = 1/cos^2(x) là:", "tan(x) + C", "-cot(x) + C", "1/sin(x) + C", "cos(x) + C", 1);
addQ("I", "CD4", CD4, "B1", "Nguyên hàm và các tính chất", "Thong hieu", "F(x) là nguyên hàm của f(x) = e^(2x). Công thức F(x) là:", "1/2 * e^(2x) + C", "2e^(2x) + C", "e^(2x) + C", "e^x + C", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Nhan biet", "Tích phân I = integral_0^1 x dx có giá trị bằng:", "1/2", "1", "2", "0", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_0^2 f(x)dx = 3. Tính integral_0^2 [f(x) + 2x]dx.", "7", "5", "9", "3", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính tích phân I = integral_1^2 (1/x^2) dx.", "1/2", "1", "-1/2", "2", 1);
addQ("I", "CD4", CD4, "B3", "Ứng dụng hình học của tích phân", "Nhan biet", "Công thức diện tích hình phẳng giới hạn bởi y = f(x), y = 0, x = a, x = b là:", "S = integral_a^b |f(x)| dx", "S = integral_a^b f(x) dx", "S = pi integral_a^b f^2(x) dx", "S = |integral_a^b f(x) dx|", 1);
addQ("I", "CD4", CD4, "B3", "Ứng dụng hình học của tích phân", "Thong hieu", "Tính thể tích khối tròn xoay tạo bởi y = x quay quanh Ox từ x = 0 đến x = 1.", "pi / 3", "pi / 2", "pi", "2pi / 3", 1);
addQ("I", "CD4", CD4, "B2", "Tích phân", "Van dung", "Cho integral_0^1 f(3x)dx = 2. Giá trị integral_0^3 f(x)dx bằng:", "6", "2/3", "2", "5", 1);

addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Nhan biet", "Phương trình mặt phẳng (Oxz) là:", "y = 0", "x = 0", "z = 0", "x + z = 0", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Thong hieu", "Mặt phẳng qua A(2; 0; 0), B(0; -1; 0), C(0; 0; 3) có phương trình là:", "x/2 + y/(-1) + z/3 = 1", "2x - y + 3z = 1", "x/2 - y/1 + z/3 = 0", "x + y + z = 4", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Thong hieu", "Khoảng cách giữa hai mặt phẳng song song (P): x + 2y + 2z - 1 = 0 và (Q): x + 2y + 2z + 5 = 0 là:", "2", "6", "4", "3", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Bán kính mặt cầu (x + 1)^2 + (y - 2)^2 + (z - 3)^2 = 25 bằng:", "5", "25", "căn 5", "10", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Nhan biet", "Phương trình đường thẳng Oy có vectơ chỉ phương là:", "u = (0; 1; 0)", "u = (1; 0; 0)", "u = (0; 0; 1)", "u = (1; 1; 0)", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Hình chiếu vuông góc của A(1; 2; 3) lên trục Oz là điểm nào?", "(0; 0; 3)", "(1; 0; 0)", "(0; 2; 0)", "(1; 2; 0)", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Van dung", "Đường thẳng d đi qua A(1; -1; 2) và vuông góc với (P): 2x - y + z - 1 = 0 có phương trình là:", "(x-1)/2 = (y+1)/(-1) = (z-2)/1", "(x+1)/2 = (y-1)/(-1) = (z+2)/1", "(x-2)/1 = (y+1)/(-1) = (z-1)/2", "x/2 = y/(-1) = z/1", 1);
addQ("I", "CD5", CD5, "B2", "Đường thẳng và mặt cầu trong không gian Oxyz", "Thong hieu", "Khoảng cách từ M(1; 2; -1) đến mặt phẳng (P): x + y - z + 1 = 0 bằng:", "căn 3", "5/căn 3", "3/căn 3", "2", 1);
addQ("I", "CD5", CD5, "B1", "Mặt phẳng trong không gian Oxyz", "Van dung", "Góc giữa hai mặt phẳng (P): x - y = 0 và (Q): y - z = 0 bằng:", "60 độ", "45 độ", "90 độ", "30 độ", 1);

addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Nhan biet", "Nếu A và B là hai biến cố đối nhau thì P(A) + P(B) bằng:", "1", "0", "0,5", "P(AB)", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,7 và P(B|A) = 0,5. Xác suất P(AB) bằng:", "0,35", "0,2", "1,2", "0,7", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Van dung", "Một túi đựng 4 viên bi đỏ và 6 viên bi xanh. Rút ngẫu nhiên 2 viên. Xác suất 2 viên cùng màu là:", "7/15", "8/15", "1/2", "2/5", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Nhan biet", "Công thức Bayes cho phép tính:", "P(Ai|B) từ P(Ai) và P(B|Ai)", "P(A ∪ B) từ P(AB)", "Số phần tử không gian mẫu", "Kỳ vọng E(X)", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho hai biến cố độc lập A và B có P(A) = 0,4; P(B) = 0,5. Xác suất để có ít nhất 1 biến cố xảy ra là:", "0,7", "0,9", "0,2", "0,3", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Thong hieu", "Cho P(A) = 0,6; P(B) = 0,3; P(AB) = 0,18. Hai biến cố A và B là:", "Độc lập", "Xung khắc", "Đối nhau", "Không độc lập", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung", "Bắn 2 phát đạn độc lập, xác suất trúng đích mỗi phát là 0,8. Xác suất trúng ít nhất 1 phát là:", "0,96", "0,64", "0,8", "0,16", 1);
addQ("I", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Gieo con súc sắc cân đối 1 lần. Xác suất xuất hiện mặt chẵn biết số chấm lớn hơn 2 là:", "2/4 = 1/2", "1/3", "2/3", "1/6", 1);
addQ("I", "CD6", CD6, "B2", "Các quy tắc tính xác suất", "Van dung cao", "Tỷ lệ sản phẩm loại A xưởng 1 là 90%, xưởng 2 là 80%. Nhập 70% từ xưởng 1 và 30% từ xưởng 2. Xác suất chọn được sản phẩm loại A là:", "0,87", "0,85", "0,90", "0,80", 1);


// --- PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (BỔ SUNG 18 CÂU MỚI) ---
addQ("II", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Thong hieu", "Cho hàm số y = -x^3 + 3x. Xét các mệnh đề:", "a) Đồ thị cắt Oy tại (0; 0).", "b) Hàm số có 2 điểm cực trị.", "c) Điểm cực đại là (1; 2).", "d) Hàm số nghịch biến trên (-1; 1).", "Đ;Đ;Đ;S");
addQ("II", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Thong hieu", "Cho f(x) = x^2 - 4x + 5 trên [0; 3]. Mệnh đề đúng/sai:", "a) f'(x) = 2x - 4.", "b) Điểm cực trị x = 2 thuộc [0; 3].", "c) Giá trị nhỏ nhất bằng 1.", "d) Giá trị lớn nhất bằng 5.", "Đ;Đ;Đ;Đ");
addQ("II", "CD1", CD1, "B3", "Tiệm cận đồ thị hàm số", "Thong hieu", "Cho y = (2x + 1)/(x - 1). Mệnh đề đúng/sai:", "a) Tiệm cận đứng x = 1.", "b) Tiệm cận ngang y = 2.", "c) Giao điểm 2 tiệm cận là I(1; 2).", "d) Đồ thị đi qua gốc tọa độ O.", "Đ;Đ;Đ;S");

addQ("II", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho tam giác ABC đều cạnh 2. Xét mệnh đề:", "a) Độ dài AB = 2.", "b) Tích vô hướng AB.AC = 2.", "c) Góc giữa AB và AC bằng 60 độ.", "d) Vectơ AB + AC có độ dài 2 căn 3.", "Đ;Đ;Đ;Đ");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ Oxyz", "Thong hieu", "Cho A(1; 0; 2), B(3; 2; 0). Mệnh đề đúng/sai:", "a) Vectơ AB = (2; 2; -2).", "b) Trung điểm I của AB là (2; 1; 1).", "c) Độ dài AB = 2 căn 3.", "d) Điểm M(2; 1; 0) thuộc đoạn AB.", "Đ;Đ;Đ;S");
addQ("II", "CD2", CD2, "B2", "Hệ tọa độ Oxyz", "Van dung", "Cho u = (1; 2; 3) và v = (2; -1; 0). Xét tính đúng/sai:", "a) u.v = 0.", "b) u và v vuông góc với nhau.", "c) |u| = căn 14.", "d) |v| = căn 5.", "Đ;Đ;Đ;Đ");

addQ("II", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Cho mẫu số liệu ghép nhóm có Q1 = 10, Q3 = 25. Xét mệnh đề:", "a) Khoảng tứ phân vị IQR = 15.", "b) Nửa khoảng tứ phân vị bằng 7,5.", "c) Khoảng biến thiên luôn nhỏ hơn IQR.", "d) 50% số liệu nằm giữa 10 và 25.", "Đ;Đ;S;Đ");
addQ("II", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Cho mẫu số liệu có phương sai s^2 = 4. Mệnh đề đúng/sai:", "a) Độ lệch chuẩn s = 2.", "b) Nếu tăng mọi giá trị thêm 3 thì phương sai mới bằng 7.", "c) Nếu nhân mọi giá trị với 2 thì phương sai mới bằng 16.", "d) Độ lệch chuẩn luôn không âm.", "Đ;S;Đ;Đ");

addQ("II", "CD4", CD4, "B1", "Nguyên hàm và tính chất", "Thong hieu", "Cho f(x) = cos(x). Xét mệnh đề đúng/sai:", "a) Nguyên hàm F(x) = sin(x) + C.", "b) F(0) = 0 khi C = 0.", "c) Integral_0^(pi/2) f(x)dx = 1.", "d) F'(x) = -sin(x).", "Đ;Đ;Đ;S");
addQ("II", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_0^1 f(x)dx = 2 và integral_0^1 g(x)dx = 3. Mệnh đề đúng/sai:", "a) Integral_0^1 [f(x) + g(x)]dx = 5.", "b) Integral_0^1 [3f(x) - g(x)]dx = 3.", "c) Integral_1^0 f(x)dx = -2.", "d) Integral_0^1 [f(x).g(x)]dx = 6.", "Đ;Đ;Đ;S");
addQ("II", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Cho hình phẳng giới hạn bởi y = x^2, y = 0, x = 1. Mệnh đề đúng/sai:", "a) Diện tích S = 1/3.", "b) Thể tích quay quanh Ox là V = pi/5.", "c) Giao điểm đường cong với Ox tại x = 0.", "d) Diện tích S lớn hơn 0,5.", "Đ;Đ;Đ;S");

addQ("II", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Cho (P): x + y + z - 3 = 0. Mệnh đề đúng/sai:", "a) n = (1; 1; 1) là vectơ pháp tuyến.", "b) Điểm A(1; 1; 1) thuộc (P).", "c) Khoảng cách từ O đến (P) bằng căn 3.", "d) (P) cắt các trục tọa độ tại 3 điểm tạo thành tam giác đều.", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B2", "Mặt cầu Oxyz", "Thong hieu", "Cho mặt cầu (S): x^2 + y^2 + z^2 - 2x = 0. Mệnh đề đúng/sai:", "a) Tâm I(1; 0; 0).", "b) Bán kính R = 1.", "c) Mặt cầu đi qua gốc tọa độ O(0;0;0).", "d) Thể tích khối cầu V = 4pi/3.", "Đ;Đ;Đ;Đ");
addQ("II", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Cho d: x = t, y = 2t, z = 3t. Mệnh đề đúng/sai:", "a) d đi qua gốc tọa độ O.", "b) u = (1; 2; 3) là vectơ chỉ phương.", "c) d vuông góc với mặt phẳng x + 2y + 3z = 0.", "d) Điểm A(1; 2; 4) thuộc d.", "Đ;Đ;Đ;S");

addQ("II", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,5; P(B) = 0,4; P(AB) = 0,2. Mệnh đề đúng/sai:", "a) P(A|B) = 0,5.", "b) P(B|A) = 0,4.", "c) A và B là hai biến cố độc lập.", "d) P(A ∪ B) = 0,7.", "Đ;Đ;Đ;Đ");
addQ("II", "CD6", CD6, "B2", "Quy tắc tính xác suất", "Thong hieu", "Gieo 1 con súc sắc cân đối. Gọi A là biến cố mặt chẵn, B là biến cố số chấm chia hết cho 3. Mệnh đề đúng/sai:", "a) P(A) = 1/2.", "b) P(B) = 1/3.", "c) P(AB) = 1/6.", "d) A và B là hai biến cố độc lập.", "Đ;Đ;Đ;Đ");
addQ("II", "CD6", CD6, "B2", "Quy tắc tính xác suất", "Van dung", "Có 2 hộp sản phẩm. Hộp I có 8 tốt 2 xấu. Hộp II có 7 tốt 3 xấu. Chọn ngẫu nhiên 1 hộp rồi lấy 1 sản phẩm. Mệnh đề đúng/sai:", "a) Xác suất lấy từ hộp I là 0,5.", "b) Xác suất lấy được sản phẩm tốt là 0,75.", "c) Xác suất lấy được sản phẩm xấu là 0,25.", "d) Nếu lấy được sản phẩm tốt, xác suất từ hộp I là 8/15.", "Đ;Đ;Đ;Đ");


// --- PHẦN III: TRẢ LỜI NGẮN (BỔ SUNG 28 CÂU MỚI) ---
addQ("III", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Van dung", "Hàm số y = x^3 - 3x có bao nhiêu điểm cực trị?", "", "", "", "", "0002");
addQ("III", "CD1", CD1, "B2", "Giá trị lớn nhất và nhỏ nhất", "Thong hieu", "Giá trị nhỏ nhất của y = x^2 - 4x + 1 trên đoạn [0; 4] bằng bao nhiêu?", "", "", "", "", "-3,0");
addQ("III", "CD1", CD1, "B3", "Đường tiệm cận", "Thong hieu", "Tổng số đường tiệm cận đứng và tiệm cận ngang của đồ thị y = (x + 1)/(x - 2) bằng bao nhiêu?", "", "", "", "", "0002");
addQ("III", "CD1", CD1, "B4", "Khảo sát và vẽ đồ thị", "Thong hieu", "Đồ thị hàm số y = x^3 - 3x^2 + 4 cắt trục tung tại điểm có tung độ bằng bao nhiêu?", "", "", "", "", "0004");
addQ("III", "CD1", CD1, "B1", "Tính đơn điệu và cực trị", "Van dung cao", "Tìm m nguyên nhỏ nhất để hàm số y = x^3 + 3x^2 + mx + 1 đồng biến trên R.", "", "", "", "", "0003");

addQ("III", "CD2", CD2, "B2", "Hệ tọa độ Oxyz", "Thong hieu", "Cho u = (3; 4; 0). Tính độ dài vectơ u.", "", "", "", "", "0005");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ Oxyz", "Thong hieu", "Cho A(1; 2; 3) và B(3; 2; 1). Tính tung độ trung điểm I của AB.", "", "", "", "", "0002");
addQ("III", "CD2", CD2, "B2", "Hệ tọa độ Oxyz", "Van dung", "Cho u = (1; -1; 2) và v = (2; 1; -1). Tính tích vô hướng u.v.", "", "", "", "", "-1,0");
addQ("III", "CD2", CD2, "B1", "Vectơ trong không gian", "Thong hieu", "Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh 2. Tính tích vô hướng AB.AD.", "", "", "", "", "0000");

addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Mẫu số liệu {5, 10, 15, 20, 25} có khoảng biến thiên R bằng bao nhiêu?", "", "", "", "", "20,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Tính phương sai s^2 biết độ lệch chuẩn s = 0,5.", "", "", "", "", "0,25");
addQ("III", "CD3", CD3, "B1", "Khoảng biến thiên và khoảng tứ phân vị", "Thong hieu", "Mẫu số liệu có Q1 = 8 và Q3 = 20. Tính khoảng tứ phân vị IQR.", "", "", "", "", "12,0");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Thong hieu", "Tính độ lệch chuẩn s biết phương sai s^2 = 2,25.", "", "", "", "", "1,50");
addQ("III", "CD3", CD3, "B2", "Phương sai và độ lệch chuẩn", "Van dung", "Nếu tất cả các số liệu trong mẫu bằng 5 thì phương sai s^2 bằng bao nhiêu?", "", "", "", "", "0000");

addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Tính tích phân I = integral_0^1 4x^3 dx.", "", "", "", "", "0001");
addQ("III", "CD4", CD4, "B3", "Ứng dụng hình học tích phân", "Van dung", "Tính diện tích hình phẳng giới hạn bởi y = x, y = 0, x = 0, x = 4.", "", "", "", "", "0008");
addQ("III", "CD4", CD4, "B1", "Nguyên hàm và tính chất", "Thong hieu", "Biết F(x) = e^x là nguyên hàm của f(x). Tính f(0).", "", "", "", "", "0001");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Thong hieu", "Cho integral_0^2 f(x)dx = 6. Tính integral_0^2 1/2 * f(x) dx.", "", "", "", "", "0003");
addQ("III", "CD4", CD4, "B2", "Tích phân", "Van dung cao", "Tính tích phân I = integral_0^1 (x + 1)^2 dx. (Làm tròn 2 chữ số thập phân).", "", "", "", "", "2,33");

addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Tính khoảng cách từ A(0; 0; 5) đến mặt phẳng (Oxy).", "", "", "", "", "0005");
addQ("III", "CD5", CD5, "B2", "Mặt cầu Oxyz", "Thong hieu", "Tính bán kính R của mặt cầu x^2 + y^2 + z^2 = 49.", "", "", "", "", "0007");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Thong hieu", "Tìm tung độ giao điểm của mặt phẳng x + y + z - 4 = 0 với trục Oy.", "", "", "", "", "0004");
addQ("III", "CD5", CD5, "B2", "Đường thẳng Oxyz", "Thong hieu", "Cho d: x = 1+t, y = 2+t, z = 3-t. Tính hoành độ điểm thuộc d ứng với t = 2.", "", "", "", "", "0003");
addQ("III", "CD5", CD5, "B1", "Mặt phẳng Oxyz", "Van dung", "Tính khoảng cách từ điểm M(1; 2; 3) đến mặt phẳng (P): z - 1 = 0.", "", "", "", "", "0002");

addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(A) = 0,5 và P(AB) = 0,3. Tính P(B|A).", "", "", "", "", "0,60");
addQ("III", "CD6", CD6, "B2", "Quy tắc tính xác suất", "Thong hieu", "Cho A và B độc lập với P(A) = 0,5; P(B) = 0,6. Tính P(AB).", "", "", "", "", "0,30");
addQ("III", "CD6", CD6, "B1", "Xác suất có điều kiện", "Thong hieu", "Cho P(B) = 0,8 và P(A|B) = 0,25. Tính P(AB).", "", "", "", "", "0,20");
addQ("III", "CD6", CD6, "B2", "Quy tắc tính xác suất", "Van dung cao", "Một xạ thủ bắn 3 phát độc lập, xác suất trúng mỗi phát là 0,8. Tính xác suất bắn trúng cả 3 phát.", "", "", "", "", "0,51");


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

XLSX.utils.book_append_sheet(wb, ws, "CauHoi_276Cau_NganHang");

const webappTarget = path.join(__dirname, '..', 'CauHoi_276Cau_NganHang.xlsx');
const rootTarget = path.join(__dirname, '..', '..', 'CauHoi_276Cau_NganHang.xlsx');
const csvTarget = path.join(__dirname, '..', 'CauHoiToanHoc.csv');

XLSX.writeFile(wb, webappTarget);
XLSX.writeFile(wb, rootTarget);

// Tạo file CSV song song
const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync(csvTarget, csvContent, 'utf-8');

console.log(`Successfully generated 276 questions Excel & CSV files! Total questions: ${questions.length}`);
console.log(`- Excel 1: ${webappTarget}`);
console.log(`- Excel 2: ${rootTarget}`);
console.log(`- CSV: ${csvTarget}`);
