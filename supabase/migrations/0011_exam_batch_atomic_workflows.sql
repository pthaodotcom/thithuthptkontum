-- Atomic workflows for UC-BATCH-02/03/04 and UC-EXAM-03/04.
-- This migration is additive; migrations 0001-0010 remain immutable.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  hanh_dong text not null,
  doi_tuong text not null,
  doi_tuong_id uuid,
  nguoi_thuc_hien_tai_khoan_id uuid references tai_khoan(tai_khoan_id),
  du_lieu jsonb not null default '{}'::jsonb,
  thoi_diem timestamptz not null default now()
);
create index if not exists idx_audit_log_doi_tuong
  on audit_log(doi_tuong, doi_tuong_id, thoi_diem desc);
alter table audit_log enable row level security;
drop policy if exists admin_doc_audit_log on audit_log;
create policy admin_doc_audit_log on audit_log for select using (jwt_vai_tro()='Admin');

-- UC-BATCH-02: only the name and two dates may change. All four sessions
-- must still be upcoming. Subject/student assignments and papers are untouched.
create or replace function cap_nhat_dot_thi(
  p_dot_thi_id uuid,
  p_ten text,
  p_ngay_1 date,
  p_ngay_2 date,
  p_nguoi_thuc_hien_id uuid
) returns void
language plpgsql security definer set search_path=public as $$
declare
  v_ca record;
  v_khung record;
  v_ngay date;
  v_nam_hoc text;
begin
  if nullif(trim(p_ten),'') is null then raise exception 'TEN_DOT_THI_KHONG_HOP_LE'; end if;
  if p_ngay_2 <= p_ngay_1 then raise exception 'NGAY_THI_2_PHAI_SAU_NGAY_THI_1'; end if;

  perform 1 from dot_thi where dot_thi_id=p_dot_thi_id for update;
  if not found then raise exception 'KHONG_TIM_THAY_DOT_THI'; end if;
  if (select count(*) from ca_thi where dot_thi_id=p_dot_thi_id) <> 4 then
    raise exception 'DOT_THI_KHONG_DU_BON_CA';
  end if;
  if exists(select 1 from ca_thi where dot_thi_id=p_dot_thi_id and trang_thai<>'SapDienRa') then
    raise exception 'DOT_THI_DA_MO_KHONG_THE_SUA';
  end if;

  v_nam_hoc:=case when extract(month from p_ngay_1)>=8
    then extract(year from p_ngay_1)::int||'-'||(extract(year from p_ngay_1)::int+1)
    else (extract(year from p_ngay_1)::int-1)||'-'||extract(year from p_ngay_1)::int end;

  update dot_thi set ten_dot_thi=trim(p_ten),nam_hoc=v_nam_hoc,
    ngay_thi_1=p_ngay_1,ngay_thi_2=p_ngay_2
  where dot_thi_id=p_dot_thi_id;

  for v_ca in select ca_thi_id,so_thu_tu_ca from ca_thi where dot_thi_id=p_dot_thi_id loop
    select * into strict v_khung from khung_gio_chuan where so_thu_tu_ca=v_ca.so_thu_tu_ca;
    v_ngay:=case when v_ca.so_thu_tu_ca<=2 then p_ngay_1 else p_ngay_2 end;
    update ca_thi set
      gio_bat_dau=(v_ngay+v_khung.gio_bat_dau)::timestamp at time zone 'Asia/Ho_Chi_Minh',
      gio_ket_thuc=((v_ngay+v_khung.gio_bat_dau)::timestamp+
        make_interval(mins=>v_khung.thoi_luong_phut)) at time zone 'Asia/Ho_Chi_Minh'
    where ca_thi_id=v_ca.ca_thi_id;
  end loop;

  insert into audit_log(hanh_dong,doi_tuong,doi_tuong_id,nguoi_thuc_hien_tai_khoan_id,du_lieu)
  values('CapNhatDotThi','DotThi',p_dot_thi_id,p_nguoi_thuc_hien_id,
    jsonb_build_object('ten',trim(p_ten),'ngay1',p_ngay_1,'ngay2',p_ngay_2));
