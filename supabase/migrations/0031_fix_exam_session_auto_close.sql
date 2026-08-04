-- Close every session whose end time has passed, including sessions that never
-- transitioned from SapDienRa because the scheduler was not running at start time.
create or replace function chuyen_trang_thai_ca_tu_dong()
returns table(mo_count integer, ket_thuc_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mo integer;
  v_ket_thuc integer;
begin
  update ca_thi
  set trang_thai = 'KetThuc'
  where trang_thai <> 'KetThuc'
    and gio_ket_thuc <= now();
  get diagnostics v_ket_thuc = row_count;

  update ca_thi
  set trang_thai = 'DangMo'
  where trang_thai = 'SapDienRa'
    and gio_bat_dau <= now()
    and gio_ket_thuc > now();
  get diagnostics v_mo = row_count;

  return query select v_mo, v_ket_thuc;
end;
$$;
