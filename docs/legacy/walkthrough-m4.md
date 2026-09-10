# Walkthrough M4 — gate trước M5

Ngày chạy: 2026-07-30  
Supabase: project liên kết trong `supabase/.temp/project-ref`  
Docker: không sử dụng

## 1. Migration và dữ liệu Tin học

Đã áp dụng thành công các migration:

- `0019_m4_subject_catalog.sql`
- `0020_fix_audit_delete_snapshot.sql`
- `0021_atomic_idempotent_exam_io.sql`

Seed `supabase/seed_m4_tin_hoc.sql` đã được chạy hai lần liên tiếp để xác
nhận tính idempotent. Truy vấn hậu kiểm trả về:

```text
canonical_electives = 9
canonical_tin_hoc   = 1
tin_part_i          = 24
tin_part_ii         = 4
sample_max_score    = 10.00
```

pgTAP `0019_m4_catalog_and_tin_hoc.test.sql`: 19/19 assertions pass:

- Chặn thiếu môn, trùng môn, môn bắt buộc và môn ngừng dùng.
- Chấp nhận hai môn hợp lệ và cập nhật hợp lệ.
- Snapshot khớp ngân hàng; barem bằng 10.
- Bộ đáp án đúng biết trước đạt `10.00`, `28 đúng`, `0 sai`, đúng một audit.
- Bộ đáp án bán phần đạt đúng `6.85`, kiểm chứng barem lũy tiến Phần II.

pgTAP hồi quy `0012_atomic_submit_and_grade.test.sql`: 21/21 assertions pass.

## 2. Audit SQL Editor

Chạy không Docker:

```powershell
npx supabase db query --linked --file .\supabase\tests\0020_audit_sql_editor.test.sql
```

12/12 assertions pass. Snapshot chẩn đoán cuối:

```text
INSERT: before = null, after.ten_mon = "M4 Audit temporary"
UPDATE: before.ten_mon = "M4 Audit temporary"
        after.ten_mon  = "M4 Audit updated"
DELETE: before.ten_mon = "M4 Audit updated", after = null
```

Admin đọc được audit, Học sinh không đọc được; update/delete audit log đều bị
`AUDIT_LOG_IMMUTABLE`. Update dữ liệu nghiệp vụ vẫn tồn tại sau trigger.

Gate đã phát hiện và sửa một hồi quy thật: delete chạy sau update trong cùng
transaction từng lấy nhầm snapshot update cũ. Migration `0020` buộc sự kiện
`Xoa*` dùng payload bản ghi ngay trước xóa.

## 3. Offline và Realtime E2E

Fixture:

```powershell
npm run fixtures:m4
```

Kết quả Playwright:

```text
tests/e2e/offline-exam.spec.ts        1 passed
tests/e2e/realtime.smoke.spec.ts      4 passed
```

Offline E2E xác nhận: mất kết nối API, trả lời, reload, phục hồi IndexedDB,
queue theo sequence, submit terminal, khôi phục mạng, queue rỗng, điểm 10 và
chỉ tăng một audit `NopBai`.

Realtime E2E xác nhận: vi phạm cập nhật ngay, fallback polling 30 giây, stale
banner/phục hồi HTTP và trạng thái nộp bài cập nhật tức thời.

## 4. Tải nhẹ 20 phiên

Node standalone runner được chạy trên production build, 20 học sinh và 20 bài
làm độc lập:

```json
{
  "sessions": 20,
  "failures": [],
  "p95Ms": {
    "autosave": 1469.4056,
    "submit": 1190.1554
  },
  "thresholdMs": 1500,
  "passed": true
}
```

Hậu kiểm DB trong runner: đủ 20 bài `DaNopBai`, đúng 20 audit `NopBai` phát
sinh trong lần chạy, replay idempotent không chấm lại.

Để đạt gate mà không nới threshold, autosave và submit đã được gộp thành RPC
nguyên tử: claim idempotency, ghi/chấm và lưu response trong một transaction.

## 5. Gate cuối

```text
npm run lint       PASS
npm run typecheck  PASS
npm test           PASS — 9 files, 28 tests
npm run build      PASS
Supabase db lint   PASS — 0 error
pgTAP              PASS — 10 + 12 + 19 + 21 assertions
Realtime E2E       PASS — 4/4
Offline E2E        PASS — 1/1
20-session load    PASS
```

M4 đủ điều kiện đóng. M5 reporting chỉ được bắt đầu từ trạng thái này.
