-- Tách "Từ chối" (kết thúc) khỏi "Yêu cầu sửa" (giáo viên được sửa và gửi lại).

alter table cau_hoi drop constraint if exists cau_hoi_trang_thai_duyet_check;
alter table cau_hoi add constraint cau_hoi_trang_thai_duyet_check
  check (trang_thai_duyet in ('ChoDuyet', 'DaDuyet', 'TuChoi', 'CanChinhSua'));

create or replace function duyet_cau_hoi_moi(
  p_cau_hoi_id uuid, p_nguoi_duyet_id uuid, p_quyet_dinh text, p_ly_do text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_mon_id uuid; v_to_truong uuid;
begin
  if p_quyet_dinh not in ('DaDuyet', 'TuChoi', 'CanChinhSua') then
    raise exception using errcode = '22023', message = 'QUYET_DINH_KHONG_HOP_LE';
  end if;
  if p_quyet_dinh in ('TuChoi', 'CanChinhSua') and nullif(trim(p_ly_do), '') is null then
    raise exception using errcode = '22023', message = 'LY_DO_XU_LY_BAT_BUOC';
  end if;

  select cd.mon_id into v_mon_id
  from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where ch.cau_hoi_id = p_cau_hoi_id for update of ch;
  select to_truong_tai_khoan_id into v_to_truong from mon where mon_id = v_mon_id;
  if v_to_truong is distinct from p_nguoi_duyet_id then
    raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON';
  end if;

  update cau_hoi set
    trang_thai_duyet = p_quyet_dinh,
    ly_do_duyet = nullif(trim(p_ly_do), ''),
    nguoi_duyet_tai_khoan_id = p_nguoi_duyet_id,
    ngay_duyet = now(),
    updated_at = now()
  where cau_hoi_id = p_cau_hoi_id and trang_thai_duyet = 'ChoDuyet';
  if not found then raise exception using errcode = '40001', message = 'CAU_HOI_DA_DUOC_XU_LY'; end if;
end $$;

create or replace function gui_lai_cau_hoi_can_chinh_sua(
  p_cau_hoi_id uuid,
  p_nguoi_tao_id uuid,
  p_bai_hoc_id uuid,
  p_muc_do_id uuid,
  p_noi_dung text,
  p_dap_an_phan3 text,
  p_chi_tiet jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_phan text; v_mon_id uuid; v_bai_hoc_mon_id uuid;
begin
  select ch.phan, cd.mon_id into v_phan, v_mon_id
  from cau_hoi ch
  join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where ch.cau_hoi_id = p_cau_hoi_id
    and ch.nguoi_tao_tai_khoan_id = p_nguoi_tao_id
    and ch.trang_thai_duyet = 'CanChinhSua'
  for update of ch;
  if not found then raise exception using errcode = '42501', message = 'KHONG_THE_GUI_LAI_CAU_HOI'; end if;

  select cd.mon_id into v_bai_hoc_mon_id
  from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  where bh.bai_hoc_id = p_bai_hoc_id and bh.trang_thai = 'DangDung' and cd.trang_thai = 'DangDung';
  if v_bai_hoc_mon_id is distinct from v_mon_id then
    raise exception using errcode = '42501', message = 'BAI_HOC_KHONG_THUOC_MON';
  end if;
  if not exists (select 1 from muc_do_nhan_thuc where muc_do_id = p_muc_do_id) then
    raise exception using errcode = '22023', message = 'MUC_DO_KHONG_HOP_LE';
  end if;

  update cau_hoi set
    bai_hoc_id = p_bai_hoc_id,
    muc_do_id = p_muc_do_id,
    noi_dung = p_noi_dung,
    dap_an_phan3 = case when v_phan = 'III' then p_dap_an_phan3 else null end,
    trang_thai_duyet = 'ChoDuyet',
    ly_do_duyet = null,
    nguoi_duyet_tai_khoan_id = null,
    ngay_duyet = null,
    updated_at = now()
  where cau_hoi_id = p_cau_hoi_id;

  delete from chi_tiet_cau_hoi where cau_hoi_id = p_cau_hoi_id;
  if v_phan <> 'III' then
    insert into chi_tiet_cau_hoi(cau_hoi_id, thu_tu, noi_dung, la_dap_an_dung)
    select p_cau_hoi_id, ordinality::smallint, x->>'noi_dung', coalesce((x->>'la_dap_an_dung')::boolean, false)
    from jsonb_array_elements(p_chi_tiet) with ordinality as t(x, ordinality);
  end if;
end $$;

revoke all on function gui_lai_cau_hoi_can_chinh_sua(uuid,uuid,uuid,uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function gui_lai_cau_hoi_can_chinh_sua(uuid,uuid,uuid,uuid,text,text,jsonb) to service_role;
