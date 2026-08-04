-- FR-M3-03: mỗi mã đề là một bộ câu độc lập; hoàn tất sẽ snapshot và giao đề ngay.
create or replace function tao_va_giao_de_thi_v2(
  p_ca_thi_mon_id uuid,
  p_nguoi_tao_id uuid,
  p_ma_tran jsonb,
  p_cau_hoi_theo_ma jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_de uuid; v_mon mon%rowtype; v_code jsonb; v_question_id uuid; v_q record;
  v_snapshot_id uuid; v_display jsonb; v_so_ma int; v_expected int;
begin
  if jsonb_typeof(p_ma_tran)<>'array' or jsonb_typeof(p_cau_hoi_theo_ma)<>'array'
     or jsonb_array_length(p_cau_hoi_theo_ma) not between 1 and 4 then
    raise exception using errcode='22023',message='DU_LIEU_DE_KHONG_HOP_LE';
  end if;

  perform 1 from ca_thi_mon where id=p_ca_thi_mon_id for update;
  select m.* into v_mon from ca_thi_mon ctm join mon m on m.mon_id=ctm.mon_id
    where ctm.id=p_ca_thi_mon_id;
  if not found or v_mon.to_truong_tai_khoan_id is distinct from p_nguoi_tao_id then
    raise exception using errcode='42501',message='VUOT_PHAM_VI_MON';
  end if;
  if exists(select 1 from de_thi where ca_thi_mon_id=p_ca_thi_mon_id and trang_thai in('DangSoan','DaGiaoChuaBatDau','DangThi')) then
    raise exception using errcode='23505',message='CA_THI_DA_CO_DE';
  end if;

  v_expected:=coalesce(v_mon.phan1_so_cau,0)+coalesce(v_mon.phan2_so_cau,0)+coalesce(v_mon.phan3_so_cau,0);
  if exists(select 1 from jsonb_array_elements(p_cau_hoi_theo_ma) c where jsonb_array_length(c->'cau_hoi_ids')<>v_expected) then
    raise exception using errcode='22023',message='SAI_SO_CAU_TRONG_MA_DE';
  end if;
  if (select count(*) from jsonb_array_elements(p_cau_hoi_theo_ma) c, jsonb_array_elements_text(c->'cau_hoi_ids')) <>
     (select count(distinct x::uuid) from jsonb_array_elements(p_cau_hoi_theo_ma) c, jsonb_array_elements_text(c->'cau_hoi_ids') x) then
    raise exception using errcode='22023',message='TRUNG_CAU_GIUA_CAC_MA_DE';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_cau_hoi_theo_ma) c
    where (select count(*) from jsonb_array_elements_text(c->'cau_hoi_ids')) <>
          (select count(distinct coalesce(q.nhom_id,q.cau_hoi_id))
             from jsonb_array_elements_text(c->'cau_hoi_ids') x join cau_hoi q on q.cau_hoi_id=x::uuid)
  ) then raise exception using errcode='22023',message='TRUNG_NHOM_CAU_TRONG_MA_DE'; end if;

  insert into de_thi(ca_thi_mon_id,trang_thai,so_ma_de,nguoi_tao_tai_khoan_id,phan1_so_cau,phan1_diem_moi_cau,
    phan2_so_cau,phan2_diem_1y,phan2_diem_2y,phan2_diem_3y,phan2_diem_4y,phan3_so_cau,phan3_diem_moi_cau,ma_tran)
  values(p_ca_thi_mon_id,'DaGiaoChuaBatDau',jsonb_array_length(p_cau_hoi_theo_ma),p_nguoi_tao_id,
    v_mon.phan1_so_cau,v_mon.phan1_diem_moi_cau,v_mon.phan2_so_cau,v_mon.phan2_diem_1y,v_mon.phan2_diem_2y,
    v_mon.phan2_diem_3y,v_mon.phan2_diem_4y,v_mon.phan3_so_cau,v_mon.phan3_diem_moi_cau,p_ma_tran)
  returning de_thi_id into v_de;

  for v_code in select * from jsonb_array_elements(p_cau_hoi_theo_ma) loop
    v_so_ma:=(v_code->>'so_ma')::int; v_display:='[]'::jsonb;
    for v_question_id in select x::uuid from jsonb_array_elements_text(v_code->'cau_hoi_ids') x loop
      select ch.*,cd.chuyen_de_id into v_q from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id
        join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id
        where ch.cau_hoi_id=v_question_id and cd.mon_id=v_mon.mon_id and ch.trang_thai_duyet='DaDuyet'
          and ch.trang_thai_su_dung='ChuaDung' and ch.trang_thai_hoat_dong='DangHoatDong' for update of ch;
      if not found then raise exception using errcode='P0001',message='CAU_HOI_KHONG_CON_HOP_LE'; end if;
      insert into cau_hoi_snapshot(de_thi_id,cau_hoi_goc_id,phan,chuyen_de_id,muc_do_id,noi_dung,dap_an_phan3)
        values(v_de,v_q.cau_hoi_id,v_q.phan,v_q.chuyen_de_id,v_q.muc_do_id,v_q.noi_dung,v_q.dap_an_phan3)
        returning snapshot_id into v_snapshot_id;
      insert into chi_tiet_cau_hoi_snapshot(cau_hoi_snapshot_id,thu_tu,noi_dung,la_dap_an_dung)
        select v_snapshot_id,thu_tu,noi_dung,la_dap_an_dung from chi_tiet_cau_hoi where cau_hoi_id=v_q.cau_hoi_id;
      v_display:=v_display||jsonb_build_array(jsonb_build_object('snapshot_id',v_snapshot_id,'phan',v_q.phan,
        'thu_tu_phuong_an',case when v_q.phan='I' then (select jsonb_agg(x.thu_tu order by random()) from chi_tiet_cau_hoi x where x.cau_hoi_id=v_q.cau_hoi_id) when v_q.phan='II' then '[1,2,3,4]'::jsonb else '[]'::jsonb end));
      update cau_hoi set trang_thai_su_dung='DaDung' where cau_hoi_id=v_q.cau_hoi_id;
    end loop;
    insert into ma_de(de_thi_id,so_thu_tu_ma,thu_tu_hien_thi) values(v_de,v_so_ma,v_display);
  end loop;
  return v_de;
end $$;

revoke all on function tao_va_giao_de_thi_v2(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function tao_va_giao_de_thi_v2(uuid,uuid,jsonb,jsonb) to service_role;
