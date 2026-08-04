-- Thông báo nội bộ cho luồng câu hỏi giữa Giáo viên và Tổ trưởng.

create table if not exists thong_bao_noi_bo (
  id uuid primary key default gen_random_uuid(),
  nguoi_nhan_tai_khoan_id uuid not null references tai_khoan(tai_khoan_id) on delete cascade,
  loai text not null,
  tieu_de text not null,
  noi_dung text not null,
  duong_dan text,
  doi_tuong_id uuid,
  da_doc boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_thong_bao_noi_bo_nguoi_nhan
  on thong_bao_noi_bo(nguoi_nhan_tai_khoan_id, da_doc, created_at desc);

alter table thong_bao_noi_bo enable row level security;

create or replace function tao_thong_bao_tu_cau_hoi() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to_truong_id uuid; v_tom_tat text;
begin
  select m.to_truong_tai_khoan_id into v_to_truong_id
  from bai_hoc bh join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  join mon m on m.mon_id = cd.mon_id where bh.bai_hoc_id = new.bai_hoc_id;
  v_tom_tat := left(trim(regexp_replace(new.noi_dung, '<[^>]+>', '', 'g')), 140);

  if tg_op = 'INSERT' then
    if v_to_truong_id is not null and v_to_truong_id is distinct from new.nguoi_tao_tai_khoan_id then
      insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
      values(v_to_truong_id,'CauHoiMoi','Có câu hỏi mới chờ duyệt',v_tom_tat,'/duyet-cau-hoi',new.cau_hoi_id);
    end if;
    return new;
  end if;

  if old.trang_thai_duyet is distinct from new.trang_thai_duyet then
    if old.trang_thai_duyet = 'CanChinhSua' and new.trang_thai_duyet = 'ChoDuyet' then
      if v_to_truong_id is not null then
        insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
        values(v_to_truong_id,'CauHoiGuiLai','Giáo viên đã sửa và gửi lại câu hỏi',v_tom_tat,'/duyet-cau-hoi',new.cau_hoi_id);
      end if;
    elsif old.trang_thai_duyet = 'ChoDuyet' and new.nguoi_tao_tai_khoan_id is not null then
      insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
      values(
        new.nguoi_tao_tai_khoan_id,
        case new.trang_thai_duyet when 'DaDuyet' then 'CauHoiDaDuyet' when 'CanChinhSua' then 'CauHoiCanSua' else 'CauHoiTuChoi' end,
        case new.trang_thai_duyet when 'DaDuyet' then 'Câu hỏi đã được duyệt' when 'CanChinhSua' then 'Tổ trưởng yêu cầu chỉnh sửa câu hỏi' else 'Câu hỏi đã bị từ chối' end,
        case when new.trang_thai_duyet in ('CanChinhSua','TuChoi') then coalesce(new.ly_do_duyet,'') else v_tom_tat end,
        '/soan-cau-hoi',new.cau_hoi_id
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_thong_bao_cau_hoi on cau_hoi;
create trigger trg_thong_bao_cau_hoi
after insert or update of trang_thai_duyet on cau_hoi
for each row execute function tao_thong_bao_tu_cau_hoi();

create or replace function tao_thong_bao_tu_yeu_cau_chinh_sua() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_to_truong_id uuid; v_tom_tat text;
begin
  select m.to_truong_tai_khoan_id, left(trim(regexp_replace(ch.noi_dung, '<[^>]+>', '', 'g')), 140)
  into v_to_truong_id, v_tom_tat
  from cau_hoi ch join bai_hoc bh on bh.bai_hoc_id = ch.bai_hoc_id
  join chuyen_de cd on cd.chuyen_de_id = bh.chuyen_de_id
  join mon m on m.mon_id = cd.mon_id where ch.cau_hoi_id = new.cau_hoi_id;

  if tg_op = 'INSERT' then
    if v_to_truong_id is not null and v_to_truong_id is distinct from new.nguoi_de_xuat_tai_khoan_id then
      insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
      values(v_to_truong_id,'YeuCauSuaMoi','Có yêu cầu chỉnh sửa câu hỏi',v_tom_tat,'/duyet-cau-hoi',new.yc_id);
    end if;
  elsif old.trang_thai is distinct from new.trang_thai and old.trang_thai = 'ChoDuyet' then
    insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
    values(
      new.nguoi_de_xuat_tai_khoan_id,
      case new.trang_thai when 'DaDuyet' then 'YeuCauSuaDaDuyet' else 'YeuCauSuaTuChoi' end,
      case new.trang_thai when 'DaDuyet' then 'Yêu cầu chỉnh sửa đã được duyệt' else 'Yêu cầu chỉnh sửa đã bị từ chối' end,
      case when new.trang_thai = 'TuChoi' then coalesce(new.ly_do_ket_qua,'') else v_tom_tat end,
      '/yeu-cau-chinh-sua',new.yc_id
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_thong_bao_yeu_cau_chinh_sua on yeu_cau_chinh_sua;
create trigger trg_thong_bao_yeu_cau_chinh_sua
after insert or update of trang_thai on yeu_cau_chinh_sua
for each row execute function tao_thong_bao_tu_yeu_cau_chinh_sua();
