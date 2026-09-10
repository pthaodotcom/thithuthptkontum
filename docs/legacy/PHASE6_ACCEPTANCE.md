# Phase 6 - Ma trận nghiệm thu

Nguồn truy vết: `3.2_Khung_yeu_cau_chuc_nang.md` (22 FR) và
`../use-case-v4/07-Validation-Report-vi.md` (31 UC).

## Cổng tự động

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `npm run test:e2e`: đăng nhập, đổi mật khẩu, tạo đề, làm/nộp bài, báo cáo.
- `npm run test:e2e:offline`: autosave, IndexedDB, mất mạng và phục hồi.
- `npm run test:e2e:realtime`: giám sát ca và thay đổi trạng thái.
- `npm run test:load:m4:node`: tối thiểu 20 phiên thi đồng thời.

## M5 / UC-REPORT-01..06

- [ ] Kết thúc ca chỉ tạo một job phân tích; chạy lại không tạo dữ liệu trùng.
- [ ] Chỉ bài `DaNopBai` có điểm được phân tích; vắng mặt/lỗi tổ chức bị loại.
- [ ] Tỷ lệ đúng theo chuyên đề đối chiếu đúng với snapshot và câu trả lời.
- [ ] Điểm trung bình cùng môn/năm học xếp đúng bốn nhóm năng lực.
- [ ] Bài thứ hai hiển thị dữ liệu tiến trình; bài đầu không hiển thị biểu đồ giả.
- [ ] Gemini lỗi ba lần tạo fallback; job thử lại nền không gửi lại email đã gửi.
- [ ] Admin xem toàn trường; giáo viên đúng Lớp x Môn; tổ trưởng mọi lớp đúng môn.
- [ ] Học sinh chỉ xem báo cáo cá nhân; truy cập ID người khác bị từ chối.
- [ ] PDF/Excel khớp bộ lọc và số liệu trên màn hình, mở được, không lỗi bố cục.
- [ ] Báo cáo quy mô trường tải trong tối đa 5 giây.

## UC-NOTIFY-01 / FR-M5-07 - Gmail

- [ ] `EMAIL_ENABLED=false` chỉ tạo log stub, không gửi mạng.
- [ ] Thiếu email ghi `KhongGui_ThieuEmail`, không tính là thất bại.
- [ ] Gmail thành công lưu `message_id` và không gửi trùng khi cron chạy lại.
- [ ] Network/timeout/SMTP tạm thời retry ba lần, cách 15 phút.
- [ ] Email sai hoặc lỗi xác thực dừng ngay và vào danh sách xử lý thủ công.
- [ ] App Password không xuất hiện trong client bundle, database hoặc log.
- [ ] Email không chứa đáp án hay thông tin đăng nhập.
- [ ] Vượt SLA phân tích hai giờ hoặc email thất bại tạo cảnh báo Admin.

## Bảo mật và demo

- [ ] RLS chặn truy cập chéo `bai_lam_thi`, `tra_loi`, `phan_tich_chuyen_de`,
  `nhan_xet_ai`, `email_log`.
- [ ] Demo dùng địa chỉ `example.com` khi `EMAIL_ENABLED=false`; chỉ dùng hộp thư
  thử nghiệm do nhóm kiểm soát khi bật Gmail thật.
- [ ] Kịch bản bảo vệ: Admin cấu hình/xem báo cáo -> Tổ trưởng báo cáo môn ->
  Giáo viên báo cáo lớp -> Học sinh xem năng lực -> Admin xem nhật ký email.
- [ ] Có script/reset checklist để đưa dữ liệu demo về trạng thái ban đầu.
