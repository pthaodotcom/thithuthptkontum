-- FR-M5-02: publish the tables that can change the exam monitoring view.
-- Realtime still applies each table's SELECT RLS policy to subscribers.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'bai_lam_thi',
    'vi_pham',
    'tai_khoan',
    'ca_thi'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end
$$;
