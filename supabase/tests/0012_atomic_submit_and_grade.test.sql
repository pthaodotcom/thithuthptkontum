begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into lop(lop_id, ten_lop, khoi)
values ('12000000-0000-0000-0000-000000000001', '12 RPC', '12');

insert into mon(
  mon_id, ten_mon, loai_mon,
  phan1_so_cau, phan1_diem_moi_cau,
  phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
  phan2_diem_3y, phan2_diem_4y,
  phan3_so_cau, phan3_diem_moi_cau
) values (
  '12000000-0000-0000-0000-000000000002', 'Mon test RPC', 'TuChon',
  4, 0.25,
  4, 0.10, 0.25, 0.50, 1.00,
  10, 0.50
);

insert into tai_khoan(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro,
  phai_doi_mat_khau, nam_sinh, mon_id
) values (
  '12000000-0000-0000-0000-000000000003',
  'gv-rpc-001', 'Giao vien RPC', 'not-used', 'GiaoVien',
  false, 1985, '12000000-0000-0000-0000-000000000002'
);

insert into tai_khoan(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro,
  phai_doi_mat_khau, nam_sinh, lop_id,
  mon_tu_chon_1_id, mon_tu_chon_2_id
)
select *
from (values
(
  '12000000-0000-0000-0000-000000000004'::uuid,
  'hs-rpc-001', 'Hoc sinh RPC 1', 'not-used', 'HocSinh',
  false, 2008, '12000000-0000-0000-0000-000000000001'::uuid
),
(
  '12000000-0000-0000-0000-000000000005'::uuid,
  'hs-rpc-002', 'Hoc sinh RPC 2', 'not-used', 'HocSinh',
  false, 2008, '12000000-0000-0000-0000-000000000001'::uuid
)) as student(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro,
  phai_doi_mat_khau, nam_sinh, lop_id
)
cross join lateral (
  select
    (select mon_id from mon where ten_mon = 'Tin học') as mon_tu_chon_1_id,
    (select mon_id from mon where ten_mon = 'Vật lí') as mon_tu_chon_2_id
) electives;

insert into dot_thi(
  dot_thi_id, ten_dot_thi, nam_hoc, ngay_thi_1, ngay_thi_2
) values (
  '12000000-0000-0000-0000-000000000006',
  'Dot test RPC', '2031-2032', '2032-01-01', '2032-01-02'
);

insert into ca_thi(
  ca_thi_id, dot_thi_id, so_thu_tu_ca,
  gio_bat_dau, gio_ket_thuc, trang_thai
) values (
  '12000000-0000-0000-0000-000000000007',
  '12000000-0000-0000-0000-000000000006', 3,
  '2032-01-02 07:00+07', '2032-01-02 08:30+07', 'DangMo'
);

insert into ca_thi_mon(id, ca_thi_id, mon_id)
select
  '12000000-0000-0000-0000-000000000008',
  '12000000-0000-0000-0000-000000000007',
  mon_id
from mon where ten_mon = 'Tin học';

insert into de_thi(
  de_thi_id, ca_thi_mon_id, trang_thai, so_ma_de,
  nguoi_tao_tai_khoan_id,
  phan1_so_cau, phan1_diem_moi_cau,
  phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
  phan2_diem_3y, phan2_diem_4y,
  phan3_so_cau, phan3_diem_moi_cau
) values (
  '12000000-0000-0000-0000-000000000009',
  '12000000-0000-0000-0000-000000000008',
  'DangSoan', 1,
  '12000000-0000-0000-0000-000000000003',
  4, 0.25,
  4, 0.10, 0.25, 0.50, 1.00,
  10, 0.50
);

insert into cau_hoi_snapshot(
  snapshot_id, de_thi_id, phan, noi_dung, dap_an_phan3
) values
(
  '12000000-0000-0000-0000-000000000010',
  '12000000-0000-0000-0000-000000000009',
  'I', 'Cau Phan I', null
),
(
  '12000000-0000-0000-0000-000000000011',
  '12000000-0000-0000-0000-000000000009',
  'II', 'Cau Phan II', null
),
(
  '12000000-0000-0000-0000-000000000012',
  '12000000-0000-0000-0000-000000000009',
  'III', 'Cau Phan III', '1,25'
);

