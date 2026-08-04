-- =====================================================================
-- 0027_seed_toan_cau_hoi.sql
-- Seed du lieu chuyen de, bai hoc va cau hoi mau cho mon Toan (Chuan cau truc)
-- =====================================================================

do $$
declare
  v_mon_id uuid;
  v_cd_id uuid;
  v_bh_id uuid;
  v_muc_do_1 uuid;
  v_cau_hoi_id uuid;
begin
  -- Fix missing columns in thong_bao_noi_bo (issue from older migrations)
  alter table thong_bao_noi_bo add column if not exists duong_dan text;
  alter table thong_bao_noi_bo add column if not exists doi_tuong_id uuid;
  alter table thong_bao_noi_bo add column if not exists read_at timestamptz;

  select mon_id into v_mon_id from mon where ten_mon = 'Toán' limit 1;
  if v_mon_id is null then
    raise notice 'Môn Toán không tồn tại, bỏ qua seed.';
    return;
  end if;

  select muc_do_id into v_muc_do_1 from muc_do_nhan_thuc where thu_tu = 1 limit 1;

  -- Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số') returning chuyen_de_id into v_cd_id;
  end if;

  -- Tính đơn điệu và cực trị của hàm số
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Tính đơn điệu và cực trị của hàm số' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Tính đơn điệu và cực trị của hàm số') returning bai_hoc_id into v_bh_id;
  end if;

  -- Giá trị lớn nhất và giá trị nhỏ nhất của hàm số
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số') returning bai_hoc_id into v_bh_id;
  end if;

  -- Đường tiệm cận của đồ thị hàm số
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Đường tiệm cận của đồ thị hàm số' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Đường tiệm cận của đồ thị hàm số') returning bai_hoc_id into v_bh_id;
  end if;

  -- Khảo sát sự biến thiên và vẽ đồ thị của hàm số
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Khảo sát sự biến thiên và vẽ đồ thị của hàm số' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Khảo sát sự biến thiên và vẽ đồ thị của hàm số') returning bai_hoc_id into v_bh_id;
  end if;

  -- Chương 2: Vectơ và hệ trục tọa độ trong không gian
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 2: Vectơ và hệ trục tọa độ trong không gian' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 2: Vectơ và hệ trục tọa độ trong không gian') returning chuyen_de_id into v_cd_id;
  end if;

  -- Vectơ và các phép toán vectơ trong không gian
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Vectơ và các phép toán vectơ trong không gian' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Vectơ và các phép toán vectơ trong không gian') returning bai_hoc_id into v_bh_id;
  end if;

  -- Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Hệ tọa độ trong không gian (tọa độ của điểm và vectơ)') returning bai_hoc_id into v_bh_id;
  end if;

  -- Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm') returning chuyen_de_id into v_cd_id;
  end if;

  -- Khoảng biến thiên và khoảng tứ phân vị
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Khoảng biến thiên và khoảng tứ phân vị' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Khoảng biến thiên và khoảng tứ phân vị') returning bai_hoc_id into v_bh_id;
  end if;

  -- Phương sai và độ lệch chuẩn
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Phương sai và độ lệch chuẩn' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Phương sai và độ lệch chuẩn') returning bai_hoc_id into v_bh_id;
  end if;

  -- Chương 4: Nguyên hàm và Tích phân
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 4: Nguyên hàm và Tích phân' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 4: Nguyên hàm và Tích phân') returning chuyen_de_id into v_cd_id;
  end if;

  -- Nguyên hàm và các tính chất
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Nguyên hàm và các tính chất' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Nguyên hàm và các tính chất') returning bai_hoc_id into v_bh_id;
  end if;

  -- Tích phân
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Tích phân' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Tích phân') returning bai_hoc_id into v_bh_id;
  end if;

  -- Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Ứng dụng hình học của tích phân (tính diện tích hình phẳng, thể tích khối tròn xoay)') returning bai_hoc_id into v_bh_id;
  end if;

  -- Chương 5: Phương pháp tọa độ trong không gian (Hình học Giải tích)
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 5: Phương pháp tọa độ trong không gian (Hình học Giải tích)' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 5: Phương pháp tọa độ trong không gian (Hình học Giải tích)') returning chuyen_de_id into v_cd_id;
  end if;

  -- Phương trình mặt phẳng
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Phương trình mặt phẳng' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Phương trình mặt phẳng') returning bai_hoc_id into v_bh_id;
  end if;

  -- Phương trình đường thẳng trong không gian
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Phương trình đường thẳng trong không gian' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Phương trình đường thẳng trong không gian') returning bai_hoc_id into v_bh_id;
  end if;

  -- Phương trình mặt cầu
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Phương trình mặt cầu' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Phương trình mặt cầu') returning bai_hoc_id into v_bh_id;
  end if;

  -- Chương 6: Xác suất có điều kiện và các quy tắc tính xác suất
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 6: Xác suất có điều kiện và các quy tắc tính xác suất' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 6: Xác suất có điều kiện và các quy tắc tính xác suất') returning chuyen_de_id into v_cd_id;
  end if;

  -- Xác suất có điều kiện
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Xác suất có điều kiện' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Xác suất có điều kiện') returning bai_hoc_id into v_bh_id;
  end if;

  -- Công thức xác suất toàn phần và công thức Bayes
  select bai_hoc_id into v_bh_id from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Công thức xác suất toàn phần và công thức Bayes' limit 1;
  if v_bh_id is null then
    insert into bai_hoc (chuyen_de_id, ten_bai_hoc) values (v_cd_id, 'Công thức xác suất toàn phần và công thức Bayes') returning bai_hoc_id into v_bh_id;
  end if;

end $$;
