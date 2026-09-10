-- DEV/TEST ONLY.
-- Idempotent M4 Informatics bank and a complete exam fixture.
-- Prerequisite: migrations through 0019_m4_subject_catalog.sql.

do $$
declare
  v_mon_tin uuid;
  v_mon_vat_li uuid;
  v_muc_do uuid;
  v_chuyen_de uuid := 'a4000000-0000-0000-0000-000000000001';
  v_bai_hoc uuid := 'a4000000-0000-0000-0000-000000000002';
  v_q uuid;
  v_snapshot uuid;
  v_i integer;
  v_n integer;
  v_prompts text[] := array[
    'Thiết bị nào thực hiện xử lí dữ liệu trong máy tính?',
    'Bộ nhớ nào mất dữ liệu khi máy tính tắt nguồn?',
    'Đơn vị nhỏ nhất dùng để biểu diễn thông tin số là gì?',
    'Phần mềm nào quản lí tài nguyên phần cứng của máy tính?',
    'Giao thức nào được dùng để truyền tải trang web an toàn?',
    'Địa chỉ IPv4 gồm bao nhiêu bit?',
    'Thiết bị nào kết nối các mạng máy tính khác nhau?',
    'Mật khẩu nào có độ an toàn cao nhất?',
    'Hành vi nào giúp phòng tránh thư điện tử lừa đảo?',
    'Bản quyền phần mềm bảo vệ đối tượng nào?',
    'Trong bảng tính, công thức phải bắt đầu bằng kí tự nào?',
    'Hàm nào thường dùng để tính tổng trong bảng tính?',
    'Khóa chính trong cơ sở dữ liệu có đặc điểm gì?',
    'Câu lệnh SQL nào dùng để truy vấn dữ liệu?',
    'Thuật toán là gì?',
    'Cấu trúc rẽ nhánh được dùng khi nào?',
    'Vòng lặp phù hợp với bài toán nào?',
    'Kiểu dữ liệu Boolean lưu những giá trị nào?',
    'Biến trong chương trình dùng để làm gì?',
    'Lỗi cú pháp được phát hiện ở giai đoạn nào?',
    'Trí tuệ nhân tạo tạo sinh có khả năng chính nào?',
    'Dữ liệu huấn luyện thiên lệch có thể gây ra điều gì?',
    'Khi dùng nội dung do AI tạo, người học nên làm gì?',
    'Biện pháp nào bảo vệ dữ liệu cá nhân khi dùng dịch vụ trực tuyến?'
  ];
  v_correct text[] := array[
    'Bộ xử lí trung tâm (CPU)',
    'RAM',
    'Bit',
    'Hệ điều hành',
    'HTTPS',
    '32 bit',
    'Bộ định tuyến',
    'T9!mQ2#vL8',
    'Kiểm tra địa chỉ người gửi và liên kết trước khi mở',
    'Chương trình máy tính và quyền khai thác hợp pháp',
    'Dấu bằng (=)',
    'SUM',
    'Mỗi giá trị là duy nhất và không để trống',
    'SELECT',
    'Một dãy hữu hạn các bước giải bài toán',
    'Khi cần lựa chọn hành động theo điều kiện',
    'Lặp lại một nhóm thao tác nhiều lần',
    'Đúng và Sai',
    'Lưu giá trị có thể thay đổi khi chương trình chạy',
    'Khi phân tích hoặc biên dịch chương trình',
    'Tạo nội dung mới từ mẫu dữ liệu đã học',
    'Kết quả không công bằng hoặc sai lệch',
    'Kiểm chứng thông tin và ghi nhận nguồn hỗ trợ',
    'Bật xác thực hai yếu tố và giới hạn dữ liệu chia sẻ'
  ];
