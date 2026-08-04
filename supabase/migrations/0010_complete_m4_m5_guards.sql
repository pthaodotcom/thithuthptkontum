-- Hoan thien cac chot chan M4/M5 theo khung 22 FR.
-- Migration bo sung; khong thay doi lich su 0001-0009.

alter table bai_lam_thi
  add column if not exists thu_tu_hien_thi jsonb,
  add column if not exists nhom_tin_hoc text check (nhom_tin_hoc in ('KhoaHocMayTinh','TinHocUngDung')),
  add column if not exists ly_do_nop text check (ly_do_nop in ('TuNop','HetGio','ViPham')),
  add column if not exists canh_bao_luu_cuoi boolean not null default false;

alter table job_hang_doi
  add column if not exists bat_dau_xu_ly_luc timestamptz,
  add column if not exists hoan_tat_luc timestamptz,
  add column if not exists khoa_idempotency text;

create unique index if not exists uq_job_hang_doi_idempotency
  on job_hang_doi(khoa_idempotency)
  where khoa_idempotency is not null and trang_thai in ('ChoXuLy','DangXuLy','HoanTat');

alter table zns_log
  add column if not exists han_gui_luc timestamptz,
  add column if not exists ma_loi text,
  add column if not exists chi_tiet_loi text;

create index if not exists idx_zns_log_sdt_thoi_diem
  on zns_log(sdt_gui, thoi_diem_gui_gan_nhat desc)
  where sdt_gui is not null;

-- Mot lop dang co hoc sinh khong duoc xoa am tham.
create or replace function chan_xoa_lop_co_hoc_sinh()
returns trigger language plpgsql as $$
begin
  if exists(select 1 from tai_khoan where lop_id=old.lop_id) then
    raise exception 'LOP_DANG_CO_HOC_SINH';
  end if;
  return old;
end $$;
drop trigger if exists trg_chan_xoa_lop_co_hoc_sinh on lop;
create trigger trg_chan_xoa_lop_co_hoc_sinh
before delete on lop for each row execute function chan_xoa_lop_co_hoc_sinh();

-- Khoa snapshot bat bien da co o 0008; bo sung khoa ma de va danh sach snapshot.
create or replace function khoa_noi_dung_de_da_giao()
returns trigger language plpgsql as $$
declare v_trang_thai text;
begin
  select trang_thai into v_trang_thai
  from de_thi where de_thi_id=coalesce(old.de_thi_id,new.de_thi_id);
  if v_trang_thai <> 'DangSoan' then
    raise exception 'DE_DA_GIAO_KHONG_THE_SUA';
  end if;
  return coalesce(new,old);
end $$;
drop trigger if exists trg_khoa_ma_de_da_giao on ma_de;
create trigger trg_khoa_ma_de_da_giao
before update or delete on ma_de for each row execute function khoa_noi_dung_de_da_giao();

-- Lay job theo transaction, tranh hai cron cung xu ly mot job.
create or replace function nhan_job_hang_doi()
returns setof job_hang_doi
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  select id into v_id
  from job_hang_doi
  where trang_thai='ChoXuLy' and chay_luc<=now()
  order by chay_luc,created_at
  for update skip locked
  limit 1;
  if v_id is null then return; end if;
  return query
    update job_hang_doi
    set trang_thai='DangXuLy',bat_dau_xu_ly_luc=now(),so_lan_thu=so_lan_thu+1
    where id=v_id
    returning *;
end $$;

create or replace function hoan_tat_job_hang_doi(
  p_id uuid,p_thanh_cong boolean,p_ket_qua jsonb,p_chay_lai_luc timestamptz default null
) returns void
language plpgsql security definer set search_path=public as $$
begin
  update job_hang_doi set
    trang_thai=case when p_thanh_cong then 'HoanTat'
                    when p_chay_lai_luc is not null then 'ChoXuLy' else 'ThatBai' end,
    ket_qua=p_ket_qua,
    chay_luc=coalesce(p_chay_lai_luc,chay_luc),
    hoan_tat_luc=case when p_thanh_cong or p_chay_lai_luc is null then now() else null end
  where id=p_id and trang_thai='DangXuLy';
