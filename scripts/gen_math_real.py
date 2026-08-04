import uuid

def u():
    return str(uuid.uuid4())

chapters = [
    {
        "name": "Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số",
        "lessons": [
            {
                "name": "Tính đơn điệu và cực trị của hàm số",
                "questions": [
                    {"q": "Hàm số y = x^3 - 3x + 2 đồng biến trên khoảng nào?", "a": "(1; +vô cùng)"},
                    {"q": "Điểm cực đại của đồ thị hàm số y = -x^3 + 3x^2 là?", "a": "(0; 2)"},
                ]
            },
            {
                "name": "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
                "questions": [
                    {"q": "Giá trị lớn nhất của hàm số y = x^4 - 2x^2 + 1 trên đoạn [0; 2] là?", "a": "9"},
                ]
            },
            {
                "name": "Đường tiệm cận của đồ thị hàm số",
                "questions": [
                    {"q": "Đồ thị hàm số y = (2x - 1)/(x + 1) có tiệm cận đứng là?", "a": "x = -1"},
                ]
            },
            {
                "name": "Khảo sát sự biến thiên và vẽ đồ thị của hàm số",
                "questions": [
                    {"q": "Số giao điểm của đồ thị hàm số y = x^3 - 3x và đường thẳng y = x là?", "a": "3"},
                    {"q": "Hàm số nào sau đây nghịch biến trên R?", "a": "y = -x^3"},
                    {"q": "Cho hàm số y = f(x) liên tục trên R và có đạo hàm y' = x(x-1). Hàm số đạt cực tiểu tại?", "a": "x = 1"},
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
                    {"q": "Trong không gian, cho hai vectơ u và v cùng phương, điều kiện cần và đủ là?", "a": "Tồn tại số k để u = k.v"},
                    {"q": "Góc giữa hai vectơ vuông góc bằng bao nhiêu độ?", "a": "90 độ"},
                    {"q": "Độ dài của vectơ tổng u + v luôn tuân theo bất đẳng thức nào?", "a": "|u + v| <= |u| + |v|"},
                ]
            },
            {
                "name": "Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)",
                "questions": [
                    {"q": "Trong không gian Oxyz, cho hai điểm A(1; 2; 3) và B(-1; 0; 1). Tọa độ vectơ AB là?", "a": "(-2; -2; -2)"},
                    {"q": "Cho u = (1; 2; 3), v = (0; -1; 1). Tích vô hướng u.v bằng?", "a": "1"},
                    {"q": "Tọa độ trung điểm I của đoạn thẳng AB với A(2; 4; -6) và B(0; 2; 4) là?", "a": "(1; 3; -1)"},
                    {"q": "Tọa độ trọng tâm G của tam giác ABC với A(1;0;0), B(0;1;0), C(0;0;1) là?", "a": "(1/3; 1/3; 1/3)"},
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
                    {"q": "Khoảng biến thiên của mẫu số liệu {2, 5, 8, 10, 15} là?", "a": "13"},
                    {"q": "Khoảng tứ phân vị của mẫu số liệu {1, 3, 5, 7, 9} là?", "a": "4"},
                    {"q": "Đại lượng nào sau đây đo khoảng cách giữa các phần tử cực trị?", "a": "Khoảng biến thiên"},
                ]
            },
            {
                "name": "Phương sai và độ lệch chuẩn",
                "questions": [
                    {"q": "Phương sai của mẫu số liệu {2, 4, 6, 8} là?", "a": "5"},
                    {"q": "Độ lệch chuẩn là gì của phương sai?", "a": "Căn bậc hai"},
                    {"q": "Mẫu số liệu có độ phân tán càng thấp thì độ lệch chuẩn sẽ?", "a": "Càng nhỏ"},
                    {"q": "Độ lệch chuẩn của tập dữ liệu có các phần tử giống hệt nhau là?", "a": "0"},
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
                    {"q": "Nguyên hàm của hàm số f(x) = 2x là?", "a": "x^2 + C"},
                    {"q": "Nguyên hàm của hàm số sin(x) là?", "a": "-cos(x) + C"},
                    {"q": "Nguyên hàm của 1/x trên khoảng (0; +vô cùng) là?", "a": "ln(x) + C"},
                ]
            },
            {
                "name": "Tích phân",
                "questions": [
                    {"q": "Tích phân từ 0 đến 1 của e^x dx bằng?", "a": "e - 1"},
                    {"q": "Tích phân từ 0 đến pi/2 của cos(x) dx là?", "a": "1"},
                ]
            },
            {
                "name": "Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)",
                "questions": [
                    {"q": "Diện tích hình phẳng giới hạn bởi y = x^2, y = 0, x = 0, x = 1 là?", "a": "1/3"},
                    {"q": "Thể tích khối tròn xoay khi quay hình phẳng y = x, y = 0, x = 1 quanh Ox là?", "a": "pi/3"},
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
                    {"q": "Phương trình mặt phẳng (Oxy) là?", "a": "z = 0"},
                    {"q": "Vectơ pháp tuyến của mặt phẳng (P): 2x - y + 3z - 1 = 0 là?", "a": "(2; -1; 3)"},
                    {"q": "Khoảng cách từ điểm M(1; 1; 1) đến mặt phẳng (P): x + y + z - 3 = 0 là?", "a": "0"},
                ]
            },
            {
                "name": "Phương trình đường thẳng trong không gian",
                "questions": [
                    {"q": "Phương trình tham số của đường thẳng đi qua A(1;2;3) và có vtcp u=(1;0;-1) là?", "a": "x=1+t, y=2, z=3-t"},
                    {"q": "Đường thẳng d song song với trục Oz có vectơ chỉ phương là?", "a": "(0; 0; 1)"},
                ]
            },
            {
                "name": "Phương trình mặt cầu",
                "questions": [
                    {"q": "Phương trình mặt cầu tâm I(1; -2; 3) bán kính R=2 là?", "a": "(x-1)^2 + (y+2)^2 + (z-3)^2 = 4"},
                    {"q": "Bán kính của mặt cầu (S): x^2 + y^2 + z^2 - 2x + 4y - 6z = 0 là?", "a": "R = 4"},
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
                    {"q": "Công thức tính xác suất có điều kiện P(A|B) là?", "a": "P(AB)/P(B)"},
                    {"q": "Hai biến cố A và B độc lập khi và chỉ khi?", "a": "P(AB) = P(A)P(B)"},
                    {"q": "Một hộp có 3 bi xanh, 2 bi đỏ. Xác suất lấy 2 bi xanh liên tiếp (không hoàn lại) là?", "a": "3/10"},
                    {"q": "Nếu P(A) = 0.5, P(B|A) = 0.4 thì P(AB) bằng?", "a": "0.2"},
                ]
            },
            {
                "name": "Công thức xác suất toàn phần và công thức Bayes",
                "questions": [
                    {"q": "Công thức Bayes được sử dụng chủ yếu để tính xác suất gì?", "a": "Xác suất hậu nghiệm"},
                    {"q": "Xác suất toàn phần của biến cố B dựa trên hệ đầy đủ A1, A2 là?", "a": "P(A1)P(B|A1) + P(A2)P(B|A2)"},
                    {"q": "Để áp dụng công thức xác suất toàn phần, hệ biến cố A_i cần thỏa mãn điều kiện gì?", "a": "Hệ đầy đủ các biến cố"},
                ]
            }
        ]
    }
]