end $$;

-- UC-BATCH-03: cascade delete is allowed only before any student has entered.
create or replace function xoa_dot_thi(
  p_dot_thi_id uuid,
  p_nguoi_thuc_hien_id uuid
) returns void
language plpgsql security definer set search_path=public as $$
declare v_tom_tat jsonb;
begin
  perform 1 from dot_thi where dot_thi_id=p_dot_thi_id for update;
  if not found then raise exception 'KHONG_TIM_THAY_DOT_THI'; end if;
  if exists(select 1 from ca_thi where dot_thi_id=p_dot_thi_id and trang_thai<>'SapDienRa') then
    raise exception 'DOT_THI_DA_MO_KHONG_THE_XOA';
  end if;
  if exists(
    select 1 from bai_lam_thi b
    join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
    join ca_thi c on c.ca_thi_id=cm.ca_thi_id
    where c.dot_thi_id=p_dot_thi_id
      and (b.thoi_diem_vao_thi is not null or b.trang_thai<>'ChuaDangNhap')
  ) then raise exception 'DA_CO_HOC_SINH_DANG_NHAP'; end if;

  select jsonb_build_object('ten',ten_dot_thi,'nam_hoc',nam_hoc,'ngay1',ngay_thi_1,'ngay2',ngay_thi_2)
    into v_tom_tat from dot_thi where dot_thi_id=p_dot_thi_id;
  insert into audit_log(hanh_dong,doi_tuong,doi_tuong_id,nguoi_thuc_hien_tai_khoan_id,du_lieu)
  values('XoaDotThi','DotThi',p_dot_thi_id,p_nguoi_thuc_hien_id,v_tom_tat);
  delete from bai_lam_thi where ca_thi_mon_id in (
    select cm.id from ca_thi_mon cm join ca_thi c on c.ca_thi_id=cm.ca_thi_id
    where c.dot_thi_id=p_dot_thi_id
  );
  delete from de_thi where ca_thi_mon_id in (
    select cm.id from ca_thi_mon cm join ca_thi c on c.ca_thi_id=cm.ca_thi_id
    where c.dot_thi_id=p_dot_thi_id
  );
  delete from dot_thi where dot_thi_id=p_dot_thi_id;
end $$;

-- Scheduled state machine. Calling it repeatedly is safe.
create or replace function chuyen_trang_thai_ca_tu_dong()
returns table(mo_count integer,ket_thuc_count integer)
language plpgsql security definer set search_path=public as $$
declare v_mo integer; v_ket_thuc integer;
begin
  update ca_thi set trang_thai='KetThuc'
    where trang_thai='DangMo' and gio_ket_thuc<=now();
  get diagnostics v_ket_thuc=row_count;
  update ca_thi set trang_thai='DangMo'
    where trang_thai='SapDienRa' and gio_bat_dau<=now() and gio_ket_thuc>now();
  get diagnostics v_mo=row_count;
  return query select v_mo,v_ket_thuc;
end $$;

-- UC-BATCH-04: updates the student's selection and only upcoming Day-2
-- eligibility. Old attempted/submitted exam history is never deleted.
create or replace function doi_mon_tu_chon(
  p_hoc_sinh_id uuid,
  p_dot_thi_id uuid,
  p_vi_tri text,
  p_mon_moi_id uuid
) returns void
language plpgsql security definer set search_path=public as $$
declare
  v_hoc_sinh tai_khoan%rowtype;
  v_mon_cu uuid;
  v_ca smallint;
  v_ca_id uuid;
  v_ctm_moi uuid;
  v_han timestamptz;
