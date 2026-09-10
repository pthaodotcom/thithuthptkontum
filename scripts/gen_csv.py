import csv
import io
from pathlib import Path

chapters = [
    {
        "name": "Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số",
        "lessons": [
            {
                "name": "Tính đơn điệu và cực trị của hàm số",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào?", "a1": "(-vô cùng; -1) và (1; +vô cùng)", "a2": "(-1; 1)", "a3": "(0; 2)", "a4": "R", "dung": "1"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 là?", "a1": "(0; 0)", "a2": "(2; 4)", "a3": "(1; 2)", "a4": "(-1; 4)", "dung": "2"},
                    {"phan": "II", "muc_do": "Van dung", "q": "Cho hàm số y = ax^3 + bx^2 + cx + d có đồ thị như hình vẽ. Các khẳng định sau đúng hay sai?", "a1": "Hàm số đồng biến trên (-1; 1)", "a2": "Hàm số đạt cực đại tại x = -1", "a3": "Hàm số có hai điểm cực trị", "a4": "Giá trị cực tiểu của hàm số là 0", "dung": "S;Đ;Đ;S"}
                ]
            },
            {
                "name": "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Giá trị lớn nhất của hàm số y = x^4 - 2x^2 + 1 trên đoạn [0; 2] là?", "a1": "0", "a2": "1", "a3": "9", "a4": "8", "dung": "3"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Cho hàm số f(x) liên tục trên [-1; 3] và có bảng biến thiên. Giá trị nhỏ nhất của hàm số trên [-1; 3] là?", "a1": "-2", "a2": "0", "a3": "1", "a4": "5", "dung": "1"}
                ]
            },
            {
                "name": "Đường tiệm cận của đồ thị hàm số",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Đồ thị hàm số y = (2x - 1)/(x + 1) có tiệm cận đứng là?", "a1": "x = 1", "a2": "x = -1", "a3": "y = 2", "a4": "y = -1", "dung": "2"},
                    {"phan": "III", "muc_do": "Van dung", "q": "Tìm tiệm cận ngang của đồ thị hàm số y = (3x + 2)/(x - 1). (Chỉ ghi số)", "a1": "", "a2": "", "a3": "", "a4": "", "dung": "3"}
                ]
            },
            {
                "name": "Khảo sát sự biến thiên và vẽ đồ thị của hàm số",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Số giao điểm của đồ thị hàm số y = x^3 - 3x và đường thẳng y = x là?", "a1": "0", "a2": "1", "a3": "2", "a4": "3", "dung": "4"},
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Hàm số nào sau đây nghịch biến trên R?", "a1": "y = x^3", "a2": "y = -x^3", "a3": "y = x^4", "a4": "y = (x-1)/(x+1)", "dung": "2"}
                ]
            }
        ]
    },
    {
        "name": "Chương 2: Vectơ và hệ trục tọa độ trong không gian",
        "lessons": [
            {
                "name": "Vectơ và các phép toán vectơ trong không gian",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Trong không gian, cho hai vectơ u và v cùng phương, điều kiện cần và đủ là?", "a1": "u = v", "a2": "u = -v", "a3": "Tồn tại số k khác 0 để u = k.v", "a4": "u.v = 0", "dung": "3"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Góc giữa hai vectơ vuông góc bằng bao nhiêu độ?", "a1": "0 độ", "a2": "45 độ", "a3": "90 độ", "a4": "180 độ", "dung": "3"},
                    {"phan": "II", "muc_do": "Van dung", "q": "Cho ba điểm A, B, C trong không gian. Các mệnh đề sau đúng hay sai?", "a1": "AB + BC = AC", "a2": "AB - AC = CB", "a3": "|AB| + |BC| = |AC|", "a4": "AB.BC = 0 nếu tam giác ABC vuông tại B", "dung": "Đ;Đ;S;Đ"}
                ]
            },
            {
                "name": "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Trong không gian Oxyz, cho hai điểm A(1; 2; 3) và B(-1; 0; 1). Tọa độ vectơ AB là?", "a1": "(-2; -2; -2)", "a2": "(0; 2; 4)", "a3": "(2; 2; 2)", "a4": "(-1; -2; -1)", "dung": "1"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Cho u = (1; 2; 3), v = (0; -1; 1). Tích vô hướng u.v bằng?", "a1": "0", "a2": "1", "a3": "2", "a4": "-1", "dung": "2"},
                    {"phan": "III", "muc_do": "Van dung", "q": "Tìm hoành độ trung điểm I của đoạn thẳng AB với A(2; 4; -6) và B(0; 2; 4).", "a1": "", "a2": "", "a3": "", "a4": "", "dung": "1"}
                ]
            }
        ]
    },
    {
        "name": "Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm",
        "lessons": [
            {
                "name": "Khoảng biến thiên và khoảng tứ phân vị",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Khoảng biến thiên của mẫu số liệu {2, 5, 8, 10, 15} là?", "a1": "10", "a2": "13", "a3": "15", "a4": "2", "dung": "2"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Đại lượng nào sau đây đo khoảng cách giữa phần tử lớn nhất và nhỏ nhất?", "a1": "Phương sai", "a2": "Độ lệch chuẩn", "a3": "Khoảng biến thiên", "a4": "Khoảng tứ phân vị", "dung": "3"}
                ]
            },
            {
                "name": "Phương sai và độ lệch chuẩn",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Độ lệch chuẩn là gì của phương sai?", "a1": "Bình phương", "a2": "Căn bậc hai", "a3": "Gấp đôi", "a4": "Một nửa", "dung": "2"},
                    {"phan": "II", "muc_do": "Thong hieu", "q": "Về phương sai và độ lệch chuẩn, các mệnh đề sau đúng hay sai?", "a1": "Phương sai luôn không âm", "a2": "Độ lệch chuẩn có thể âm", "a3": "Độ lệch chuẩn cùng đơn vị với số liệu", "a4": "Phương sai bằng 0 khi các số liệu bằng nhau", "dung": "Đ;S;Đ;Đ"}
                ]
            }
        ]
    },
    {
        "name": "Chương 4: Nguyên hàm và Tích phân",
        "lessons": [
            {
                "name": "Nguyên hàm và các tính chất",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Nguyên hàm của hàm số f(x) = 2x là?", "a1": "x^2 + C", "a2": "2x^2 + C", "a3": "x + C", "a4": "2 + C", "dung": "1"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Nguyên hàm của 1/x trên khoảng (0; +vô cùng) là?", "a1": "-1/x^2 + C", "a2": "ln(x) + C", "a3": "e^x + C", "a4": "1/x^2 + C", "dung": "2"}
                ]
            },
            {
                "name": "Tích phân",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Tích phân từ 0 đến 1 của e^x dx bằng?", "a1": "e", "a2": "e - 1", "a3": "1 - e", "a4": "e + 1", "dung": "2"},
                    {"phan": "III", "muc_do": "Thong hieu", "q": "Tích phân từ 0 đến pi/2 của cos(x) dx là?", "a1": "", "a2": "", "a3": "", "a4": "", "dung": "1"}
                ]
            },
            {
                "name": "Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)",
                "questions": [
                    {"phan": "I", "muc_do": "Van dung", "q": "Diện tích hình phẳng giới hạn bởi y = x^2, y = 0, x = 0, x = 1 là?", "a1": "1/2", "a2": "1/3", "a3": "1/4", "a4": "1", "dung": "2"},
                    {"phan": "I", "muc_do": "Van dung", "q": "Thể tích khối tròn xoay khi quay hình phẳng y = x, y = 0, x = 1 quanh Ox là?", "a1": "pi/2", "a2": "pi/3", "a3": "pi", "a4": "2pi", "dung": "2"}
                ]
            }
        ]
    },
    {
        "name": "Chương 5: Phương pháp tọa độ trong không gian (Hình học Giải tích)",
        "lessons": [
            {
                "name": "Phương trình mặt phẳng",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Phương trình mặt phẳng (Oxy) là?", "a1": "x = 0", "a2": "y = 0", "a3": "z = 0", "a4": "x + y = 0", "dung": "3"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Vectơ pháp tuyến của mặt phẳng (P): 2x - y + 3z - 1 = 0 là?", "a1": "(2; 1; 3)", "a2": "(2; -1; 3)", "a3": "(-2; -1; 3)", "a4": "(2; 1; -3)", "dung": "2"}
                ]
            },
            {
                "name": "Phương trình đường thẳng trong không gian",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Đường thẳng d song song với trục Oz có vectơ chỉ phương là?", "a1": "(1; 0; 0)", "a2": "(0; 1; 0)", "a3": "(0; 0; 1)", "a4": "(1; 1; 1)", "dung": "3"},
                    {"phan": "II", "muc_do": "Thong hieu", "q": "Cho đường thẳng d: (x-1)/2 = y/1 = (z+1)/-1. Mệnh đề nào sau đây đúng hay sai?", "a1": "d đi qua M(1; 0; -1)", "a2": "d có vtcp là (2; 1; -1)", "a3": "d song song với mặt phẳng x+y+z=0", "a4": "d vuông góc với trục Ox", "dung": "Đ;Đ;S;S"}
                ]
            },
            {
                "name": "Phương trình mặt cầu",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Phương trình mặt cầu tâm I(1; -2; 3) bán kính R=2 là?", "a1": "(x-1)^2 + (y+2)^2 + (z-3)^2 = 4", "a2": "(x+1)^2 + (y-2)^2 + (z+3)^2 = 4", "a3": "(x-1)^2 + (y+2)^2 + (z-3)^2 = 2", "a4": "(x+1)^2 + (y-2)^2 + (z+3)^2 = 2", "dung": "1"},
                    {"phan": "I", "muc_do": "Van dung", "q": "Bán kính của mặt cầu (S): x^2 + y^2 + z^2 - 2x + 4y - 6z = 0 là?", "a1": "2", "a2": "3", "a3": "4", "a4": "14", "dung": "4"}
                ]
            }
        ]
    },
    {
        "name": "Chương 6: Xác suất có điều kiện và các quy tắc tính xác suất",
        "lessons": [
            {
                "name": "Xác suất có điều kiện",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Công thức tính xác suất có điều kiện P(A|B) là?", "a1": "P(A)/P(B)", "a2": "P(AB)/P(B)", "a3": "P(AB)/P(A)", "a4": "P(A)*P(B)", "dung": "2"},
                    {"phan": "I", "muc_do": "Thong hieu", "q": "Hai biến cố A và B độc lập khi và chỉ khi?", "a1": "P(AB) = 0", "a2": "P(A|B) = P(B)", "a3": "P(AB) = P(A)P(B)", "a4": "P(A+B) = P(A) + P(B)", "dung": "3"},
                    {"phan": "III", "muc_do": "Van dung", "q": "Nếu P(A) = 0.5, P(B|A) = 0.4 thì P(AB) bằng bao nhiêu?", "a1": "", "a2": "", "a3": "", "a4": "", "dung": "0.2"}
                ]
            },
            {
                "name": "Công thức xác suất toàn phần và công thức Bayes",
                "questions": [
                    {"phan": "I", "muc_do": "Nhan biet", "q": "Công thức Bayes được sử dụng chủ yếu để tính xác suất gì?", "a1": "Xác suất tiên nghiệm", "a2": "Xác suất hậu nghiệm", "a3": "Xác suất toàn phần", "a4": "Xác suất biên", "dung": "2"},
                    {"phan": "II", "muc_do": "Thong hieu", "q": "Khẳng định về công thức xác suất toàn phần đúng hay sai?", "a1": "Cần một hệ biến cố đầy đủ", "a2": "Áp dụng được cho mọi tập hợp biến cố", "a3": "P(B) = Tổng của P(Ai)*P(B|Ai)", "a4": "Luôn dùng kèm công thức Bayes", "dung": "Đ;S;Đ;S"}
                ]
            }
        ]
    }
]

headers = ["Phan", "ChuyenDe", "BaiHoc", "MucDo", "NoiDung", "DapAn1", "DapAn2", "DapAn3", "DapAn4", "DapAnDung"]

artifact_dir = Path(__file__).resolve().parents[1] / "artifacts" / "reference-data"
artifact_dir.mkdir(parents=True, exist_ok=True)
with open(artifact_dir / "CauHoiToanHoc.csv", 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for chap in chapters:
        for les in chap['lessons']:
            for q in les['questions']:
                row = [
                    q['phan'],
                    chap['name'],
                    les['name'],
                    q['muc_do'],
                    q['q'],
                    q['a1'],
                    q['a2'],
                    q['a3'],
                    q['a4'],
                    q['dung']
                ]
                writer.writerow(row)
