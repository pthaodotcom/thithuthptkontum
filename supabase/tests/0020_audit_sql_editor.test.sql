-- Standalone pgTAP audit gate for Supabase SQL Editor (no Docker).
-- The final rollback leaves the project unchanged.
begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into mon(
  mon_id, ten_mon, loai_mon, thu_tu_ca_bat_buoc, trang_thai,
  phan1_so_cau, phan1_diem_moi_cau
) values (
  'a4800000-0000-0000-0000-000000000001',
  'M4 Audit temporary', 'TuChon', null, 'DangDung', 1, 10
);
insert into audit_log(
  id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu
) values (
  'a4800000-0000-0000-0000-000000000002',
  'TaoMon', 'Mon', 'a4800000-0000-0000-0000-000000000001',
  '{"source":"m4-audit"}'
);
select is(
  (select du_lieu_truoc from audit_log
   where id = 'a4800000-0000-0000-0000-000000000002'),
  null::jsonb,
  'insert event has no before snapshot'
);
select is(
  (select du_lieu_sau->>'ten_mon' from audit_log
   where id = 'a4800000-0000-0000-0000-000000000002'),
  'M4 Audit temporary',
  'insert event captures the current row as after snapshot'
);

update mon set ten_mon = 'M4 Audit updated'
where mon_id = 'a4800000-0000-0000-0000-000000000001';
insert into audit_log(
  id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu
) values (
  'a4800000-0000-0000-0000-000000000003',
  'SuaMon', 'Mon', 'a4800000-0000-0000-0000-000000000001',
  '{"source":"m4-audit"}'
);
select is(
  (select du_lieu_truoc->>'ten_mon' from audit_log
   where id = 'a4800000-0000-0000-0000-000000000003'),
  'M4 Audit temporary',
  'update event captures the before snapshot'
);
select is(
  (select du_lieu_sau->>'ten_mon' from audit_log
   where id = 'a4800000-0000-0000-0000-000000000003'),
  'M4 Audit updated',
  'update event captures the after snapshot'
);

insert into audit_log(
  id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu
) values (
  'a4800000-0000-0000-0000-000000000004',
  'XoaMon', 'Mon', 'a4800000-0000-0000-0000-000000000001',
  (select to_jsonb(m) from mon m
   where mon_id = 'a4800000-0000-0000-0000-000000000001')
);
delete from mon where mon_id = 'a4800000-0000-0000-0000-000000000001';
select is(
  (select du_lieu_truoc->>'ten_mon' from audit_log
   where id = 'a4800000-0000-0000-0000-000000000004'),
  'M4 Audit updated',
  'delete event retains the deleted row as before snapshot'
);
select is(
  (select du_lieu_sau from audit_log
   where id = 'a4800000-0000-0000-0000-000000000004'),
  null::jsonb,
  'delete event has no after snapshot'
);

select throws_ok(
  $$update audit_log set hanh_dong = 'Tamper'
    where id = 'a4800000-0000-0000-0000-000000000002'$$,
  '55000', 'AUDIT_LOG_IMMUTABLE',
  'audit rows cannot be updated'
);
select throws_ok(
  $$delete from audit_log
    where id = 'a4800000-0000-0000-0000-000000000002'$$,
  '55000', 'AUDIT_LOG_IMMUTABLE',
  'audit rows cannot be deleted'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"vai_tro":"HocSinh"}', true);
select is(
  (select count(*)::integer from audit_log
   where id = 'a4800000-0000-0000-0000-000000000002'),
  0,
  'student RLS cannot read audit rows'
);
select set_config('request.jwt.claims', '{"vai_tro":"Admin"}', true);
select is(
  (select count(*)::integer from audit_log
   where id = 'a4800000-0000-0000-0000-000000000002'),
  1,
  'Admin RLS can read audit rows'
);
reset role;

select lives_ok(
  $$update tai_khoan
    set phien_hien_hanh = gen_random_uuid()
    where tai_khoan_id = 'a4500000-0000-0000-0000-000000000002'$$,
  'audit capture trigger permits the business update'
);
select isnt(
  (select phien_hien_hanh from tai_khoan
   where tai_khoan_id = 'a4500000-0000-0000-0000-000000000002'),
  null::uuid,
  'the business update persists its new value'
);

select * from finish();
select jsonb_build_object(
  'insert_before', (select du_lieu_truoc from audit_log
    where id = 'a4800000-0000-0000-0000-000000000002'),
  'insert_after_name', (select du_lieu_sau->>'ten_mon' from audit_log
    where id = 'a4800000-0000-0000-0000-000000000002'),
  'update_before_name', (select du_lieu_truoc->>'ten_mon' from audit_log
    where id = 'a4800000-0000-0000-0000-000000000003'),
  'update_after_name', (select du_lieu_sau->>'ten_mon' from audit_log
    where id = 'a4800000-0000-0000-0000-000000000003'),
  'delete_before_name', (select du_lieu_truoc->>'ten_mon' from audit_log
    where id = 'a4800000-0000-0000-0000-000000000004'),
  'delete_after', (select du_lieu_sau from audit_log
    where id = 'a4800000-0000-0000-0000-000000000004'),
  'business_session', (select phien_hien_hanh from tai_khoan
    where tai_khoan_id = 'a4500000-0000-0000-0000-000000000002')
) as audit_snapshot_diagnostics;
rollback;
