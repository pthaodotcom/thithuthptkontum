-- =====================================================================
-- 0002_rls_policies.sql
-- Row Level Security - lop phong thu CHINH cho du lieu (xem ghi chu
-- "RLS la lop phong thu chinh, UI chi la lop phu").
--
-- Kien truc auth: khong dung Supabase Auth (GoTrue). Server tu ky JWT bang
-- SUPABASE_JWT_SECRET sau khi xac minh ma_so + mat_khau (xem lib/auth/jwt.ts).
-- JWT chua claim chuan "sub" = tai_khoan_id va claim tuy bien "vai_tro".
-- Cac thao tac nghiep vu phuc tap (tao de, cham diem, nop bai, cron...) chay
-- qua API route bang SUPABASE_SERVICE_ROLE_KEY (bo qua RLS theo thiet ke) -
-- phan quyen cho cac luong do nam o tang application code, KHONG o RLS.
-- RLS o day chu yeu bao ve: (a) truy van doc truc tiep tu client (vi du man
-- hinh danh muc, bao cao), (b) Supabase Realtime subscriptions (FR-M5-02).
--
-- TODO Phase 6: ra soat lai toan bo policy nay truoc khi go-live, doi chieu
-- dung 07-Validation-Report.md va bang phan quyen FR-M2-05.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper functions doc claim tu JWT hien hanh
-- ---------------------------------------------------------------------
create or replace function jwt_claim(p_claim text)
returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> p_claim, '');
$$;

create or replace function jwt_tai_khoan_id()
returns uuid
language sql stable
as $$
  select jwt_claim('sub')::uuid;
$$;

create or replace function jwt_vai_tro()
returns text
language sql stable
as $$
  select jwt_claim('vai_tro');
$$;

-- To truong la BO NHIEM theo Mon (FR-M2-03), khong phai vai_tro rieng - tra ve
-- true neu tai khoan hien hanh dang la to_truong_tai_khoan_id cua dung Mon do.
create or replace function la_to_truong_cua_mon(p_mon_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from mon
    where mon_id = p_mon_id and to_truong_tai_khoan_id = jwt_tai_khoan_id()
  );
$$;

-- Giao vien co duoc phan cong Lop nay khong (FR-M2-04) - dieu kien xem bao cao
create or replace function co_phan_cong_lop(p_lop_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from phan_cong_giang_day
    where lop_id = p_lop_id and giao_vien_tai_khoan_id = jwt_tai_khoan_id()
  );
$$;

-- ---------------------------------------------------------------------
-- Bat RLS cho toan bo bang nghiep vu
-- ---------------------------------------------------------------------
alter table khung_gio_chuan enable row level security;
alter table lop enable row level security;
alter table muc_do_nhan_thuc enable row level security;
alter table dot_thi enable row level security;
alter table mon enable row level security;
alter table tai_khoan enable row level security;
alter table phan_cong_giang_day enable row level security;
alter table chuyen_de enable row level security;
alter table bai_hoc enable row level security;
alter table cau_hoi enable row level security;
alter table chi_tiet_cau_hoi enable row level security;
alter table yeu_cau_chinh_sua enable row level security;
alter table dot_thi_lop enable row level security;
alter table ca_thi enable row level security;
alter table ca_thi_mon enable row level security;
alter table de_thi enable row level security;
alter table cau_hoi_snapshot enable row level security;
alter table chi_tiet_cau_hoi_snapshot enable row level security;
alter table ma_de enable row level security;
alter table log_doi_mon_tu_chon enable row level security;
alter table bai_lam_thi enable row level security;
alter table tra_loi enable row level security;
alter table vi_pham enable row level security;
alter table log_xu_ly_ngoai_le enable row level security;
alter table nang_luc_hoc_sinh enable row level security;
alter table nhan_xet_ai enable row level security;
alter table zns_log enable row level security;
alter table job_hang_doi enable row level security;
-- job_hang_doi: khong policy nao ca -> chi service_role (bo qua RLS) doc/ghi duoc.

-- ---------------------------------------------------------------------
-- Danh muc dung chung (M1) - moi vai tro da dang nhap deu doc duoc; chi
-- Admin ghi duoc (kiem tra lai o application layer khi ghi qua service role)
-- ---------------------------------------------------------------------
create policy "danh_muc_read_all" on khung_gio_chuan for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on lop for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on muc_do_nhan_thuc for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on mon for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on dot_thi for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on dot_thi_lop for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on ca_thi for select using (jwt_vai_tro() is not null);
create policy "danh_muc_read_all" on ca_thi_mon for select using (jwt_vai_tro() is not null);

create policy "admin_write" on khung_gio_chuan for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "admin_write" on lop for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "admin_write" on mon for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "admin_write" on dot_thi for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "admin_write" on dot_thi_lop for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');

