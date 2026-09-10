# Kế hoạch triển khai Webapp — Hệ thống Thi thử Trực tuyến cấp Trường THPT

**Nguồn gốc:** `3.2_Khung_yeu_cau_chuc_nang.md` (22 FR, 5 module M1-M5), `use-case-v4/` (31 UC), `../Thiet_ke_CSDL_Rut_Gon_KhoaLuan.md` (27 bảng).
Tài liệu này KHÔNG lặp lại nội dung nghiệp vụ đã có — chỉ ánh xạ nghiệp vụ đó sang kiến trúc kỹ thuật, thư mục code, và roadmap. Mọi mã FR/UC nhắc tới bên dưới đều tra ngược được vào 3 file nguồn trên.

**Đường cơ sở cập nhật:** BFD 5 nhánh và khung chức năng ngày 2026-07-30 thay thế cách nhóm 6 module trước đây. Việc giảm từ 29 xuống 22 FR là tái cấu trúc/gộp box chức năng; phạm vi triển khai vẫn được phân rã thành 31 UC để không làm mất các luồng nghiệp vụ khác tác nhân hoặc khác kết quả.

**Quyết định đã chốt cùng chủ dự án (2026-07-26):**
1. Đặt tên bảng/cột giữ nguyên tiếng Việt không dấu (`mon`, `tai_khoan`, `cau_hoi`...) — khớp 100% với `Thiet_ke_CSDL_Rut_Gon_KhoaLuan.md`.
2. Gmail SMTP (FR-M5-07) dựng interface + stub (ghi log nội bộ) trước; tích hợp tài khoản Gmail thật ở phase cuối cùng, sau khi có tài khoản Gmail đã có App Password.
3. Lượt này vừa viết kế hoạch vừa khởi tạo khung dự án (scaffold) để bắt đầu code ngay.

---

## 1. Lựa chọn công nghệ (tech stack)

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Frontend + Server | **Next.js 15 (App Router) + TypeScript**, triển khai trên **Vercel** | SSR cho các trang cần phân quyền theo vai trò; API routes làm lớp nghiệp vụ; Vercel Cron cho các tác vụ định kỳ (FR-M4-03, FR-M5-02, FR-M5-07) |
| UI | Tailwind CSS + shadcn/ui | Tốc độ dựng giao diện nhanh, đủ dùng cho 4 vai trò khác nhau, không cần thư viện nặng |
| Database | **Supabase Postgres** | Postgres thật (đủ mạnh cho ràng buộc phức tạp: barem tổng = 10, ma trận đề, snapshot), có Row Level Security (RLS) để thực thi phạm vi dữ liệu theo vai trò, Môn, Lớp và bảng phân công |
| Auth | **Tự viết (custom), KHÔNG dùng Supabase Auth (GoTrue) trực tiếp** | Học sinh đăng nhập bằng **mã số**, không có email — không khớp mô hình email/phone mặc định của Supabase Auth. Xem Mục 2 để biết cơ chế cụ thể |
| Realtime | Supabase Realtime (Postgres Changes + Broadcast) | Phục vụ màn hình giám sát ca thi real-time (FR-M4-03) |
| Storage | Supabase Storage | Lưu ảnh/bảng trong câu hỏi import Word/Excel (FR-M3-02) |
| AI sinh nhận xét | **Gemini API** (model cấu hình qua biến môi trường, chọn bản Flash GA phù hợp tại thời điểm tích hợp) | Text-generation tiếng Việt ngắn, không cần reasoning nặng, chi phí thấp, phù hợp khối lượng lớn theo ca thi (FR-M5-02) |
| Thông báo | Gmail SMTP (SMTP qua Gmail App Password) | Stub phase đầu, tích hợp thật phase cuối (FR-M5-07) |
| Cron / job nền | Vercel Cron (mỗi 1 phút) + bảng `job_hang_doi` trong Postgres | Vercel serverless không giữ tiến trình dài; xem Mục 3 |
| Export báo cáo | `xlsx` (SheetJS) + PDF renderer (`@react-pdf/renderer` hoặc puppeteer) | FR-M5-03 và FR-M5-04 yêu cầu xuất PDF/Excel |
| Testing | Vitest (unit cho `lib/rules/*`) + Playwright (e2e luồng thi) | Business rule dày đặc, cần test tự động, không thể kiểm thử tay hết trước bảo vệ khóa luận |

