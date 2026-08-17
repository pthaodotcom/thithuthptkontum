-- Khi ca that ket thuc, chi danh dau vang mat cac mon khong nam trong lich
-- demo. Cac dong bypass duoc sinh theo ca va se bi xoa khi tra ve lich that.
-- Do bang bypass rong trong release, quy tac release khong thay doi.

create or replace function tao_job_khi_ca_ket_thuc()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.trang_thai is distinct from 'KetThuc' and new.trang_thai = 'KetThuc' then
    insert into job_hang_doi(loai_job, tham_chieu_id, khoa_idempotency)
    values('phan_tich_ket_qua', new.ca_thi_id, 'phan_tich:' || new.ca_thi_id)
    on conflict do nothing;

    update bai_lam_thi b
    set trang_thai = 'VangMat'
    from ca_thi_mon cm
    where cm.ca_thi_id = new.ca_thi_id
      and b.ca_thi_mon_id = cm.id
      and b.trang_thai in ('ChuaDangNhap', 'BiKhoaChoXuLy')
      and not exists (
        select 1
        from demo_bypass_ca_thi_mon demo
        where demo.ca_thi_mon_id = cm.id
      );
  end if;
  return new;
end;
$$;
