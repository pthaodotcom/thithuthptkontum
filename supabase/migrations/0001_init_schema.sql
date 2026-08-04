-- =====================================================================
-- 0001_init_schema.sql
-- He thong Thi thu Truc tuyen cap Truong THPT - schema khoi tao (27 bang)
-- Nguon: ../../Thiet_ke_CSDL_Rut_Gon_KhoaLuan.md (ban rut gon 27 bang)
-- Quy uoc: giu ten bang/cot tieng Viet khong dau, snake_case (da chot cung
-- chu du an 2026-07-26). Dung TEXT + CHECK thay vi ENUM de de sua khi cac
-- Open Item trong 3.2_Khung_yeu_cau_chuc_nang.md duoc chot lai.
-- Thu tu tao bang theo dependency graph (khong theo thu tu module M1-M6)
-- de tranh loi FK tham chieu bang chua ton tai.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Trigger dung chung: tu cap nhat cot updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- M1 - Danh muc & cau hinh (FR-M1-01, FR-M1-02, FR-M1-03)
-- =====================================================================

-- FR-M1-02: 4 khung gio co dinh, dieu kien bat buoc truoc khi tao Dot thi dau tien
create table khung_gio_chuan (
  so_thu_tu_ca smallint primary key check (so_thu_tu_ca between 1 and 4),
  gio_bat_dau time not null,
  thoi_luong_phut smallint not null check (thoi_luong_phut > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_khung_gio_chuan_updated_at
  before update on khung_gio_chuan
  for each row execute function set_updated_at();

-- Trigger muc bang: Sang phai ket thuc truoc khi Chieu bat dau trong cung 1 ngay
-- (Ca 1&2 = Ngay 1, Ca 3&4 = Ngay 2). Chay statement-level vi la rang buoc lien-hang.
create or replace function validate_khung_gio_chuan()
returns trigger as $$
declare
  v_sang record;
  v_chieu record;
begin
  select gio_bat_dau, thoi_luong_phut into v_sang from khung_gio_chuan where so_thu_tu_ca = 1;
  select gio_bat_dau, thoi_luong_phut into v_chieu from khung_gio_chuan where so_thu_tu_ca = 2;
  if v_sang is not null and v_chieu is not null
     and (v_sang.gio_bat_dau + (v_sang.thoi_luong_phut || ' minutes')::interval) > v_chieu.gio_bat_dau then
    raise exception 'FR-M1-02: Khung gio Sang Ngay 1 phai ket thuc truoc khi Chieu Ngay 1 bat dau';
  end if;
  select gio_bat_dau, thoi_luong_phut into v_sang from khung_gio_chuan where so_thu_tu_ca = 3;
  select gio_bat_dau, thoi_luong_phut into v_chieu from khung_gio_chuan where so_thu_tu_ca = 4;
  if v_sang is not null and v_chieu is not null
     and (v_sang.gio_bat_dau + (v_sang.thoi_luong_phut || ' minutes')::interval) > v_chieu.gio_bat_dau then
    raise exception 'FR-M1-02: Khung gio Sang Ngay 2 phai ket thuc truoc khi Chieu Ngay 2 bat dau';
  end if;
  return null;
end;
$$ language plpgsql;

create constraint trigger trg_validate_khung_gio_chuan
  after insert or update on khung_gio_chuan
  deferrable initially deferred
  for each row execute function validate_khung_gio_chuan();

-- FR-M1-03: danh muc Lop hoc. Si so KHONG luu rieng - suy ra tu tai_khoan.lop_id.
create table lop (
  lop_id uuid primary key default gen_random_uuid(),
  ten_lop text not null,
  khoi text not null,
  trang_thai text not null default 'HoatDong' check (trang_thai in ('HoatDong', 'NgungHoatDong')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_lop_updated_at
  before update on lop
  for each row execute function set_updated_at();

-- Danh muc muc do nhan thuc (so luong/ten chua chot - xem Open Item #2)
create table muc_do_nhan_thuc (
  muc_do_id uuid primary key default gen_random_uuid(),
  ten_muc text not null unique,
  thu_tu smallint not null unique
);

-- FR-M4-01: "thu muc lon" chua 4 Ca - tao truoc mon/tai_khoan vi khong phu thuoc gi ca
create table dot_thi (
  dot_thi_id uuid primary key default gen_random_uuid(),
  ten_dot_thi text not null,
  nam_hoc text not null check (nam_hoc ~ '^[0-9]{4}-[0-9]{4}$'),
  ngay_thi_1 date not null,
  ngay_thi_2 date not null check (ngay_thi_2 > ngay_thi_1),
  created_at timestamptz not null default now(),
  unique (ten_dot_thi, nam_hoc)
);

-- FR-M1-01: danh muc Mon hoc, kem cau truc de + barem 3 Phan (khong hardcode ten mon)
-- Luu y: to_truong_tai_khoan_id tham chieu tai_khoan, nhung tai_khoan lai tham chieu
-- mon (mon_id, mon_tu_chon_1/2_id) -> quan he vong. Tao cot truoc, ALTER FK sau khi
-- tai_khoan da ton tai (xem cuoi file).
create table mon (
  mon_id uuid primary key default gen_random_uuid(),
  ten_mon text not null unique,
  loai_mon text not null check (loai_mon in ('BatBuoc', 'TuChon')),
  thu_tu_ca_bat_buoc smallint check (thu_tu_ca_bat_buoc in (1, 2)),
  trang_thai text not null default 'DangDung' check (trang_thai in ('DangDung', 'NgungDung')),
  to_truong_tai_khoan_id uuid, -- FK them sau (xem ALTER TABLE cuoi file)
  -- FR-M1-01: cau truc de + barem, trong neu Mon khong co Phan tuong ung
  phan1_so_cau smallint,
  phan1_diem_moi_cau numeric(4, 2),
  phan2_so_cau smallint,
  phan2_diem_1y numeric(4, 2),
  phan2_diem_2y numeric(4, 2),
  phan2_diem_3y numeric(4, 2),
  phan2_diem_4y numeric(4, 2),
  phan3_so_cau smallint,
  phan3_diem_moi_cau numeric(4, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Mon Bat buoc bat buoc phai co thu_tu_ca_bat_buoc; Mon Tu chon thi khong
  constraint chk_mon_thu_tu_ca check (
    (loai_mon = 'BatBuoc' and thu_tu_ca_bat_buoc is not null) or
    (loai_mon = 'TuChon' and thu_tu_ca_bat_buoc is null)
  ),
  -- Cot so_cau va diem_moi_cau phai cung co hoac cung khong (Phan I / Phan III)
  constraint chk_mon_phan1_dong_bo check ((phan1_so_cau is null) = (phan1_diem_moi_cau is null)),
  constraint chk_mon_phan3_dong_bo check ((phan3_so_cau is null) = (phan3_diem_moi_cau is null)),
  constraint chk_mon_phan2_dong_bo check (
    (phan2_so_cau is null and phan2_diem_1y is null and phan2_diem_2y is null and phan2_diem_3y is null and phan2_diem_4y is null)
    or (phan2_so_cau is not null and phan2_diem_1y is not null and phan2_diem_2y is not null and phan2_diem_3y is not null and phan2_diem_4y is not null)
  ),
  -- Thang luy tien Phan II bat buoc tang dan
  constraint chk_mon_phan2_tang_dan check (
    phan2_so_cau is null or (phan2_diem_1y < phan2_diem_2y and phan2_diem_2y < phan2_diem_3y and phan2_diem_3y < phan2_diem_4y)
  ),
  -- FR-M1-01: tong diem toi da cua Mon phai = 10 (Phan II tinh theo muc diem toi da/cau)
  constraint chk_mon_tong_diem_10 check (
    coalesce(phan1_so_cau, 0) * coalesce(phan1_diem_moi_cau, 0)
    + coalesce(phan2_so_cau, 0) * coalesce(phan2_diem_4y, 0)
    + coalesce(phan3_so_cau, 0) * coalesce(phan3_diem_moi_cau, 0)
    = 10
  )
);
create trigger trg_mon_updated_at
  before update on mon
  for each row execute function set_updated_at();

-- Chi 2 Mon "Bat buoc" dang dung, khong trung thu_tu_ca_bat_buoc (FR-M4-01 doc dieu kien nay
-- khi tao Dot thi, nhung chan tai nguon o day cho chac)
create unique index uq_mon_bat_buoc_thu_tu
  on mon (thu_tu_ca_bat_buoc)
  where loai_mon = 'BatBuoc' and trang_thai = 'DangDung';

-- =====================================================================
-- M2 - Nguoi dung & phan quyen (FR-M2-01 .. FR-M2-05)
-- =====================================================================

-- FR-M2-01/02: gop ca 3 vai tro, cot rieng vai tro chi dien khi dung vai tro.
-- Khong co xoa vinh vien - chi Dinh chi (trang_thai).
create table tai_khoan (
  tai_khoan_id uuid primary key default gen_random_uuid(),
  ma_so text not null unique check (char_length(ma_so) between 4 and 20),
  ho_ten text not null check (char_length(ho_ten) <= 100),
  mat_khau_hash text not null,
  vai_tro text not null check (vai_tro in ('Admin', 'GiaoVien', 'HocSinh')),
  -- FR-M2-02: xac thuc
  phai_doi_mat_khau boolean not null default true,
  mat_khau_mac_dinh_het_han_luc timestamptz,
  so_lan_sai_lien_tiep smallint not null default 0,
  khoa_dang_nhap_den timestamptz,
  phien_hien_hanh uuid, -- session id hien hanh, dung de huy phien cu khi dang nhap noi khac (FR-M5-01)
  trang_thai text not null default 'HoatDong' check (trang_thai in ('HoatDong', 'DinhChi')),
  -- nam_sinh dung cho mat khau mac dinh cua moi vai tro; cac cot con lai chi Hoc sinh
  lop_id uuid references lop (lop_id),
  nam_sinh smallint not null check (nam_sinh between 1900 and 2100),
  sdt_zalo_phu_huynh text,
  mon_tu_chon_1_id uuid references mon (mon_id),
  mon_tu_chon_2_id uuid references mon (mon_id),
  -- chi Giao vien (mon phu trach - moi giao vien dung 1 mon, FR-M1-01)
  mon_id uuid references mon (mon_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_tai_khoan_mon_id_chi_giao_vien check (vai_tro = 'GiaoVien' or mon_id is null),
  constraint chk_tai_khoan_truong_hoc_sinh check (
    vai_tro = 'HocSinh' or (
      lop_id is null and sdt_zalo_phu_huynh is null
      and mon_tu_chon_1_id is null and mon_tu_chon_2_id is null
    )
  ),
  constraint chk_tai_khoan_2_mon_tu_chon_khac_nhau check (
    mon_tu_chon_1_id is null or mon_tu_chon_2_id is null or mon_tu_chon_1_id <> mon_tu_chon_2_id
  )
);
create trigger trg_tai_khoan_updated_at
  before update on tai_khoan
  for each row execute function set_updated_at();

-- Gan FK vong tron mon.to_truong_tai_khoan_id -> tai_khoan (tai_khoan da ton tai)
alter table mon
  add constraint fk_mon_to_truong foreign key (to_truong_tai_khoan_id)
  references tai_khoan (tai_khoan_id);

-- FR-M2-04: bang 2 chieu Giao vien - Lop (KHONG co chieu Mon, Mon suy tu tai_khoan.mon_id).
-- Day la can cu DUY NHAT cho quyen xem bao cao cua Giao vien (FR-M6-03).
create table phan_cong_giang_day (
  id uuid primary key default gen_random_uuid(),
  giao_vien_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  lop_id uuid not null references lop (lop_id),
  created_at timestamptz not null default now(),
  unique (giao_vien_tai_khoan_id, lop_id)
);

-- =====================================================================
-- M3 - Ngan hang cau hoi & de thi (FR-M3-01 .. FR-M3-04)
-- =====================================================================

-- FR-M3-01: cay Chuyen de -> Bai hoc cho 1 Mon. Da co cau hoi gan vao thi chi
-- vo hieu hoa, khong xoa (TODO[Open Item #3]: chot lai rang buoc xoa).
create table chuyen_de (
  chuyen_de_id uuid primary key default gen_random_uuid(),
  mon_id uuid not null references mon (mon_id),
  ten_chuyen_de text not null,
  trang_thai text not null default 'DangDung' check (trang_thai in ('DangDung', 'VoHieuHoa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_chuyen_de_updated_at
  before update on chuyen_de
  for each row execute function set_updated_at();

create table bai_hoc (
  bai_hoc_id uuid primary key default gen_random_uuid(),
  chuyen_de_id uuid not null references chuyen_de (chuyen_de_id),
  ten_bai_hoc text not null,
  trang_thai text not null default 'DangDung' check (trang_thai in ('DangDung', 'VoHieuHoa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_bai_hoc_updated_at
  before update on bai_hoc
  for each row execute function set_updated_at();

-- FR-M3-02: cau hoi goc trong ngan hang. Mon suy ra qua bai_hoc -> chuyen_de -> mon.
create table cau_hoi (
  cau_hoi_id uuid primary key default gen_random_uuid(),
  bai_hoc_id uuid not null references bai_hoc (bai_hoc_id),
  phan text not null check (phan in ('I', 'II', 'III')),
  muc_do_id uuid not null references muc_do_nhan_thuc (muc_do_id),
  noi_dung text not null,
  dap_an_phan3 text, -- chuoi 4 ky tu co dinh (0-9, dau tru, dau phay), chi khi phan = 'III'
  nhom_id uuid references cau_hoi (cau_hoi_id), -- tu tham chieu: cau dai dien neu trung y
  trang_thai_duyet text not null default 'ChoDuyet' check (trang_thai_duyet in ('ChoDuyet', 'DaDuyet', 'TuChoi')),
  trang_thai_su_dung text not null default 'ChuaDung' check (trang_thai_su_dung in ('ChuaDung', 'DaDung')),
  nguoi_tao_tai_khoan_id uuid references tai_khoan (tai_khoan_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cau_hoi_dap_an_phan3 check (
    (phan = 'III' and dap_an_phan3 is not null and dap_an_phan3 ~ '^[0-9,-]{4}$')
    or (phan <> 'III' and dap_an_phan3 is null)
  )
);
create trigger trg_cau_hoi_updated_at
  before update on cau_hoi
  for each row execute function set_updated_at();

-- Phan I (4 phuong an) hoac Phan II (4 y Dung/Sai). Phan III khong dung bang nay.
create table chi_tiet_cau_hoi (
  id uuid primary key default gen_random_uuid(),
  cau_hoi_id uuid not null references cau_hoi (cau_hoi_id) on delete cascade,
  thu_tu smallint not null check (thu_tu between 1 and 4),
  noi_dung text not null,
  la_dap_an_dung boolean not null default false,
  unique (cau_hoi_id, thu_tu)
);

-- FR-M3-03: Yeu cau chinh sua - Giao vien khong tu sua cau da duyet
create table yeu_cau_chinh_sua (
  yc_id uuid primary key default gen_random_uuid(),
  cau_hoi_id uuid not null references cau_hoi (cau_hoi_id),
  noi_dung_de_xuat jsonb not null, -- { noi_dung?, chi_tiet_cau_hoi?, dap_an_phan3? }
  nguoi_de_xuat_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  trang_thai text not null default 'ChoDuyet' check (trang_thai in ('ChoDuyet', 'DaDuyet', 'TuChoi')),
  nguoi_duyet_tai_khoan_id uuid references tai_khoan (tai_khoan_id),
  ngay_gui timestamptz not null default now(),
  ngay_duyet timestamptz
);

-- FR-M4-01 (tiep - can trc de_thi): Dot thi lop du thi + 4 Ca
create table dot_thi_lop (
  id uuid primary key default gen_random_uuid(),
  dot_thi_id uuid not null references dot_thi (dot_thi_id) on delete cascade,
  lop_id uuid not null references lop (lop_id),
  unique (dot_thi_id, lop_id)
);

create table ca_thi (
  ca_thi_id uuid primary key default gen_random_uuid(),
  dot_thi_id uuid not null references dot_thi (dot_thi_id) on delete cascade,
  so_thu_tu_ca smallint not null check (so_thu_tu_ca between 1 and 4),
  gio_bat_dau timestamptz not null,
  gio_ket_thuc timestamptz not null check (gio_ket_thuc > gio_bat_dau),
  trang_thai text not null default 'SapDienRa' check (trang_thai in ('SapDienRa', 'DangMo', 'KetThuc')),
  unique (dot_thi_id, so_thu_tu_ca)
);

-- Ca 1/2: dung 1 dong (Mon Bat buoc); Ca 3/4: nhieu dong (nhieu Mon Tu chon song song)
create table ca_thi_mon (
  id uuid primary key default gen_random_uuid(),
  ca_thi_id uuid not null references ca_thi (ca_thi_id) on delete cascade,
  mon_id uuid not null references mon (mon_id),
  unique (ca_thi_id, mon_id)
);

-- FR-M3-04: De thi dung 1 lan - khong tai su dung/nhan ban. Snapshot cau truc+barem
-- cua Mon tai thoi diem tao (khong doc lai mon.* sau nay).
create table de_thi (
  de_thi_id uuid primary key default gen_random_uuid(),
  ca_thi_mon_id uuid not null references ca_thi_mon (id),
  trang_thai text not null default 'DangSoan' check (
    trang_thai in ('DangSoan', 'DaGiaoChuaBatDau', 'DangThi', 'DaThiXong')
  ),
  so_ma_de smallint not null check (so_ma_de between 1 and 4),
  nguoi_tao_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  -- snapshot cau truc + barem cua mon tai thoi diem tao (FR-M3-04)
  phan1_so_cau smallint,
  phan1_diem_moi_cau numeric(4, 2),
  phan2_so_cau smallint,
  phan2_diem_1y numeric(4, 2),
  phan2_diem_2y numeric(4, 2),
  phan2_diem_3y numeric(4, 2),
  phan2_diem_4y numeric(4, 2),
  phan3_so_cau smallint,
  phan3_diem_moi_cau numeric(4, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_de_thi_updated_at
  before update on de_thi
  for each row execute function set_updated_at();

-- Snapshot noi dung cau hoi tai thoi diem boc vao de - tach biet hoan toan khoi cau_hoi goc
create table cau_hoi_snapshot (
  snapshot_id uuid primary key default gen_random_uuid(),
  de_thi_id uuid not null references de_thi (de_thi_id) on delete cascade,
  cau_hoi_goc_id uuid references cau_hoi (cau_hoi_id), -- chi de tra vet, KHONG doc lai de cham diem
  phan text not null check (phan in ('I', 'II', 'III')),
  chuyen_de_id uuid references chuyen_de (chuyen_de_id),
  muc_do_id uuid references muc_do_nhan_thuc (muc_do_id),
  noi_dung text not null,
  dap_an_phan3 text
);

create table chi_tiet_cau_hoi_snapshot (
  id uuid primary key default gen_random_uuid(),
  cau_hoi_snapshot_id uuid not null references cau_hoi_snapshot (snapshot_id) on delete cascade,
  thu_tu smallint not null check (thu_tu between 1 and 4),
  noi_dung text not null,
  la_dap_an_dung boolean not null default false,
  unique (cau_hoi_snapshot_id, thu_tu)
);

-- Ma de nhanh (1-4 ma/de). thu_tu_hien_thi la du lieu hien thi, khong join quan he.
create table ma_de (
  ma_de_id uuid primary key default gen_random_uuid(),
  de_thi_id uuid not null references de_thi (de_thi_id) on delete cascade,
  so_thu_tu_ma smallint not null check (so_thu_tu_ma between 1 and 4),
  thu_tu_hien_thi jsonb not null,
  unique (de_thi_id, so_thu_tu_ma)
);

-- FR-M4-02: log doi mon tu chon (gioi han 48h / 2 lan / vi tri - kiem tra o application layer)
create table log_doi_mon_tu_chon (
  id uuid primary key default gen_random_uuid(),
  hoc_sinh_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  dot_thi_id uuid not null references dot_thi (dot_thi_id),
  vi_tri text not null check (vi_tri in ('TC1', 'TC2')),
  mon_cu_id uuid references mon (mon_id),
  mon_moi_id uuid not null references mon (mon_id),
  thoi_diem timestamptz not null default now()
);

-- =====================================================================
-- M5 - Thuc hien & giam sat ca thi (FR-M5-01 .. FR-M5-04)
-- =====================================================================

-- Vua la danh sach du thi vua la ket qua. 1 dong / hoc sinh / (Ca, Mon).
create table bai_lam_thi (
  bai_lam_id uuid primary key default gen_random_uuid(),
  ca_thi_mon_id uuid not null references ca_thi_mon (id),
  hoc_sinh_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  de_thi_id uuid references de_thi (de_thi_id),
  ma_de_id uuid references ma_de (ma_de_id),
  trang_thai text not null default 'ChuaDangNhap' check (
    trang_thai in (
      'ChuaDangNhap', 'DangThi', 'BiKhoaChoXuLy', 'DaNopBai',
      'VangMat', 'KhongTheDuThi_LoiToChuc'
    )
  ),
  thoi_diem_vao_thi timestamptz,
  thoi_diem_nop timestamptz,
  diem_tong numeric(4, 2),
  so_cau_dung smallint,
  so_cau_sai smallint,
  unique (ca_thi_mon_id, hoc_sinh_tai_khoan_id)
);

-- Cau tra loi cho tung cau/y, dung chung ca 3 Phan
create table tra_loi (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi (bai_lam_id) on delete cascade,
  cau_hoi_snapshot_id uuid not null references cau_hoi_snapshot (snapshot_id),
  chi_tiet_thu_tu smallint not null default 0, -- 0 = Phan I/III (1 dap an); 1-4 = y cua Phan II
  dap_an_lua_chon_id uuid references chi_tiet_cau_hoi_snapshot (id), -- Phan I
  dap_an_dung_sai boolean, -- Phan II
  dap_an_chuoi text, -- Phan III (chuoi 4 ky tu)
  thoi_diem_luu timestamptz not null default now(),
  unique (bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu)
);

create table vi_pham (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi (bai_lam_id) on delete cascade,
  loai_vi_pham text not null check (loai_vi_pham in ('Copy', 'ChuyenTab', 'MatKetNoi')),
  thoi_diem timestamptz not null default now()
);

-- Gom mo khoa vao tre, reset bai thi, va dinh chi (deu la xu ly ngoai le cua Admin)
create table log_xu_ly_ngoai_le (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi (bai_lam_id) on delete cascade,
  loai_xu_ly text not null check (
    loai_xu_ly in ('MoKhoaVaoTre', 'Reset_TiepTuc', 'Reset_LamLai', 'DinhChi')
  ),
  nguoi_thuc_hien_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  ly_do text not null,
  hieu_luc_tu_ca_thi_id uuid references ca_thi (ca_thi_id), -- chi dung khi loai_xu_ly = 'DinhChi'
  thoi_diem timestamptz not null default now()
);

-- =====================================================================
-- M6 - Phan tich & bao cao (FR-M6-01 .. FR-M6-06)
-- =====================================================================

create table nang_luc_hoc_sinh (
  id uuid primary key default gen_random_uuid(),
  hoc_sinh_tai_khoan_id uuid not null references tai_khoan (tai_khoan_id),
  mon_id uuid not null references mon (mon_id),
  nam_hoc text not null check (nam_hoc ~ '^[0-9]{4}-[0-9]{4}$'),
  diem_trung_binh numeric(4, 2) not null,
  cap_nhat_luc timestamptz not null default now(),
  unique (hoc_sinh_tai_khoan_id, mon_id, nam_hoc)
);

create table nhan_xet_ai (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null unique references bai_lam_thi (bai_lam_id) on delete cascade,
  noi_dung text,
  nguon text not null default 'AI' check (nguon in ('AI', 'Fallback')),
  so_lan_thu_lai smallint not null default 0,
  thoi_diem_sinh timestamptz
);

create table zns_log (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi (bai_lam_id) on delete cascade,
  sdt_gui text,
  trang_thai text not null default 'ChoGui' check (
    trang_thai in ('ChoGui', 'DaGui', 'KhongGuiDuoc_ThieuSDT', 'ThatBai_CanXuLyThuCong')
  ),
  so_lan_thu smallint not null default 0,
  thoi_diem_gui_gan_nhat timestamptz
);

-- =====================================================================
-- Bo sung ha tang (KHONG thuoc 27 bang nghiep vu goc) - xem Muc 3 trong
-- ke-hoach-trien-khai-webapp.md: hang doi job cho cac tac vu co SLA/retry
-- (FR-M4-03, FR-M6-01, FR-M6-02, FR-M6-06) ma Vercel serverless khong the
-- tu giu tien trinh nen de cho.
-- =====================================================================
create table job_hang_doi (
  id uuid primary key default gen_random_uuid(),
  loai_job text not null check (
    loai_job in ('kiem_tra_san_sang', 'phan_tich_ket_qua', 'sinh_nhan_xet_ai', 'gui_zns')
  ),
  tham_chieu_id uuid not null,
  trang_thai text not null default 'ChoXuLy' check (
    trang_thai in ('ChoXuLy', 'DangXuLy', 'HoanTat', 'ThatBai')
  ),
  so_lan_thu smallint not null default 0,
  chay_luc timestamptz not null default now(),
  ket_qua jsonb,
  created_at timestamptz not null default now()
);
create index idx_job_hang_doi_chay_luc on job_hang_doi (chay_luc) where trang_thai = 'ChoXuLy';