begin
  if p_vi_tri not in ('TC1','TC2') then raise exception 'VI_TRI_TU_CHON_KHONG_HOP_LE'; end if;
  select * into v_hoc_sinh from tai_khoan where tai_khoan_id=p_hoc_sinh_id and vai_tro='HocSinh' for update;
  if not found then raise exception 'KHONG_TIM_THAY_HOC_SINH'; end if;
  if not exists(select 1 from mon where mon_id=p_mon_moi_id and loai_mon='TuChon' and trang_thai='DangDung') then
    raise exception 'MON_TU_CHON_KHONG_HOP_LE';
  end if;
  if not exists(
    select 1 from dot_thi_lop where dot_thi_id=p_dot_thi_id and lop_id=v_hoc_sinh.lop_id
  ) then raise exception 'HOC_SINH_KHONG_THUOC_DOT_THI'; end if;

  select gio_bat_dau into v_han from ca_thi where dot_thi_id=p_dot_thi_id and so_thu_tu_ca=3;
  if v_han is null then raise exception 'KHONG_TIM_THAY_CA_SANG_NGAY_2'; end if;
  if now() >= v_han - interval '48 hours' then raise exception 'DA_QUA_HAN_DOI_MON'; end if;
  if (select count(*) from log_doi_mon_tu_chon
      where hoc_sinh_tai_khoan_id=p_hoc_sinh_id and dot_thi_id=p_dot_thi_id and vi_tri=p_vi_tri) >= 2 then
    raise exception 'DA_DU_HAI_LAN_DOI_MON';
  end if;

  v_mon_cu:=case when p_vi_tri='TC1' then v_hoc_sinh.mon_tu_chon_1_id else v_hoc_sinh.mon_tu_chon_2_id end;
  if v_mon_cu=p_mon_moi_id then raise exception 'MON_MOI_TRUNG_MON_HIEN_TAI'; end if;
  if (p_vi_tri='TC1' and v_hoc_sinh.mon_tu_chon_2_id=p_mon_moi_id)
    or (p_vi_tri='TC2' and v_hoc_sinh.mon_tu_chon_1_id=p_mon_moi_id) then
    raise exception 'HAI_MON_TU_CHON_PHAI_KHAC_NHAU';
  end if;

  update tai_khoan set
    mon_tu_chon_1_id=case when p_vi_tri='TC1' then p_mon_moi_id else mon_tu_chon_1_id end,
    mon_tu_chon_2_id=case when p_vi_tri='TC2' then p_mon_moi_id else mon_tu_chon_2_id end
  where tai_khoan_id=p_hoc_sinh_id;

  insert into log_doi_mon_tu_chon(hoc_sinh_tai_khoan_id,dot_thi_id,vi_tri,mon_cu_id,mon_moi_id)
  values(p_hoc_sinh_id,p_dot_thi_id,p_vi_tri,v_mon_cu,p_mon_moi_id);

  v_ca:=case when p_vi_tri='TC1' then 3 else 4 end;
  select ca_thi_id into v_ca_id from ca_thi
    where dot_thi_id=p_dot_thi_id and so_thu_tu_ca=v_ca and trang_thai='SapDienRa' for update;
  if v_ca_id is not null then
    insert into ca_thi_mon(ca_thi_id,mon_id) values(v_ca_id,p_mon_moi_id)
      on conflict(ca_thi_id,mon_id) do update set mon_id=excluded.mon_id
      returning id into v_ctm_moi;
    insert into bai_lam_thi(ca_thi_mon_id,hoc_sinh_tai_khoan_id)
      values(v_ctm_moi,p_hoc_sinh_id)
      on conflict(ca_thi_mon_id,hoc_sinh_tai_khoan_id) do nothing;
    delete from bai_lam_thi b using ca_thi_mon cm
      where b.ca_thi_mon_id=cm.id and cm.ca_thi_id=v_ca_id and cm.mon_id=v_mon_cu
        and b.hoc_sinh_tai_khoan_id=p_hoc_sinh_id
        and b.trang_thai='ChuaDangNhap' and b.thoi_diem_vao_thi is null;
    delete from ca_thi_mon cm where cm.ca_thi_id=v_ca_id and cm.mon_id=v_mon_cu
      and not exists(select 1 from bai_lam_thi b where b.ca_thi_mon_id=cm.id)
      and not exists(select 1 from de_thi d where d.ca_thi_mon_id=cm.id);
  end if;
end $$;

