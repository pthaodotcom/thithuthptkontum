-- Immutable audit-log read model for the Admin UI.
alter table audit_log
  add column if not exists du_lieu_truoc jsonb,
  add column if not exists du_lieu_sau jsonb;

create index if not exists idx_audit_log_thoi_diem_id
  on audit_log(thoi_diem desc, id desc);
create index if not exists idx_audit_log_hanh_dong_thoi_diem
  on audit_log(hanh_dong, thoi_diem desc);
create index if not exists idx_audit_log_nguoi_thuc_hien_thoi_diem
  on audit_log(nguoi_thuc_hien_tai_khoan_id, thoi_diem desc);

-- RPCs write their audit entry in the same transaction as the mutation.
-- Preserve OLD in a transaction-local setting for the subsequent INSERT.
create or replace function audit_capture_old_row()
returns trigger language plpgsql set search_path = public as $$
begin
  perform set_config(
    'app.audit_before_' || tg_table_name,
    jsonb_build_object('id', to_jsonb(old)->tg_argv[0], 'row', to_jsonb(old))::text,
    true
  );
  return old;
end
$$;

drop trigger if exists audit_capture_dot_thi on dot_thi;
create trigger audit_capture_dot_thi before update on dot_thi
  for each row execute function audit_capture_old_row('dot_thi_id');
drop trigger if exists audit_capture_mon on mon;
create trigger audit_capture_mon before update on mon
  for each row execute function audit_capture_old_row('mon_id');
drop trigger if exists audit_capture_tai_khoan on tai_khoan;
create trigger audit_capture_tai_khoan before update on tai_khoan
  for each row execute function audit_capture_old_row('tai_khoan_id');
drop trigger if exists audit_capture_bai_lam_thi on bai_lam_thi;
create trigger audit_capture_bai_lam_thi before update on bai_lam_thi
  for each row execute function audit_capture_old_row('bai_lam_id');

create or replace function audit_prepare_snapshots()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_table text;
  v_pk text;
  v_captured jsonb;
  v_current jsonb;
begin
  if new.du_lieu_truoc is not null or new.du_lieu_sau is not null then
    return new;
  end if;

  select x.table_name, x.pk_name into v_table, v_pk
  from (values
    ('DotThi', 'dot_thi', 'dot_thi_id'),
    ('Mon', 'mon', 'mon_id'),
    ('TaiKhoan', 'tai_khoan', 'tai_khoan_id'),
    ('BaiLamThi', 'bai_lam_thi', 'bai_lam_id')
  ) as x(object_name, table_name, pk_name)
  where x.object_name = new.doi_tuong;

  if v_table is not null and new.doi_tuong_id is not null then
    begin
      v_captured := nullif(
        current_setting('app.audit_before_' || v_table, true), ''
      )::jsonb;
    exception when others then
      v_captured := null;
    end;

    if v_captured->>'id' = new.doi_tuong_id::text then
      new.du_lieu_truoc := v_captured->'row';
    end if;

    if new.hanh_dong not like 'Xoa%' then
      execute format(
        'select to_jsonb(t) from %I t where %I = $1', v_table, v_pk
      ) into v_current using new.doi_tuong_id;
      new.du_lieu_sau := v_current;
    end if;
  end if;

  -- Delete RPCs deliberately write the audit row before removing the target.
  -- Their existing payload is the durable deleted-state snapshot.
  if new.hanh_dong like 'Xoa%' and new.du_lieu_truoc is null then
    new.du_lieu_truoc := new.du_lieu;
  end if;

  -- Event/create actions do not have a previous row; retain their useful
  -- payload as the after snapshot. Historical entries are not backfilled.
  if new.du_lieu_sau is null and new.hanh_dong not like 'Xoa%' then
    new.du_lieu_sau := new.du_lieu;
  end if;
  return new;
end
$$;

drop trigger if exists audit_prepare_snapshots_trigger on audit_log;
create trigger audit_prepare_snapshots_trigger before insert on audit_log
  for each row execute function audit_prepare_snapshots();

create or replace function audit_log_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE' using errcode = '55000';
end
$$;

drop trigger if exists audit_log_immutable_trigger on audit_log;
create trigger audit_log_immutable_trigger before update or delete on audit_log
  for each row execute function audit_log_immutable();

revoke update, delete, truncate on audit_log from public, anon, authenticated;

comment on column audit_log.du_lieu is
  'Legacy payload retained verbatim; historical rows are never inferred or backfilled.';
comment on column audit_log.du_lieu_truoc is
  'Immutable snapshot immediately before the audited mutation, when applicable.';
comment on column audit_log.du_lieu_sau is
  'Immutable snapshot immediately after the audited mutation, when applicable.';
