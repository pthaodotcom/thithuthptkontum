-- Phase 2: approval, question-bank administration and atomic exam creation.
-- Existing migrations are intentionally left immutable.

alter table cau_hoi
  add column if not exists trang_thai_hoat_dong text not null default 'DangHoatDong',
  add column if not exists ly_do_duyet text,
  add column if not exists nguoi_duyet_tai_khoan_id uuid references tai_khoan(tai_khoan_id),
  add column if not exists ngay_duyet timestamptz;

alter table cau_hoi drop constraint if exists chk_cau_hoi_trang_thai_hoat_dong;
alter table cau_hoi add constraint chk_cau_hoi_trang_thai_hoat_dong
  check (trang_thai_hoat_dong in ('DangHoatDong', 'VoHieuHoa'));

alter table yeu_cau_chinh_sua
  add column if not exists ly_do_ket_qua text;

alter table de_thi
  add column if not exists ma_tran jsonb not null default '[]'::jsonb;

create unique index if not exists uq_de_thi_ca_thi_mon_active
  on de_thi(ca_thi_mon_id)
  where trang_thai in ('DangSoan', 'DaGiaoChuaBatDau', 'DangThi');

create index if not exists ix_cau_hoi_pool
  on cau_hoi(bai_hoc_id, phan, muc_do_id, trang_thai_duyet, trang_thai_su_dung, trang_thai_hoat_dong);

create or replace function duyet_cau_hoi_moi(
  p_cau_hoi_id uuid, p_nguoi_duyet_id uuid, p_quyet_dinh text, p_ly_do text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_mon_id uuid; v_to_truong uuid;
begin
  if p_quyet_dinh not in ('DaDuyet', 'TuChoi') then
    raise exception using errcode = '22023', message = 'QUYET_DINH_KHONG_HOP_LE';
  end if;
  if p_quyet_dinh = 'TuChoi' and nullif(trim(p_ly_do), '') is null then
    raise exception using errcode = '22023', message = 'LY_DO_TU_CHOI_BAT_BUOC';
  end if;

  select cd.mon_id into v_mon_id
  from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where ch.cau_hoi_id = p_cau_hoi_id for update of ch;
  select to_truong_tai_khoan_id into v_to_truong from mon where mon_id = v_mon_id;
  if v_to_truong is distinct from p_nguoi_duyet_id then
    raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON';
  end if;

  update cau_hoi set trang_thai_duyet = p_quyet_dinh, ly_do_duyet = nullif(trim(p_ly_do), ''),
    nguoi_duyet_tai_khoan_id = p_nguoi_duyet_id, ngay_duyet = now()
  where cau_hoi_id = p_cau_hoi_id and trang_thai_duyet = 'ChoDuyet';
  if not found then raise exception using errcode = '40001', message = 'CAU_HOI_DA_DUOC_XU_LY'; end if;
end $$;

create or replace function xu_ly_yeu_cau_chinh_sua(
  p_yc_id uuid, p_nguoi_duyet_id uuid, p_quyet_dinh text, p_ly_do text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_yc yeu_cau_chinh_sua%rowtype; v_mon_id uuid; v_to_truong uuid; v_phan text;
begin
  if p_quyet_dinh not in ('DaDuyet', 'TuChoi') then
    raise exception using errcode = '22023', message = 'QUYET_DINH_KHONG_HOP_LE';
  end if;
  if p_quyet_dinh = 'TuChoi' and nullif(trim(p_ly_do), '') is null then
    raise exception using errcode = '22023', message = 'LY_DO_TU_CHOI_BAT_BUOC';
  end if;
  select * into v_yc from yeu_cau_chinh_sua where yc_id = p_yc_id for update;
  if not found or v_yc.trang_thai <> 'ChoDuyet' then
    raise exception using errcode = '40001', message = 'YEU_CAU_DA_DUOC_XU_LY';
  end if;
  select ch.phan, cd.mon_id into v_phan, v_mon_id
  from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id where ch.cau_hoi_id=v_yc.cau_hoi_id
  for update of ch;
  select to_truong_tai_khoan_id into v_to_truong from mon where mon_id=v_mon_id;
  if v_to_truong is distinct from p_nguoi_duyet_id then
    raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON';
  end if;

  if p_quyet_dinh = 'DaDuyet' then
    if not exists (
      select 1 from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id
      where bh.bai_hoc_id=(v_yc.noi_dung_de_xuat->>'bai_hoc_id')::uuid and cd.mon_id=v_mon_id
    ) then raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON'; end if;
    update cau_hoi set
      bai_hoc_id=(v_yc.noi_dung_de_xuat->>'bai_hoc_id')::uuid,
      muc_do_id=(v_yc.noi_dung_de_xuat->>'muc_do_id')::uuid,
      noi_dung=v_yc.noi_dung_de_xuat->>'noi_dung',
      dap_an_phan3=nullif(v_yc.noi_dung_de_xuat->>'dap_an_phan3','')
    where cau_hoi_id=v_yc.cau_hoi_id;
    delete from chi_tiet_cau_hoi where cau_hoi_id=v_yc.cau_hoi_id;
    if v_phan <> 'III' then
      insert into chi_tiet_cau_hoi(cau_hoi_id,thu_tu,noi_dung,la_dap_an_dung)
      select v_yc.cau_hoi_id,(x->>'thu_tu')::smallint,x->>'noi_dung',
        coalesce((x->>'la_dap_an_dung')::boolean,false)
      from jsonb_array_elements(v_yc.noi_dung_de_xuat->'chi_tiet_cau_hoi') x;
    end if;
  end if;
  update yeu_cau_chinh_sua set trang_thai=p_quyet_dinh,
    nguoi_duyet_tai_khoan_id=p_nguoi_duyet_id, ngay_duyet=now(),
    ly_do_ket_qua=nullif(trim(p_ly_do),'') where yc_id=p_yc_id;
end $$;

create or replace function huy_de_dang_soan(p_de_thi_id uuid, p_nguoi_tao_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_count int;
begin
  delete from de_thi where de_thi_id=p_de_thi_id and nguoi_tao_tai_khoan_id=p_nguoi_tao_id
    and trang_thai='DangSoan';
  get diagnostics v_count = row_count;
  if v_count=0 then raise exception using errcode='42501', message='KHONG_THE_HUY_DE'; end if;
end $$;

create or replace function khoa_snapshot_da_giao() returns trigger language plpgsql as $$
begin
  if exists(select 1 from de_thi where de_thi_id=coalesce(old.de_thi_id,new.de_thi_id)
    and trang_thai <> 'DangSoan') then
    raise exception using errcode='55000', message='SNAPSHOT_DA_KHOA';
  end if;
  return coalesce(new,old);
end $$;
drop trigger if exists trg_khoa_cau_hoi_snapshot on cau_hoi_snapshot;
create trigger trg_khoa_cau_hoi_snapshot before update or delete on cau_hoi_snapshot
for each row execute function khoa_snapshot_da_giao();

revoke all on function duyet_cau_hoi_moi(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function xu_ly_yeu_cau_chinh_sua(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function huy_de_dang_soan(uuid,uuid) from public, anon, authenticated;
grant execute on function duyet_cau_hoi_moi(uuid,uuid,text,text) to service_role;
grant execute on function xu_ly_yeu_cau_chinh_sua(uuid,uuid,text,text) to service_role;
grant execute on function huy_de_dang_soan(uuid,uuid) to service_role;
