# Webapp — Hệ thống Thi thử Trực tuyến cấp Trường THPT

Scaffold ban đầu (Next.js + Supabase + Gemini). Xem:
- `docs/legacy/ke-hoach-trien-khai-webapp.md` — roadmap đầy đủ, kiến trúc, lý do chọn công nghệ.
- `CLAUDE.md` — rule bắt buộc khi code trong thư mục này.
- `docs/legacy/3.2_Khung_yeu_cau_chuc_nang.md` + `../use-case-v3/` — nguồn nghiệp vụ gốc.

## 1. Tạo tài khoản & project (làm 1 lần)

### Supabase
1. Tạo tài khoản tại supabase.com, tạo **New project** (chọn region gần Việt Nam, ví dụ Singapore).
2. Vào **Project Settings → API**, lấy 3 giá trị:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (bấm "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **giữ bí mật tuyệt đối, không commit, không đưa vào code client**.
3. Vào **Project Settings → API → JWT Settings**, lấy `JWT Secret` → `SUPABASE_JWT_SECRET` (dùng để tự ký JWT đăng nhập — xem mục 2 của kế hoạch triển khai).
4. Chạy migration (xem mục 3 bên dưới).

### Vercel
1. Tạo tài khoản tại vercel.com, **Import Project** từ repo GitHub chứa thư mục `webapp/` (đặt Root Directory = `du-an-thi-thu-thpt/webapp` khi import nếu repo là monorepo).
2. Vào **Project Settings → Environment Variables**, khai đủ các biến trong `.env.example` (Production + Preview).
3. **Vercel Cron cần plan trả phí (Pro) để chạy dưới 1 lần/ngày** — dự án này cần cron mỗi 1 phút (`vercel.json`). Nếu đang dùng Hobby plan, tạm thời tăng khoảng cách cron hoặc dùng dịch vụ cron ngoài (cron-job.org gọi vào route có `CRON_SECRET`) cho tới khi nâng cấp plan.

### Gemini API (FR-M6-02)
1. Vào aistudio.google.com/apikey, tạo API key → `GEMINI_API_KEY`.
2. Kiểm tra model đang ở trạng thái GA (Generally Available) mới nhất tại ai.google.dev trước khi deploy Phase 5 — đặt tên model vào `GEMINI_MODEL` (mặc định gợi ý: `gemini-3.5-flash`, phù hợp cho tác vụ sinh văn bản tiếng Việt ngắn, chi phí thấp). Google cập nhật model thường xuyên, không hardcode trong code.

### Gmail SMTP (FR-M5-07)
1. Bật xác minh hai bước cho tài khoản Gmail dùng để gửi.
2. Tạo App Password và cấu hình `GMAIL_SMTP_USER`, `GMAIL_APP_PASSWORD`.
3. Giữ `EMAIL_ENABLED=false` khi dev/demo để chỉ ghi log; bật `true` sau khi gửi thử thành công.
4. App Password có thể nhập liền 16 ký tự hoặc có khoảng trắng; ứng dụng tự chuẩn hóa. Không dùng mật khẩu đăng nhập Gmail thông thường.
5. Khi bật gửi thật, cấu hình thiếu/sai được coi là lỗi không thể retry để tránh cron thử vô ích; Admin có thể sửa cấu hình rồi bấm **Thử lại** trong `/thong-bao-email`.
6. Luôn gửi thử tới một hộp thư kiểm thử trước. Sau khi nhận được thư và kiểm tra liên kết báo cáo, mới bật `EMAIL_ENABLED=true` ở Production.

## 2. Chạy dự án local

```bash
npm install
cp .env.example .env.local
# dien cac gia tri that vao .env.local
npm run dev
```

Cần cài Supabase CLI (`npm install -g supabase` hoặc theo hướng dẫn chính thức) nếu muốn chạy Supabase local (`supabase start`) thay vì trỏ thẳng vào project cloud khi dev.

## 3. Chạy migration database

Cách đơn giản nhất (không cần Supabase CLI): mở **Supabase Dashboard → SQL Editor**, copy nội dung từng file theo đúng thứ tự và chạy:

1. `supabase/migrations/0001_init_schema.sql` (27 bảng)
2. `supabase/migrations/0002_rls_policies.sql` (RLS)
3. `supabase/migrations/0003_seed_dev.sql` (dữ liệu mẫu — **chỉ chạy ở project dev/test**, không chạy ở production; nhớ thay `mat_khau_hash` placeholder bằng hash bcrypt thật trước khi dùng)

Hoặc dùng Supabase CLI:
```bash
supabase link --project-ref <project-id>
supabase db push
```

## 4. Sinh type TypeScript từ schema

```bash
npm run supabase:types
```
(cần biến môi trường `SUPABASE_PROJECT_ID` và đã `supabase login`)

## 5. Trạng thái hiện tại

Phase 0-5 đã có triển khai chức năng: auth/RLS, danh mục và người dùng, ngân hàng câu hỏi/đề thi, đợt và ca thi, làm bài/giám sát, báo cáo PDF/Excel, nhận xét Gemini có fallback và email stub. Phase 6 đang tiếp tục với kiểm thử tích hợp, E2E, tải và rà soát bảo mật trên project Supabase dev.

Khi không cấu hình `GEMINI_API_KEY` hoặc API tạm thời lỗi, hàng đợi thử lại tối đa 3 lần rồi sinh nhận xét mẫu; vì vậy có thể tiếp tục kiểm thử toàn bộ luồng mà không lưu key trong repo.

### Phát hiện câu hỏi trùng

Chức năng phát hiện trùng không gọi Gemini hoặc dịch vụ AI. Migration `0040_question_duplicate_detection.sql` dùng SHA-256 và PostgreSQL `pg_trgm`; câu Toán chỉ thay số được gắn nhãn “Cùng dạng – khác số” thay vì tự động coi là trùng.

- `QUESTION_TEXT_SIMILARITY_THRESHOLD`: ngưỡng cảnh báo gần giống nội dung, mặc định thử nghiệm `0.72`.
- `QUESTION_TEMPLATE_SIMILARITY_THRESHOLD`: ngưỡng cảnh báo cùng mẫu câu, mặc định thử nghiệm `0.84`.
- Sau khi chạy migration, chạy `npm.cmd run fingerprints:backfill` để tạo dấu vân cho câu hỏi cũ.

Hai ngưỡng trên chỉ phục vụ cảnh báo và cần hiệu chỉnh bằng tập câu hỏi đã được giáo viên gán nhãn. Tổ trưởng vẫn là người xác nhận cuối cùng; hệ thống không tự động xóa hoặc từ chối câu hỏi gần giống.
