-- =====================================================================
-- 0003_seed_dev.sql
-- Du lieu mau CHI DUNG cho moi truong dev/test cuc bo - KHONG chay tren
-- Supabase production project. Mat khau mau: "Admin@123".
-- =====================================================================

-- Khung gio chuan (FR-M1-02) - dieu kien bat buoc truoc khi tao Dot thi
insert into khung_gio_chuan (so_thu_tu_ca, gio_bat_dau, thoi_luong_phut) values
  (1, '07:30', 90),
  (2, '13:30', 90),
  (3, '07:30', 90),
  (4, '13:30', 90)
on conflict (so_thu_tu_ca) do nothing;

-- Muc do nhan thuc (TODO[Open Item #2]: xac nhan 3 hay 4 muc - dang seed 4 muc pho bien)
insert into muc_do_nhan_thuc (ten_muc, thu_tu) values
  ('Nhan biet', 1),
  ('Thong hieu', 2),
  ('Van dung', 3),
  ('Van dung cao', 4)
on conflict do nothing;

-- Mon hoc mau (FR-M1-01) - Ngu van (Bat buoc, Ca 1), Toan (Bat buoc, Ca 2), Vat ly (Tu chon)
insert into mon (ten_mon, loai_mon, thu_tu_ca_bat_buoc, phan1_so_cau, phan1_diem_moi_cau, phan2_so_cau, phan2_diem_1y, phan2_diem_2y, phan2_diem_3y, phan2_diem_4y, phan3_so_cau, phan3_diem_moi_cau)
values
  ('Toan', 'BatBuoc', 2, 12, 0.25, 4, 0.1, 0.25, 0.5, 1.0, 6, 0.5),
  ('Vat ly', 'TuChon', null, 18, 0.25, 4, 0.1, 0.25, 0.5, 1.0, 6, 0.25)
on conflict (ten_mon) do nothing;

-- Luu y: Ngu van nam ngoai pham vi cham tu dong (Open Item #1) - vi du nay
-- KHONG seed Ngu van vi cau truc "trac nghiem 3 Phan" khong khop bai tu luan;
-- can quyet dinh cach xu ly truoc khi seed du lieu that.

-- Lop mau
insert into lop (ten_lop, khoi) values ('12A1', '12') on conflict do nothing;

-- Tai khoan Admin mau - mat khau: Admin@123
insert into tai_khoan (ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh, phai_doi_mat_khau)
values ('admin01', 'Quan tri vien mau', '$2a$10$KZ.sArtDBSoK3V8NPnoaMOCH4gSL/UqwhtJSFCI9CI0zh1f8/ZWiy', 'Admin', 1990, false)
on conflict (ma_so) do nothing;