**Ghi chú về Gemini:** trước khi code module báo cáo, kiểm tra danh sách model GA tại tài liệu chính thức; không hardcode tên model, để trong biến môi trường `GEMINI_MODEL`.

---

## 2. Kiến trúc Auth (quan trọng — quyết định kỹ thuật cốt lõi)

Vì học sinh/giáo viên đăng nhập bằng **mã số + mật khẩu** (FR-M2-04), không dùng email, ta **không** dùng thẳng Supabase Auth. Thay vào đó:

1. Bảng `tai_khoan` tự quản lý `mat_khau_hash` (bcrypt), không đụng tới `auth.users` của Supabase.
2. API route `/api/auth/dang-nhap` nhận `ma_so` + `mat_khau`, kiểm tra hash, áp dụng rule khóa 5 lần sai/15 phút (FR-M2-04).
3. Đăng nhập thành công → server **tự ký một JWT** bằng `SUPABASE_JWT_SECRET` (secret của project Supabase, lấy trong Settings → API), chứa claim `role: authenticated`, `sub: tai_khoan_id`, cùng các claim tuỳ biến (`vai_tro`, `mon_id`, `lop_id`) để RLS đọc trực tiếp qua `auth.jwt()`.
4. JWT lưu trong cookie `httpOnly` + `secure`; client Supabase (`supabase-js`) dùng JWT này làm access token khi gọi Postgres/Realtime → RLS coi đây là user đã đăng nhập, áp policy như bình thường.
5. **Một phiên làm bài duy nhất** (FR-M4-05): lưu `session_id` hiện hành trong bảng `tai_khoan` (cột `phien_hien_hanh`); mỗi lần đăng nhập mới sinh `session_id` mới và ghi đè — middleware/API kiểm tra JWT session_id khớp cột này trước khi cho thao tác trong bài thi, phiên cũ coi như bị hủy.
6. Đổi mật khẩu lần đầu bắt buộc (FR-M2-04): middleware chặn mọi route trừ trang đổi mật khẩu nếu `phai_doi_mat_khau = true`.

Đây là pattern "Bring your own auth" được Supabase hỗ trợ chính thức (ký JWT hợp lệ với JWT secret của project). Không cần NextAuth vì logic đăng nhập ở đây đơn giản (không OAuth, không MFA).

---

## 3. Kiến trúc tác vụ định kỳ / nền (cron, retry, SLA)

Vercel serverless function chỉ chạy trong 1 request-response, không giữ tiến trình nền. Các yêu cầu có SLA/retry (kiểm tra sẵn sàng 30 phút trước giờ thi — FR-M4-03; retry Gemini 3 lần cách 2 phút — FR-M5-02; retry email 3 lần cách 15 phút — FR-M5-07) cần một **bảng hàng đợi** (`job_hang_doi`: id, loai_job, tham_chieu_id, trang_thai, so_lan_thu, chay_luc, ket_qua) do các trigger/logic nghiệp vụ insert vào, và **Vercel Cron chạy mỗi 1 phút** quét các job "đến hạn" (`chay_luc <= now()`) để xử lý:

```
supabase (Postgres trigger/RPC) → insert vào job_hang_doi (VD: "ca_thi kết thúc" → job phân tích FR-M5-01)
                                          │
Vercel Cron (mỗi 1 phút, route /api/cron/xu-ly-hang-doi) → SELECT job đến hạn, FOR UPDATE SKIP LOCKED
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
        Phân tích kết quả (M5-01)   Gọi Gemini (M5-02)     Gửi email (M5-07, stub)
        chạy trực tiếp trong SQL    retry theo cột          retry theo cột
        (không cần gọi ngoài)       so_lan_thu, chay_luc     so_lan_thu, chay_luc
```

Việc kiểm tra sẵn sàng ca thi (FR-M4-03, mốc "30 phút trước giờ thi") cũng chạy qua route cron này: mỗi phút quét `ca_thi` có `gio_bat_dau - now() ≈ 30 phút` và chưa kiểm tra, đối chiếu `ca_thi_mon` nào chưa có `de_thi`.

---

## 4. Cấu trúc thư mục dự án (webapp)

Đã scaffold tại `du-an-thi-thu-thpt/webapp/`. Cấu trúc route theo App Router, đặt tên thư mục **theo đúng UC-ID** để không lệch pha với tài liệu use-case khi cả nhóm cùng tra cứu:

