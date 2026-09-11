# Hệ thống Thi thử THPT Kon Tum

Ứng dụng web hỗ trợ tổ chức thi thử trực tuyến ở cấp trường. Hệ thống phục vụ quản trị viên, giáo viên, tổ trưởng bộ môn và học sinh trong các công việc quản lý ngân hàng câu hỏi, tổ chức ca thi, làm bài và theo dõi kết quả.

> Đây là mã nguồn ứng dụng, không bao gồm kế hoạch triển khai, tài liệu nội bộ, dữ liệu phát sinh hoặc công cụ xử lý dữ liệu một lần.

## Chức năng chính

- Quản lý tài khoản, lớp học, môn học, tổ trưởng bộ môn, đợt thi và ca thi.
- Soạn, duyệt, yêu cầu chỉnh sửa và quản lý ngân hàng câu hỏi theo môn.
- Tạo đề, phát hành cho ca thi và hỗ trợ học sinh làm bài trực tuyến với tự động lưu/nộp bài.
- Chấm điểm, ghi nhận vi phạm trong khi thi và theo dõi ca thi cho quản trị viên.
- Báo cáo theo học sinh, lớp, môn; xuất dữ liệu và tạo nhận xét học tập khi đã cấu hình Gemini.
- Gửi email thông báo khi đã cấu hình nhà cung cấp email.

## Công nghệ

- Next.js 15, React 19 và TypeScript
- Tailwind CSS
- Supabase/PostgreSQL (migrations, RPC và Row Level Security)
- Vitest, Playwright và k6 cho kiểm thử

## Yêu cầu

- Node.js 20 trở lên
- Một dự án Supabase
- Supabase CLI nếu cần áp dụng migrations từ dòng lệnh

## Chạy trên máy local

```powershell
npm ci
Copy-Item .env.example .env.local
# Điền các giá trị của dự án Supabase vào .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Tệp `.env.local` chứa khóa bí mật và không được commit.

## Cấu hình môi trường

Sao chép `.env.example` để xem đầy đủ biến cần thiết. Nhóm cấu hình chính:

| Nhóm | Biến |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |
| Phiên đăng nhập | `SESSION_COOKIE_SECRET` |
| Nhận xét học tập | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Email | `EMAIL_PROVIDER`, `GMAIL_SENDER_EMAIL` hoặc cấu hình SMTP |
| Cron | `CRON_SECRET` |

Không đưa service role key, JWT secret, mật khẩu email hay bất kỳ tệp `.env*` nào lên GitHub.

## Cơ sở dữ liệu

Migrations được lưu tại `supabase/migrations` và phải được áp dụng theo thứ tự. Với Supabase CLI:

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`0003_seed_dev.sql` chỉ dành cho môi trường development/test. Không dùng dữ liệu seed hoặc các script fixture trên cơ sở dữ liệu production.

Khi schema thay đổi, có thể tạo lại kiểu TypeScript:

```powershell
npm run supabase:types
```

## Kiểm thử và kiểm tra chất lượng

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

E2E và load test cần một môi trường Supabase development/test đã cấu hình biến môi trường tương ứng. Các lệnh `fixtures:*` chỉ tạo và dọn dữ liệu kiểm thử có định danh riêng; không chạy chúng trên production.

```powershell
npm run fixtures:m4
npm run test:e2e:offline
npm run test:e2e:realtime
npm run test:load:m4:node
```

## Cấu trúc mã nguồn

```text
src/                 Giao diện Next.js, API routes và nghiệp vụ ứng dụng
src/lib/             Xác thực, Supabase, chấm điểm, báo cáo, email và AI
supabase/migrations/ Lịch sử thay đổi schema và logic PostgreSQL
supabase/tests/      Kiểm thử SQL
tests/               Unit, E2E và load tests
scripts/             Script maintenance và fixture đang được npm scripts sử dụng
public/              Tài nguyên tĩnh
```

## Triển khai

Ứng dụng có thể triển khai trên Vercel hoặc một môi trường Node.js tương thích Next.js. Khai báo đầy đủ biến môi trường trong nền tảng triển khai trước khi build; không sao chép `.env.local` lên môi trường công khai.

## Đóng góp

Trước khi mở pull request, hãy chạy `npm run typecheck`, `npm run lint` và `npm test`. Với thay đổi database, thêm một migration mới; không chỉnh sửa migration đã được áp dụng ở môi trường dùng chung.
