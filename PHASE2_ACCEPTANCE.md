# Checklist nghiệm thu Phase 2

1. Đăng nhập Giáo viên, tạo lần lượt câu Phần I/II/III và import file Excel/Word mẫu; xác nhận dòng đúng được nhập, dòng sai có mã lỗi.
2. Đăng nhập đúng Tổ trưởng môn; duyệt một câu, từ chối một câu có lý do và duyệt một yêu cầu chỉnh sửa.
3. Tại Ngân hàng câu hỏi, lọc theo metadata/trạng thái, gắn nhóm trùng, xóa câu chưa dùng và vô hiệu hóa câu đã dùng.
4. Chọn ca thi sắp diễn ra, nhập ma trận; xác nhận hệ thống chỉ rõ ô thiếu và chặn bước tiếp theo.
5. Tạo 1–4 mã đề; xác nhận không có hai câu cùng nhóm, snapshot có đủ nội dung/đáp án/barem.
6. Giao đề và xác nhận không thể sửa snapshot; với đề khác đang soạn, hủy và xác nhận câu hỏi trở lại `ChuaDung`.
7. Chạy `npm run typecheck`, `npm run test`, `npm run build`.

## Migration

- Local mới nhất: `0008_phase2_atomic_workflows.sql`.
- Kiểm tra remote: `npx supabase migration list`.
- Chỉ khi đã sao lưu và đúng project: `npx supabase db push`.