```
webapp/
├── CLAUDE.md                    # rule coding riêng cho giai đoạn dev (khác claude-config/ ở gốc)
├── README.md                    # hướng dẫn setup Vercel/Supabase/Gemini + lệnh chạy
├── package.json / tsconfig.json / next.config.ts / tailwind.config.ts
├── middleware.ts                # guard theo vai_tro + phai_doi_mat_khau
├── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init_schema.sql       # 27 bảng (DDL đầy đủ)
│   │   ├── 0002_rls_policies.sql      # RLS theo vai_tro/mon_id/lop_id trong JWT
│   │   └── 0003_seed_dev.sql          # dữ liệu mẫu để dev/test
│   └── config.toml
├── src/
│   ├── middleware/session.ts
│   ├── app/
│   │   ├── dang-nhap/                          # FR-M2-04 / UC-AUTH-01
│   │   ├── doi-mat-khau/                       # FR-M2-04 / UC-AUTH-01
│   │   ├── (admin)/
│   │   │   ├── mon-hoc/                        # UC-CAT-01
│   │   │   ├── khung-gio-ca-thi/               # UC-CAT-02
│   │   │   ├── lop-hoc/                        # UC-CAT-03
│   │   │   ├── hoc-sinh/                       # FR-M2-01 / UC-USER-01, 02
│   │   │   ├── giao-vien/                      # FR-M2-02 / UC-USER-01, 02, 04
│   │   │   ├── to-truong-bo-mon/               # UC-USER-03
│   │   │   ├── phan-cong-giang-day/            # UC-USER-04
│   │   │   ├── dot-thi/                        # UC-BATCH-01, 02, 03
│   │   │   ├── giam-sat-ca-thi/                # UC-EXAM-02, 03, 04
│   │   │   └── bao-cao/                        # UC-REPORT-03, 05, 06 (Admin scope)
│   │   ├── (to-truong)/
│   │   │   ├── khung-chuyen-de/                # UC-QB-01
│   │   │   ├── duyet-cau-hoi/                  # UC-QB-04, 05
│   │   │   ├── ngan-hang-cau-hoi/              # UC-QB-06
│   │   │   ├── de-thi/                         # UC-QB-07
│   │   │   └── bao-cao-mon/                    # UC-REPORT-06
│   │   ├── (giao-vien)/
│   │   │   ├── soan-cau-hoi/                   # UC-QB-02
│   │   │   ├── yeu-cau-chinh-sua/              # UC-QB-03
│   │   │   └── bao-cao-lop/                    # UC-REPORT-03 (scope Giáo viên)
│   │   ├── (hoc-sinh)/
│   │   │   ├── ho-so/doi-mon-tu-chon/          # UC-BATCH-04
│   │   │   ├── lam-bai/[caThiMonId]/           # UC-EXAM-01 (lõi hệ thống)
│   │   │   └── ket-qua-ca-thi/                 # UC-EXAM-01: tóm tắt ngay sau nộp
│   │   └── api/
│   │       ├── auth/dang-nhap/route.ts
│   │       ├── bai-thi/vao-thi/route.ts        # UC-EXAM-01
│   │       ├── bai-thi/autosave/route.ts       # FR-M4-05 autosave 30s
│   │       ├── bai-thi/nop-bai/route.ts        # FR-M4-05 chấm điểm tự động
│   │       ├── bai-thi/vi-pham/route.ts        # FR-M4-04 ghi nhận tự động
│   │       └── cron/
│   │           ├── kiem-tra-san-sang/route.ts  # UC-BATCH-05 / FR-M4-03
│   │           └── xu-ly-hang-doi/route.ts     # FR-M5-01, 02, 07
│   ├── components/{ui,exam,reports}/
│   ├── lib/
│   │   ├── supabase/{server.ts,client.ts}
│   │   ├── auth/{jwt.ts,session.ts,password.ts}
│   │   ├── rules/                              # logic nghiệp vụ thuần, 1 file ↔ 1 nhóm FR
│   │   │   ├── barem.ts                        # FR-M1-01: validate tổng điểm = 10
│   │   │   ├── sinh-ca-thi.ts                  # FR-M4-01: tự sinh 4 ca theo loai_mon
│   │   │   ├── doi-mon-tu-chon.ts              # FR-M4-02: 48h / 2 lần
│   │   │   ├── ma-tran-de-thi.ts               # FR-M3-03: ma trận 3 chiều + snapshot
│   │   │   ├── cham-diem.ts                    # FR-M4-05: chấm 3 Phần
│   │   │   └── phan-tich-nang-luc.ts           # FR-M5-01: 4 nhóm năng lực
│   │   ├── ai/gemini.ts                        # FR-M5-02
│   │   └── email/gmail.ts                         # FR-M5-07 (stub)
│   └── types/database.ts                       # sinh từ `supabase gen types typescript`
├── tests/{unit,e2e}/
```

