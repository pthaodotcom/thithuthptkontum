-- Run after applying seed_m4_tin_hoc.sql.
begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select is(
  (select count(*)::integer
   from mon
   where ten_mon in (
     'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí',
     'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ',
     'Ngoại ngữ'
   ) and loai_mon = 'TuChon' and trang_thai = 'DangDung'),
  9,
  'all nine canonical electives are active'
);
select is(
  (select count(*)::integer from mon where ten_mon = 'Tin học'),
  1,
  'there is exactly one canonical Informatics subject'
);
select is(
  (select count(*)::integer
   from information_schema.columns
   where table_schema = 'public' and table_name = 'bai_lam_thi'
     and column_name = 'nhom_tin_hoc'),
  0,
  'the obsolete nhom_tin_hoc column was removed'
);

select throws_ok(
  $$insert into tai_khoan(
      ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh, lop_id,
      mon_tu_chon_1_id
    ) values (
      'm4-missing', 'M4 Missing', 'x', 'HocSinh', 2008,
      'a4500000-0000-0000-0000-000000000001',
      (select mon_id from mon where ten_mon = 'Tin học')
    )$$,
  '23514', 'HOC_SINH_PHAI_CHON_DU_HAI_MON',
  'a student must select two electives'
);
select throws_ok(
  $$insert into tai_khoan(
      ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh, lop_id,
      mon_tu_chon_1_id, mon_tu_chon_2_id
    ) select
      'm4-same', 'M4 Same', 'x', 'HocSinh', 2008,
      'a4500000-0000-0000-0000-000000000001', mon_id, mon_id
    from mon where ten_mon = 'Tin học'$$,
  '23514', 'HAI_MON_TU_CHON_PHAI_KHAC_NHAU',
  'two selected subjects cannot be identical'
);

insert into mon(
  mon_id, ten_mon, loai_mon, thu_tu_ca_bat_buoc, trang_thai,
  phan1_so_cau, phan1_diem_moi_cau
) values (
  'a4900000-0000-0000-0000-000000000001',
  'Môn bắt buộc kiểm thử M4', 'BatBuoc', 1, 'NgungDung', 1, 10
);
select throws_ok(
  $$insert into tai_khoan(
      ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh, lop_id,
      mon_tu_chon_1_id, mon_tu_chon_2_id
    ) values (
      'm4-required', 'M4 Required', 'x', 'HocSinh', 2008,
      'a4500000-0000-0000-0000-000000000001',
      'a4900000-0000-0000-0000-000000000001',
      (select mon_id from mon where ten_mon = 'Tin học')
    )$$,
  '23514', 'MON_TU_CHON_KHONG_THUOC_DANH_MUC_CHO_PHEP',
  'a mandatory subject cannot be selected as an elective'
);

update mon set trang_thai = 'NgungDung' where ten_mon = 'Công nghệ';
select throws_ok(
  $$insert into tai_khoan(
      ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh, lop_id,
      mon_tu_chon_1_id, mon_tu_chon_2_id
    ) values (
      'm4-stopped', 'M4 Stopped', 'x', 'HocSinh', 2008,
      'a4500000-0000-0000-0000-000000000001',
      (select mon_id from mon where ten_mon = 'Tin học'),
      (select mon_id from mon where ten_mon = 'Công nghệ')
    )$$,
  '23514', 'MON_TU_CHON_KHONG_THUOC_DANH_MUC_CHO_PHEP',
  'an inactive elective cannot be selected'
);
update mon set trang_thai = 'DangDung' where ten_mon = 'Công nghệ';

select lives_ok(
  $$insert into tai_khoan(
      tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh,
      lop_id, mon_tu_chon_1_id, mon_tu_chon_2_id
    ) values (
      'a4900000-0000-0000-0000-000000000002',
      'm4-valid', 'M4 Valid', 'x', 'HocSinh', 2008,
      'a4500000-0000-0000-0000-000000000001',
      (select mon_id from mon where ten_mon = 'Tin học'),
      (select mon_id from mon where ten_mon = 'Vật lí')
    )$$,
  'two distinct active canonical electives are accepted'
);
select lives_ok(
  $$update tai_khoan
    set mon_tu_chon_2_id = (select mon_id from mon where ten_mon = 'Hóa học')
    where tai_khoan_id = 'a4900000-0000-0000-0000-000000000002'$$,
  'a valid elective update is accepted'
);

select is(
  (select count(*)::integer from cau_hoi q
   join bai_hoc bh on bh.bai_hoc_id = q.bai_hoc_id
   join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
   join mon m on m.mon_id = cd.mon_id
   where m.ten_mon = 'Tin học' and q.phan = 'I'
     and q.cau_hoi_id::text like 'a4100000-%'),
  24,
  'the sample bank has 24 Part I questions'
);
select is(
  (select count(*)::integer from cau_hoi q
   join bai_hoc bh on bh.bai_hoc_id = q.bai_hoc_id
   join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
   join mon m on m.mon_id = cd.mon_id
   where m.ten_mon = 'Tin học' and q.phan = 'II'
     and q.cau_hoi_id::text like 'a4300000-%'),
  4,
  'the sample bank has 4 Part II questions'
);
select is(
  (select count(*)::integer
   from cau_hoi q
   where (q.cau_hoi_id::text like 'a4100000-%'
      or q.cau_hoi_id::text like 'a4300000-%')
   and (select count(*) from chi_tiet_cau_hoi ct
        where ct.cau_hoi_id = q.cau_hoi_id) <> 4),
  0,
  'every sample question has four answer details'
);
select is(
  (select count(*)::integer
   from cau_hoi_snapshot s
   join cau_hoi q on q.cau_hoi_id = s.cau_hoi_goc_id
   where s.de_thi_id = 'a4500000-0000-0000-0000-000000000007'
     and (s.noi_dung, s.phan) is distinct from (q.noi_dung, q.phan)),
  0,
  'exam snapshots match their source questions'
);
select is(
  (select round(
    phan1_so_cau * phan1_diem_moi_cau
    + phan2_so_cau * phan2_diem_4y, 2)
   from de_thi
   where de_thi_id = 'a4500000-0000-0000-0000-000000000007'),
  10.00::numeric,
  'the Informatics exam snapshot totals 10 points'
);

