-- =====================================================================
-- 0034_seed_tieng_anh_khung_chuyen_de.sql
-- Seed khung chuyên đề và bài học chuẩn cho môn Tiếng Anh 12 (14 chuyên đề / unit, 48 bài học)
-- =====================================================================

do $$
declare
  v_mon_id uuid;
  v_cd_id uuid;
begin
  -- Tìm hoặc khởi tạo môn Tiếng Anh
  select mon_id into v_mon_id from mon where lower(trim(ten_mon)) in ('tiếng anh', 'tieng anh', 'ngoại ngữ', 'ngoai ngu') limit 1;

  if v_mon_id is null then
    insert into mon (
      ten_mon, loai_mon, trang_thai,
      phan1_so_cau, phan1_diem_moi_cau,
      phan2_so_cau, phan2_diem_1y, phan2_diem_2y, phan2_diem_3y, phan2_diem_4y,
      phan3_so_cau, phan3_diem_moi_cau
    ) values (
      'Tiếng Anh', 'TuChon', 'DangDung',
      40, 0.25,
      null, null, null, null, null,
      null, null
    )
    returning mon_id into v_mon_id;
  else
    update mon set 
      ten_mon = 'Tiếng Anh',
      phan1_so_cau = 40,
      phan1_diem_moi_cau = 0.25,
      phan2_so_cau = null,
      phan2_diem_1y = null,
      phan2_diem_2y = null,
      phan2_diem_3y = null,
      phan2_diem_4y = null,
      phan3_so_cau = null,
      phan3_diem_moi_cau = null,
      trang_thai = 'DangDung'
    where mon_id = v_mon_id;
  end if;

  -- ===================================================================
  -- CHUYÊN ĐỀ 1: Unit 1. Life stories we admire
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD1_TA' or lower(trim(ten_chuyen_de)) like '%unit 1%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD1_TA', 'Unit 1: Life stories we admire', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD1_TA', ten_chuyen_de = 'Unit 1: Life stories we admire', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B1_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B2_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B3_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B4_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 2: Unit 2. A multicultural world
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD2_TA' or lower(trim(ten_chuyen_de)) like '%unit 2%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD2_TA', 'Unit 2: A multicultural world', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD2_TA', ten_chuyen_de = 'Unit 2: A multicultural world', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B5_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B6_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B7_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B8_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 3: Unit 3. Green living
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD3_TA' or lower(trim(ten_chuyen_de)) like '%unit 3%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD3_TA', 'Unit 3: Green living', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD3_TA', ten_chuyen_de = 'Unit 3: Green living', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B9_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B10_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B11_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B12_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 4: Review 1
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD4_TA' or lower(trim(ten_chuyen_de)) like '%review 1%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD4_TA', 'Review 1 (Units 1 - 2 - 3)', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD4_TA', ten_chuyen_de = 'Review 1 (Units 1 - 2 - 3)', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B13_TA', 'Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B14_TA', 'Bài 2: Skills Review (Reading, Speaking, Listening, Writing)', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 5: Unit 4. Urbanisation
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD5_TA' or lower(trim(ten_chuyen_de)) like '%unit 4%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD5_TA', 'Unit 4: Urbanisation', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD5_TA', ten_chuyen_de = 'Unit 4: Urbanisation', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B15_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B16_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B17_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B18_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 6: Unit 5. The world of work
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD6_TA' or lower(trim(ten_chuyen_de)) like '%unit 5%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD6_TA', 'Unit 5: The world of work', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD6_TA', ten_chuyen_de = 'Unit 5: The world of work', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B19_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B20_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B21_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B22_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 7: Review 2
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD7_TA' or lower(trim(ten_chuyen_de)) like '%review 2%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD7_TA', 'Review 2 (Units 4 - 5)', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD7_TA', ten_chuyen_de = 'Review 2 (Units 4 - 5)', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B23_TA', 'Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B24_TA', 'Bài 2: Skills Review (Reading, Speaking, Listening, Writing)', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 8: Unit 6. Artificial intelligence
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD8_TA' or lower(trim(ten_chuyen_de)) like '%unit 6%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD8_TA', 'Unit 6: Artificial intelligence', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD8_TA', ten_chuyen_de = 'Unit 6: Artificial intelligence', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B25_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B26_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B27_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B28_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 9: Unit 7. The world of mass media
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD9_TA' or lower(trim(ten_chuyen_de)) like '%unit 7%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD9_TA', 'Unit 7: The world of mass media', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD9_TA', ten_chuyen_de = 'Unit 7: The world of mass media', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B29_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B30_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B31_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B32_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 10: Unit 8. Wildlife conservation
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD10_TA' or lower(trim(ten_chuyen_de)) like '%unit 8%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD10_TA', 'Unit 8: Wildlife conservation', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD10_TA', ten_chuyen_de = 'Unit 8: Wildlife conservation', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B33_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B34_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B35_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B36_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 11: Review 3
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD11_TA' or lower(trim(ten_chuyen_de)) like '%review 3%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD11_TA', 'Review 3 (Units 6 - 7 - 8)', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD11_TA', ten_chuyen_de = 'Review 3 (Units 6 - 7 - 8)', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B37_TA', 'Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B38_TA', 'Bài 2: Skills Review (Reading, Speaking, Listening, Writing)', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 12: Unit 9. Career paths
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD12_TA' or lower(trim(ten_chuyen_de)) like '%unit 9%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD12_TA', 'Unit 9: Career paths', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD12_TA', ten_chuyen_de = 'Unit 9: Career paths', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B39_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B40_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B41_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B42_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 13: Unit 10. Lifelong learning
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD13_TA' or lower(trim(ten_chuyen_de)) like '%unit 10%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD13_TA', 'Unit 10: Lifelong learning', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD13_TA', ten_chuyen_de = 'Unit 10: Lifelong learning', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B43_TA', 'Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B44_TA', 'Bài 2: Reading & Listening Skills', 'DangDung'),
    (v_cd_id, 'B45_TA', 'Bài 3: Speaking & Writing Skills', 'DangDung'),
    (v_cd_id, 'B46_TA', 'Bài 4: Communication and Culture / CLIL & Looking Back', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

  -- ===================================================================
  -- CHUYÊN ĐỀ 14: Review 4
  -- ===================================================================
  select chuyen_de_id into v_cd_id from chuyen_de 
  where mon_id = v_mon_id and (upper(ma_chuyen_de) = 'CD14_TA' or lower(trim(ten_chuyen_de)) like '%review 4%') limit 1;

  if v_cd_id is null then
    insert into chuyen_de (mon_id, ma_chuyen_de, ten_chuyen_de, trang_thai)
    values (v_mon_id, 'CD14_TA', 'Review 4 (Units 9 - 10)', 'DangDung')
    returning chuyen_de_id into v_cd_id;
  else
    update chuyen_de set ma_chuyen_de = 'CD14_TA', ten_chuyen_de = 'Review 4 (Units 9 - 10)', trang_thai = 'DangDung' where chuyen_de_id = v_cd_id;
  end if;

  insert into bai_hoc (chuyen_de_id, ma_bai_hoc, ten_bai_hoc, trang_thai)
  values 
    (v_cd_id, 'B47_TA', 'Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)', 'DangDung'),
    (v_cd_id, 'B48_TA', 'Bài 2: Skills Review (Reading, Speaking, Listening, Writing)', 'DangDung')
  on conflict (chuyen_de_id, upper(ma_bai_hoc)) 
  do update set ten_bai_hoc = excluded.ten_bai_hoc, trang_thai = 'DangDung';

end $$;
