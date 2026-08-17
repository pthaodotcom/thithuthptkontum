-- Ho so ca nhan dung chung cho moi vai tro.
-- Cac truong phan quyen, lop/mon va lien he phu huynh van do nha truong quan ly.

alter table tai_khoan
  add column if not exists ngay_sinh date,
  add column if not exists gioi_tinh text,
  add column if not exists email_ca_nhan text,
  add column if not exists so_dien_thoai text,
  add column if not exists dia_chi text;

alter table tai_khoan drop constraint if exists chk_tai_khoan_ngay_sinh;
alter table tai_khoan add constraint chk_tai_khoan_ngay_sinh
  check (ngay_sinh is null or ngay_sinh >= date '1900-01-01');

alter table tai_khoan drop constraint if exists chk_tai_khoan_gioi_tinh;
alter table tai_khoan add constraint chk_tai_khoan_gioi_tinh
  check (gioi_tinh is null or gioi_tinh in ('Nam', 'Nu', 'Khac'));

alter table tai_khoan drop constraint if exists chk_tai_khoan_email_ca_nhan;
alter table tai_khoan add constraint chk_tai_khoan_email_ca_nhan check (
  email_ca_nhan is null or (
    char_length(email_ca_nhan) <= 254
    and email_ca_nhan = lower(trim(email_ca_nhan))
    and email_ca_nhan ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

alter table tai_khoan drop constraint if exists chk_tai_khoan_so_dien_thoai;
alter table tai_khoan add constraint chk_tai_khoan_so_dien_thoai
  check (so_dien_thoai is null or so_dien_thoai ~ '^\+?[0-9]{9,15}$');

alter table tai_khoan drop constraint if exists chk_tai_khoan_dia_chi;
alter table tai_khoan add constraint chk_tai_khoan_dia_chi
  check (dia_chi is null or char_length(dia_chi) <= 255);

comment on column tai_khoan.ngay_sinh is 'Ngay sinh day du; nam_sinh duoc dong bo de duy tri mat khau mac dinh.';
comment on column tai_khoan.gioi_tinh is 'Nam, Nu hoac Khac.';
comment on column tai_khoan.email_ca_nhan is 'Email lien he ca nhan cua chu tai khoan.';
comment on column tai_khoan.so_dien_thoai is 'So dien thoai ca nhan cua chu tai khoan.';
comment on column tai_khoan.dia_chi is 'Dia chi lien he cua chu tai khoan.';
