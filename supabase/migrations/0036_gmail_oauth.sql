-- Token OAuth Gmail ma hoa o tang ung dung; khong mo policy RLS cho client.
create table if not exists public.tich_hop_email (
  nha_cung_cap text primary key check (nha_cung_cap in ('gmail-api')),
  email_gui text not null,
  refresh_token_ma_hoa text not null,
  da_ket_noi_luc timestamptz not null default now(),
  cap_nhat_luc timestamptz not null default now()
);

alter table public.tich_hop_email enable row level security;

