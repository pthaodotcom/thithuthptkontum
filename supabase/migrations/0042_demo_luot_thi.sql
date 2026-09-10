-- Demo chi ap dung cho tung bai_lam duoc Admin chon. Khong duoc mo rong
-- theo ca_thi_mon, de hoc sinh khong duoc chon van dung lich thi that.

create table if not exists demo_luot_thi (
  demo_luot_thi_id uuid primary key default gen_random_uuid(),
  dot_thi_id uuid not null references dot_thi(dot_thi_id),
  trang_thai text not null default 'DangMo'
    check (trang_thai in ('DangMo','DangXuLy','HoanTat','CanXuLy')),
  ly_do text not null check (char_length(trim(ly_do)) between 5 and 500),
  nguoi_tao_tai_khoan_id uuid not null references tai_khoan(tai_khoan_id),
  created_at timestamptz not null default now(),
  ket_thuc_luc timestamptz
);

-- Giao dien chi theo doi mot luot dang hoat dong de tranh hai nhom demo
-- cung chiem mot bai lam va lam mo trang thai cua nhau.
create unique index if not exists uq_demo_luot_thi_dang_hoat_dong
  on demo_luot_thi ((true))
  where trang_thai in ('DangMo','DangXuLy');

create table if not exists demo_luot_thi_bai_lam (
  demo_luot_thi_id uuid not null references demo_luot_thi(demo_luot_thi_id) on delete cascade,
  bai_lam_id uuid not null references bai_lam_thi(bai_lam_id),
  trang_thai_hien_thi text not null check (trang_thai_hien_thi in ('VaoThi','SapDienRa')),
  gio_bat_dau timestamptz not null,
  gio_ket_thuc timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (demo_luot_thi_id,bai_lam_id),
  constraint demo_luot_thi_bai_lam_thoi_gian_hop_le check (gio_ket_thuc > gio_bat_dau)
);
create index if not exists idx_demo_luot_thi_bai_lam_bai_lam
  on demo_luot_thi_bai_lam(bai_lam_id);

alter table demo_luot_thi enable row level security;
alter table demo_luot_thi_bai_lam enable row level security;

alter table job_hang_doi
  add column if not exists demo_luot_thi_id uuid references demo_luot_thi(demo_luot_thi_id);
create index if not exists idx_job_hang_doi_demo_luot_thi
  on job_hang_doi(demo_luot_thi_id, chay_luc)
  where trang_thai = 'ChoXuLy';

alter table job_hang_doi drop constraint if exists job_hang_doi_loai_job_check;
alter table job_hang_doi add constraint job_hang_doi_loai_job_check check (
  loai_job in ('kiem_tra_san_sang','phan_tich_ket_qua','sinh_nhan_xet_ai',
               'gui_zns','gui_email','thu_lai_nhan_xet_ai',
               'demo_phan_tich','demo_ai','demo_email')
);