insert into chi_tiet_cau_hoi_snapshot(
  id, cau_hoi_snapshot_id, thu_tu, noi_dung, la_dap_an_dung
)
select
  ('12000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid,
  '12000000-0000-0000-0000-000000000010'::uuid,
  i, 'Lua chon ' || i, i = 2
from generate_series(1, 4) i;

insert into chi_tiet_cau_hoi_snapshot(
  id, cau_hoi_snapshot_id, thu_tu, noi_dung, la_dap_an_dung
)
select
  ('12000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid,
  '12000000-0000-0000-0000-000000000011'::uuid,
  i, 'Y ' || i, i in (1, 3)
from generate_series(1, 4) i;

insert into bai_lam_thi(
  bai_lam_id, ca_thi_mon_id, hoc_sinh_tai_khoan_id,
  de_thi_id, trang_thai, thoi_diem_vao_thi
) values
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000008',
  '12000000-0000-0000-0000-000000000004',
  '12000000-0000-0000-0000-000000000009',
  'DangThi', now()
),
(
  '12000000-0000-0000-0000-000000000014',
  '12000000-0000-0000-0000-000000000008',
  '12000000-0000-0000-0000-000000000005',
  '12000000-0000-0000-0000-000000000009',
  'DangThi', now()
);

insert into tra_loi(
  bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu,
  dap_an_lua_chon_id, dap_an_dung_sai, dap_an_chuoi
) values
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000010',
  0, '12000000-0000-0000-0001-000000000002', null, null
),
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000011',
  1, null, true, null
),
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000011',
  2, null, false, null
),
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000011',
  3, null, true, null
),
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000011',
  4, null, true, null
),
(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000012',
  0, null, null, '1,25'
);

create temporary table ket_qua_lan_dau as
select *
from nop_va_cham_bai(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000004',
  'TuNop',
  false
);

select is(
  (select diem_tong from ket_qua_lan_dau),
  1.25::numeric,
  'grades all three parts from the immutable snapshot'
);
select is(
  (select so_cau_dung from ket_qua_lan_dau),
  2,
  'counts fully correct questions'
);
select is(
  (select so_cau_sai from ket_qua_lan_dau),
  1,
  'counts partially correct Part II as an incorrect question'
);
select is(
  (select da_nop_truoc from ket_qua_lan_dau),
  false,
  'marks the first submission'
);
select is(
  (select trang_thai from bai_lam_thi
    where bai_lam_id = '12000000-0000-0000-0000-000000000013'),
  'DaNopBai',
  'persists the submitted state'
);
select is(
  (select ly_do_nop from bai_lam_thi
    where bai_lam_id = '12000000-0000-0000-0000-000000000013'),
  'TuNop',
  'persists the submission reason'
);
select is(
  (select count(*)::integer from audit_log
    where doi_tuong_id = '12000000-0000-0000-0000-000000000013'
      and hanh_dong = 'NopBai'),
  1,
  'writes exactly one audit entry'
);

create temporary table ket_qua_lap_lai as
select *
from nop_va_cham_bai(
  '12000000-0000-0000-0000-000000000013',
  '12000000-0000-0000-0000-000000000004',
  'TuNop',
  false
);

select is(
  (select da_nop_truoc from ket_qua_lap_lai),
  true,
  'returns an idempotent result for a repeated submission'
);
select is(
  (select thoi_diem_nop from ket_qua_lap_lai),
  (select thoi_diem_nop from ket_qua_lan_dau),
  'does not replace the original submission time'
);
select is(
  (select count(*)::integer from audit_log
    where doi_tuong_id = '12000000-0000-0000-0000-000000000013'
      and hanh_dong = 'NopBai'),
  1,
  'does not duplicate audit entries on replay'
);

select throws_ok(
  $$select * from nop_va_cham_bai(
    '12000000-0000-0000-0000-000000000014',
    '12000000-0000-0000-0000-000000000004',
    'TuNop',
    false
  )$$,
  'P0002',
  'KHONG_TIM_THAY_BAI',
  'does not expose another student attempt'
);

select throws_ok(
  $$select * from nop_va_cham_bai(
    '12000000-0000-0000-0000-000000000014',
    '12000000-0000-0000-0000-000000000005',
    'ViPham',
    false
  )$$,
  '55000',
  'CHUA_DU_VI_PHAM',
  'requires three violations for automatic submission'
);

insert into mon(
  mon_id, ten_mon, loai_mon,
  phan1_so_cau, phan1_diem_moi_cau,
  phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
  phan2_diem_3y, phan2_diem_4y,
  phan3_so_cau, phan3_diem_moi_cau
) values
(
  '12000000-0000-0000-0000-000000000020', 'Mon test RPC 2', 'TuChon',
  4, 0.25, 4, 0.10, 0.25, 0.50, 1.00, 10, 0.50
),
(
  '12000000-0000-0000-0000-000000000021', 'Mon test RPC 3', 'TuChon',
  4, 0.25, 4, 0.10, 0.25, 0.50, 1.00, 10, 0.50
);

