-- UC-BATCH-04: make elective reassignment explicit and observable.
-- Existing exam papers and attempted/submitted work for the old subject are
-- history and must never be deleted. A missing paper for the new subject is an
-- allowed alternative flow and creates an internal notification.

create table if not exists thong_bao_noi_bo (
  id uuid primary key default gen_random_uuid(),
  nguoi_nhan_tai_khoan_id uuid not null references tai_khoan(tai_khoan_id),
  loai text not null,
  tieu_de text not null,
  noi_dung text not null,
  du_lieu jsonb not null default '{}'::jsonb,
  da_doc boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_thong_bao_noi_bo_nguoi_nhan
  on thong_bao_noi_bo(nguoi_nhan_tai_khoan_id, da_doc, created_at desc);

alter table thong_bao_noi_bo enable row level security;

drop policy if exists nguoi_nhan_doc_thong_bao_noi_bo on thong_bao_noi_bo;
create policy nguoi_nhan_doc_thong_bao_noi_bo
  on thong_bao_noi_bo for select
  using (
    nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id()
    or jwt_vai_tro() = 'Admin'
  );

drop policy if exists nguoi_nhan_danh_dau_thong_bao_noi_bo on thong_bao_noi_bo;
create policy nguoi_nhan_danh_dau_thong_bao_noi_bo
  on thong_bao_noi_bo for update
  using (
    nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id()
    or jwt_vai_tro() = 'Admin'
  )
  with check (
    nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id()
    or jwt_vai_tro() = 'Admin'
  );

drop function if exists doi_mon_tu_chon(uuid,uuid,text,uuid);

create function doi_mon_tu_chon(
  p_hoc_sinh_id uuid,
  p_dot_thi_id uuid,
  p_vi_tri text,
  p_mon_moi_id uuid
) returns table(
  mon_moi_chua_co_de boolean,
  da_giu_lich_su_mon_cu boolean,
  mon_cu_da_co_de boolean,
  so_lan_da_doi integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoc_sinh tai_khoan%rowtype;
  v_mon_cu uuid;
  v_ca smallint;
  v_ca_id uuid;
  v_ctm_cu uuid;
  v_ctm_moi uuid;
  v_han timestamptz;
  v_log_id uuid;
  v_to_truong uuid;
  v_mon_moi_chua_co_de boolean := false;
  v_da_giu_lich_su boolean := false;
  v_mon_cu_da_co_de boolean := false;
  v_so_lan integer := 0;
begin
  if p_vi_tri not in ('TC1', 'TC2') then
    raise exception using errcode = '22023', message = 'VI_TRI_TU_CHON_KHONG_HOP_LE';
  end if;

  select *
  into v_hoc_sinh
  from tai_khoan
  where tai_khoan_id = p_hoc_sinh_id
    and vai_tro = 'HocSinh'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'KHONG_TIM_THAY_HOC_SINH';
  end if;

  if not exists (
    select 1
    from mon
    where mon_id = p_mon_moi_id
      and loai_mon = 'TuChon'
      and trang_thai = 'DangDung'
  ) then
    raise exception using errcode = '22023', message = 'MON_TU_CHON_KHONG_HOP_LE';
  end if;

  if not exists (
    select 1
    from dot_thi_lop
    where dot_thi_id = p_dot_thi_id
      and lop_id = v_hoc_sinh.lop_id
  ) then
    raise exception using errcode = '42501', message = 'HOC_SINH_KHONG_THUOC_DOT_THI';
  end if;

  select gio_bat_dau
  into v_han
  from ca_thi
  where dot_thi_id = p_dot_thi_id
    and so_thu_tu_ca = 3;

  if v_han is null then
    raise exception using errcode = 'P0002', message = 'KHONG_TIM_THAY_CA_SANG_NGAY_2';
  end if;
  if now() >= v_han - interval '48 hours' then
    raise exception using errcode = '55000', message = 'DA_QUA_HAN_DOI_MON';
  end if;

  select count(*)::integer
  into v_so_lan
  from log_doi_mon_tu_chon
  where hoc_sinh_tai_khoan_id = p_hoc_sinh_id
    and dot_thi_id = p_dot_thi_id
    and vi_tri = p_vi_tri;

  if v_so_lan >= 2 then
    raise exception using errcode = '55000', message = 'DA_DU_HAI_LAN_DOI_MON';
  end if;

  v_mon_cu := case
    when p_vi_tri = 'TC1' then v_hoc_sinh.mon_tu_chon_1_id
    else v_hoc_sinh.mon_tu_chon_2_id
  end;

  if v_mon_cu = p_mon_moi_id then
    raise exception using errcode = '22023', message = 'MON_MOI_TRUNG_MON_HIEN_TAI';
  end if;
  if (p_vi_tri = 'TC1' and v_hoc_sinh.mon_tu_chon_2_id = p_mon_moi_id)
    or (p_vi_tri = 'TC2' and v_hoc_sinh.mon_tu_chon_1_id = p_mon_moi_id) then
    raise exception using errcode = '22023', message = 'HAI_MON_TU_CHON_PHAI_KHAC_NHAU';
  end if;

  v_ca := case when p_vi_tri = 'TC1' then 3 else 4 end;
  select ca_thi_id
  into v_ca_id
  from ca_thi
  where dot_thi_id = p_dot_thi_id
    and so_thu_tu_ca = v_ca
    and trang_thai = 'SapDienRa'
  for update;

  if v_ca_id is not null and v_mon_cu is not null then
    select id
    into v_ctm_cu
    from ca_thi_mon
    where ca_thi_id = v_ca_id
      and mon_id = v_mon_cu;

    if v_ctm_cu is not null then
      v_mon_cu_da_co_de := exists (
        select 1 from de_thi where ca_thi_mon_id = v_ctm_cu
      );
      v_da_giu_lich_su := exists (
        select 1
        from bai_lam_thi b
        where b.ca_thi_mon_id = v_ctm_cu
          and b.hoc_sinh_tai_khoan_id = p_hoc_sinh_id
          and (
            b.trang_thai <> 'ChuaDangNhap'
            or b.thoi_diem_vao_thi is not null
            or exists (
              select 1 from tra_loi tl where tl.bai_lam_id = b.bai_lam_id
            )
          )
      );
    end if;
  end if;

  update tai_khoan
  set mon_tu_chon_1_id = case
        when p_vi_tri = 'TC1' then p_mon_moi_id else mon_tu_chon_1_id end,
      mon_tu_chon_2_id = case
        when p_vi_tri = 'TC2' then p_mon_moi_id else mon_tu_chon_2_id end
  where tai_khoan_id = p_hoc_sinh_id;

  insert into log_doi_mon_tu_chon(
    hoc_sinh_tai_khoan_id,
    dot_thi_id,
    vi_tri,
    mon_cu_id,
    mon_moi_id
  ) values (
    p_hoc_sinh_id,
    p_dot_thi_id,
    p_vi_tri,
    v_mon_cu,
    p_mon_moi_id
  )
  returning id into v_log_id;

  if v_ca_id is not null then
    insert into ca_thi_mon(ca_thi_id, mon_id)
    values (v_ca_id, p_mon_moi_id)
    on conflict(ca_thi_id, mon_id)
    do update set mon_id = excluded.mon_id
    returning id into v_ctm_moi;

    insert into bai_lam_thi(ca_thi_mon_id, hoc_sinh_tai_khoan_id)
    values (v_ctm_moi, p_hoc_sinh_id)
    on conflict(ca_thi_mon_id, hoc_sinh_tai_khoan_id) do nothing;

    -- Only the disposable eligibility placeholder may be removed. Any attempt,
    -- answer or result for the old subject remains attached to its old paper.
    if v_ctm_cu is not null then
      delete from bai_lam_thi b
      where b.ca_thi_mon_id = v_ctm_cu
        and b.hoc_sinh_tai_khoan_id = p_hoc_sinh_id
        and b.trang_thai = 'ChuaDangNhap'
        and b.thoi_diem_vao_thi is null
        and not exists (
          select 1 from tra_loi tl where tl.bai_lam_id = b.bai_lam_id
        );

      delete from ca_thi_mon cm
      where cm.id = v_ctm_cu
        and not exists (
          select 1 from bai_lam_thi b where b.ca_thi_mon_id = cm.id
        )
        and not exists (
          select 1 from de_thi d where d.ca_thi_mon_id = cm.id
        );
    end if;

    v_mon_moi_chua_co_de := not exists (
      select 1 from de_thi where ca_thi_mon_id = v_ctm_moi
    );
  end if;

  if v_mon_moi_chua_co_de then
    select to_truong_tai_khoan_id
    into v_to_truong
    from mon
    where mon_id = p_mon_moi_id;

    if v_to_truong is not null then
      insert into thong_bao_noi_bo(
        nguoi_nhan_tai_khoan_id,
        loai,
        tieu_de,
        noi_dung,
        du_lieu
      ) values (
        v_to_truong,
        'MonMoiChuaCoDe',
        'Môn mới được chọn chưa có đề thi',
        'Một học sinh vừa đổi sang môn của tổ trong đợt thi sắp tới; cần chuẩn bị đề.',
        jsonb_build_object(
          'log_doi_mon_id', v_log_id,
          'dot_thi_id', p_dot_thi_id,
          'ca_thi_id', v_ca_id,
          'mon_id', p_mon_moi_id
        )
      );
    end if;
  end if;

  insert into audit_log(
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    nguoi_thuc_hien_tai_khoan_id,
    du_lieu
  ) values (
    'DoiMonTuChon',
    'TaiKhoan',
    p_hoc_sinh_id,
    p_hoc_sinh_id,
    jsonb_build_object(
      'dot_thi_id', p_dot_thi_id,
      'vi_tri', p_vi_tri,
      'mon_cu_id', v_mon_cu,
      'mon_moi_id', p_mon_moi_id,
      'mon_cu_da_co_de', v_mon_cu_da_co_de,
      'da_giu_lich_su_mon_cu', v_da_giu_lich_su,
      'mon_moi_chua_co_de', v_mon_moi_chua_co_de
    )
  );

  return query
  select
    v_mon_moi_chua_co_de,
    v_da_giu_lich_su,
    v_mon_cu_da_co_de,
    v_so_lan + 1;
end
$$;

revoke all on function doi_mon_tu_chon(uuid,uuid,text,uuid)
  from public, anon, authenticated;
grant execute on function doi_mon_tu_chon(uuid,uuid,text,uuid)
  to service_role;
