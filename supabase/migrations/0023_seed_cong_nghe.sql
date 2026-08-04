-- =====================================================================
-- 0023_seed_cong_nghe.sql
-- Seed du lieu chuyen de va bai hoc cho mon Cong nghe
-- =====================================================================

do $$
declare
  v_mon_id uuid;
  v_cd_id uuid;
begin
  select mon_id into v_mon_id from mon where ten_mon = 'Công nghệ' limit 1;

  if v_mon_id is null then
    raise notice 'Môn Công nghệ không tồn tại, bỏ qua seed.';
    return;
  end if;

  -- Chương 1
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 1: Giới thiệu chung về kĩ thuật điện' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 1: Giới thiệu chung về kĩ thuật điện') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 1: Giới thiệu tổng quan về kĩ thuật điện' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 1: Giới thiệu tổng quan về kĩ thuật điện');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 2: Ngành nghề trong lĩnh vực kĩ thuật điện' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 2: Ngành nghề trong lĩnh vực kĩ thuật điện');

  -- Chương 2
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 2: Hệ thống điện quốc gia' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 2: Hệ thống điện quốc gia') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 3: Mạch điện xoay chiều ba pha' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 3: Mạch điện xoay chiều ba pha');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 4: Hệ thống điện quốc gia' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 4: Hệ thống điện quốc gia');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 5: Sản xuất điện năng' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 5: Sản xuất điện năng');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 6: Mạng điện sản xuất quy mô nhỏ' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 6: Mạng điện sản xuất quy mô nhỏ');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 7: Mạng điện hạ áp dùng trong sinh hoạt' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 7: Mạng điện hạ áp dùng trong sinh hoạt');

  -- Chương 3
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 3: Hệ thống điện trong gia đình' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 3: Hệ thống điện trong gia đình') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 8: Hệ thống điện trong gia đình' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 8: Hệ thống điện trong gia đình');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 9: Thiết bị điện trong hệ thống điện gia đình' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 9: Thiết bị điện trong hệ thống điện gia đình');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 10: Thiết kế và lắp đặt mạch điện điều khiển trong gia đình' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 10: Thiết kế và lắp đặt mạch điện điều khiển trong gia đình');

  -- Chương 4
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 4: An toàn và tiết kiệm điện năng' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 4: An toàn và tiết kiệm điện năng') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 11: An toàn điện' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 11: An toàn điện');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 12: Tiết kiệm điện năng' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 12: Tiết kiệm điện năng');

  -- Chương 5
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 5: Giới thiệu chung về kĩ thuật điện tử' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 5: Giới thiệu chung về kĩ thuật điện tử') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 13: Khái quát về kĩ thuật điện tử' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 13: Khái quát về kĩ thuật điện tử');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 14: Ngành nghề và dịch vụ trong lĩnh vực kĩ thuật điện tử' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 14: Ngành nghề và dịch vụ trong lĩnh vực kĩ thuật điện tử');

  -- Chương 6
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 6: Linh kiện điện tử' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 6: Linh kiện điện tử') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 15: Điện trở, tụ điện và cuộn cảm' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 15: Điện trở, tụ điện và cuộn cảm');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 16: Diode, transistor và mạch tích hợp IC' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 16: Diode, transistor và mạch tích hợp IC');

  -- Chương 7
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 7: Điện tử tương tự' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 7: Điện tử tương tự') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 18: Giới thiệu về điện tử tương tự' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 18: Giới thiệu về điện tử tương tự');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 19: Khuếch đại thuật toán' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 19: Khuếch đại thuật toán');

  -- Chương 8
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 8: Điện tử số' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 8: Điện tử số') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 21: Tín hiệu số và các cổng logic cơ bản' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 21: Tín hiệu số và các cổng logic cơ bản');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 22: Một số mạch xử lí tín hiệu trong điện tử số' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 22: Một số mạch xử lí tín hiệu trong điện tử số');

  -- Chương 9
  select chuyen_de_id into v_cd_id from chuyen_de where mon_id = v_mon_id and ten_chuyen_de = 'Chương 9: Vi điều khiển' limit 1;
  if v_cd_id is null then
    insert into chuyen_de (mon_id, ten_chuyen_de) values (v_mon_id, 'Chương 9: Vi điều khiển') returning chuyen_de_id into v_cd_id;
  end if;
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 24: Khái quát về vi điều khiển' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 24: Khái quát về vi điều khiển');
  insert into bai_hoc (chuyen_de_id, ten_bai_hoc) select v_cd_id, 'Bài 25: Bo mạch lập trình vi điều khiển' where not exists (select 1 from bai_hoc where chuyen_de_id = v_cd_id and ten_bai_hoc = 'Bài 25: Bo mạch lập trình vi điều khiển');
  
end $$;
