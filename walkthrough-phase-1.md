# Walkthrough - Phase 1: Danh mục & Người dùng (Đang tiến hành)

Tài liệu này ghi nhận quá trình triển khai Phase 1 của dự án webapp thi thử THPT.

## 1. Cài đặt hạ tầng Giao diện (UI)
- Khởi tạo thư viện **shadcn/ui** và **Tailwind CSS**.
- Cài đặt các thành phần cốt lõi: Nút bấm (Button), Ô nhập liệu (Input), Bảng (Table), Hộp thoại (Dialog), Khung chọn (Select).
- Tích hợp **Sonner** để hiển thị các thông báo nổi (Toast) thân thiện với người dùng (ví dụ: "Tạo môn học thành công").
- Cập nhật file `layout.tsx` gốc để nhúng `<Toaster />`, cho phép gọi thông báo từ bất kỳ đâu.

## 2. Bố cục trang Quản trị (Admin Layout)
- Tạo mới file `src/app/(admin)/layout.tsx`.
- Thiết kế thanh điều hướng (Sidebar) tĩnh bên trái gồm các danh mục: Môn học, Khung giờ chuẩn, Lớp học, Tài khoản, Phân công dạy.
- Tích hợp nút Đăng xuất bằng Client Component (`LogoutButton.tsx`) gọi trực tiếp tới Server Action `dang-xuat` đã xây dựng từ Phase 0.

## 3. FR-M1-01: Quản trị Môn học
- Xây dựng file `src/app/(admin)/mon-hoc/page.tsx` và `actions.ts`.
- **Giao diện danh sách (Table)**: 
  - Hiển thị danh sách môn học kèm phân loại (Bắt buộc / Tự chọn) với badge màu.
  - Hiển thị Ca thi bắt buộc.
  - Trạng thái Đang dùng / Ngưng dùng.
- **Tính năng thêm Môn học (Dialog)**:
  - Form nhập thông tin môn học và barem cấu trúc đề (Phần I, II, III).
  - Validation mạnh bằng `zod`: 
    - Bắt lỗi bắt buộc nhập đồng bộ (nếu có câu hỏi thì phải có điểm và ngược lại).
    - Bắt lỗi thang điểm lũy tiến Phần II phải tăng dần.
    - **Quan trọng**: Ràng buộc cứng *Tổng điểm tối đa = 10*, nếu sai lệch hệ thống sẽ từ chối tạo và báo lỗi đỏ.
- **Tính năng Cập nhật trạng thái**: Chuyển đổi qua lại giữa "Đang dùng" và "Ngưng dùng" bằng 1 click.

## 4. FR-M1-02: Khung giờ chuẩn
- Xây dựng `src/app/(admin)/khung-gio/page.tsx`, `actions.ts`, `KhungGioClient.tsx`.
- Giao diện: 4 thẻ card tương ứng 4 ca thi (Ngày 1 Sáng/Chiều, Ngày 2 Sáng/Chiều).
- Mỗi thẻ cho phép nhập **Giờ bắt đầu** và **Thời lượng (phút)**, tự tính và hiển thị **Giờ kết thúc** ngay lập tức khi gõ (không cần submit).
- Server Action `capNhatKhungGio` dùng `upsert` — tự tạo mới nếu chưa có dữ liệu, tự cập nhật nếu đã có.
- Lưu từng ca độc lập, không phải lưu cá 4 ca một lúc.

## 5. FR-M1-03: Lớp học
- Xây dựng `src/app/(admin)/lop-hoc/page.tsx`, `actions.ts`, `LopHocClient.tsx`.
- Giao diện: Bảng danh sách **phân nhóm theo Khối** (10, 11, 12) — mỗi khối là một bảng riêng, hiển thị số lớp.
- Tính năng: Thêm lớp mới (chọn khối + tên lớp), Sửa tên/khối, Đổi trạng thái (Hoạt động / Ngưng).
- Chặn xóa cứng theo thiết kế DB — khi lớp đã gắn học sinh, chỉ có thể ngưng hoạt động, không xoá.

> [!TIP]
> Tiến độ hiện tại: **Hoàn thành Phase 1 (5/5)** — Đã xong Môn học, Khung giờ, Lớp học, Tài khoản và Phân công giảng dạy.

