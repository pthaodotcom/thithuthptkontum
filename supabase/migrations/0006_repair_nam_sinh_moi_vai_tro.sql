-- Repair cho database dev da chay 0004 thu cong khong day du:
-- FR-M2-02 dung ma_so + nam_sinh lam mat khau mac dinh cho moi vai tro.

alter table tai_khoan drop constraint if exists chk_tai_khoan_truong_hoc_sinh;

alter table tai_khoan drop constraint if exists chk_tai_khoan_nam_sinh;
alter table tai_khoan
  add constraint chk_tai_khoan_nam_sinh
  check (nam_sinh is null or nam_sinh between 1900 and 2100);

alter table tai_khoan
  add constraint chk_tai_khoan_truong_hoc_sinh check (
    vai_tro = 'HocSinh' or (
      lop_id is null and sdt_zalo_phu_huynh is null
      and mon_tu_chon_1_id is null and mon_tu_chon_2_id is null
    )
  );