-- ---------------------------------------------------------------------
-- tai_khoan (FR-M2-01, FR-M2-05): Admin toan quyen; nguoi dung tu xem/sua
-- ho so chinh minh (khong duoc tu doi vai_tro/trang_thai/mat_khau_hash qua day
-- - cac cot do chi sua qua API co kiem tra rieng).
-- ---------------------------------------------------------------------
create policy "admin_full" on tai_khoan for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "tu_xem_ho_so" on tai_khoan for select
  using (tai_khoan_id = jwt_tai_khoan_id());
-- To truong xem danh sach Giao vien cua Mon minh (de doi chieu phan cong - FR-M2-04)
create policy "to_truong_xem_giao_vien_cung_mon" on tai_khoan for select
  using (vai_tro = 'GiaoVien' and la_to_truong_cua_mon(mon_id));

-- ---------------------------------------------------------------------
-- phan_cong_giang_day (FR-M2-04): Admin ghi; To truong read-only bang cua To
-- minh; Giao vien xem dong cua chinh minh.
-- ---------------------------------------------------------------------
create policy "admin_write" on phan_cong_giang_day for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "giao_vien_xem_phan_cong_cua_minh" on phan_cong_giang_day for select
  using (giao_vien_tai_khoan_id = jwt_tai_khoan_id());
create policy "to_truong_xem_phan_cong_cua_to" on phan_cong_giang_day for select
  using (
    exists (
      select 1 from tai_khoan gv
      where gv.tai_khoan_id = phan_cong_giang_day.giao_vien_tai_khoan_id
        and la_to_truong_cua_mon(gv.mon_id)
    )
  );

-- ---------------------------------------------------------------------
-- chuyen_de / bai_hoc (FR-M3-01): To truong toan quyen tren Mon minh; Giao
-- vien cung Mon duoc doc (de gan metadata khi soan cau hoi); Hoc sinh khong xem.
-- ---------------------------------------------------------------------
create policy "to_truong_full_theo_mon" on chuyen_de for all
  using (la_to_truong_cua_mon(mon_id)) with check (la_to_truong_cua_mon(mon_id));
create policy "giao_vien_doc_theo_mon" on chuyen_de for select
  using (
    jwt_vai_tro() = 'GiaoVien'
    and exists (select 1 from tai_khoan where tai_khoan_id = jwt_tai_khoan_id() and mon_id = chuyen_de.mon_id)
  );

create policy "to_truong_full_theo_mon" on bai_hoc for all
  using (la_to_truong_cua_mon((select mon_id from chuyen_de where chuyen_de_id = bai_hoc.chuyen_de_id)))
  with check (la_to_truong_cua_mon((select mon_id from chuyen_de where chuyen_de_id = bai_hoc.chuyen_de_id)));
create policy "giao_vien_doc_theo_mon" on bai_hoc for select
  using (
    jwt_vai_tro() = 'GiaoVien'
    and exists (
      select 1 from chuyen_de cd
      join tai_khoan tk on tk.mon_id = cd.mon_id
      where cd.chuyen_de_id = bai_hoc.chuyen_de_id and tk.tai_khoan_id = jwt_tai_khoan_id()
    )
  );

-- ---------------------------------------------------------------------
-- cau_hoi / chi_tiet_cau_hoi (FR-M3-02, FR-M3-03): Giao vien CRUD cau cua
-- chinh minh khi con "ChoDuyet"; To truong toan quyen tren Mon minh. Hoc sinh
-- KHONG BAO GIO duoc doc bang nay (chi doc cau_hoi_snapshot qua server, khong
-- qua RLS truc tiep, vi luong lam bai di qua API route dung service role).
-- ---------------------------------------------------------------------
create policy "to_truong_full_theo_mon" on cau_hoi for all
  using (la_to_truong_cua_mon((select mon_id from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id where bh.bai_hoc_id = cau_hoi.bai_hoc_id)))
  with check (la_to_truong_cua_mon((select mon_id from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id where bh.bai_hoc_id = cau_hoi.bai_hoc_id)));
create policy "giao_vien_doc_cau_cung_mon" on cau_hoi for select
  using (
    jwt_vai_tro() = 'GiaoVien'
    and exists (
      select 1 from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
      join tai_khoan tk on tk.mon_id = cd.mon_id
      where bh.bai_hoc_id = cau_hoi.bai_hoc_id and tk.tai_khoan_id = jwt_tai_khoan_id()
    )
  );
create policy "giao_vien_tao_cau_hoi" on cau_hoi for insert
  with check (
    jwt_vai_tro() = 'GiaoVien' and nguoi_tao_tai_khoan_id = jwt_tai_khoan_id()
    and exists (
      select 1 from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
      join tai_khoan tk on tk.mon_id = cd.mon_id
      where bh.bai_hoc_id = cau_hoi.bai_hoc_id and tk.tai_khoan_id = jwt_tai_khoan_id()
    )
  );