---

## 5. Roadmap theo phase

Thứ tự phase bám chuỗi phụ thuộc của khung mới M1→M2→M3→M4→M5. Riêng M4 có phạm vi lớn (Đợt thi, Ca thi, vi phạm và thực hiện bài thi) nên được chia thành hai phase kỹ thuật liên tiếp; đây không phải tách thêm module nghiệp vụ.

### Phase 0 — Hạ tầng & nền tảng auth (~1 tuần)
- Tạo project Supabase, project Vercel, API key Gemini (Google AI Studio), kết nối repo GitHub → Vercel.
- Chạy `0001_init_schema.sql` (27 bảng) + `0002_rls_policies.sql`.
- Auth: bảng `tai_khoan`, ký/xác minh JWT, đăng nhập, đổi mật khẩu lần đầu, khóa 5 lần sai.
- CI cơ bản: lint + typecheck + test chạy trên mỗi PR.
- **Done khi:** đăng nhập được bằng tài khoản Admin seed sẵn, đổi mật khẩu lần đầu hoạt động, RLS chặn đúng theo `vai_tro`.

### Phase 1 — M1 + M2: Danh mục, người dùng & xác thực (~2 tuần)
- UC-CAT-01/02/03: cấu hình Môn học (kèm validate barem tổng=10), khung giờ chuẩn, lớp học.
- UC-AUTH-01 và UC-USER-01..04: xác thực; quản lý Học sinh (gồm phân lớp); quản lý Giáo viên (gồm phân giảng); tạo/import tài khoản; đình chỉ/gỡ đình chỉ; bổ nhiệm Tổ trưởng.
- **Done khi:** Admin cấu hình đủ danh mục gốc, tạo được tài khoản Giáo viên/Học sinh, bổ nhiệm Tổ trưởng đúng 1 người/Môn.

### Phase 2 — M3: Ngân hàng câu hỏi & Đề thi (~3 tuần, nặng nhất về logic)
- UC-QB-01: Khung chuyên đề (cây Chuyên đề → Bài học).
- UC-QB-02/03: soạn câu hỏi theo đúng khuôn từng Phần (I/II/III), import Excel/Word (LaTeX, ảnh, bảng), yêu cầu chỉnh sửa.
- UC-QB-04/05/06: duyệt câu hỏi, duyệt yêu cầu chỉnh sửa, gắn ID nhóm trùng ý.
- UC-QB-07: tạo đề 3 bước (ma trận Phần×Chuyên đề×Mức độ, xem trước hoán đổi, mã đề nhánh) + snapshot cấu trúc/barem/nội dung câu hỏi.
- **Done khi:** tạo được 1 đề thi hoàn chỉnh cho 1 Môn, đề khóa đúng theo vòng đời (đang soạn → đã giao → khóa vĩnh viễn).

### Phase 3 — M4A: Đợt thi & chuẩn bị Ca thi (~1.5 tuần)
- UC-BATCH-01/02/03: tạo/sửa/xóa Đợt thi, tự sinh 4 Ca theo `loai_mon` + `thu_tu_ca_bat_buoc` (không hardcode tên môn).
- UC-BATCH-04: đổi môn tự chọn (giới hạn 48h/2 lần/vị trí).
- UC-BATCH-05: cron kiểm tra sẵn sàng 30 phút trước giờ thi, cảnh báo đúng phạm vi Môn thiếu đề.
- **Done khi:** tạo Đợt thi tự sinh đúng 4 Ca, đổi môn tự chọn tính lại danh sách Ca Ngày 2 đúng.