create or replace function xu_ly_ngoai_le_bai_thi(
  p_bai_lam_id uuid,
  p_loai_xu_ly text,
  p_ly_do text,
  p_nguoi_thuc_hien_id uuid
) returns void
language plpgsql security definer set search_path=public as $$
declare v_bai bai_lam_thi%rowtype; v_ca ca_thi%rowtype;
begin
  if p_loai_xu_ly not in ('MoKhoaVaoTre','Reset_TiepTuc','Reset_LamLai') then
    raise exception 'LOAI_XU_LY_KHONG_HOP_LE';
  end if;
  if nullif(trim(p_ly_do),'') is null then raise exception 'BAT_BUOC_NHAP_LY_DO'; end if;
  select * into v_bai from bai_lam_thi where bai_lam_id=p_bai_lam_id for update;
  if not found then raise exception 'KHONG_TIM_THAY_BAI_LAM'; end if;
  select c.* into v_ca from ca_thi c join ca_thi_mon cm on cm.ca_thi_id=c.ca_thi_id
    where cm.id=v_bai.ca_thi_mon_id;
  if v_ca.trang_thai<>'DangMo' or now()>=v_ca.gio_ket_thuc then raise exception 'CA_THI_KHONG_DANG_MO'; end if;

  if p_loai_xu_ly='MoKhoaVaoTre' then
    if v_bai.trang_thai<>'BiKhoaChoXuLy' then raise exception 'TRANG_THAI_DA_THAY_DOI'; end if;
    update bai_lam_thi set trang_thai='ChuaDangNhap' where bai_lam_id=p_bai_lam_id;
  else
    if (select count(*) from log_xu_ly_ngoai_le where bai_lam_id=p_bai_lam_id
      and loai_xu_ly in ('Reset_TiepTuc','Reset_LamLai')) >= 2 then
      raise exception 'VUOT_QUA_HAI_LAN_RESET';
    end if;
    if p_loai_xu_ly='Reset_LamLai' then delete from tra_loi where bai_lam_id=p_bai_lam_id; end if;
    update bai_lam_thi set trang_thai='DangThi',thoi_diem_nop=null,
      diem_tong=null,so_cau_dung=null,so_cau_sai=null
    where bai_lam_id=p_bai_lam_id;
  end if;

  insert into log_xu_ly_ngoai_le(bai_lam_id,loai_xu_ly,nguoi_thuc_hien_tai_khoan_id,ly_do)
  values(p_bai_lam_id,p_loai_xu_ly,p_nguoi_thuc_hien_id,trim(p_ly_do));
end $$;

-- UC-USER-03: one head per subject. The role remains GiaoVien; authority is
-- derived from mon.to_truong_tai_khoan_id, so replacing the FK demotes the old head.
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
  if exists(select 1 from mon where to_truong_tai_khoan_id=p_giao_vien_id and mon_id<>p_mon_id) then
    raise exception 'GIAO_VIEN_DANG_LA_TO_TRUONG_MON_KHAC';
  end if;
  select to_truong_tai_khoan_id into v_cu from mon where mon_id=p_mon_id;
  update mon set to_truong_tai_khoan_id=p_giao_vien_id where mon_id=p_mon_id;
  insert into audit_log(hanh_dong,doi_tuong,doi_tuong_id,nguoi_thuc_hien_tai_khoan_id,du_lieu)
  values('BoNhiemToTruong','Mon',p_mon_id,p_nguoi_thuc_hien_id,
    jsonb_build_object('to_truong_cu',v_cu,'to_truong_moi',p_giao_vien_id));
end $$;

grant execute on function cap_nhat_dot_thi(uuid,text,date,date,uuid) to service_role;
grant execute on function xoa_dot_thi(uuid,uuid) to service_role;
grant execute on function doi_mon_tu_chon(uuid,uuid,text,uuid) to service_role;
grant execute on function xu_ly_ngoai_le_bai_thi(uuid,text,text,uuid) to service_role;
grant execute on function bo_nhiem_to_truong(uuid,uuid,uuid) to service_role;
grant execute on function chuyen_trang_thai_ca_tu_dong() to service_role;