create temporary table m4_audit_before as
select count(*)::integer as n
from audit_log
where hanh_dong = 'NopBai'
  and doi_tuong_id = 'a4500000-0000-0000-0000-000000000008';

insert into tra_loi(
  bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu,
  dap_an_lua_chon_id, dap_an_dung_sai
)
select
  'a4500000-0000-0000-0000-000000000008',
  s.snapshot_id,
  case when s.phan = 'I' then 0 else ct.thu_tu end,
  case when s.phan = 'I' then ct.id end,
  case when s.phan = 'II' then ct.la_dap_an_dung end
from cau_hoi_snapshot s
join chi_tiet_cau_hoi_snapshot ct
  on ct.cau_hoi_snapshot_id = s.snapshot_id
where s.de_thi_id = 'a4500000-0000-0000-0000-000000000007'
  and (s.phan = 'II' or ct.la_dap_an_dung);

create temporary table m4_perfect_result as
select * from nop_va_cham_bai(
  'a4500000-0000-0000-0000-000000000008',
  'a4500000-0000-0000-0000-000000000003',
  'TuNop', false
);
select is((select diem_tong from m4_perfect_result), 10.00::numeric,
  'known perfect answers score 10 points');
select is((select so_cau_dung from m4_perfect_result), 28,
  'known perfect answers mark all 28 questions correct');
select is((select so_cau_sai from m4_perfect_result), 0,
  'known perfect answers mark no question incorrect');
select is(
  (select count(*)::integer from audit_log
   where hanh_dong = 'NopBai'
     and doi_tuong_id = 'a4500000-0000-0000-0000-000000000008')
    - (select n from m4_audit_before),
  1,
  'grading writes exactly one submission audit event'
);

insert into tai_khoan(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh,
  lop_id, mon_tu_chon_1_id, mon_tu_chon_2_id,
  phai_doi_mat_khau, trang_thai
) values (
  'a4900000-0000-0000-0000-000000000003',
  'm4-partial', 'M4 Partial', 'x', 'HocSinh', 2008,
  'a4500000-0000-0000-0000-000000000001',
  (select mon_id from mon where ten_mon = 'Tin học'),
  (select mon_id from mon where ten_mon = 'Vật lí'),
  false, 'HoatDong'
);
insert into bai_lam_thi(
  bai_lam_id, ca_thi_mon_id, hoc_sinh_tai_khoan_id,
  de_thi_id, ma_de_id, trang_thai, thoi_diem_vao_thi
) values (
  'a4900000-0000-0000-0000-000000000004',
  'a4500000-0000-0000-0000-000000000006',
  'a4900000-0000-0000-0000-000000000003',
  'a4500000-0000-0000-0000-000000000007',
  'a4500000-0000-0000-0000-000000000009',
  'DangThi', now()
);

-- All Part I answers are correct. Part II has respectively 1, 2, 3 and
-- 0 correct statements, producing 6 + .10 + .25 + .50 = 6.85.
insert into tra_loi(
  bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu,
  dap_an_lua_chon_id, dap_an_dung_sai
)
select
  'a4900000-0000-0000-0000-000000000004',
  s.snapshot_id, 0, ct.id, null
from cau_hoi_snapshot s
join chi_tiet_cau_hoi_snapshot ct
  on ct.cau_hoi_snapshot_id = s.snapshot_id and ct.la_dap_an_dung
where s.de_thi_id = 'a4500000-0000-0000-0000-000000000007'
  and s.phan = 'I';
insert into tra_loi(
  bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu, dap_an_dung_sai
)
select
  'a4900000-0000-0000-0000-000000000004',
  s.snapshot_id, ct.thu_tu,
  case
    when ct.thu_tu <= mod(
      (substring(s.snapshot_id::text from 25))::integer - 24, 4
    )
    then ct.la_dap_an_dung
    else not ct.la_dap_an_dung
  end
from cau_hoi_snapshot s
join chi_tiet_cau_hoi_snapshot ct
  on ct.cau_hoi_snapshot_id = s.snapshot_id
where s.de_thi_id = 'a4500000-0000-0000-0000-000000000007'
  and s.phan = 'II';

select is(
  (select diem_tong from nop_va_cham_bai(
    'a4900000-0000-0000-0000-000000000004',
    'a4900000-0000-0000-0000-000000000003',
    'TuNop', false
  )),
  6.85::numeric,
  'progressive Part II scoring produces the known partial score'
);

select * from finish();
rollback;
