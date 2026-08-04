-- FR-M5-01/04: submit and grade an exam in one database transaction.
-- The row lock serializes concurrent submissions for the same attempt. All
-- answer keys and scoring weights are read from the immutable exam snapshot.

create or replace function nop_va_cham_bai(
  p_bai_lam_id uuid,
  p_hoc_sinh_id uuid,
  p_ly_do text,
  p_canh_bao_luu_cuoi boolean default false
) returns table(
  diem_tong numeric,
  so_cau_dung integer,
  so_cau_sai integer,
  thoi_diem_nop timestamptz,
  da_nop_truoc boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bai bai_lam_thi%rowtype;
  v_de de_thi%rowtype;
  v_diem numeric := 0;
  v_so_cau_dung integer := 0;
  v_so_cau_sai integer := 0;
  v_thoi_diem_nop timestamptz := clock_timestamp();
begin
  if p_ly_do not in ('TuNop', 'HetGio', 'ViPham') then
    raise exception using errcode = '22023', message = 'LY_DO_NOP_KHONG_HOP_LE';
  end if;

  select *
  into v_bai
  from bai_lam_thi
  where bai_lam_id = p_bai_lam_id
    and hoc_sinh_tai_khoan_id = p_hoc_sinh_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'KHONG_TIM_THAY_BAI';
  end if;

  -- Idempotent response after waiting for any concurrent submitter holding the
  -- row lock. The first transaction is the only one that performs grading.
  if v_bai.trang_thai = 'DaNopBai' then
    return query
      select v_bai.diem_tong, v_bai.so_cau_dung::integer,
        v_bai.so_cau_sai::integer, v_bai.thoi_diem_nop, true;
    return;
  end if;

  if v_bai.trang_thai <> 'DangThi' or v_bai.de_thi_id is null then
    raise exception using errcode = '55000', message = 'BAI_KHONG_HOAT_DONG';
  end if;

  if p_ly_do = 'ViPham' and (
    select count(*) from vi_pham where bai_lam_id = v_bai.bai_lam_id
  ) < 3 then
    raise exception using errcode = '55000', message = 'CHUA_DU_VI_PHAM';
  end if;

  select *
  into v_de
  from de_thi
  where de_thi_id = v_bai.de_thi_id;

  if not found then
    raise exception using errcode = '23503', message = 'KHONG_TIM_THAY_DE_THI';
  end if;

  with ket_qua_cau as (
    select
      cau.snapshot_id,
      case cau.phan
        when 'I' then coalesce(chi_tiet.phan_1_dung, false)
        when 'II' then chi_tiet.so_y_dung = 4
        when 'III' then exists (
          select 1
          from tra_loi tl
          where tl.bai_lam_id = v_bai.bai_lam_id
            and tl.cau_hoi_snapshot_id = cau.snapshot_id
            and tl.chi_tiet_thu_tu = 0
            and tl.dap_an_chuoi = cau.dap_an_phan3
        )
        else false
      end as la_cau_dung,
      case cau.phan
        when 'I' then
          case when coalesce(chi_tiet.phan_1_dung, false)
            then coalesce(v_de.phan1_diem_moi_cau, 0) else 0 end
        when 'II' then
          case chi_tiet.so_y_dung
            when 1 then coalesce(v_de.phan2_diem_1y, 0)
            when 2 then coalesce(v_de.phan2_diem_2y, 0)
            when 3 then coalesce(v_de.phan2_diem_3y, 0)
            when 4 then coalesce(v_de.phan2_diem_4y, 0)
            else 0
          end
        when 'III' then
          case when exists (
            select 1
            from tra_loi tl
            where tl.bai_lam_id = v_bai.bai_lam_id
              and tl.cau_hoi_snapshot_id = cau.snapshot_id
              and tl.chi_tiet_thu_tu = 0
              and tl.dap_an_chuoi = cau.dap_an_phan3
          ) then coalesce(v_de.phan3_diem_moi_cau, 0) else 0 end
        else 0
      end as diem_cau
    from cau_hoi_snapshot cau
    left join lateral (
      select
        coalesce(bool_or(
          ct.la_dap_an_dung
          and tl.dap_an_lua_chon_id = ct.id
        ), false) as phan_1_dung,
        count(*) filter (
          where tl.id is not null
            and tl.dap_an_dung_sai = ct.la_dap_an_dung
        )::integer as so_y_dung
      from chi_tiet_cau_hoi_snapshot ct
      left join tra_loi tl
        on tl.bai_lam_id = v_bai.bai_lam_id
       and tl.cau_hoi_snapshot_id = cau.snapshot_id
       and (
         (cau.phan = 'I' and tl.chi_tiet_thu_tu = 0)
         or (cau.phan = 'II' and tl.chi_tiet_thu_tu = ct.thu_tu)
       )
      where ct.cau_hoi_snapshot_id = cau.snapshot_id
    ) chi_tiet on true
    where cau.de_thi_id = v_bai.de_thi_id
  )
  select
    round(coalesce(sum(diem_cau), 0), 2),
    count(*) filter (where la_cau_dung)::integer,
    count(*) filter (where not la_cau_dung)::integer
  into v_diem, v_so_cau_dung, v_so_cau_sai
  from ket_qua_cau;

  update bai_lam_thi
  set trang_thai = 'DaNopBai',
      thoi_diem_nop = v_thoi_diem_nop,
      diem_tong = v_diem,
      so_cau_dung = v_so_cau_dung,
      so_cau_sai = v_so_cau_sai,
      ly_do_nop = p_ly_do,
      canh_bao_luu_cuoi = coalesce(p_canh_bao_luu_cuoi, false)
  where bai_lam_id = v_bai.bai_lam_id;

  insert into audit_log(
    hanh_dong,
    doi_tuong,
    doi_tuong_id,
    nguoi_thuc_hien_tai_khoan_id,
    du_lieu
  ) values (
    'NopBai',
    'BaiLamThi',
    v_bai.bai_lam_id,
    p_hoc_sinh_id,
    jsonb_build_object(
      'ly_do', p_ly_do,
      'canh_bao_luu_cuoi', coalesce(p_canh_bao_luu_cuoi, false),
      'diem_tong', v_diem,
      'so_cau_dung', v_so_cau_dung,
      'so_cau_sai', v_so_cau_sai
    )
  );

  return query
    select v_diem, v_so_cau_dung, v_so_cau_sai,
      v_thoi_diem_nop, false;
end
$$;

revoke all on function nop_va_cham_bai(uuid,uuid,text,boolean)
  from public, anon, authenticated;
grant execute on function nop_va_cham_bai(uuid,uuid,text,boolean)
  to service_role;
