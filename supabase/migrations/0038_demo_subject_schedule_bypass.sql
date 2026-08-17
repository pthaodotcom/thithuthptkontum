-- Cau hinh chi phuc vu chup giao dien va demo san pham. Giao dien quan tri
-- cau hinh theo ca; he thong mo rong mot cau hinh ca thanh cac dong mon trong ca
-- de giu tuong thich voi API va du lieu bai lam hien tai.
-- Release chinh thuc phai dat DEMO_BYPASS_ENABLED=false; khi do ung dung
-- khong doc bang nay va khong hien cong cu cau hinh.

create table if not exists demo_bypass_ca_thi_mon (
  ca_thi_mon_id uuid primary key references ca_thi_mon(id) on delete cascade,
  trang_thai text not null check (trang_thai in ('VaoThi', 'SapDienRa')),
  gio_bat_dau timestamptz not null,
  gio_ket_thuc timestamptz not null,
  ly_do text not null check (char_length(trim(ly_do)) between 5 and 500),
  nguoi_cap_nhat_tai_khoan_id uuid not null references tai_khoan(tai_khoan_id),
  updated_at timestamptz not null default now(),
  constraint demo_bypass_thoi_gian_hop_le check (gio_ket_thuc > gio_bat_dau)
);

alter table demo_bypass_ca_thi_mon enable row level security;

comment on table demo_bypass_ca_thi_mon is
  'Luu cac dong mon duoc sinh dong loat tu cau hinh ca, chi dung khi DEMO_BYPASS_ENABLED=true; service role only.';
