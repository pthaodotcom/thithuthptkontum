-- Bo sung policy RLS con thieu cho thong_bao_noi_bo (0025 da bat RLS nhung chua co policy).

create policy "tu_xem_thong_bao_cua_minh" on thong_bao_noi_bo for select
  using (nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id());

create policy "tu_danh_dau_da_doc" on thong_bao_noi_bo for update
  using (nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id())
  with check (nguoi_nhan_tai_khoan_id = jwt_tai_khoan_id());
