# GEMINI.md — Rule coding cho webapp Thi thử Trực tuyến THPT

Đây là rule tầng **dự án code** (khác `claude-config/` ở gốc repo — vốn dùng cho giai
đoạn viết tài liệu BA). Đọc file này trước khi sửa bất kỳ file nào trong `webapp/`.

## Nguồn sự thật (source of truth) — đọc theo thứ tự khi cần tra cứu nghiệp vụ

1. `../3.2_Khung_yeu_cau_chuc_nang.md` — 29 FR, mã `FR-M{module}-{seq}`. Đây là **luật nghiệp vụ**, không tự suy diễn thêm.
2. `../use-case-v3/` — 29 UC chi tiết (luồng chính, luồng thay thế, exception).
3. `../Thiet_ke_CSDL_Rut_Gon_KhoaLuan.md` — thiết kế 27 bảng đã map sang `supabase/migrations/0001_init_schema.sql`.
4. `../ke-hoach-trien-khai-webapp.md` — roadmap, kiến trúc kỹ thuật, lý do chọn công nghệ.

Nếu code và tài liệu FR/UC mâu thuẫn nhau, **tài liệu FR/UC đúng** — sửa code, không sửa cách hiểu tài liệu trừ khi được xác nhận đó là lỗi đánh máy trong tài liệu.

## Quy tắc bắt buộc

1. **Không tự thêm rule ngoài FR đã chốt.** Thiếu quy tắc → viết `// TODO[Open Item #x]` (xem mục "Open Items" trong khung FR), không tự bịa quyết định thiết kế. Nếu buộc phải giả định để code chạy được, ghi rõ giả định trong comment và báo lại cho người dùng.
2. **Snapshot là bất biến.** `de_thi`, `cau_hoi_snapshot`, `chi_tiet_cau_hoi_snapshot` không bao giờ UPDATE sau khi `de_thi.trang_thai` chuyển khỏi `'DangSoan'` — chỉ INSERT lúc tạo đề. Không viết code nào "tiện tay" update các bảng này để sửa lỗi dữ liệu — nếu cần sửa, đó là một quyết định nghiệp vụ mới, hỏi lại trước.
3. **Không hardcode tên môn.** Mọi logic gán Ca thi (FR-M4-01) tra theo `mon.loai_mon` + `mon.thu_tu_ca_bat_buoc`. Không bao giờ so sánh chuỗi kiểu `ten_mon = 'Ngữ văn'`.
4. **Không bù giờ / không gia hạn** trong bất kỳ luồng xử lý ngoại lệ nào (FR-M5-03: mở khóa vào trễ, reset phiên). Đồng hồ đếm ngược luôn = `gio_ket_thuc - now()`.
5. **RLS là lớp phòng thủ chính, UI/middleware chỉ là lớp phụ.** Không bao giờ chỉ "ẩn nút" hoặc chặn ở `middleware.ts` mà bỏ qua policy RLS tương ứng ở `supabase/migrations/0002_rls_policies.sql`. Khi thêm bảng/cột mới có dữ liệu nhạy cảm, luôn thêm policy RLS cùng lúc, không để "làm sau".
6. **Giới hạn cứng phải chặn ở DB, không chỉ ở UI/API:** ví dụ tổng barem = 10, tối đa 2 lần đổi môn tự chọn/vị trí/đợt thi, tối đa 2 lần reset phiên thi/ca thi. Validate ở cả API (thông báo lỗi rõ ràng cho người dùng) lẫn constraint/trigger DB (chốt chặn cuối).
7. **Business logic thuần (không I/O) đặt trong `src/lib/rules/*`**, tách khỏi Supabase/Next.js, để unit test không cần mock. Mỗi file rule mới nên có test tương ứng trong `tests/unit/` (xem `barem.test.ts` làm khuôn mẫu).
8. **Đặt tên bảng/cột/route giữ tiếng Việt không dấu** (đã chốt cùng chủ dự án) — khớp với `Thiet_ke_CSDL_Rut_Gon_KhoaLuan.md` và cấu trúc route hiện có. Không tự đổi sang tiếng Anh giữa chừng.
9. **Không dùng Supabase Auth (GoTrue) trực tiếp.** Auth tự viết qua `src/lib/auth/*` (xem chi tiết trong `ke-hoach-trien-khai-webapp.md` mục 2). Nếu cần thêm luồng auth mới, mở rộng theo pattern JWT tự ký hiện có, không thêm NextAuth/Supabase Auth song song.
10. **Zalo ZNS đang ở chế độ stub** (`ZALO_ZNS_ENABLED=false`). Không code cứng logic gọi API Zalo thật cho tới khi có tài khoản OA + template được duyệt (xem Phase 5.5 trong kế hoạch).

## Quy ước code

- App Router, Server Components mặc định; chỉ thêm `"use client"` khi thật sự cần state/event ở trình duyệt (giao diện làm bài, giám sát real-time).
- Validate input bằng `zod` ở mọi API route trước khi chạm DB.
- Không import `src/lib/supabase/server.ts` (service role) vào bất kỳ file nào chạy ở client — service role key không bao giờ được lộ ra bundle client.
- Trước khi coi 1 UC là "xong": đối chiếu lại đúng UC-ID trong `use-case-v3/`, đảm bảo mọi luồng thay thế (alternative flow) và exception trong đặc tả đều có code xử lý, không chỉ luồng chính (happy path).

## Chạy dự án

```bash
npm install
cp .env.example .env.local   # dien cac secret that (xem README.md)
npm run dev                  # http://localhost:3000
npm run test                 # unit test (vitest)
npm run typecheck
npm run lint
```

Xem `README.md` để biết cách tạo project Supabase/Vercel/Gemini và chạy migration.
