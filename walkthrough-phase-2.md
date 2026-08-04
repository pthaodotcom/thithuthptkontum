# Walkthrough — Phase 2: Ngân hàng câu hỏi & Đề thi (Đang tiến hành)

## 1. Quyết định Go Phase 2

- Loại Ngữ văn khỏi phạm vi ngân hàng câu hỏi, tạo đề và chấm tự động.
- Dùng 4 mức độ nhận thức: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
- Tổ trưởng quản lý khung Chuyên đề → Bài học của đúng môn mình.
- Mục đã có câu hỏi chỉ được vô hiệu hóa, không xóa.
- Khi tạo đề, hệ thống phải kiểm tra sức chứa theo Chuyên đề × Mức độ, chỉ rõ số câu thiếu và chặn hoàn tất đề.

## 2. UC-QB-01: Khung Chuyên đề → Bài học

- Xây dựng trang `src/app/(to-truong)/khung-chuyen-de`.
- Hiển thị cây hai cấp Chuyên đề → Bài học, số bài học và số câu hỏi.
- Cho phép thêm, đổi tên, xóa và đổi trạng thái từng cấp.
- Vô hiệu hóa Chuyên đề sẽ vô hiệu hóa các Bài học bên trong.
- Chỉ cho xóa khi chưa có câu hỏi; nếu đã có câu hỏi thì bắt buộc vô hiệu hóa.
- Kiểm tra quyền Tổ trưởng và phạm vi Môn trong mọi Server Action, không chỉ ẩn nút ở UI.
- Chặn tên Chuyên đề trùng trong cùng Môn và tên Bài học trùng trong cùng Chuyên đề.
- Bổ sung layout/sidebar riêng cho Tổ trưởng.
- Trang chủ tự nhận biết Giáo viên có phải Tổ trưởng không để chuyển đến đúng không gian làm việc.

## 3. Kiểm tra

- `npm run typecheck`: đạt.

## 4. Tiếp theo

- UC-QB-02/03: soạn câu hỏi theo khuôn Phần I/II/III và import dữ liệu.