end $$;

-- Dua job phan tich vao hang doi dung mot lan khi Ca ket thuc.
create or replace function tao_job_khi_ca_ket_thuc()
returns trigger language plpgsql as $$
begin
  if old.trang_thai is distinct from 'KetThuc' and new.trang_thai='KetThuc' then
    insert into job_hang_doi(loai_job,tham_chieu_id,khoa_idempotency)
    values('phan_tich_ket_qua',new.ca_thi_id,'phan_tich:'||new.ca_thi_id)
    on conflict do nothing;
    update bai_lam_thi b set trang_thai='VangMat'
    from ca_thi_mon cm
    where cm.ca_thi_id=new.ca_thi_id and b.ca_thi_mon_id=cm.id
      and b.trang_thai in ('ChuaDangNhap','BiKhoaChoXuLy');
  end if;
  return new;
end $$;
drop trigger if exists trg_tao_job_khi_ca_ket_thuc on ca_thi;
create trigger trg_tao_job_khi_ca_ket_thuc
after update of trang_thai on ca_thi for each row execute function tao_job_khi_ca_ket_thuc();

-- Gioi han reset cung tai database.
create or replace function chan_reset_qua_hai_lan()
returns trigger language plpgsql as $$
begin
  if new.loai_xu_ly in ('Reset_TiepTuc','Reset_LamLai') and
     (select count(*) from log_xu_ly_ngoai_le
      where bai_lam_id=new.bai_lam_id
        and loai_xu_ly in ('Reset_TiepTuc','Reset_LamLai')) >= 2 then
    raise exception 'VUOT_QUA_HAI_LAN_RESET';
  end if;
  return new;
end $$;
drop trigger if exists trg_chan_reset_qua_hai_lan on log_xu_ly_ngoai_le;
create trigger trg_chan_reset_qua_hai_lan
before insert on log_xu_ly_ngoai_le for each row execute function chan_reset_qua_hai_lan();

alter table bai_lam_thi enable row level security;
alter table tra_loi enable row level security;
alter table vi_pham enable row level security;
alter table nang_luc_hoc_sinh enable row level security;
alter table nhan_xet_ai enable row level security;
alter table zns_log enable row level security;

drop policy if exists hoc_sinh_doc_bai_cua_minh on bai_lam_thi;
create policy hoc_sinh_doc_bai_cua_minh on bai_lam_thi for select
using (hoc_sinh_tai_khoan_id=jwt_tai_khoan_id() or jwt_vai_tro()='Admin');
drop policy if exists hoc_sinh_doc_tra_loi_cua_minh on tra_loi;
create policy hoc_sinh_doc_tra_loi_cua_minh on tra_loi for select
using (exists(select 1 from bai_lam_thi b where b.bai_lam_id=tra_loi.bai_lam_id and b.hoc_sinh_tai_khoan_id=jwt_tai_khoan_id()) or jwt_vai_tro()='Admin');
drop policy if exists hoc_sinh_doc_vi_pham_cua_minh on vi_pham;
create policy hoc_sinh_doc_vi_pham_cua_minh on vi_pham for select
using (exists(select 1 from bai_lam_thi b where b.bai_lam_id=vi_pham.bai_lam_id and b.hoc_sinh_tai_khoan_id=jwt_tai_khoan_id()) or jwt_vai_tro()='Admin');
drop policy if exists hoc_sinh_doc_nang_luc_cua_minh on nang_luc_hoc_sinh;
create policy hoc_sinh_doc_nang_luc_cua_minh on nang_luc_hoc_sinh for select
using (hoc_sinh_tai_khoan_id=jwt_tai_khoan_id() or jwt_vai_tro()='Admin');

