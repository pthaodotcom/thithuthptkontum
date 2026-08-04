-- M5: thay Zalo ZNS bang email phu huynh qua Gmail SMTP.
-- Cac cot/bang Zalo cu duoc giu lai chi de tuong thich lich su.

alter table tai_khoan add column if not exists email_phu_huynh text;

alter table tai_khoan drop constraint if exists chk_tai_khoan_email_phu_huynh;
alter table tai_khoan add constraint chk_tai_khoan_email_phu_huynh check (
  email_phu_huynh is null or (
    vai_tro = 'HocSinh'
    and email_phu_huynh = lower(trim(email_phu_huynh))
    and email_phu_huynh ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create table if not exists phan_tich_chuyen_de (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi(bai_lam_id) on delete cascade,
  chuyen_de_id uuid not null references chuyen_de(chuyen_de_id),
  so_cau integer not null default 0 check (so_cau >= 0),
  so_cau_dung integer not null default 0 check (so_cau_dung between 0 and so_cau),
  ty_le_dung numeric(5,2) not null default 0 check (ty_le_dung between 0 and 100),
  created_at timestamptz not null default now(),
  unique (bai_lam_id, chuyen_de_id)
);

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  bai_lam_id uuid not null references bai_lam_thi(bai_lam_id) on delete cascade,
  email_gui text,
  tieu_de text not null,
  trang_thai text not null default 'ChoGui' check (
    trang_thai in ('ChoGui','DaGui','KhongGui_ThieuEmail','ThatBaiTamThoi','CanXuLyThuCong')
  ),
  so_lan_thu smallint not null default 0,
  message_id text,
  ma_loi text,
  chi_tiet_loi text,
  han_gui_luc timestamptz,
  thoi_diem_gui timestamptz,
  created_at timestamptz not null default now(),
  unique (bai_lam_id)
);

create table if not exists thong_bao_admin (
  id uuid primary key default gen_random_uuid(),
  loai text not null check (loai in ('ViPhamSLA','EmailThatBai','ChamDiemChoXuLy')),
  tham_chieu_id uuid not null,
  noi_dung text not null,
  da_doc boolean not null default false,
  created_at timestamptz not null default now()
);

alter table phan_tich_chuyen_de enable row level security;
alter table email_log enable row level security;
alter table thong_bao_admin enable row level security;

create policy "hoc_sinh_doc_phan_tich_cua_minh" on phan_tich_chuyen_de for select
using (exists (
  select 1 from bai_lam_thi b
  where b.bai_lam_id=phan_tich_chuyen_de.bai_lam_id
    and (b.hoc_sinh_tai_khoan_id=jwt_tai_khoan_id() or jwt_vai_tro()='Admin')
));
create policy "giao_vien_doc_phan_tich_dung_pham_vi" on phan_tich_chuyen_de for select
using (exists (
  select 1
  from bai_lam_thi b
  join tai_khoan hs on hs.tai_khoan_id=b.hoc_sinh_tai_khoan_id
  join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
  where b.bai_lam_id=phan_tich_chuyen_de.bai_lam_id
    and jwt_vai_tro()='GiaoVien'
    and (
      la_to_truong_cua_mon(cm.mon_id)
      or (
        co_phan_cong_lop(hs.lop_id)
        and exists (
          select 1 from tai_khoan gv
          where gv.tai_khoan_id=jwt_tai_khoan_id() and gv.mon_id=cm.mon_id
        )
      )
    )
));
create policy "admin_doc_email_log" on email_log for select using (jwt_vai_tro()='Admin');
create policy "admin_doc_thong_bao" on thong_bao_admin for select using (jwt_vai_tro()='Admin');

alter table job_hang_doi drop constraint if exists job_hang_doi_loai_job_check;
alter table job_hang_doi add constraint job_hang_doi_loai_job_check check (
  loai_job in ('kiem_tra_san_sang','phan_tich_ket_qua','sinh_nhan_xet_ai','gui_zns','gui_email','thu_lai_nhan_xet_ai')
);

create or replace function phan_tich_ket_qua_ca(p_ca_thi_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_ket_thuc timestamptz;
  v_so_bai integer;
begin
  select gio_ket_thuc into v_ket_thuc from ca_thi where ca_thi_id=p_ca_thi_id;
  if v_ket_thuc is null then raise exception 'KHONG_TIM_THAY_CA_THI'; end if;

  insert into phan_tich_chuyen_de(bai_lam_id,chuyen_de_id,so_cau,so_cau_dung,ty_le_dung)
  select b.bai_lam_id, q.chuyen_de_id, count(distinct q.snapshot_id),
    count(distinct q.snapshot_id) filter (where
      case q.phan
        when 'I' then exists (
          select 1 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.id=t.dap_an_lua_chon_id
          where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and c.la_dap_an_dung
        )
        when 'II' then (
          select count(*)=4 from tra_loi t join chi_tiet_cau_hoi_snapshot c
            on c.cau_hoi_snapshot_id=t.cau_hoi_snapshot_id and c.thu_tu=t.chi_tiet_thu_tu
          where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id
            and t.dap_an_dung_sai=c.la_dap_an_dung
        )
        when 'III' then exists (
          select 1 from tra_loi t where t.bai_lam_id=b.bai_lam_id
            and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_chuoi=q.dap_an_phan3
        )
      end
    ),
    round(100.0 * count(distinct q.snapshot_id) filter (where
      case q.phan
        when 'I' then exists (select 1 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.id=t.dap_an_lua_chon_id where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and c.la_dap_an_dung)
        when 'II' then (select count(*)=4 from tra_loi t join chi_tiet_cau_hoi_snapshot c on c.cau_hoi_snapshot_id=t.cau_hoi_snapshot_id and c.thu_tu=t.chi_tiet_thu_tu where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_dung_sai=c.la_dap_an_dung)
        when 'III' then exists (select 1 from tra_loi t where t.bai_lam_id=b.bai_lam_id and t.cau_hoi_snapshot_id=q.snapshot_id and t.dap_an_chuoi=q.dap_an_phan3)
      end) / nullif(count(distinct q.snapshot_id),0), 2)
  from bai_lam_thi b
  join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
  join cau_hoi_snapshot q on q.de_thi_id=b.de_thi_id
  where cm.ca_thi_id=p_ca_thi_id and b.trang_thai='DaNopBai' and b.diem_tong is not null
    and q.chuyen_de_id is not null
  group by b.bai_lam_id,q.chuyen_de_id
  on conflict (bai_lam_id,chuyen_de_id) do update set
    so_cau=excluded.so_cau,so_cau_dung=excluded.so_cau_dung,ty_le_dung=excluded.ty_le_dung;

  with bai as (
    select b.bai_lam_id,b.hoc_sinh_tai_khoan_id,cm.mon_id,d.nam_hoc
    from bai_lam_thi b join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
    join ca_thi c on c.ca_thi_id=cm.ca_thi_id join dot_thi d on d.dot_thi_id=c.dot_thi_id
    where cm.ca_thi_id=p_ca_thi_id and b.trang_thai='DaNopBai' and b.diem_tong is not null
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

  insert into job_hang_doi(loai_job,tham_chieu_id,khoa_idempotency)
  select 'sinh_nhan_xet_ai',b.bai_lam_id,'ai:'||b.bai_lam_id
  from bai_lam_thi b join ca_thi_mon cm on cm.id=b.ca_thi_mon_id
  where cm.ca_thi_id=p_ca_thi_id and b.trang_thai='DaNopBai' and b.diem_tong is not null
  on conflict do nothing;
  get diagnostics v_so_bai = row_count;

  if now()>v_ket_thuc+interval '2 hours' then
    insert into thong_bao_admin(loai,tham_chieu_id,noi_dung)
    values('ViPhamSLA',p_ca_thi_id,'Phan tich ket qua ca thi vuot SLA 2 gio');
  end if;
  return jsonb_build_object('so_bai',v_so_bai,'hoan_tat_luc',now());
end $$;
