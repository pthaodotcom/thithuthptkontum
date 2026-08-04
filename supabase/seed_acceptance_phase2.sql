-- Manual acceptance data for Toan, Vat ly and Tin hoc.
-- Run explicitly in a disposable dev/test project only. This file intentionally
-- lives outside migrations because it creates known-password test accounts.
do $$
declare m record; v_teacher uuid; v_cd uuid; v_bh uuid; v_md uuid; v_q uuid; i int; p text; n int;
  v_hash text := crypt('Totruong@123', gen_salt('bf'));
  v_giao_vien_hash text := crypt('Giaovien@123', gen_salt('bf'));
begin
  insert into mon(ten_mon,loai_mon,thu_tu_ca_bat_buoc,phan1_so_cau,phan1_diem_moi_cau,phan2_so_cau,phan2_diem_1y,phan2_diem_2y,phan2_diem_3y,phan2_diem_4y,phan3_so_cau,phan3_diem_moi_cau)
  values('Tin hoc','TuChon',null,12,.25,4,.1,.25,.5,1,6,.5) on conflict(ten_mon) do nothing;
  for m in select * from mon where ten_mon in('Toan','Vat ly','Tin hoc') loop
    insert into tai_khoan(ma_so,ho_ten,mat_khau_hash,vai_tro,nam_sinh,phai_doi_mat_khau,mon_id)
      values(case m.ten_mon when 'Toan' then 'totruongtoan' when 'Vat ly' then 'totruongvatly' else 'totruongtinhoc' end,
        'Tổ trưởng '||m.ten_mon,v_hash,'GiaoVien',1985,false,m.mon_id)
      on conflict(ma_so) do update set mon_id=excluded.mon_id returning tai_khoan_id into v_teacher;
    update mon set to_truong_tai_khoan_id=v_teacher where mon_id=m.mon_id;
    insert into tai_khoan(ma_so,ho_ten,mat_khau_hash,vai_tro,nam_sinh,phai_doi_mat_khau,mon_id)
      values(case m.ten_mon when 'Toan' then 'giaovientoan' when 'Vat ly' then 'giaovienvatly' else 'giaovientinhoc' end,
        'Giáo viên '||m.ten_mon,v_giao_vien_hash,'GiaoVien',1990,false,m.mon_id)
      on conflict(ma_so) do update set mon_id=excluded.mon_id;
    select chuyen_de_id into v_cd from chuyen_de where mon_id=m.mon_id and ten_chuyen_de='Chuyên đề nghiệm thu';
    if v_cd is null then insert into chuyen_de(mon_id,ten_chuyen_de) values(m.mon_id,'Chuyên đề nghiệm thu') returning chuyen_de_id into v_cd; end if;
    select bai_hoc_id into v_bh from bai_hoc where chuyen_de_id=v_cd and ten_bai_hoc='Bài học nghiệm thu';
    if v_bh is null then insert into bai_hoc(chuyen_de_id,ten_bai_hoc) values(v_cd,'Bài học nghiệm thu') returning bai_hoc_id into v_bh; end if;
    select muc_do_id into v_md from muc_do_nhan_thuc order by thu_tu limit 1;
    for p,n in select * from (values('I',m.phan1_so_cau),('II',m.phan2_so_cau),('III',m.phan3_so_cau)) x(phan,so_cau) loop
      for i in 1..coalesce(n,0) loop
        if not exists(select 1 from cau_hoi where bai_hoc_id=v_bh and phan=p and noi_dung='Câu nghiệm thu '||p||' số '||i) then
          insert into cau_hoi(bai_hoc_id,phan,muc_do_id,noi_dung,dap_an_phan3,trang_thai_duyet,nguoi_tao_tai_khoan_id,nguoi_duyet_tai_khoan_id,ngay_duyet)
            values(v_bh,p,v_md,'Câu nghiệm thu '||p||' số '||i,case when p='III' then '1234' end,'DaDuyet',v_teacher,v_teacher,now()) returning cau_hoi_id into v_q;
          if p<>'III' then
            insert into chi_tiet_cau_hoi(cau_hoi_id,thu_tu,noi_dung,la_dap_an_dung)
            select v_q,x,'Lựa chọn/ý '||x,case when p='I' then x=1 else x in(1,3) end from generate_series(1,4) x;
          end if;
        end if;
      end loop;
    end loop;
  end loop;
end $$;

do $$
declare v_dot uuid; v_ca uuid; v_mon uuid; i int;
begin
 insert into dot_thi(ten_dot_thi,nam_hoc,ngay_thi_1,ngay_thi_2) values('Đợt nghiệm thu Phase 2','2030-2031','2030-12-10','2030-12-11')
 on conflict(ten_dot_thi,nam_hoc) do update set ten_dot_thi=excluded.ten_dot_thi returning dot_thi_id into v_dot;
 for i in 1..4 loop
  insert into ca_thi(dot_thi_id,so_thu_tu_ca,gio_bat_dau,gio_ket_thuc) values(v_dot,i,'2030-12-10 07:00+07'::timestamptz+(i-1)*interval '2 hour','2030-12-10 08:30+07'::timestamptz+(i-1)*interval '2 hour')
  on conflict(dot_thi_id,so_thu_tu_ca) do update set trang_thai='SapDienRa' returning ca_thi_id into v_ca;
  for v_mon in select mon_id from mon where ten_mon in('Toan','Vat ly','Tin hoc') loop
   insert into ca_thi_mon(ca_thi_id,mon_id) values(v_ca,v_mon) on conflict do nothing;
  end loop;
 end loop;
end $$;
