-- Du lieu demo: tat ca email phu huynh cung tro ve hop thu cua chu du an
-- de kiem thu luong UC-NOTIFY-01 ma khong gui toi nguoi ngoai.
update public.tai_khoan
set email_phu_huynh = 'phuongthao2005daodao@gmail.com'
where vai_tro = 'HocSinh'
  and email_phu_huynh is distinct from 'phuongthao2005daodao@gmail.com';
