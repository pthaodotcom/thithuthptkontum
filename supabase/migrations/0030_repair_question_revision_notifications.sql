-- Repair environments where question revision status exists but its notification
-- trigger was not installed or did not run. Also backfill current pending revisions.

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
    elsif new.trang_thai_duyet in ('DaDuyet','CanChinhSua','TuChoi') and new.nguoi_tao_tai_khoan_id is not null then
      insert into thong_bao_noi_bo(nguoi_nhan_tai_khoan_id,loai,tieu_de,noi_dung,duong_dan,doi_tuong_id)
      values(
        new.nguoi_tao_tai_khoan_id,
        case new.trang_thai_duyet when 'DaDuyet' then 'CauHoiDaDuyet' when 'CanChinhSua' then 'CauHoiCanSua' else 'CauHoiTuChoi' end,
        case new.trang_thai_duyet when 'DaDuyet' then 'Câu hỏi đã được duyệt' when 'CanChinhSua' then 'Tổ trưởng yêu cầu chỉnh sửa câu hỏi' else 'Câu hỏi đã bị từ chối' end,
        case when new.trang_thai_duyet in ('CanChinhSua','TuChoi') then coalesce(new.ly_do_duyet,'') else v_tom_tat end,
        case when new.trang_thai_duyet = 'CanChinhSua' then '/soan-cau-hoi?chinhSua=' || new.cau_hoi_id::text else '/soan-cau-hoi' end,
        new.cau_hoi_id
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_thong_bao_cau_hoi on cau_hoi;
create trigger trg_thong_bao_cau_hoi
after insert or update of trang_thai_duyet on cau_hoi
for each row execute function tao_thong_bao_tu_cau_hoi();

insert into thong_bao_noi_bo(
  nguoi_nhan_tai_khoan_id, loai, tieu_de, noi_dung, duong_dan, doi_tuong_id
)
select
  ch.nguoi_tao_tai_khoan_id,
  'CauHoiCanSua',
  'Tổ trưởng yêu cầu chỉnh sửa câu hỏi',
  coalesce(ch.ly_do_duyet, ''),
  '/soan-cau-hoi?chinhSua=' || ch.cau_hoi_id::text,
  ch.cau_hoi_id
from cau_hoi ch
where ch.trang_thai_duyet = 'CanChinhSua'
  and ch.nguoi_tao_tai_khoan_id is not null
  and not exists (
    select 1 from thong_bao_noi_bo tb
    where tb.nguoi_nhan_tai_khoan_id = ch.nguoi_tao_tai_khoan_id
      and tb.loai = 'CauHoiCanSua'
      and tb.doi_tuong_id = ch.cau_hoi_id
  );
