-- One exam belongs to a (dot_thi, mon) business scope. The existing de_thi row
-- remains anchored to one ca_thi_mon for backward compatibility; all other
-- sessions in the same batch resolve and reuse that exam.
create or replace function tao_va_giao_de_theo_dot(
  p_dot_thi_id uuid,
  p_nguoi_tao_id uuid,
  p_ma_tran jsonb,
  p_cau_hoi_theo_ma jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mon_id uuid;
  v_ca_thi_mon_id uuid;
  v_de_thi_id uuid;
begin
  select mon_id into v_mon_id
  from mon
  where to_truong_tai_khoan_id = p_nguoi_tao_id
    and trang_thai = 'DangDung';

  if v_mon_id is null then
    raise exception using errcode = '42501', message = 'VUOT_PHAM_VI_MON';
  end if;

  if exists (
    select 1
    from de_thi d
    join ca_thi_mon ctm on ctm.id = d.ca_thi_mon_id
    join ca_thi c on c.ca_thi_id = ctm.ca_thi_id
    where c.dot_thi_id = p_dot_thi_id
      and ctm.mon_id = v_mon_id
      and d.trang_thai in ('DangSoan', 'DaGiaoChuaBatDau', 'DangThi')
  ) then
    raise exception using errcode = '23505', message = 'DOT_THI_MON_DA_CO_DE';
  end if;

  select ctm.id into v_ca_thi_mon_id
  from ca_thi_mon ctm
  join ca_thi c on c.ca_thi_id = ctm.ca_thi_id
  where c.dot_thi_id = p_dot_thi_id
    and ctm.mon_id = v_mon_id
    and c.trang_thai = 'SapDienRa'
  order by c.gio_bat_dau
  limit 1
  for update of ctm;

  if v_ca_thi_mon_id is null then
    raise exception using errcode = 'P0002', message = 'DOT_THI_KHONG_CO_LICH_CHO_MON';
  end if;

  select tao_va_giao_de_thi_v2(
    v_ca_thi_mon_id,
    p_nguoi_tao_id,
    p_ma_tran,
    p_cau_hoi_theo_ma
  ) into v_de_thi_id;

  return v_de_thi_id;
end;
$$;

revoke all on function tao_va_giao_de_theo_dot(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function tao_va_giao_de_theo_dot(uuid,uuid,jsonb,jsonb) to service_role;
