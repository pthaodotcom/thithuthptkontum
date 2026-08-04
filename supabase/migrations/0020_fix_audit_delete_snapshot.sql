-- Delete events carry the row being deleted in du_lieu. Do not reuse a stale
-- transaction-local UPDATE snapshot when an update and delete happen in the
-- same transaction.
create or replace function audit_prepare_snapshots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table text;
  v_pk text;
  v_captured jsonb;
  v_current jsonb;
begin
  if new.du_lieu_truoc is not null or new.du_lieu_sau is not null then
    return new;
  end if;

  if new.hanh_dong like 'Xoa%' then
    new.du_lieu_truoc := new.du_lieu;
    new.du_lieu_sau := null;
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

    execute format(
      'select to_jsonb(t) from %I t where %I = $1', v_table, v_pk
    ) into v_current using new.doi_tuong_id;
    new.du_lieu_sau := v_current;
  end if;

  if new.du_lieu_sau is null then
    new.du_lieu_sau := new.du_lieu;
  end if;
  return new;
end
$$;