-- Giao vien KHONG duoc tu sua cau da duyet (FR-M3-02) - chan UPDATE truc tiep
-- khi trang_thai_duyet = 'DaDuyet'; sua qua yeu_cau_chinh_sua thay vi UPDATE thang.
create policy "giao_vien_sua_cau_chua_duyet" on cau_hoi for update
  using (
    jwt_vai_tro() = 'GiaoVien' and nguoi_tao_tai_khoan_id = jwt_tai_khoan_id()
    and trang_thai_duyet <> 'DaDuyet'
  )
  with check (nguoi_tao_tai_khoan_id = jwt_tai_khoan_id());

create policy "theo_cau_hoi_cha" on chi_tiet_cau_hoi for all
  using (
    exists (
      select 1 from cau_hoi ch
      join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
      join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
      left join tai_khoan tk on tk.mon_id = cd.mon_id and tk.tai_khoan_id = jwt_tai_khoan_id()
      where ch.cau_hoi_id = chi_tiet_cau_hoi.cau_hoi_id
        and (la_to_truong_cua_mon(cd.mon_id) or tk.tai_khoan_id is not null)
    )
  );

-- ---------------------------------------------------------------------
-- yeu_cau_chinh_sua (FR-M3-03): Giao vien tao + xem cua minh; To truong
-- duyet/tu choi trong pham vi Mon minh.
-- ---------------------------------------------------------------------
create policy "giao_vien_xem_yc_cua_minh" on yeu_cau_chinh_sua for select
  using (nguoi_de_xuat_tai_khoan_id = jwt_tai_khoan_id());
create policy "giao_vien_tao_yc" on yeu_cau_chinh_sua for insert
  with check (nguoi_de_xuat_tai_khoan_id = jwt_tai_khoan_id());
create policy "to_truong_duyet_yc" on yeu_cau_chinh_sua for all
  using (
    la_to_truong_cua_mon((
      select cd.mon_id from cau_hoi ch
      join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
      join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
      where ch.cau_hoi_id = yeu_cau_chinh_sua.cau_hoi_id
    ))
  );

-- ---------------------------------------------------------------------
-- de_thi / cau_hoi_snapshot / chi_tiet_cau_hoi_snapshot / ma_de (FR-M3-04):
-- CHI To truong (chinh minh, Mon minh) va Admin duoc doc. Hoc sinh KHONG BAO
-- GIO co policy SELECT o day - luong lam bai luon di qua API route (service
-- role) tra ve du lieu da loc (an dap an dung), khong bao gio query thang bang
-- nay tu client cua Hoc sinh.
-- ---------------------------------------------------------------------
create policy "to_truong_full_theo_mon" on de_thi for all
  using (
    la_to_truong_cua_mon((
      select ctm.mon_id from ca_thi_mon ctm where ctm.id = de_thi.ca_thi_mon_id
    ))
  )
  with check (nguoi_tao_tai_khoan_id = jwt_tai_khoan_id());
create policy "admin_doc" on de_thi for select using (jwt_vai_tro() = 'Admin');

create policy "to_truong_doc_snapshot" on cau_hoi_snapshot for select
  using (
    la_to_truong_cua_mon((
      select ctm.mon_id from de_thi dt join ca_thi_mon ctm on ctm.id = dt.ca_thi_mon_id
      where dt.de_thi_id = cau_hoi_snapshot.de_thi_id
    ))
  );
create policy "to_truong_doc_chi_tiet_snapshot" on chi_tiet_cau_hoi_snapshot for select
  using (
    exists (
      select 1 from cau_hoi_snapshot chs
      join de_thi dt on dt.de_thi_id = chs.de_thi_id
      join ca_thi_mon ctm on ctm.id = dt.ca_thi_mon_id
      where chs.snapshot_id = chi_tiet_cau_hoi_snapshot.cau_hoi_snapshot_id
        and la_to_truong_cua_mon(ctm.mon_id)
    )
  );
create policy "to_truong_doc_ma_de" on ma_de for select
  using (
    la_to_truong_cua_mon((
      select ctm.mon_id from de_thi dt join ca_thi_mon ctm on ctm.id = dt.ca_thi_mon_id
      where dt.de_thi_id = ma_de.de_thi_id
    ))
  );

-- ---------------------------------------------------------------------
-- log_doi_mon_tu_chon (FR-M4-02): Hoc sinh xem log cua chinh minh; Admin toan quyen.
-- ---------------------------------------------------------------------
create policy "hoc_sinh_xem_log_cua_minh" on log_doi_mon_tu_chon for select
  using (hoc_sinh_tai_khoan_id = jwt_tai_khoan_id());
