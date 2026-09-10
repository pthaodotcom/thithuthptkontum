-- A teacher remains eligible for appointment in their assigned subject even
-- when legacy data still records another department-head appointment. Each
-- subject continues to have exactly one current head via mon.to_truong_tai_khoan_id.
create or replace function bo_nhiem_to_truong(
  p_mon_id uuid,
  p_giao_vien_id uuid,
  p_nguoi_thuc_hien_id uuid
) returns void
language plpgsql security definer set search_path=public as $$
declare v_cu uuid;
begin
  perform 1 from mon where mon_id=p_mon_id for update;
  if not found then raise exception 'KHONG_TIM_THAY_MON'; end if;
  if not exists(select 1 from tai_khoan where tai_khoan_id=p_giao_vien_id
    and vai_tro='GiaoVien' and trang_thai='HoatDong' and mon_id=p_mon_id) then
    raise exception 'GIAO_VIEN_KHONG_THUOC_MON';
  end if;

  select to_truong_tai_khoan_id into v_cu from mon where mon_id=p_mon_id;
  update mon set to_truong_tai_khoan_id=p_giao_vien_id where mon_id=p_mon_id;
  insert into audit_log(hanh_dong,doi_tuong,doi_tuong_id,nguoi_thuc_hien_tai_khoan_id,du_lieu)
  values('BoNhiemToTruong','Mon',p_mon_id,p_nguoi_thuc_hien_id,
    jsonb_build_object('to_truong_cu',v_cu,'to_truong_moi',p_giao_vien_id));
end $$;

grant execute on function bo_nhiem_to_truong(uuid,uuid,uuid) to service_role;
