# Walkthrough: Hoàn thành Phase 0

Em đã code xong toàn bộ nền tảng cho Phase 0 của dự án webapp. Dưới đây là những gì em đã hoàn thành:

## Những tính năng đã được bổ sung:
1. **Middleware bảo vệ (`middleware.ts`)**:
   - Sử dụng `jose` để xác minh token JWT (chạy mượt trên Edge runtime của Next.js).
   - Kiểm tra `phai_doi_mat_khau` và điều hướng về trang Đổi mật khẩu nếu chưa đổi.
   - Chặn các route theo quyền (VD: route `/khung-gio-ca-thi` chỉ Admin truy cập được).
2. **Giao diện & API Đăng Nhập (`src/app/dang-nhap`)**:
   - Xây dựng form đăng nhập cơ bản với Tailwind CSS.
   - Tự động gọi API Auth backend đã có.
3. **Giao diện & API Đổi Mật Khẩu (`src/app/doi-mat-khau`)**:
   - Giao diện form đổi mật khẩu.
   - Thêm API (`POST /api/auth/doi-mat-khau`) để kiểm tra quy tắc mật khẩu mới (>= 8 ký tự, có số, có chữ hoa).
   - Xác thực mật khẩu cũ trước khi hash và update mật khẩu mới.
   - Re-sign lại JWT session ngay lập tức với cờ `phai_doi_mat_khau: false` để người dùng không cần đăng nhập lại.
4. **CI/CD (`.github/workflows/ci.yml`)**:
   - Thêm Github Action check Linting, Typecheck và Unit Test mỗi khi có Push/PR lên nhánh `main`.
5. **Tinh chỉnh bổ sung (Bảo trì & UX)**:
   - Thêm cờ `suppressHydrationWarning` vào `src/app/layout.tsx` để ngăn lỗi Hydration do tiện ích mở rộng trình duyệt (như SwiftRead) can thiệp vào mã HTML.
   - Cập nhật giao diện trang chủ `src/app/page.tsx` có thêm nút "Vào trang Đăng Nhập" to, rõ ràng để tiện thao tác test.

## Bạn cần làm gì tiếp theo?
Để hệ thống có thể chạy được, anh hãy hoàn thành nốt **Database Setup**:
1. Tạo một dự án trên [Supabase](https://supabase.com).
2. Chép file `webapp/.env.example` thành `webapp/.env.local` và điền các khóa API của Supabase vào.
3. Chạy 3 file migration `.sql` ở `webapp/supabase/migrations` (qua Supabase CLI hoặc copy/paste chạy ở SQL Editor của Supabase).
4. Sau đó, chạy lệnh `npm run dev` ở thư mục `webapp` và vào thử trang Đăng nhập bằng tài khoản mẫu: `admin01` - `Admin@123` xem hệ thống có yêu cầu đổi mật khẩu không nhé!