create or replace function tao_dot_thi_day_du(
  p_ten text,p_ngay_1 date,p_ngay_2 date,p_lop_ids uuid[]
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_dot uuid; v_nam_hoc text; v_ca smallint; v_khung record; v_ca_id uuid;
  v_mon record; v_ctm uuid; v_ngay date;
begin
  if array_length(p_lop_ids,1) is null then raise exception 'PHAI_CHON_IT_NHAT_MOT_LOP'; end if;
  if p_ngay_2<=p_ngay_1 then raise exception 'NGAY_THI_2_PHAI_SAU_NGAY_THI_1'; end if;
  if (select count(*) from khung_gio_chuan)<>4 then raise exception 'CHUA_DU_BON_KHUNG_GIO'; end if;
  if (select count(*) from mon where loai_mon='BatBuoc' and trang_thai='DangDung')<>2 then raise exception 'PHAI_CO_DUNG_HAI_MON_BAT_BUOC'; end if;
  v_nam_hoc:=case when extract(month from p_ngay_1)>=8 then extract(year from p_ngay_1)::int||'-'||(extract(year from p_ngay_1)::int+1)
    else (extract(year from p_ngay_1)::int-1)||'-'||extract(year from p_ngay_1)::int end;
  insert into dot_thi(ten_dot_thi,nam_hoc,ngay_thi_1,ngay_thi_2) values(trim(p_ten),v_nam_hoc,p_ngay_1,p_ngay_2) returning dot_thi_id into v_dot;
  insert into dot_thi_lop(dot_thi_id,lop_id) select v_dot,unnest(p_lop_ids);
  for v_ca in 1..4 loop
    select * into v_khung from khung_gio_chuan where so_thu_tu_ca=v_ca;
    v_ngay:=case when v_ca<=2 then p_ngay_1 else p_ngay_2 end;
    insert into ca_thi(dot_thi_id,so_thu_tu_ca,gio_bat_dau,gio_ket_thuc)
    values(v_dot,v_ca,(v_ngay+v_khung.gio_bat_dau)::timestamp at time zone 'Asia/Ho_Chi_Minh',
      ((v_ngay+v_khung.gio_bat_dau)::timestamp+make_interval(mins=>v_khung.thoi_luong_phut)) at time zone 'Asia/Ho_Chi_Minh')
    returning ca_thi_id into v_ca_id;
    if v_ca<=2 then
      for v_mon in select mon_id from mon where loai_mon='BatBuoc' and trang_thai='DangDung' and thu_tu_ca_bat_buoc=v_ca loop
        insert into ca_thi_mon(ca_thi_id,mon_id) values(v_ca_id,v_mon.mon_id) returning id into v_ctm;
        insert into bai_lam_thi(ca_thi_mon_id,hoc_sinh_tai_khoan_id)
        select v_ctm,tai_khoan_id from tai_khoan where vai_tro='HocSinh' and trang_thai='HoatDong' and lop_id=any(p_lop_ids);
      end loop;
    else
      for v_mon in select distinct case when v_ca=3 then mon_tu_chon_1_id else mon_tu_chon_2_id end mon_id
        from tai_khoan where vai_tro='HocSinh' and trang_thai='HoatDong' and lop_id=any(p_lop_ids)
          and case when v_ca=3 then mon_tu_chon_1_id else mon_tu_chon_2_id end is not null loop
        insert into ca_thi_mon(ca_thi_id,mon_id) values(v_ca_id,v_mon.mon_id) returning id into v_ctm;
        insert into bai_lam_thi(ca_thi_mon_id,hoc_sinh_tai_khoan_id)
        select v_ctm,tai_khoan_id from tai_khoan where vai_tro='HocSinh' and trang_thai='HoatDong' and lop_id=any(p_lop_ids)
          and (case when v_ca=3 then mon_tu_chon_1_id else mon_tu_chon_2_id end)=v_mon.mon_id;
      end loop;
    end if;
  end loop;
  return v_dot;
end $$;
