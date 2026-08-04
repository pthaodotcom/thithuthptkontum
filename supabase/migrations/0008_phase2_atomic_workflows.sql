-- Atomic workflows and RLS hardening for Phase 2.

create or replace function gui_yeu_cau_chinh_sua(
  p_cau_hoi_id uuid, p_nguoi_de_xuat_id uuid, p_noi_dung_de_xuat jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_mon_cau uuid; v_mon_gv uuid;
begin
  select cd.mon_id into v_mon_cau from cau_hoi ch
    join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id
    where ch.cau_hoi_id=p_cau_hoi_id and ch.trang_thai_duyet='DaDuyet' for update of ch;
  select mon_id into v_mon_gv from tai_khoan where tai_khoan_id=p_nguoi_de_xuat_id and vai_tro='GiaoVien';
  if v_mon_cau is null or v_mon_cau is distinct from v_mon_gv then raise exception using errcode='42501',message='VUOT_PHAM_VI_MON'; end if;
  if exists(select 1 from yeu_cau_chinh_sua where cau_hoi_id=p_cau_hoi_id and trang_thai='ChoDuyet') then
    raise exception using errcode='23505',message='YEU_CAU_TRUNG';
  end if;
  insert into yeu_cau_chinh_sua(cau_hoi_id,nguoi_de_xuat_tai_khoan_id,noi_dung_de_xuat)
    values(p_cau_hoi_id,p_nguoi_de_xuat_id,p_noi_dung_de_xuat) returning yc_id into v_id;
  return v_id;
end $$;

create or replace function quan_tri_cau_hoi(
  p_cau_hoi_id uuid, p_to_truong_id uuid, p_hanh_dong text, p_nhom_id uuid default null
) returns text language plpgsql security definer set search_path=public as $$
declare v_mon uuid; v_tt uuid; v_sd text;
begin
  select cd.mon_id,ch.trang_thai_su_dung into v_mon,v_sd from cau_hoi ch
    join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id
    where ch.cau_hoi_id=p_cau_hoi_id for update of ch;
  select to_truong_tai_khoan_id into v_tt from mon where mon_id=v_mon;
  if v_tt is distinct from p_to_truong_id then raise exception using errcode='42501',message='VUOT_PHAM_VI_MON'; end if;
  if p_hanh_dong='Xoa' then
    if v_sd<>'ChuaDung' then raise exception using errcode='55000',message='CAU_DA_DUNG_PHAI_VO_HIEU_HOA'; end if;
    delete from cau_hoi where cau_hoi_id=p_cau_hoi_id; return 'DaXoa';
  elsif p_hanh_dong='VoHieuHoa' then update cau_hoi set trang_thai_hoat_dong='VoHieuHoa' where cau_hoi_id=p_cau_hoi_id; return 'DaVoHieuHoa';
  elsif p_hanh_dong='GanNhom' then
    if p_nhom_id is not null and not exists(
      select 1 from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id
      join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id where ch.cau_hoi_id=p_nhom_id and cd.mon_id=v_mon
    ) then raise exception using errcode='42501',message='NHOM_KHONG_CUNG_MON'; end if;
    update cau_hoi set nhom_id=p_nhom_id where cau_hoi_id=p_cau_hoi_id; return 'DaGanNhom';
  end if;
  raise exception using errcode='22023',message='HANH_DONG_KHONG_HOP_LE';
end $$;

create or replace function tao_de_thi_nguyen_tu(
  p_ca_thi_mon_id uuid, p_nguoi_tao_id uuid, p_ma_tran jsonb, p_so_ma_de smallint
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_de uuid; v_mon mon%rowtype; v_tt uuid; v_cell jsonb; v_q record; v_need int;
  v_total_i int:=0; v_total_ii int:=0; v_total_iii int:=0; v_picked uuid[]:='{}'; v_group uuid[]:='{}';
begin
  if p_so_ma_de not between 1 and 4 or jsonb_typeof(p_ma_tran)<>'array' then raise exception using errcode='22023',message='DU_LIEU_DE_KHONG_HOP_LE'; end if;
  perform 1 from ca_thi_mon where id=p_ca_thi_mon_id for update;
  select m.* into v_mon from ca_thi_mon ctm join mon m on m.mon_id=ctm.mon_id where ctm.id=p_ca_thi_mon_id;
  if not found or v_mon.to_truong_tai_khoan_id is distinct from p_nguoi_tao_id then raise exception using errcode='42501',message='VUOT_PHAM_VI_MON'; end if;
  if exists(select 1 from de_thi where ca_thi_mon_id=p_ca_thi_mon_id and trang_thai in('DangSoan','DaGiaoChuaBatDau','DangThi')) then raise exception using errcode='23505',message='CA_THI_DA_CO_DE'; end if;

  for v_cell in select * from jsonb_array_elements(p_ma_tran) loop
    if (v_cell->>'so_luong')::int < 0 then raise exception using errcode='22023',message='SO_LUONG_KHONG_HOP_LE'; end if;
    case v_cell->>'phan' when 'I' then v_total_i:=v_total_i+(v_cell->>'so_luong')::int;
      when 'II' then v_total_ii:=v_total_ii+(v_cell->>'so_luong')::int;
      when 'III' then v_total_iii:=v_total_iii+(v_cell->>'so_luong')::int;
      else raise exception using errcode='22023',message='PHAN_KHONG_HOP_LE'; end case;
  end loop;
  if coalesce(v_mon.phan1_so_cau,0)<>v_total_i or coalesce(v_mon.phan2_so_cau,0)<>v_total_ii or coalesce(v_mon.phan3_so_cau,0)<>v_total_iii
    then raise exception using errcode='22023',message='SAI_TONG_CAU_THEO_CAU_HINH'; end if;

  insert into de_thi(ca_thi_mon_id,trang_thai,so_ma_de,nguoi_tao_tai_khoan_id,phan1_so_cau,phan1_diem_moi_cau,
    phan2_so_cau,phan2_diem_1y,phan2_diem_2y,phan2_diem_3y,phan2_diem_4y,phan3_so_cau,phan3_diem_moi_cau,ma_tran)
  values(p_ca_thi_mon_id,'DangSoan',p_so_ma_de,p_nguoi_tao_id,v_mon.phan1_so_cau,v_mon.phan1_diem_moi_cau,
    v_mon.phan2_so_cau,v_mon.phan2_diem_1y,v_mon.phan2_diem_2y,v_mon.phan2_diem_3y,v_mon.phan2_diem_4y,
    v_mon.phan3_so_cau,v_mon.phan3_diem_moi_cau,p_ma_tran) returning de_thi_id into v_de;

  for v_cell in select * from jsonb_array_elements(p_ma_tran) loop
    v_need:=(v_cell->>'so_luong')::int;
    for v_q in
      select ch.*,cd.chuyen_de_id from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id=ch.bai_hoc_id
      join chuyen_de cd on cd.chuyen_de_id=bh.chuyen_de_id
      where cd.mon_id=v_mon.mon_id and cd.chuyen_de_id=(v_cell->>'chuyen_de_id')::uuid
        and ch.muc_do_id=(v_cell->>'muc_do_id')::uuid and ch.phan=v_cell->>'phan'
        and ch.trang_thai_duyet='DaDuyet' and ch.trang_thai_su_dung='ChuaDung' and ch.trang_thai_hoat_dong='DangHoatDong'
        and not(ch.cau_hoi_id=any(v_picked)) and not(coalesce(ch.nhom_id,ch.cau_hoi_id)=any(v_group))
      order by random() for update of ch skip locked limit v_need
    loop
      insert into cau_hoi_snapshot(de_thi_id,cau_hoi_goc_id,phan,chuyen_de_id,muc_do_id,noi_dung,dap_an_phan3)
        values(v_de,v_q.cau_hoi_id,v_q.phan,v_q.chuyen_de_id,v_q.muc_do_id,v_q.noi_dung,v_q.dap_an_phan3)
        returning snapshot_id into v_tt;
      insert into chi_tiet_cau_hoi_snapshot(cau_hoi_snapshot_id,thu_tu,noi_dung,la_dap_an_dung)
        select v_tt,thu_tu,noi_dung,la_dap_an_dung from chi_tiet_cau_hoi where cau_hoi_id=v_q.cau_hoi_id;
      v_picked:=array_append(v_picked,v_q.cau_hoi_id);v_group:=array_append(v_group,coalesce(v_q.nhom_id,v_q.cau_hoi_id));v_need:=v_need-1;
    end loop;
    if v_need<>0 then raise exception using errcode='P0001',message='O_MA_TRAN_THIEU_'||(v_cell->>'phan')||'_'||(v_cell->>'chuyen_de_id')||'_'||(v_cell->>'muc_do_id')||'_'||v_need; end if;
  end loop;
  update cau_hoi set trang_thai_su_dung='DaDung' where cau_hoi_id=any(v_picked);
  for v_need in 1..p_so_ma_de loop
    insert into ma_de(de_thi_id,so_thu_tu_ma,thu_tu_hien_thi)
    select v_de,v_need,jsonb_agg(jsonb_build_object(
      'snapshot_id',s.snapshot_id,'phan',s.phan,'thu_tu_phuong_an',
      case when s.phan='I' then (select jsonb_agg(x.thu_tu order by random()) from chi_tiet_cau_hoi_snapshot x where x.cau_hoi_snapshot_id=s.snapshot_id)
           when s.phan='II' then '[1,2,3,4]'::jsonb else '[]'::jsonb end
    ) order by s.phan,random()) from cau_hoi_snapshot s where s.de_thi_id=v_de;
  end loop;
  return v_de;
end $$;

create or replace function giao_de_thi(p_de_thi_id uuid,p_nguoi_tao_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 update de_thi set trang_thai='DaGiaoChuaBatDau' where de_thi_id=p_de_thi_id and nguoi_tao_tai_khoan_id=p_nguoi_tao_id and trang_thai='DangSoan';
 if not found then raise exception using errcode='42501',message='KHONG_THE_GIAO_DE'; end if;
end $$;

create or replace function huy_de_dang_soan(p_de_thi_id uuid,p_nguoi_tao_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare v_ids uuid[];
begin
 perform 1 from de_thi where de_thi_id=p_de_thi_id and nguoi_tao_tai_khoan_id=p_nguoi_tao_id and trang_thai='DangSoan' for update;
 if not found then raise exception using errcode='42501',message='KHONG_THE_HUY_DE'; end if;
 select array_agg(cau_hoi_goc_id) into v_ids from cau_hoi_snapshot where de_thi_id=p_de_thi_id;
 if v_ids is null then raise exception using errcode='42501',message='KHONG_THE_HUY_DE'; end if;
 delete from de_thi where de_thi_id=p_de_thi_id;
 update cau_hoi ch set trang_thai_su_dung='ChuaDung' where ch.cau_hoi_id=any(v_ids)
  and not exists(select 1 from cau_hoi_snapshot s join de_thi d on d.de_thi_id=s.de_thi_id where s.cau_hoi_goc_id=ch.cau_hoi_id);
end $$;

revoke all on function gui_yeu_cau_chinh_sua(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function quan_tri_cau_hoi(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function tao_de_thi_nguyen_tu(uuid,uuid,jsonb,smallint) from public,anon,authenticated;
revoke all on function giao_de_thi(uuid,uuid) from public,anon,authenticated;
revoke all on function huy_de_dang_soan(uuid,uuid) from public,anon,authenticated;
grant execute on function gui_yeu_cau_chinh_sua(uuid,uuid,jsonb) to service_role;
grant execute on function quan_tri_cau_hoi(uuid,uuid,text,uuid) to service_role;
grant execute on function tao_de_thi_nguyen_tu(uuid,uuid,jsonb,smallint) to service_role;
grant execute on function giao_de_thi(uuid,uuid) to service_role;
grant execute on function huy_de_dang_soan(uuid,uuid) to service_role;
