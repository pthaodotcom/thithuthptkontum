-- =====================================================================
-- 0028_ma_chuyen_de_bai_hoc.sql
-- FR-M3-01/FR-M3-02: them Ma chuyen de / Ma bai hoc lam khoa doi chieu
-- on dinh khi import cau hoi tu Excel, thay vi chi doi chieu theo ten
-- day du (de nham lan do khac dau/khac cach viet).
-- =====================================================================

alter table chuyen_de add column if not exists ma_chuyen_de text;
alter table bai_hoc add column if not exists ma_bai_hoc text;

-- Backfill ma cho du lieu da co (vd. seed 0027), danh so theo thu tu tao
with numbered as (
  select chuyen_de_id, row_number() over (partition by mon_id order by created_at) as stt
  from chuyen_de
  where ma_chuyen_de is null
)
update chuyen_de cd set ma_chuyen_de = 'CD' || numbered.stt
from numbered
where cd.chuyen_de_id = numbered.chuyen_de_id;

with numbered as (
  select bai_hoc_id, row_number() over (partition by chuyen_de_id order by created_at) as stt
  from bai_hoc
  where ma_bai_hoc is null
)
update bai_hoc bh set ma_bai_hoc = 'B' || numbered.stt
from numbered
where bh.bai_hoc_id = numbered.bai_hoc_id;

alter table chuyen_de alter column ma_chuyen_de set not null;
alter table bai_hoc alter column ma_bai_hoc set not null;

-- Ma chuyen de duy nhat trong 1 mon; ma bai hoc duy nhat trong 1 chuyen de
-- (khong dung ilike moi lan check nhu ten vi day la truong tra cuu import,
-- nen chan trung lap ngay o DB, khong phan biet hoa/thuong).
create unique index if not exists uq_chuyen_de_ma on chuyen_de (mon_id, upper(ma_chuyen_de));
create unique index if not exists uq_bai_hoc_ma on bai_hoc (chuyen_de_id, upper(ma_bai_hoc));
