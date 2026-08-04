-- UC-USER-02.EX.2 / UC-EXAM-01.EX.5: suspending a student changes the
-- account state immediately, but never invalidates the session that is
-- currently taking an exam. New logins are blocked by the existing auth flow.

create or replace function cap_nhat_trang_thai_tai_khoan(
  p_tai_khoan_id uuid,
  p_trang_thai text,
  p_ly_do text,
  p_admin_id uuid
) returns table(
  dang_lam_bai boolean,
  hieu_luc_tu_ca_thi_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tai_khoan tai_khoan%rowtype;
  v_bai record;
  v_dang_lam_bai boolean := false;
  v_ca_hieu_luc uuid;
begin
  if not exists (
    select 1
    from tai_khoan
    where tai_khoan_id = p_admin_id
      and vai_tro = 'Admin'
      and trang_thai = 'HoatDong'
  ) then
    raise exception using errcode = '42501', message = 'KHONG_CO_QUYEN';
  end if;

  if p_trang_thai not in ('HoatDong', 'DinhChi') then
    raise exception using errcode = '22023', message = 'TRANG_THAI_KHONG_HOP_LE';
  end if;
  if p_trang_thai = 'DinhChi' and nullif(trim(p_ly_do), '') is null then
    raise exception using errcode = '22023', message = 'LY_DO_LA_BAT_BUOC';
  end if;

  select *
  into v_tai_khoan
  from tai_khoan
  where tai_khoan_id = p_tai_khoan_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'KHONG_TIM_THAY_TAI_KHOAN';
  end if;
  if v_tai_khoan.vai_tro = 'Admin' then
    raise exception using errcode = '42501', message = 'KHONG_THE_DINH_CHI_ADMIN';
  end if;
  if v_tai_khoan.trang_thai = p_trang_thai then
    raise exception using errcode = '55000', message = 'TRANG_THAI_DA_THAY_DOI';
  end if;

  if p_trang_thai = 'DinhChi' and v_tai_khoan.vai_tro = 'HocSinh' then
    select
      b.bai_lam_id,
      c.dot_thi_id,
      c.gio_bat_dau
    into v_bai
    from bai_lam_thi b
    join ca_thi_mon ctm on ctm.id = b.ca_thi_mon_id
    join ca_thi c on c.ca_thi_id = ctm.ca_thi_id
    where b.hoc_sinh_tai_khoan_id = p_tai_khoan_id
      and b.trang_thai = 'DangThi'
      and c.trang_thai = 'DangMo'
    order by b.thoi_diem_vao_thi desc nulls last
    limit 1;

    if found then
      v_dang_lam_bai := true;
      select ca_thi_id
      into v_ca_hieu_luc
      from ca_thi
      where dot_thi_id = v_bai.dot_thi_id
        and gio_bat_dau > v_bai.gio_bat_dau
      order by gio_bat_dau
      limit 1;

      insert into log_xu_ly_ngoai_le(
        bai_lam_id,
        loai_xu_ly,
        nguoi_thuc_hien_tai_khoan_id,
        ly_do,
        hieu_luc_tu_ca_thi_id
      ) values (
        v_bai.bai_lam_id,
        'DinhChi',
        p_admin_id,
        trim(p_ly_do),
        v_ca_hieu_luc
      );
    end if;
  end if;

  -- Do not clear phien_hien_hanh here. The current exam session remains valid;
  -- dangNhap already refuses every future login while this state is DinhChi.
  update tai_khoan
  set trang_thai = p_trang_thai
  where tai_khoan_id = p_tai_khoan_id;

  insert into audit_log(
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    nguoi_thuc_hien_tai_khoan_id,
    du_lieu
  ) values (
    case when p_trang_thai = 'DinhChi'
      then 'DinhChiTaiKhoan' else 'GoDinhChiTaiKhoan' end,
    'TaiKhoan',
    p_tai_khoan_id,
    p_admin_id,
    jsonb_build_object(
      'trang_thai_cu', v_tai_khoan.trang_thai,
      'trang_thai_moi', p_trang_thai,
      'ly_do', nullif(trim(p_ly_do), ''),
      'dang_lam_bai', v_dang_lam_bai,
      'hieu_luc_tu_ca_thi_id', v_ca_hieu_luc
    )
  );

  return query select v_dang_lam_bai, v_ca_hieu_luc;
end
$$;

revoke all on function cap_nhat_trang_thai_tai_khoan(uuid,text,text,uuid)
  from public, anon, authenticated;
grant execute on function cap_nhat_trang_thai_tai_khoan(uuid,text,text,uuid)
  to service_role;