### Phase 4 — M4B: Ca thi, vi phạm & thực hiện bài thi (~3-4 tuần, rủi ro cao nhất)
- UC-EXAM-01 / FR-M4-04, FR-M4-05: giao diện làm bài (3 khuôn theo Phần), autosave 30s, đồng hồ đếm ngược không bù giờ, ghi nhận vi phạm tự động (Page Visibility API, `copy` event, mất kết nối), tự thu bài và chấm điểm ngay khi nộp.
- UC-EXAM-02/03/04 / FR-M4-03: giám sát real-time, mở khóa vào trễ, reset phiên (Tiếp tục / Làm lại), đình chỉ có hiệu lực từ ca kế tiếp.
- **Done khi:** mô phỏng được 1 ca thi đầy đủ với ≥20 phiên đồng thời (test tải nhẹ), autosave khôi phục đúng sau khi mất mạng giả lập.

### Phase 5 — M5: Phân tích, báo cáo, AI & thông báo (~2-2.5 tuần)
- UC-REPORT-01: phân tích kết quả trong 2 giờ (job nền), xếp 4 nhóm năng lực.
- UC-REPORT-02: gọi Gemini sinh nhận xét, retry 3 lần/2 phút, fallback template khi hết retry.
- UC-REPORT-03/04/05/06: báo cáo tổng quan Lớp, báo cáo cá nhân, tra cứu kết quả và **báo cáo tổng quan Môn toàn trường mới**; báo cáo Lớp/Môn xuất PDF/Excel.
- UC-NOTIFY-01: dựng interface gửi email, **chạy ở chế độ stub/log** (chưa gửi Gmail thật).
- **Done khi:** sau khi một Ca kết thúc, dữ liệu phân tích hoàn tất trong ≤2 giờ; có báo cáo Lớp, báo cáo Môn, báo cáo cá nhân, nhận xét AI, tra cứu kết quả và log email mô phỏng đúng phân quyền.

Gmail SMTP thật nằm ngay trong Phase 5. Adapter dùng App Password và được bật bằng
`EMAIL_ENABLED=true`; chế độ mặc định vẫn là stub/log để demo không gửi nhầm.

### Phase 6 — Kiểm thử, bảo mật, chuẩn bị bảo vệ (~1.5-2 tuần)
- Test theo checklist **31 UC / 22 FR** (dùng `use-case-v4/07-Validation-Report-vi.md` làm đường cơ sở).
- Rà soát RLS: đảm bảo Giáo viên chỉ thấy đúng Lớp×Môn trong phân công, Tổ trưởng thấy toàn bộ Môn của mình.
- Test tải mô phỏng ca thi đông học sinh; test khôi phục phiên khi rớt mạng.
- Chuẩn bị dữ liệu demo + kịch bản bảo vệ khóa luận.

**Tổng ước lượng:** ~14.5-16.5 tuần cho 1 người làm full-time (khóa luận). Phần tăng nhẹ so với bản cũ đến từ Báo cáo tổng quan Môn toàn trường và kiểm thử lại ma trận quyền theo khung 5 nhánh.

---

## 6. Quy tắc bắt buộc khi code (áp dụng xuyên suốt, chi tiết ở `webapp/CLAUDE.md`)

1. **Không tự thêm rule ngoài FR đã chốt.** Nếu thiếu quy tắc (xem "Open Items" trong `3.2_Khung_yeu_cau_chuc_nang.md`), đánh dấu `// TODO[Open Item #x]` trong code, không tự bịa quyết định thiết kế.
2. **Snapshot là bất biến.** `de_thi`, `cau_hoi_snapshot`, `chi_tiet_cau_hoi_snapshot` không bao giờ được UPDATE sau khi đề chuyển "Đã giao, chưa bắt đầu" — chỉ INSERT lúc tạo.
3. **Không hardcode tên môn.** Mọi logic gán Ca (FR-M4-01) tra theo `mon.loai_mon` + `mon.thu_tu_ca_bat_buoc`, không so sánh chuỗi `"Ngữ văn"`/`"Toán"`.
4. **Không bù giờ / không gia hạn** trong bất kỳ luồng xử lý ngoại lệ nào (FR-M4-03, FR-M4-05) — kể cả khi test thấy "bất công" cũng không tự thêm logic bù.
5. **RLS là lớp phòng thủ chính, UI chỉ là lớp phụ.** Không bao giờ dựa vào việc "ẩn nút" để chặn quyền — mọi bảng nhạy cảm (`cau_hoi`, `de_thi`, `bai_lam_thi`, `tra_loi`) phải có policy RLS tương ứng, review riêng ở Phase 6.
6. **Giới hạn cứng phải chặn ở DB, không chỉ ở UI:** ví dụ tổng barem = 10 (`CHECK constraint` hoặc trigger), 2 lần đổi môn tự chọn, 2 lần reset phiên thi — validate cả ở API lẫn constraint DB.
7. **Business logic thuần (không I/O) tách riêng vào `lib/rules/*`,** để unit test được mà không cần mock Supabase.