begin
  select mon_id into v_mon_tin from mon
  where ten_mon = 'Tin học' and loai_mon = 'TuChon' and trang_thai = 'DangDung';
  select mon_id into v_mon_vat_li from mon
  where ten_mon = 'Vật lí' and loai_mon = 'TuChon' and trang_thai = 'DangDung';
  select muc_do_id into v_muc_do from muc_do_nhan_thuc order by thu_tu limit 1;

  if v_mon_tin is null then raise exception 'MISSING_CANONICAL_TIN_HOC'; end if;
  if v_mon_vat_li is null then raise exception 'MISSING_CANONICAL_VAT_LI'; end if;
  if v_muc_do is null then raise exception 'MISSING_COGNITIVE_LEVEL'; end if;

  insert into chuyen_de(chuyen_de_id, mon_id, ten_chuyen_de, trang_thai)
  values(v_chuyen_de, v_mon_tin, 'Tin học và chuyển đổi số', 'DangDung')
  on conflict(chuyen_de_id) do update
    set mon_id = excluded.mon_id,
        ten_chuyen_de = excluded.ten_chuyen_de,
        trang_thai = excluded.trang_thai;

  insert into bai_hoc(bai_hoc_id, chuyen_de_id, ten_bai_hoc, trang_thai)
  values(v_bai_hoc, v_chuyen_de, 'Kiến thức Tin học tổng hợp', 'DangDung')
  on conflict(bai_hoc_id) do update
    set chuyen_de_id = excluded.chuyen_de_id,
        ten_bai_hoc = excluded.ten_bai_hoc,
        trang_thai = excluded.trang_thai;

  for v_i in 1..24 loop
    v_q := ('a4100000-0000-0000-0000-' || lpad(v_i::text, 12, '0'))::uuid;
    insert into cau_hoi(
      cau_hoi_id, bai_hoc_id, phan, muc_do_id, noi_dung,
      dap_an_phan3, trang_thai_duyet, trang_thai_su_dung,
      trang_thai_hoat_dong
    ) values (
      v_q, v_bai_hoc, 'I', v_muc_do,
      '<p><strong>Câu ' || v_i || '.</strong> ' || v_prompts[v_i] || '</p>',
      null, 'DaDuyet', 'ChuaDung', 'DangHoatDong'
    )
    on conflict(cau_hoi_id) do update
      set bai_hoc_id = excluded.bai_hoc_id,
          phan = excluded.phan,
          muc_do_id = excluded.muc_do_id,
          noi_dung = excluded.noi_dung,
          trang_thai_duyet = 'DaDuyet',
          trang_thai_hoat_dong = 'DangHoatDong';

    for v_n in 1..4 loop
      insert into chi_tiet_cau_hoi(
        id, cau_hoi_id, thu_tu, noi_dung, la_dap_an_dung
      ) values (
        ('a4200000-0000-0000-0000-' ||
          lpad((v_i * 10 + v_n)::text, 12, '0'))::uuid,
        v_q, v_n,
        case v_n
          when 1 then v_correct[v_i]
          when 2 then 'Phương án nhiễu A'
          when 3 then 'Phương án nhiễu B'
          else 'Phương án nhiễu C'
        end,
        v_n = 1
      )
      on conflict(cau_hoi_id, thu_tu) do update
        set noi_dung = excluded.noi_dung,
            la_dap_an_dung = excluded.la_dap_an_dung;
    end loop;
  end loop;

  for v_i in 1..4 loop
    v_q := ('a4300000-0000-0000-0000-' || lpad(v_i::text, 12, '0'))::uuid;
    insert into cau_hoi(
      cau_hoi_id, bai_hoc_id, phan, muc_do_id, noi_dung,
      dap_an_phan3, trang_thai_duyet, trang_thai_su_dung,
      trang_thai_hoat_dong
    ) values (
      v_q, v_bai_hoc, 'II', v_muc_do,
      '<p><strong>Câu đúng/sai ' || v_i ||
        '.</strong> Đánh giá các phát biểu về an toàn và ứng dụng Tin học.</p>',
      null, 'DaDuyet', 'ChuaDung', 'DangHoatDong'
    )
    on conflict(cau_hoi_id) do update
      set bai_hoc_id = excluded.bai_hoc_id,
          phan = excluded.phan,
          muc_do_id = excluded.muc_do_id,
          noi_dung = excluded.noi_dung,
          trang_thai_duyet = 'DaDuyet',
          trang_thai_hoat_dong = 'DangHoatDong';

    for v_n in 1..4 loop
      insert into chi_tiet_cau_hoi(
        id, cau_hoi_id, thu_tu, noi_dung, la_dap_an_dung
      ) values (
        ('a4400000-0000-0000-0000-' ||
          lpad((v_i * 10 + v_n)::text, 12, '0'))::uuid,
        v_q, v_n,
        case v_n
          when 1 then 'Cần kiểm chứng nguồn trước khi chia sẻ thông tin.'
          when 2 then 'Có thể công khai mật khẩu nếu chỉ dùng trong thời gian ngắn.'
          when 3 then 'Xác thực hai yếu tố làm giảm rủi ro mất tài khoản.'
          else 'Mọi kết quả do AI tạo đều chính xác tuyệt đối.'
        end,
        v_n in (1, 3)
      )
      on conflict(cau_hoi_id, thu_tu) do update
        set noi_dung = excluded.noi_dung,
            la_dap_an_dung = excluded.la_dap_an_dung;
    end loop;
  end loop;

  insert into lop(lop_id, ten_lop, khoi, trang_thai)
  values('a4500000-0000-0000-0000-000000000001', '12 M4 Tin học', '12', 'HoatDong')
  on conflict(lop_id) do update set ten_lop = excluded.ten_lop,
    khoi = excluded.khoi, trang_thai = excluded.trang_thai;

  insert into tai_khoan(
    tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh,
    phai_doi_mat_khau, trang_thai
  ) values (
    'a4500000-0000-0000-0000-000000000002', 'm4-tin-admin',
    'Admin M4 Tin học',
    '$2a$10$KZ.sArtDBSoK3V8NPnoaMOCH4gSL/UqwhtJSFCI9CI0zh1f8/ZWiy',
    'Admin', 1990, false, 'HoatDong'
  )
  on conflict(tai_khoan_id) do update
    set ho_ten = excluded.ho_ten, trang_thai = excluded.trang_thai;

  insert into tai_khoan(
    tai_khoan_id, ma_so, ho_ten, mat_khau_hash, vai_tro, nam_sinh,
    lop_id, mon_tu_chon_1_id, mon_tu_chon_2_id,
    phai_doi_mat_khau, trang_thai
  ) values (
    'a4500000-0000-0000-0000-000000000003', 'm4-tin-student',
    'Học sinh M4 Tin học',
    '$2a$10$KZ.sArtDBSoK3V8NPnoaMOCH4gSL/UqwhtJSFCI9CI0zh1f8/ZWiy',
    'HocSinh', 2008, 'a4500000-0000-0000-0000-000000000001',
    v_mon_tin, v_mon_vat_li, false, 'HoatDong'
  )
  on conflict(tai_khoan_id) do update
    set ho_ten = excluded.ho_ten,
        lop_id = excluded.lop_id,
        mon_tu_chon_1_id = excluded.mon_tu_chon_1_id,
        mon_tu_chon_2_id = excluded.mon_tu_chon_2_id,
        trang_thai = excluded.trang_thai;

  insert into dot_thi(
    dot_thi_id, ten_dot_thi, nam_hoc, ngay_thi_1, ngay_thi_2
  ) values (
    'a4500000-0000-0000-0000-000000000004',
    'Luyện tập môn Tin học', '2026-2027', '2026-09-09', '2026-09-10'
  )
  on conflict(dot_thi_id) do update
    set ten_dot_thi = excluded.ten_dot_thi,
        nam_hoc = excluded.nam_hoc,
        ngay_thi_1 = excluded.ngay_thi_1,
        ngay_thi_2 = excluded.ngay_thi_2;

  insert into dot_thi_lop(dot_thi_id, lop_id)
  values(
    'a4500000-0000-0000-0000-000000000004',
    'a4500000-0000-0000-0000-000000000001'
  ) on conflict(dot_thi_id, lop_id) do nothing;

  insert into ca_thi(
    ca_thi_id, dot_thi_id, so_thu_tu_ca, gio_bat_dau,
    gio_ket_thuc, trang_thai
  ) values (
    'a4500000-0000-0000-0000-000000000005',
    'a4500000-0000-0000-0000-000000000004', 3,
    '2026-09-10T00:00:00Z', '2026-09-10T16:59:59Z', 'DangMo'
  )
  on conflict(ca_thi_id) do update
    set dot_thi_id = excluded.dot_thi_id,
        so_thu_tu_ca = excluded.so_thu_tu_ca,
        gio_bat_dau = excluded.gio_bat_dau,
        gio_ket_thuc = excluded.gio_ket_thuc,
        trang_thai = excluded.trang_thai;

  insert into ca_thi_mon(id, ca_thi_id, mon_id)
  values(
    'a4500000-0000-0000-0000-000000000006',
    'a4500000-0000-0000-0000-000000000005', v_mon_tin
  )
  on conflict(id) do update set ca_thi_id = excluded.ca_thi_id,
    mon_id = excluded.mon_id;

  -- Reset only this disposable fixture. Historical application data is never
  -- touched; immutable snapshot triggers are respected by reopening the sample
  -- draft before deleting it.
  update de_thi set trang_thai = 'DangSoan'
    where de_thi_id = 'a4500000-0000-0000-0000-000000000007';
  delete from bai_lam_thi
    where bai_lam_id = 'a4500000-0000-0000-0000-000000000008';
  delete from de_thi
    where de_thi_id = 'a4500000-0000-0000-0000-000000000007';

  insert into de_thi(
    de_thi_id, ca_thi_mon_id, trang_thai, so_ma_de,
    nguoi_tao_tai_khoan_id, ma_tran,
    phan1_so_cau, phan1_diem_moi_cau,
    phan2_so_cau, phan2_diem_1y, phan2_diem_2y,
    phan2_diem_3y, phan2_diem_4y,
    phan3_so_cau, phan3_diem_moi_cau
  ) values (
    'a4500000-0000-0000-0000-000000000007',
    'a4500000-0000-0000-0000-000000000006',
    'DangSoan', 1, 'a4500000-0000-0000-0000-000000000002',
    jsonb_build_array(
      jsonb_build_object('phan', 'I', 'so_cau', 24),
      jsonb_build_object('phan', 'II', 'so_cau', 4)
    ),
    24, 0.25, 4, 0.10, 0.25, 0.50, 1.00, null, null
  );

  for v_i in 1..28 loop
    if v_i <= 24 then
      v_q := ('a4100000-0000-0000-0000-' || lpad(v_i::text, 12, '0'))::uuid;
    else
      v_q := ('a4300000-0000-0000-0000-' ||
        lpad((v_i - 24)::text, 12, '0'))::uuid;
    end if;
    v_snapshot := ('a4600000-0000-0000-0000-' ||
      lpad(v_i::text, 12, '0'))::uuid;

    insert into cau_hoi_snapshot(
      snapshot_id, de_thi_id, cau_hoi_goc_id, phan,
      chuyen_de_id, muc_do_id, noi_dung, dap_an_phan3
    )
    select v_snapshot,
      'a4500000-0000-0000-0000-000000000007',
      q.cau_hoi_id, q.phan, v_chuyen_de, q.muc_do_id,
      q.noi_dung, q.dap_an_phan3
    from cau_hoi q where q.cau_hoi_id = v_q;

    insert into chi_tiet_cau_hoi_snapshot(
      id, cau_hoi_snapshot_id, thu_tu, noi_dung, la_dap_an_dung
    )
    select
      ('a4700000-0000-0000-0000-' ||
        lpad((v_i * 10 + ct.thu_tu)::text, 12, '0'))::uuid,
      v_snapshot, ct.thu_tu, ct.noi_dung, ct.la_dap_an_dung
    from chi_tiet_cau_hoi ct
    where ct.cau_hoi_id = v_q
    order by ct.thu_tu;
  end loop;

  insert into ma_de(
    ma_de_id, de_thi_id, so_thu_tu_ma, thu_tu_hien_thi
  )
  select
    'a4500000-0000-0000-0000-000000000009',
    'a4500000-0000-0000-0000-000000000007',
    1,
    jsonb_agg(jsonb_build_object(
      'snapshot_id', snapshot_id,
      'phan', phan,
      'thu_tu_phuong_an', jsonb_build_array(1, 2, 3, 4)
    ) order by phan, snapshot_id)
  from cau_hoi_snapshot
  where de_thi_id = 'a4500000-0000-0000-0000-000000000007';

  update de_thi set trang_thai = 'DangThi'
    where de_thi_id = 'a4500000-0000-0000-0000-000000000007';

  insert into bai_lam_thi(
    bai_lam_id, ca_thi_mon_id, hoc_sinh_tai_khoan_id,
    de_thi_id, ma_de_id, trang_thai, thoi_diem_vao_thi
  ) values (
    'a4500000-0000-0000-0000-000000000008',
    'a4500000-0000-0000-0000-000000000006',
    'a4500000-0000-0000-0000-000000000003',
    'a4500000-0000-0000-0000-000000000007',
    'a4500000-0000-0000-0000-000000000009',
    'DangThi', now()
  );
end
$$;

do $$
declare
  v_bad integer;
begin
  select count(*) into v_bad
  from mon
  where ten_mon = 'Tin học'
    and (
      loai_mon <> 'TuChon' or trang_thai <> 'DangDung'
      or phan1_so_cau <> 24 or phan1_diem_moi_cau <> 0.25
      or phan2_so_cau <> 4 or phan2_diem_4y <> 1.00
      or phan3_so_cau is not null
      or round(
        phan1_so_cau * phan1_diem_moi_cau
        + phan2_so_cau * phan2_diem_4y, 2
      ) <> 10.00
    );
  if v_bad <> 0 then raise exception 'TIN_HOC_STRUCTURE_INVALID'; end if;
end
$$;
