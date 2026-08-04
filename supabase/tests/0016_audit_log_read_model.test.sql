begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_column('public', 'audit_log', 'du_lieu_truoc',
  'audit_log has a before snapshot');
select has_column('public', 'audit_log', 'du_lieu_sau',
  'audit_log has an after snapshot');

insert into audit_log(
  id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu
) values (
  '16000000-0000-0000-0000-000000000001',
  'SuKienTest', 'KhongCoBang',
  '16000000-0000-0000-0000-000000000002',
  '{"run":"0016"}'::jsonb
);

select is(
  (select du_lieu_sau from audit_log
    where id = '16000000-0000-0000-0000-000000000001'),
  '{"run":"0016"}'::jsonb,
  'new event records retain their payload as the after snapshot'
);
select is(
  (select du_lieu_truoc from audit_log
    where id = '16000000-0000-0000-0000-000000000001'),
  null::jsonb,
  'new event records correctly have no before snapshot'
);

insert into audit_log(
  id, hanh_dong, doi_tuong, doi_tuong_id, du_lieu
) values (
  '16000000-0000-0000-0000-000000000003',
  'XoaBanGhiTest', 'KhongCoBang',
  '16000000-0000-0000-0000-000000000004',
  '{"deleted":true}'::jsonb
);
select is(
  (select du_lieu_truoc from audit_log
    where id = '16000000-0000-0000-0000-000000000003'),
  '{"deleted":true}'::jsonb,
  'delete payload becomes the before snapshot'
);

select throws_ok(
  $$update audit_log set hanh_dong = 'SuaTraiPhep'
    where id = '16000000-0000-0000-0000-000000000001'$$,
  '55000', 'AUDIT_LOG_IMMUTABLE',
  'audit rows cannot be updated'
);
select throws_ok(
  $$delete from audit_log
    where id = '16000000-0000-0000-0000-000000000001'$$,
  '55000', 'AUDIT_LOG_IMMUTABLE',
  'audit rows cannot be deleted'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"vai_tro":"HocSinh"}', true);
select is(
  (select count(*)::integer from audit_log
    where id = '16000000-0000-0000-0000-000000000001'),
  0,
  'non-Admin users cannot read audit rows through RLS'
);
select set_config('request.jwt.claims', '{"vai_tro":"Admin"}', true);
select is(
  (select count(*)::integer from audit_log
    where id = '16000000-0000-0000-0000-000000000001'),
  1,
  'Admin users can read audit rows through RLS'
);
reset role;

select lives_ok(
  $$update tai_khoan set phien_hien_hanh = gen_random_uuid()
    where tai_khoan_id = (select tai_khoan_id from tai_khoan limit 1)$$,
  'audit capture trigger allows the audited row update to persist'
);

select * from finish();
rollback;
