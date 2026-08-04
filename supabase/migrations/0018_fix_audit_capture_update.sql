-- 0016 captured OLD correctly but returned OLD from a BEFORE UPDATE trigger,
-- silently turning every audited update into a no-op. Preserve OLD in the
-- transaction-local setting and allow the requested NEW row to be written.
create or replace function audit_capture_old_row()
returns trigger language plpgsql set search_path = public as $$
begin
  perform set_config(
    'app.audit_before_' || tg_table_name,
    jsonb_build_object('id', to_jsonb(old)->tg_argv[0], 'row', to_jsonb(old))::text,
    true
  );
  return new;
end
$$;