out = []
out.append("-- =====================================================================")
out.append("-- 0027_seed_toan_cau_hoi.sql")
out.append("-- Seed du lieu chuyen de, bai hoc va cau hoi mau cho mon Toan (Chuan cau truc)")
out.append("-- =====================================================================")
out.append("")
out.append("do $$")
out.append("declare")
out.append("  v_mon_id uuid;")
out.append("  v_cd_id uuid;")
out.append("  v_bh_id uuid;")
out.append("  v_muc_do_1 uuid;")
out.append("  v_cau_hoi_id uuid;")
out.append("begin")
out.append("  -- Fix missing columns in thong_bao_noi_bo (issue from older migrations)")
out.append("  alter table thong_bao_noi_bo add column if not exists duong_dan text;")
out.append("  alter table thong_bao_noi_bo add column if not exists doi_tuong_id uuid;")
out.append("  alter table thong_bao_noi_bo add column if not exists read_at timestamptz;")
out.append("")
out.append("  select mon_id into v_mon_id from mon where ten_mon = 'Toán' limit 1;")
out.append("  if v_mon_id is null then")
out.append("    raise notice 'Môn Toán không tồn tại, bỏ qua seed.';")
out.append("    return;")
out.append("  end if;")
out.append("")
out.append("  select muc_do_id into v_muc_do_1 from muc_do_nhan_thuc where thu_tu = 1 limit 1;")
out.append("")

q_index = 1
for chap in chapters:
    out.append(f"  -- {chap['name']}")
    out.append(f"  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = '{chap['name']}' limit 1;")
    out.append(f"  if v_cd_id is null then")
    out.append(f"    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, '{chap['name']}') returning chuyen_de_id into v_cd_id;")
    out.append(f"  end if;")
    out.append("")

    for les in chap['lessons']:
        out.append(f"  -- {les['name']}")
        out.append(f"  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = '{les['name']}' limit 1;")
        out.append(f"  if v_bh_id is null then")
        out.append(f"    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, '{les['name']}') returning bai_hoc_id into v_bh_id;")
        out.append(f"  end if;")
        out.append("")

        # Bỏ qua phần tạo câu hỏi

out.append("end $$;")
out.append("")

with open(r"d:\Download\notebooklm-mcp-main\skill-for-ba-final\du-an-thi-thu-thpt\webapp\scripts\gen_math.py", "w", encoding="utf-8") as f:
    f.write("")

with open(r"d:\Download\notebooklm-mcp-main\skill-for-ba-final\du-an-thi-thu-thpt\webapp\supabase\migrations\0027_seed_toan_cau_hoi.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
