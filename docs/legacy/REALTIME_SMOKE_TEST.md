# Smoke test Realtime trên project dev/test

Không chạy các kịch bản này trên production. Bài dùng cho kịch bản nộp bài sẽ
chuyển sang `DaNopBai` và không được tái sử dụng.

## Chuẩn bị

1. Áp migration đến `0016_audit_log_read_model.sql`.
2. Chuẩn bị một Admin, một học sinh và ba bài `DangThi` của học sinh đó trong
   một ca `DangMo`: một bài cho Realtime, một bài cho polling và một bài cho
   nộp bài.
3. Điền các biến `E2E_*` được mô tả trong `.env.example`.
4. Chạy `npm run test:e2e:realtime`. Mỗi sự kiện vi phạm dùng UUID mới nên
   chạy lại không gửi trùng; thay bài nộp sau mỗi lần chạy.

## Kiểm tra thủ công bằng hai cửa sổ

1. Cửa sổ thường: đăng nhập Admin, mở `/giam-sat-ca-thi`, chờ nhãn
   `Realtime đã kết nối`.
2. Cửa sổ ẩn danh: đăng nhập học sinh và mở bài thi.
3. Tạo một vi phạm hoặc nộp bài; xác nhận đúng hàng trên dashboard đổi trong
   vài giây, trước chu kỳ polling 30 giây.
4. Mở DevTools của cửa sổ Admin, chặn kết nối WebSocket đến
   `*.supabase.co/realtime/v1/websocket`, rồi tải lại dashboard.
5. Xác nhận nhãn chuyển thành `Mất Realtime · đang dùng polling 30 giây`.
6. Tạo thay đổi ở cửa sổ học sinh; xác nhận dashboard cập nhật trong tối đa
   35 giây.
7. Chặn thêm request `/api/giam-sat`; xác nhận dashboard giữ dữ liệu cuối và
   hiện cảnh báo dữ liệu có thể đã cũ. Bỏ chặn và xác nhận lần polling tiếp
   theo xóa cảnh báo, cập nhật mốc thời gian thành công.