-- Phan tich chi danh sach bai demo da ket thuc; khong quet ca thi va do do
-- khong vo tinh tao nhan xet/email cho hoc sinh khong duoc chon.
create or replace function phan_tich_ket_qua_cac_bai(
  p_bai_lam_ids uuid[], p_demo_luot_thi_id uuid
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_so_bai integer;
begin
  if not exists (
    select 1 from demo_luot_thi
    where demo_luot_thi_id=p_demo_luot_thi_id and trang_thai='DangXuLy'
  ) then
    raise exception 'LUOT_DEMO_KHONG_O_TRANG_THAI_XU_LY';
  end if;

  if coalesce(array_length(p_bai_lam_ids,1),0)=0 then
    raise exception 'DANH_SACH_BAI_LAM_TRONG';
  end if;

  if exists (
    select 1 from unnest(p_bai_lam_ids) as x(bai_lam_id)
    where not exists (
      select 1 from demo_luot_thi_bai_lam d
      where d.demo_luot_thi_id=p_demo_luot_thi_id and d.bai_lam_id=x.bai_lam_id
    )
  ) then
    raise exception 'BAI_LAM_KHONG_THUOC_LUOT_DEMO';
  end if;

  insert into phan_tich_chuyen_de(bai_lam_id,chuyen_de_id,so_cau,so_cau_dung,ty_le_dung)
  select b.bai_lam_id,q.chuyen_de_id,count(distinct q.snapshot_id),
    count(distinct q.snapshot_id) filter (where case q.phan
      when 'I' then exists (select 1 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.id=t.dap_an_lua_chon_id where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and c.la_dap_an_dung)
      when 'II' then (select count(*)=4 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.cau_hoi_snapshot_id=t.cau_hoi_snapshot_id and c.thu_tu=t.chi_tiet_thu_tu where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_dung_sai=c.la_dap_an_dung)
      when 'III' then exists (select 1 from tra_loi t where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_chuoi=q.dap_an_phan3)
    end),
    round(100.0 * count(distinct q.snapshot_id) filter (where case q.phan
      when 'I' then exists (select 1 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.id=t.dap_an_lua_chon_id where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and c.la_dap_an_dung)
      when 'II' then (select count(*)=4 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.cau_hoi_snapshot_id=t.cau_hoi_snapshot_id and c.thu_tu=t.chi_tiet_thu_tu where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_dung_sai=c.la_dap_an_dung)
      when 'III' then exists (select 1 from tra_loi t where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_chuoi=q.dap_an_phan3)
    end) / nullif(count(distinct q.snapshot_id),0),2)
  from bai_lam_thi b join cau_hoi_snapshot q on q.de_thi_id=b.de_thi_id
  where b.bai_lam_id=any(p_bai_lam_ids) and b.trang_thai='DaNopBai'
    and b.diem_tong is not null and q.chuyen_de_id is not null
  group by b.bai_lam_id,q.chuyen_de_id
  on conflict (bai_lam_id,chuyen_de_id) do update set
    so_cau=excluded.so_cau,so_cau_dung=excluded.so_cau_dung,ty_le_dung=excluded.ty_le_dung;

  with bai as (
    select b.bai_lam_id,b.hoc_sinh_tai_khoan_id,cm.mon_id,d.nam_hoc
    from bai_lam_thi b join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
    join ca_thi c on c.ca_thi_id=cm.ca_thi_id join dot_thi d on d.dot_thi_id=c.dot_thi_id
    where b.bai_lam_id=any(p_bai_lam_ids) and b.trang_thai='DaNopBai' and b.diem_tong is not null
  )
  insert into nang_luc_hoc_sinh(hoc_sinh_tai_khoan_id,mon_id,nam_hoc,diem_trung_binh,cap_nhat_luc)
  select x.hoc_sinh_tai_khoan_id,x.mon_id,x.nam_hoc,round(avg(bl.diem_tong),2),now()
  from bai x join bai_lam_thi bl on bl.hoc_sinh_tai_khoan_id=x.hoc_sinh_tai_khoan_id
  join ca_thi_mon cm on cm.id=bl.ca_thi_mon_id join ca_thi c on c.ca_thi_id=cm.ca_thi_id
  join dot_thi d on d.dot_thi_id=c.dot_thi_id
  where bl.trang_thai='DaNopBai' and bl.diem_tong is not null and cm.mon_id=x.mon_id and d.nam_hoc=x.nam_hoc
  group by x.hoc_sinh_tai_khoan_id,x.mon_id,x.nam_hoc
  on conflict (hoc_sinh_tai_khoan_id,mon_id,nam_hoc) do update set
    diem_trung_binh=excluded.diem_trung_binh,cap_nhat_luc=now();

  insert into job_hang_doi(loai_job,tham_chieu_id,demo_luot_thi_id,khoa_idempotency)
  select 'demo_ai',b.bai_lam_id,p_demo_luot_thi_id,
    'demo:'||p_demo_luot_thi_id||':ai:'||b.bai_lam_id
  from bai_lam_thi b
  where b.bai_lam_id=any(p_bai_lam_ids) and b.trang_thai='DaNopBai' and b.diem_tong is not null
  on conflict do nothing;
  get diagnostics v_so_bai=row_count;
  return jsonb_build_object('so_bai',v_so_bai,'hoan_tat_luc',now());
end $$;

create or replace function nhan_job_demo(p_demo_luot_thi_id uuid)
returns setof job_hang_doi
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  select id into v_id from job_hang_doi
  where demo_luot_thi_id=p_demo_luot_thi_id and trang_thai='ChoXuLy' and chay_luc<=now()
  order by chay_luc,created_at for update skip locked limit 1;
  if v_id is null then return; end if;
  return query update job_hang_doi
    set trang_thai='DangXuLy',bat_dau_xu_ly_luc=now(),so_lan_thu=so_lan_thu+1
    where id=v_id returning *;
end $$;

-- Ca that ket thuc chi danh vang mat cac bai khong nam trong luot demo dang mo.
create or replace function tao_job_khi_ca_ket_thuc()
returns trigger language plpgsql set search_path=public as $$
begin
  if old.trang_thai is distinct from 'KetThuc' and new.trang_thai='KetThuc' then
    insert into job_hang_doi(loai_job,tham_chieu_id,khoa_idempotency)
    values('phan_tich_ket_qua',new.ca_thi_id,'phan_tich:'||new.ca_thi_id)
    on conflict do nothing;
    update bai_lam_thi b set trang_thai='VangMat'
    from ca_thi_mon cm
    where cm.ca_thi_id=new.ca_thi_id and b.ca_thi_mon_id=cm.id
      and b.trang_thai in ('ChuaDangNhap','BiKhoaChoXuLy')
      and not exists (
        select 1 from demo_luot_thi_bai_lam dl join demo_luot_thi d on d.demo_luot_thi_id=dl.demo_luot_thi_id
        where dl.bai_lam_id=b.bai_lam_id and d.trang_thai='DangMo'
      );
  end if;
  return new;
end $$;

revoke all on function phan_tich_ket_qua_cac_bai(uuid[],uuid) from public,anon,authenticated;
revoke all on function nhan_job_demo(uuid) from public,anon,authenticated;
grant execute on function phan_tich_ket_qua_cac_bai(uuid[],uuid) to service_role;
grant execute on function nhan_job_demo(uuid) to service_role;
