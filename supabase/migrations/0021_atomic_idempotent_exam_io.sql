-- Reduce remote round-trips under light load by combining the idempotency
-- claim, business mutation and stored response in one database transaction.

create or replace function luu_bai_idempotent(
  p_bai_lam_id uuid,
  p_hoc_sinh_id uuid,
  p_idempotency_key uuid,
  p_payload_hash text,
  p_tra_loi jsonb
) returns table(response_body jsonb, idempotency_replay boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim idempotency_request%rowtype;
  v_now timestamptz := clock_timestamp();
  v_count integer := jsonb_array_length(coalesce(p_tra_loi, '[]'::jsonb));
  v_body jsonb;
begin
  begin
    insert into idempotency_request(
      tai_khoan_id, bai_lam_id, loai, idempotency_key, payload_hash
    ) values (
      p_hoc_sinh_id, p_bai_lam_id, 'autosave',
      p_idempotency_key, p_payload_hash
    );
  exception when unique_violation then
    select * into v_claim
    from idempotency_request
    where tai_khoan_id = p_hoc_sinh_id
      and bai_lam_id = p_bai_lam_id
      and loai = 'autosave'
      and idempotency_key = p_idempotency_key
    for update;
    if v_claim.payload_hash <> p_payload_hash then
      raise exception using errcode = '22023', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    if v_claim.response_body is not null then
      return query select v_claim.response_body, true;
      return;
    end if;
  end;

  if not exists (
    select 1 from bai_lam_thi
    where bai_lam_id = p_bai_lam_id
      and hoc_sinh_tai_khoan_id = p_hoc_sinh_id
  ) then
    raise exception using errcode = 'P0002', message = 'KHONG_TIM_THAY_BAI';
  end if;
  if not exists (
    select 1 from bai_lam_thi
    where bai_lam_id = p_bai_lam_id
      and hoc_sinh_tai_khoan_id = p_hoc_sinh_id
      and trang_thai = 'DangThi'
  ) then
    raise exception using errcode = '55000', message = 'BAI_DA_KHOA';
  end if;

  insert into tra_loi(
    bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu,
    dap_an_lua_chon_id, dap_an_dung_sai, dap_an_chuoi, thoi_diem_luu
  )
  select
    p_bai_lam_id,
    (answer->>'cauHoiSnapshotId')::uuid,
    coalesce((answer->>'chiTietThuTu')::smallint, 0),
    nullif(answer->>'dapAnLuaChonId', '')::uuid,
    nullif(answer->>'dapAnDungSai', '')::boolean,
    nullif(answer->>'dapAnChuoi', ''),
    v_now
  from jsonb_array_elements(coalesce(p_tra_loi, '[]'::jsonb)) answer
  on conflict(bai_lam_id, cau_hoi_snapshot_id, chi_tiet_thu_tu)
  do update set
    dap_an_lua_chon_id = excluded.dap_an_lua_chon_id,
    dap_an_dung_sai = excluded.dap_an_dung_sai,
    dap_an_chuoi = excluded.dap_an_chuoi,
    thoi_diem_luu = excluded.thoi_diem_luu;

  v_body := jsonb_build_object('data', jsonb_build_object(
    'daLuu', v_count,
    'thoiDiem', v_now,
    'idempotencyReplay', false
  ));
  update idempotency_request
  set response_body = v_body, response_status = 200, completed_at = v_now
  where tai_khoan_id = p_hoc_sinh_id
    and bai_lam_id = p_bai_lam_id
    and loai = 'autosave'
    and idempotency_key = p_idempotency_key;
  return query select v_body, false;
end
$$;

create or replace function nop_bai_idempotent(
  p_bai_lam_id uuid,
  p_hoc_sinh_id uuid,
  p_idempotency_key uuid,
  p_payload_hash text,
  p_ly_do text,
  p_canh_bao_luu_cuoi boolean default false
) returns table(response_body jsonb, idempotency_replay boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim idempotency_request%rowtype;
  v_result record;
  v_body jsonb;
begin
  begin
    insert into idempotency_request(
      tai_khoan_id, bai_lam_id, loai, idempotency_key, payload_hash
    ) values (
      p_hoc_sinh_id, p_bai_lam_id, 'submit',
      p_idempotency_key, p_payload_hash
    );
  exception when unique_violation then
    select * into v_claim
    from idempotency_request
    where tai_khoan_id = p_hoc_sinh_id
      and bai_lam_id = p_bai_lam_id
      and loai = 'submit'
      and idempotency_key = p_idempotency_key
    for update;
    if v_claim.payload_hash <> p_payload_hash then
      raise exception using errcode = '22023', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    if v_claim.response_body is not null then
      return query select v_claim.response_body, true;
      return;
    end if;
  end;

  select * into v_result
  from nop_va_cham_bai(
    p_bai_lam_id, p_hoc_sinh_id, p_ly_do, p_canh_bao_luu_cuoi
  );
  v_body := jsonb_build_object('data', jsonb_build_object(
    'diemTong', v_result.diem_tong,
    'soCauDung', v_result.so_cau_dung,
    'soCauSai', v_result.so_cau_sai,
    'thoiDiemNop', v_result.thoi_diem_nop,
    'daNopTruoc', v_result.da_nop_truoc,
    'idempotencyReplay', false
  ));
  update idempotency_request
  set response_body = v_body, response_status = 200, completed_at = now()
  where tai_khoan_id = p_hoc_sinh_id
    and bai_lam_id = p_bai_lam_id
    and loai = 'submit'
    and idempotency_key = p_idempotency_key;
  return query select v_body, false;
end
$$;

revoke all on function luu_bai_idempotent(uuid,uuid,uuid,text,jsonb)
  from public, anon, authenticated;
revoke all on function nop_bai_idempotent(uuid,uuid,uuid,text,text,boolean)
  from public, anon, authenticated;
grant execute on function luu_bai_idempotent(uuid,uuid,uuid,text,jsonb)
  to service_role;
grant execute on function nop_bai_idempotent(uuid,uuid,uuid,text,text,boolean)
  to service_role;