insert into tai_khoan(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro,
  phai_doi_mat_khau, nam_sinh, mon_id
) select
  '12000000-0000-0000-0000-000000000022',
  'gv-rpc-002', 'To truong mon moi', 'not-used', 'GiaoVien',
  false, 1985, mon_id
from mon where ten_mon = 'Hóa học';

update mon
set to_truong_tai_khoan_id = '12000000-0000-0000-0000-000000000022'
where ten_mon = 'Hóa học';

update tai_khoan
set mon_tu_chon_1_id = (select mon_id from mon where ten_mon = 'Tin học'),
    mon_tu_chon_2_id = (select mon_id from mon where ten_mon = 'Vật lí')
where tai_khoan_id = '12000000-0000-0000-0000-000000000004';

insert into dot_thi_lop(dot_thi_id, lop_id)
values (
  '12000000-0000-0000-0000-000000000006',
  '12000000-0000-0000-0000-000000000001'
);

update ca_thi
set trang_thai = 'SapDienRa'
where ca_thi_id = '12000000-0000-0000-0000-000000000007';

create temporary table ket_qua_doi_mon as
select *
from doi_mon_tu_chon(
  '12000000-0000-0000-0000-000000000004',
  '12000000-0000-0000-0000-000000000006',
  'TC1',
  (select mon_id from mon where ten_mon = 'Hóa học')
);

select is(
  (select mon_cu_da_co_de from ket_qua_doi_mon),
  true,
  'detects an existing paper for the old subject'
);
select is(
  (select da_giu_lich_su_mon_cu from ket_qua_doi_mon),
  true,
  'reports preserved attempt history for the old subject'
);
select is(
  (select trang_thai from bai_lam_thi
    where bai_lam_id = '12000000-0000-0000-0000-000000000013'),
  'DaNopBai',
  'keeps the submitted old-subject attempt unchanged'
);
select is(
  (select mon_moi_chua_co_de from ket_qua_doi_mon),
  true,
  'allows the change and reports that the new subject has no paper'
);
select is(
  (select count(*)::integer
    from thong_bao_noi_bo
    where nguoi_nhan_tai_khoan_id = '12000000-0000-0000-0000-000000000022'
      and loai = 'MonMoiChuaCoDe'),
  1,
  'notifies the new subject head when paper preparation is needed'
);

insert into tai_khoan(
  tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro,
  phai_doi_mat_khau, nam_sinh
) values (
  '12000000-0000-0000-0000-000000000023',
  'admin-rpc-001', 'Admin RPC', 'not-used', 'Admin',
  false, 1980
);

update tai_khoan
set phien_hien_hanh = '12000000-0000-0000-0000-000000000024'
where tai_khoan_id = '12000000-0000-0000-0000-000000000005';

update ca_thi
set trang_thai = 'DangMo'
where ca_thi_id = '12000000-0000-0000-0000-000000000007';

insert into ca_thi(
  ca_thi_id, dot_thi_id, so_thu_tu_ca,
  gio_bat_dau, gio_ket_thuc, trang_thai
) values (
  '12000000-0000-0000-0000-000000000025',
  '12000000-0000-0000-0000-000000000006', 4,
  '2032-01-02 09:00+07', '2032-01-02 10:30+07', 'SapDienRa'
);

create temporary table ket_qua_dinh_chi as
select *
from cap_nhat_trang_thai_tai_khoan(
  '12000000-0000-0000-0000-000000000005',
  'DinhChi',
  'Vi pham quy che',
  '12000000-0000-0000-0000-000000000023'
);

select is(
  (select trang_thai from bai_lam_thi
    where bai_lam_id = '12000000-0000-0000-0000-000000000014'),
  'DangThi',
  'does not interrupt the active exam attempt'
);
select is(
  (select phien_hien_hanh from tai_khoan
    where tai_khoan_id = '12000000-0000-0000-0000-000000000005'),
  '12000000-0000-0000-0000-000000000024'::uuid,
  'does not invalidate the current login session'
);
select is(
  (select hieu_luc_tu_ca_thi_id from log_xu_ly_ngoai_le
    where bai_lam_id = '12000000-0000-0000-0000-000000000014'
      and loai_xu_ly = 'DinhChi'),
  '12000000-0000-0000-0000-000000000025'::uuid,
  'records the next session as the suspension boundary'
);
select is(
  (select count(*)::integer from audit_log
    where doi_tuong_id = '12000000-0000-0000-0000-000000000005'
      and hanh_dong = 'DinhChiTaiKhoan'),
  1,
  'audits the administrator suspension action'
);

select * from finish();
rollback;