---

## 7. Skill / công cụ hỗ trợ trong quá trình code

Không cần tạo skill mới — dùng các skill sẵn có trong phiên làm việc khi tới đúng việc:
- **`xlsx`** — khi build Phase 1 (mẫu import Excel tài khoản/phân công) và Phase 5 (xuất báo cáo lớp ra Excel).
- **`pdf`** — khi build Phase 5 (xuất báo cáo lớp ra PDF).
- **`data:sql-queries`** — khi viết migration/query Postgres phức tạp (ma trận đề, phân tích năng lực).
- Riêng cho *coding agent* làm việc trong thư mục `webapp/`: đọc `webapp/CLAUDE.md` trước khi sửa code — file đó là rule tầng dự án, tương tự cách `claude-config/` đã làm cho giai đoạn viết tài liệu BA, nhưng áp cho giai đoạn dev.

---

## 8. Cổng quyết định theo Open Items của khung mới

Không tự suy diễn các điểm TBD. Chốt theo cổng phase để tránh block toàn bộ dự án:

| Open Item | Cần chốt trước | Ảnh hưởng kỹ thuật |
|---|---|---|
| #1 Ngữ văn/chấm tự luận | Phase 2 | Khuôn câu hỏi, UI làm bài, mô hình đáp án và engine chấm |
| #2 Số mức độ nhận thức (3 hay 4) | Phase 2 | Seed danh mục, ma trận đề và bộ lọc ngân hàng câu hỏi |
| #3 Chủ thể quản lý/ràng buộc xóa Khung chuyên đề | Phase 2 | Quyền UC-QB-01, FK và cơ chế vô hiệu hóa/xóa |
| #5 Chuẩn hóa bảng trạng thái | Trước migration Phase 0 | Enum/check constraint, state machine và nhãn UI |
| #6 Có/không danh mục Năm học riêng | Trước migration Phase 0 | Mô hình dữ liệu và bộ lọc báo cáo |
| #7 Cảnh báo sớm sức chứa ngân hàng câu hỏi | Phase 2 | Validation khi cấu hình số mã đề và UX tạo đề |
| #8 Quy ước đánh số UC con của FR gộp | Đã được xử lý bởi `use-case-v4/` | Dùng 31 UC hiện hành; không tạo lại mã `03a/03b` |
| #4 Khiếu nại/sửa điểm | Ngoài phạm vi hiện tại | Không dựng UI/API sửa điểm; chỉ để extension point và log tra cứu |
| #9 Ghi nhận thủ công gian lận vật lý | Ngoài phạm vi hiện tại | FR-M4-04 chỉ ghi nhận tự động; đình chỉ thủ công đi qua FR-M4-03 |

**Điều kiện Go/No-Go Phase 0:** phải chốt #5 và #6 trước khi khóa migration đầu tiên.  
**Điều kiện Go/No-Go Phase 2:** phải chốt #1, #2, #3 và #7 trước khi khóa schema/nghiệp vụ ngân hàng câu hỏi.  
Hai mục #4 và #9 không được tự thêm vào backlog triển khai hiện tại nếu chưa có FR mới hoặc quyết định mở rộng phạm vi.

### Quyết định Go Phase 2 (30/07/2026)

- **#1 Ngữ văn:** loại khỏi phạm vi ngân hàng câu hỏi, tạo đề và chấm tự động.
- **#2 Mức độ nhận thức:** dùng 4 mức — Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
- **#3 Khung chuyên đề:** Tổ trưởng quản lý Chuyên đề → Bài học của đúng môn mình. Mục đã có câu hỏi chỉ được vô hiệu hóa, không xóa.
- **#7 Sức chứa ngân hàng:** kiểm tra theo từng ô Chuyên đề × Mức độ; hiển thị số câu còn thiếu và không cho hoàn tất đề khi chưa đủ.

Kết luận: **GO Phase 2**.
