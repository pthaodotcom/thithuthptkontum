-- =====================================================================
-- 0033_seed_tin_hoc_khung_chuyen_de.sql
-- Seed khung chuyen de va bai hoc chuan cho mon Tin hoc 12 (7 chu de, 28 bai hoc)
-- =====================================================================

do $$
declare
  v_mon_id uuid;
  v_cd_id uuid;
begin
  -- Lay mon_id cua Tin hoc
  select mon_id into v_mon_id from mon where lower(trim(ten_mon)) in ('tin học', 'tin hoc') and trang_thai = 'DangDung' limit 1;

  if v_mon_id is null then
    raise notice 'Môn Tin học không tồn tại hoặc chưa kích hoạt, bỏ qua seed.';
    return;
  end if;

  -- ===================================================================
  -- CHỦ ĐỀ 1: Máy tính và xã hội tri thức
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD1' or lower(trim(ten_chuyen_de)) = 'chủ đề 1: máy tính và xã hội tri thức') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD1', 'Chủ đề 1: Máy tính và xã hội tri thức', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD1', ten_chuyen_de = 'Chủ đề 1: Máy tính và xã hội tri thức', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B1', 'Bài 1: Làm quen với Trí tuệ nhân tạo', 'DangDung'),
    (v_cd_id, 'B2', 'Bài 2: Trí tuệ nhân tạo trong khoa học và đời sống', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 2: Mạng máy tính và internet
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD2' or lower(trim(ten_chuyen_de)) = 'chủ đề 2: mạng máy tính và internet') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD2', 'Chủ đề 2: Mạng máy tính và internet', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD2', ten_chuyen_de = 'Chủ đề 2: Mạng máy tính và internet', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B3', 'Bài 3: Một số thiết bị mạng thông dụng', 'DangDung'),
    (v_cd_id, 'B4', 'Bài 4: Giao thức mạng', 'DangDung'),
    (v_cd_id, 'B5', 'Bài 5: Thực hành chia sẻ tài nguyên trên mạng', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 3: Đạo đức, pháp luật và văn hóa trong môi trường số
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD3' or lower(trim(ten_chuyen_de)) = 'chủ đề 3: đạo đức, pháp luật và văn hóa trong môi trường số') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD3', 'Chủ đề 3: Đạo đức, pháp luật và văn hóa trong môi trường số', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD3', ten_chuyen_de = 'Chủ đề 3: Đạo đức, pháp luật và văn hóa trong môi trường số', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B6', 'Bài 6: Giao tiếp và ứng xử trong không gian mạng', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 4: Giải quyết vấn đề với sự trợ giúp của máy tính
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD4' or lower(trim(ten_chuyen_de)) = 'chủ đề 4: giải quyết vấn đề với sự trợ giúp của máy tính') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD4', 'Chủ đề 4: Giải quyết vấn đề với sự trợ giúp của máy tính', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD4', ten_chuyen_de = 'Chủ đề 4: Giải quyết vấn đề với sự trợ giúp của máy tính', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B7', 'Bài 7: HTML và cấu trúc trang web', 'DangDung'),
    (v_cd_id, 'B8', 'Bài 8: Định dạng văn bản', 'DangDung'),
    (v_cd_id, 'B9', 'Bài 9: Tạo danh sách, bảng', 'DangDung'),
    (v_cd_id, 'B10', 'Bài 10: Tạo liên kết', 'DangDung'),
    (v_cd_id, 'B11', 'Bài 11: Chèn tệp tin đa phương tiện và khung nội tuyến vào trang web', 'DangDung'),
    (v_cd_id, 'B12', 'Bài 12: Tạo biểu mẫu', 'DangDung'),
    (v_cd_id, 'B13', 'Bài 13: Khái niệm, vai trò của CSS', 'DangDung'),
    (v_cd_id, 'B14', 'Bài 14: Định dạng văn bản bằng CSS', 'DangDung'),
    (v_cd_id, 'B15', 'Bài 15: Tạo màu cho chữ và nền', 'DangDung'),
    (v_cd_id, 'B16', 'Bài 16: Định dạng khung', 'DangDung'),
    (v_cd_id, 'B17', 'Bài 17: Các mức ưu tiên của bộ chọn', 'DangDung'),
    (v_cd_id, 'B18', 'Bài 18: Thực hành tổng hợp thiết kế trang web', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 5: Hướng nghiệp với tin học
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD5' or lower(trim(ten_chuyen_de)) = 'chủ đề 5: hướng nghiệp với tin học') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD5', 'Chủ đề 5: Hướng nghiệp với tin học', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD5', ten_chuyen_de = 'Chủ đề 5: Hướng nghiệp với tin học', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B19', 'Bài 19: Dịch vụ sửa chữa và bảo trì máy tính', 'DangDung'),
    (v_cd_id, 'B20', 'Bài 20: Nhóm nghề quản trị thuộc ngành Công nghệ thông tin', 'DangDung'),
    (v_cd_id, 'B21', 'Bài 21: Hội thảo hướng nghiệp', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 6: Máy tính và xã hội tri thức (Kết nối thiết bị số)
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD6' or lower(trim(ten_chuyen_de)) = 'chủ đề 6: máy tính và xã hội tri thức') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD6', 'Chủ đề 6: Máy tính và xã hội tri thức', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD6', ten_chuyen_de = 'Chủ đề 6: Máy tính và xã hội tri thức', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B22', 'Bài 22: Thực hành kết nối các thiết bị số', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHỦ ĐỀ 7: Ứng dụng tin học
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (ma_chuyen_de = 'CD7' or lower(trim(ten_chuyen_de)) = 'chủ đề 7: ứng dụng tin học') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD7', 'Chủ đề 7: Ứng dụng tin học', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD7', ten_chuyen_de = 'Chủ đề 7: Ứng dụng tin học', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B23', 'Bài 23: Chuẩn bị xây dựng trang web', 'DangDung'),
    (v_cd_id, 'B24', 'Bài 24: Xây dựng phần đầu trang web', 'DangDung'),
    (v_cd_id, 'B25', 'Bài 25: Xây dựng phần thân và chân trang web', 'DangDung'),
    (v_cd_id, 'B26', 'Bài 26: Liên kết và thanh điều hướng', 'DangDung'),
    (v_cd_id, 'B27', 'Bài 27: Biểu mẫu trên trang web', 'DangDung'),
    (v_cd_id, 'B28', 'Bài 28: Thực hành tổng hợp', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

end $$;
