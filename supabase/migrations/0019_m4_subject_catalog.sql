-- M4: canonical elective catalogue and database-enforced student selections.
-- Historical migrations stay immutable; this migration is safe to re-run.

do $$
declare
  v_canonical_id uuid;
  v_duplicate record;
begin
  -- Reuse the oldest existing Informatics row when possible so historical
  -- references remain attached to their original subject.
  select mon_id
  into v_canonical_id
  from mon
  where lower(trim(ten_mon)) in ('tin học', 'tin hoc')
  order by created_at, mon_id::text
  limit 1;

  if v_canonical_id is null then
    insert into mon(
      ten_mon, loai_mon, thu_tu_ca_bat_buoc, trang_thai,
      phan1_so_cau, phan1_diem_moi_cau,
      phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
      phan2_diem_3y, phan2_diem_4y,
      phan3_so_cau, phan3_diem_moi_cau
    ) values (
      'Tin học', 'TuChon', null, 'DangDung',
      24, 0.25, 4, 0.10, 0.25, 0.50, 1.00, null, null
    )
    returning mon_id into v_canonical_id;
  else
    update mon
    set ten_mon = case when ten_mon = 'Tin học' then ten_mon
      else 'Tin học (đang chuẩn hóa)' end
    where mon_id = v_canonical_id;

    -- Free the canonical display name before normalizing the selected row.
    update mon
    set ten_mon = 'Tin học (lưu trữ ' || left(mon_id::text, 8) || ')',
        trang_thai = 'NgungDung'
    where mon_id <> v_canonical_id
      and lower(trim(ten_mon)) in ('tin học', 'tin hoc');

    update mon
    set ten_mon = 'Tin học',
        loai_mon = 'TuChon',
        thu_tu_ca_bat_buoc = null,
        trang_thai = 'DangDung',
        phan1_so_cau = 24,
        phan1_diem_moi_cau = 0.25,
        phan2_so_cau = 4,
        phan2_diem_1y = 0.10,
        phan2_diem_2y = 0.25,
        phan2_diem_3y = 0.50,
        phan2_diem_4y = 1.00,
        phan3_so_cau = null,
        phan3_diem_moi_cau = null
    where mon_id = v_canonical_id;
  end if;

  -- Move every conflict-free reference to the canonical subject. If a
  -- duplicate already has independent exam history in the same session, keep
  -- that row as an explicitly archived subject rather than deleting history.
  for v_duplicate in
    select mon_id
    from mon
    where mon_id <> v_canonical_id
      and ten_mon like 'Tin học (lưu trữ %'
  loop
    update tai_khoan set mon_tu_chon_1_id = v_canonical_id
      where mon_tu_chon_1_id = v_duplicate.mon_id
        and mon_tu_chon_2_id is distinct from v_canonical_id;
    update tai_khoan set mon_tu_chon_2_id = v_canonical_id
      where mon_tu_chon_2_id = v_duplicate.mon_id
        and mon_tu_chon_1_id is distinct from v_canonical_id;
    update tai_khoan set mon_id = v_canonical_id
      where mon_id = v_duplicate.mon_id;
    update chuyen_de set mon_id = v_canonical_id
      where mon_id = v_duplicate.mon_id;
    update log_doi_mon_tu_chon set mon_cu_id = v_canonical_id
      where mon_cu_id = v_duplicate.mon_id;
    update log_doi_mon_tu_chon set mon_moi_id = v_canonical_id
      where mon_moi_id = v_duplicate.mon_id;

    update ca_thi_mon ctm
    set mon_id = v_canonical_id
    where ctm.mon_id = v_duplicate.mon_id
      and not exists (
        select 1 from ca_thi_mon existing
        where existing.ca_thi_id = ctm.ca_thi_id
          and existing.mon_id = v_canonical_id
      );

    update nang_luc_hoc_sinh n
    set mon_id = v_canonical_id
    where n.mon_id = v_duplicate.mon_id
      and not exists (
        select 1 from nang_luc_hoc_sinh existing
        where existing.hoc_sinh_tai_khoan_id = n.hoc_sinh_tai_khoan_id
          and existing.mon_id = v_canonical_id
          and existing.nam_hoc = n.nam_hoc
      );
  end loop;
end
$$;

-- Seed missing canonical electives without overwriting a school's existing
-- scoring configuration. Newly inserted rows receive a valid 10-point
-- structure which an Admin may subsequently configure.
insert into mon(
  ten_mon, loai_mon, thu_tu_ca_bat_buoc, trang_thai,
  phan1_so_cau, phan1_diem_moi_cau,
  phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
  phan2_diem_3y, phan2_diem_4y,
  phan3_so_cau, phan3_diem_moi_cau
)
select ten_mon, 'TuChon', null, 'DangDung',
  24, 0.25, 4, 0.10, 0.25, 0.50, 1.00, null, null
from (values
  ('Vật lí'),
  ('Hóa học'),
  ('Sinh học'),
  ('Lịch sử'),
  ('Địa lí'),
  ('Giáo dục kinh tế và pháp luật'),
  ('Tin học'),
  ('Công nghệ'),
  ('Ngoại ngữ')
) as canonical(ten_mon)
on conflict (ten_mon) do update
set loai_mon = 'TuChon',
    thu_tu_ca_bat_buoc = null,
    trang_thai = 'DangDung';

alter table bai_lam_thi drop column if exists nhom_tin_hoc;

create or replace function validate_hoc_sinh_mon_tu_chon()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_so_mon_hop_le integer;
begin
  if new.vai_tro = 'HocSinh' then
    if new.mon_tu_chon_1_id is null or new.mon_tu_chon_2_id is null then
      raise exception using errcode = '23514',
        message = 'HOC_SINH_PHAI_CHON_DU_HAI_MON';
    end if;
    if new.mon_tu_chon_1_id = new.mon_tu_chon_2_id then
      raise exception using errcode = '23514',
        message = 'HAI_MON_TU_CHON_PHAI_KHAC_NHAU';
    end if;

    select count(*)
    into v_so_mon_hop_le
    from mon
    where mon_id in (new.mon_tu_chon_1_id, new.mon_tu_chon_2_id)
      and loai_mon = 'TuChon'
      and trang_thai = 'DangDung'
      and ten_mon in (
        'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí',
        'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ',
        'Ngoại ngữ'
      );
    if v_so_mon_hop_le <> 2 then
      raise exception using errcode = '23514',
        message = 'MON_TU_CHON_KHONG_THUOC_DANH_MUC_CHO_PHEP';
    end if;
  elsif new.mon_tu_chon_1_id is not null or new.mon_tu_chon_2_id is not null then
    raise exception using errcode = '23514',
      message = 'CHI_HOC_SINH_DUOC_CHON_MON_TU_CHON';
  end if;
  return new;
end
$$;

drop trigger if exists trg_validate_hoc_sinh_mon_tu_chon on tai_khoan;
create trigger trg_validate_hoc_sinh_mon_tu_chon
before insert or update of vai_tro, mon_tu_chon_1_id, mon_tu_chon_2_id
on tai_khoan
for each row execute function validate_hoc_sinh_mon_tu_chon();