create policy "admin_full" on log_doi_mon_tu_chon for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');

-- ---------------------------------------------------------------------
-- bai_lam_thi (FR-M5-01..04, FR-M6-03/04/05): day la bang nhay cam nhat cho
-- phan quyen bao cao. Hoc sinh chi xem dong cua chinh minh (sau khi da nop -
-- khong xem noi dung de/dap an, vi bang nay khong luu noi dung de). Giao vien
-- xem theo dung to hop Lop x Mon trong phan_cong_giang_day (FR-M2-04). To
-- truong xem MOI lop cho Mon minh. Admin toan quyen.
-- ---------------------------------------------------------------------
create policy "hoc_sinh_xem_bai_cua_minh" on bai_lam_thi for select
  using (hoc_sinh_tai_khoan_id = jwt_tai_khoan_id());
create policy "admin_full" on bai_lam_thi for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "to_truong_xem_theo_mon" on bai_lam_thi for select
  using (
    la_to_truong_cua_mon((select ctm.mon_id from ca_thi_mon ctm where ctm.id = bai_lam_thi.ca_thi_mon_id))
  );
create policy "giao_vien_xem_theo_phan_cong" on bai_lam_thi for select
  using (
    jwt_vai_tro() = 'GiaoVien'
    and co_phan_cong_lop((select lop_id from tai_khoan where tai_khoan_id = bai_lam_thi.hoc_sinh_tai_khoan_id))
    and exists (
      select 1 from ca_thi_mon ctm join tai_khoan gv on gv.mon_id = ctm.mon_id
      where ctm.id = bai_lam_thi.ca_thi_mon_id and gv.tai_khoan_id = jwt_tai_khoan_id()
    )
  );

-- ---------------------------------------------------------------------
-- tra_loi (FR-M5-01): chi ghi/doc qua API route (service role) trong luc dang
-- thi vi ly do do tre + chong gian lan. Sau khi nop, khong ai can doc bang nay
-- qua RLS (bao cao dung nang_luc_hoc_sinh/bai_lam_thi). Khong cap policy SELECT
-- cho client -> mac dinh khong ai (ngoai service_role) doc/ghi duoc.
-- ---------------------------------------------------------------------
-- (co chu y khong tao policy nao o day)

-- vi_pham, log_xu_ly_ngoai_le: Admin xem de doi chieu; khong cho Hoc sinh xem
-- (tranh lo cach he thong phat hien vi pham).
create policy "admin_doc" on vi_pham for select using (jwt_vai_tro() = 'Admin');
create policy "admin_doc" on log_xu_ly_ngoai_le for select using (jwt_vai_tro() = 'Admin');

-- ---------------------------------------------------------------------
-- nang_luc_hoc_sinh (FR-M6-01/04): Hoc sinh xem cua chinh minh; Giao vien/To
-- truong xem theo cung dieu kien bao cao lop; Admin toan quyen.
-- ---------------------------------------------------------------------
create policy "hoc_sinh_xem_cua_minh" on nang_luc_hoc_sinh for select
  using (hoc_sinh_tai_khoan_id = jwt_tai_khoan_id());
create policy "admin_full" on nang_luc_hoc_sinh for all
  using (jwt_vai_tro() = 'Admin') with check (jwt_vai_tro() = 'Admin');
create policy "to_truong_xem_theo_mon" on nang_luc_hoc_sinh for select
  using (la_to_truong_cua_mon(mon_id));
create policy "giao_vien_xem_theo_phan_cong" on nang_luc_hoc_sinh for select
  using (
    jwt_vai_tro() = 'GiaoVien'
    and co_phan_cong_lop((select lop_id from tai_khoan where tai_khoan_id = nang_luc_hoc_sinh.hoc_sinh_tai_khoan_id))
    and exists (select 1 from tai_khoan where tai_khoan_id = jwt_tai_khoan_id() and mon_id = nang_luc_hoc_sinh.mon_id)
  );

-- nhan_xet_ai: Hoc sinh xem nhan xet cua chinh minh (qua bai_lam_id)
create policy "hoc_sinh_xem_nhan_xet_cua_minh" on nhan_xet_ai for select
  using (
    exists (
      select 1 from bai_lam_thi blt
      where blt.bai_lam_id = nhan_xet_ai.bai_lam_id and blt.hoc_sinh_tai_khoan_id = jwt_tai_khoan_id()
    )
  );
create policy "admin_doc" on nhan_xet_ai for select using (jwt_vai_tro() = 'Admin');

-- zns_log: chi Admin xem (xu ly thu cong khi ZNS that bai - FR-M6-06)
create policy "admin_doc" on zns_log for select using (jwt_vai_tro() = 'Admin');