## 6. FR-M2-01/02: Quản lý tài khoản
- Xây dựng `src/app/(admin)/tai-khoan/page.tsx`, `actions.ts`, `TaiKhoanClient.tsx`.
- Danh sách có tìm kiếm, lọc theo 4 vai trò nghiệp vụ: Admin, Tổ trưởng, Giáo viên, Học sinh.
- Hỗ trợ tạo và cập nhật thông tin theo vai trò; kiểm tra mã số 4–20 ký tự, họ tên tối đa 100 ký tự, lớp/môn bắt buộc và hai môn tự chọn không trùng nhau.
- Tổ trưởng được ánh xạ đúng theo thiết kế DB: tài khoản vẫn là Giáo viên và được gắn vào `mon.to_truong_tai_khoan_id`. Bổ nhiệm người mới tự thay thế Tổ trưởng cũ.
- Mật khẩu mặc định tự sinh bằng `mã số + năm sinh`, bắt buộc đổi và hết hiệu lực sau 15 ngày.
- Hỗ trợ reset mật khẩu, xóa khóa đăng nhập tạm thời và hủy phiên cũ.
- Hỗ trợ Đình chỉ/Gỡ đình chỉ, không xóa vĩnh viễn tài khoản.
- Import Excel theo cơ chế partial success: dòng hợp lệ vẫn lưu; dòng lỗi trả số dòng, mã lỗi và chi tiết. Có kiểm tra mã số trùng ngay trong file.
- Bổ sung migration `0004_nam_sinh_moi_vai_tro.sql` để mọi vai trò đều có thể dùng quy tắc mật khẩu mặc định theo năm sinh.

## 7. FR-M2-04: Phân công giảng dạy
- Xây dựng `src/app/(admin)/phan-cong-giang-day/page.tsx`, `actions.ts`, `PhanCongClient.tsx`.
- Giao diện ma trận Giáo viên × Lớp; môn được hiển thị và tự suy ra từ tài khoản Giáo viên, không nhập lại.
- Admin chọn nhiều lớp cho từng giáo viên và lưu độc lập.
- Giáo viên chưa gắn môn không thể được phân công.
- Import Excel bằng hai cột `ma_giao_vien` và `ten_lop`, có báo lỗi theo dòng và kiểm tra cặp trùng trong file.
- Sửa liên kết Sidebar từ route không tồn tại `/phan-cong` sang `/phan-cong-giang-day`.

## 8. Bug Fixes & Tinh chỉnh
- **CSS Build Error**: shadcn v4 ghi đè `globals.css` bằng cú pháp `@import "shadcn/tailwind.css"` và `oklch()` không tương thích với Tailwind v3. Fix: viết lại toàn bộ `globals.css` và `tailwind.config.ts` theo cú pháp HSL chuẩn v3, thay `@apply` bằng CSS thuần trong `@layer base`.
- **401 Unauthorized khi đăng nhập**: Cookie `session` được set với `secure: true` nhưng localhost chạy `http://` nên trình duyệt tự chặn không lưu cookie. Fix: đổi thành `secure: process.env.NODE_ENV === "production"` ở cả `session.ts` và `doi-mat-khau/route.ts`.
- **Vòng lặp redirect sau đổi mật khẩu**: JWT mới với `phai_doi_mat_khau = false` không được ghi vào browser vì lỗi `secure: true` → middleware luôn đọc JWT cũ → redirect mãi. Fix chung với bug trên.
- **Trang chủ `/` không redirect**: Sau login, `router.push("/")` đưa về trang chủ tĩnh không có nội dung. Fix: viết lại `page.tsx` thành Server Component, đọc session và redirect theo vai trò (Admin → `/mon-hoc`, GiaoVien → `/ngan-hang-cau-hoi`, HocSinh → `/ho-so`).

## 9. Kết quả kiểm thử
- Đăng nhập bằng `admin01` → Admin Panel hiển thị đúng.
- Bảng Môn học load được data từ DB (Toán - Bắt buộc Ca 2, Vật lý - Tự chọn).
- Layout Sidebar hiển thị đầy đủ menu và thông tin tài khoản.
- `npm run typecheck`: đạt, không còn lỗi TypeScript.
- `npm run lint`: chưa chạy được vì dự án cũ chưa có cấu hình flat config cho ESLint 9.
- `npm test`: chưa chạy được vì dependency `vite` trong `node_modules` hiện tại bị thiếu.
- `npm run build`: phần code mới qua typecheck; build toàn dự án còn bị chặn bởi Google Fonts không truy cập được trong sandbox và hai route `/bao-cao` từ các route group cũ bị trùng nhau.

> [!IMPORTANT]
> Với database đã chạy các migration trước đây, cần chạy thêm `supabase/migrations/0004_nam_sinh_moi_vai_tro.sql` trước khi tạo/reset tài khoản Admin hoặc Giáo viên.
