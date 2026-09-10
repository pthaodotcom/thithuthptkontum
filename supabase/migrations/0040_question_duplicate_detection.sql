-- Phát hiện câu hỏi trùng bằng thuật toán văn bản, không gọi LLM/API bên ngoài.
-- Dấu vân đầy đủ giữ nguyên số; mẫu câu thay số bằng <num> để nhận ra biến thể Toán.

create extension if not exists pg_trgm with schema extensions;

create table if not exists cau_hoi_dau_van (
  cau_hoi_id uuid primary key references cau_hoi(cau_hoi_id) on delete cascade,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  noi_dung_chuan_hoa text not null,
  mau_cau_hoi text not null,
  chu_ky_so text not null default '',
  source_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_cau_hoi_dau_van_hash
  on cau_hoi_dau_van(content_hash);
create index if not exists ix_cau_hoi_dau_van_noi_dung_trgm
  on cau_hoi_dau_van using gin(noi_dung_chuan_hoa extensions.gin_trgm_ops);
create index if not exists ix_cau_hoi_dau_van_mau_trgm
  on cau_hoi_dau_van using gin(mau_cau_hoi extensions.gin_trgm_ops);

drop trigger if exists trg_cau_hoi_dau_van_updated_at on cau_hoi_dau_van;
create trigger trg_cau_hoi_dau_van_updated_at
  before update on cau_hoi_dau_van
  for each row execute function set_updated_at();

alter table cau_hoi_dau_van enable row level security;
grant select, insert, update, delete on cau_hoi_dau_van to service_role;

create or replace function tim_cau_hoi_trung(
  p_mon_id uuid,
  p_phan text,
  p_noi_dung_chuan_hoa text,
  p_mau_cau_hoi text,
  p_chu_ky_so text,
  p_content_hash text,
  p_cau_hoi_loai_tru_id uuid default null,
  p_gioi_han integer default 5
) returns table (
  cau_hoi_id uuid,
  noi_dung text,
  phan text,
  nhom_id uuid,
  ten_chuyen_de text,
  ten_bai_hoc text,
  trung_hash boolean,
  cung_mau_chinh_xac boolean,
  chu_ky_so text,
  do_tuong_dong double precision,
  do_tuong_dong_mau double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    ch.cau_hoi_id,
    ch.noi_dung,
    ch.phan,
    ch.nhom_id,
    cd.ten_chuyen_de,
    bh.ten_bai_hoc,
    dv.content_hash = p_content_hash as trung_hash,
    dv.mau_cau_hoi = p_mau_cau_hoi as cung_mau_chinh_xac,
    dv.chu_ky_so,
    case
      when dv.content_hash = p_content_hash then 1::double precision
      else extensions.similarity(dv.noi_dung_chuan_hoa, p_noi_dung_chuan_hoa)::double precision
    end as do_tuong_dong,
    extensions.similarity(dv.mau_cau_hoi, p_mau_cau_hoi)::double precision as do_tuong_dong_mau
  from cau_hoi_dau_van dv
  join cau_hoi ch on ch.cau_hoi_id = dv.cau_hoi_id
  join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where cd.mon_id = p_mon_id
    and ch.phan = p_phan
    and ch.trang_thai_duyet <> 'TuChoi'
    and ch.trang_thai_hoat_dong = 'DangHoatDong'
    and (p_cau_hoi_loai_tru_id is null or ch.cau_hoi_id <> p_cau_hoi_loai_tru_id)
    and (
      dv.content_hash = p_content_hash
      or extensions.similarity(dv.noi_dung_chuan_hoa, p_noi_dung_chuan_hoa) >= 0.30
      or extensions.similarity(dv.mau_cau_hoi, p_mau_cau_hoi) >= 0.45
    )
  order by
    (dv.content_hash = p_content_hash) desc,
    greatest(
      extensions.similarity(dv.noi_dung_chuan_hoa, p_noi_dung_chuan_hoa),
      extensions.similarity(dv.mau_cau_hoi, p_mau_cau_hoi)
    ) desc,
    ch.updated_at desc
  limit least(greatest(coalesce(p_gioi_han, 5), 1), 10);
$$;

create or replace function gan_nhom_cau_hoi_trung(
  p_cau_hoi_id uuid,
  p_cau_hoi_dai_dien_id uuid,
  p_to_truong_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mon_nguon uuid;
  v_mon_dich uuid;
  v_phan_nguon text;
  v_phan_dich text;
  v_to_truong uuid;
  v_nhom_dich uuid;
begin
  select cd.mon_id, ch.phan
    into v_mon_nguon, v_phan_nguon
  from cau_hoi ch
  join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where ch.cau_hoi_id = p_cau_hoi_id
  for update of ch;
  if not found then
    raise exception using errcode = 'P0002', message = 'CAU_HOI_NGUON_KHONG_TON_TAI';
  end if;

  select cd.mon_id, ch.phan, coalesce(ch.nhom_id, ch.cau_hoi_id)
    into v_mon_dich, v_phan_dich, v_nhom_dich
  from cau_hoi ch
  join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where ch.cau_hoi_id = p_cau_hoi_dai_dien_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'CAU_HOI_DAI_DIEN_KHONG_TON_TAI';
  end if;

  select to_truong_tai_khoan_id into v_to_truong from mon where mon_id = v_mon_nguon;
  if v_to_truong is distinct from p_to_truong_id then
    raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON';
  end if;
  if v_mon_nguon is distinct from v_mon_dich or v_phan_nguon is distinct from v_phan_dich then
    raise exception using errcode = '22023', message = 'CAU_HOI_KHONG_CUNG_MON_HOAC_CUNG_PHAN';
  end if;
  if p_cau_hoi_id = p_cau_hoi_dai_dien_id then
    raise exception using errcode = '22023', message = 'KHONG_THE_TU_GAN_NHOM';
  end if;

  -- Nếu câu đích đã thuộc một nhóm thì luôn gán về câu đại diện gốc, không tạo chuỗi nhóm.
  if v_nhom_dich = p_cau_hoi_id then
    return v_nhom_dich;
  end if;
  update cau_hoi set nhom_id = v_nhom_dich where cau_hoi_id = p_cau_hoi_id;
  return v_nhom_dich;
end;
$$;

revoke all on function tim_cau_hoi_trung(uuid,text,text,text,text,text,uuid,integer) from public, anon, authenticated;
revoke all on function gan_nhom_cau_hoi_trung(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function tim_cau_hoi_trung(uuid,text,text,text,text,text,uuid,integer) to service_role;
grant execute on function gan_nhom_cau_hoi_trung(uuid,uuid,uuid) to service_role;
