-- UC-QB-02/03: tao cau hoi theo giao dich va khoa mot yeu cau sua dang cho/cau.

-- Co cau hinh thay cho viec hardcode ten Mon trong application.
alter table mon add column if not exists ho_tro_ngan_hang_cau_hoi boolean not null default true;
update mon set ho_tro_ngan_hang_cau_hoi = false where lower(trim(ten_mon)) = lower('Ngữ văn');

create unique index uq_yc_chinh_sua_cho_duyet_moi_cau
  on yeu_cau_chinh_sua (cau_hoi_id)
  where trang_thai = 'ChoDuyet';

create or replace function tao_cau_hoi_cho_duyet(
  p_bai_hoc_id uuid,
  p_phan text,
  p_muc_do_id uuid,
  p_noi_dung text,
  p_dap_an_phan3 text,
  p_chi_tiet jsonb,
  p_nguoi_tao_id uuid
) returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_so_chi_tiet integer;
  v_so_dap_an_dung integer;
begin
  if p_phan not in ('I', 'II', 'III') then
    raise exception 'Phan cau hoi khong hop le';
  end if;

  v_so_chi_tiet := coalesce(jsonb_array_length(p_chi_tiet), 0);
  if p_phan = 'III' then
    if p_dap_an_phan3 is null or p_dap_an_phan3 !~ '^[0-9,-]{4}$' or v_so_chi_tiet <> 0 then
      raise exception 'Khuon dap an Phan III khong hop le';
    end if;
  else
    if p_dap_an_phan3 is not null or v_so_chi_tiet <> 4 then
      raise exception 'Phan I/II phai co dung 4 chi tiet';
    end if;
    select count(*) into v_so_dap_an_dung
    from jsonb_array_elements(p_chi_tiet) item
    where coalesce((item->>'la_dap_an_dung')::boolean, false);
    if p_phan = 'I' and v_so_dap_an_dung <> 1 then
      raise exception 'Phan I phai co dung 1 dap an dung';
    end if;
  end if;

  insert into cau_hoi (
    bai_hoc_id, phan, muc_do_id, noi_dung, dap_an_phan3,
    trang_thai_duyet, trang_thai_su_dung, nguoi_tao_tai_khoan_id
  ) values (
    p_bai_hoc_id, p_phan, p_muc_do_id, trim(p_noi_dung), p_dap_an_phan3,
    'ChoDuyet', 'ChuaDung', p_nguoi_tao_id
  ) returning cau_hoi_id into v_id;

  if p_phan <> 'III' then
    insert into chi_tiet_cau_hoi (cau_hoi_id, thu_tu, noi_dung, la_dap_an_dung)
    select v_id, ordinality::smallint, trim(item->>'noi_dung'),
      coalesce((item->>'la_dap_an_dung')::boolean, false)
    from jsonb_array_elements(p_chi_tiet) with ordinality as x(item, ordinality);
  end if;
  return v_id;
end;
$$;

revoke all on function tao_cau_hoi_cho_duyet(uuid, text, uuid, text, text, jsonb, uuid) from public;
grant execute on function tao_cau_hoi_cho_duyet(uuid, text, uuid, text, text, jsonb, uuid) to service_role;
