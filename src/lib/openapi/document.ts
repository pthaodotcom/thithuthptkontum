const json = (schema: Record<string, unknown>) => ({
  content: { "application/json": { schema } },
});

const success = (schema: Record<string, unknown>, description = "Thành công") => ({
  description,
  ...json({
    type: "object",
    required: ["data"],
    properties: { data: schema },
  }),
});

const apiError = (description: string) => ({
  description,
  ...json({ $ref: "#/components/schemas/ApiError" }),
});

const simpleError = (description: string) => ({
  description,
  ...json({ $ref: "#/components/schemas/SimpleError" }),
});

const cookieSecurity = [{ cookieAuth: [] }];
const uuid = { type: "string", format: "uuid" };
const dateTime = { type: "string", format: "date-time" };

export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "API Hệ thống Thi thử THPT",
    version: "1.0.0",
    description:
      "Tài liệu được xây dựng từ các Next.js Route Handler đang có trong hệ thống. " +
      "Các API nghiệp vụ dùng cookie phiên đăng nhập; hai API cron dùng Bearer token riêng.",
  },
  servers: [{ url: "/", description: "Máy chủ hiện tại" }],
  tags: [
    { name: "Xác thực" },
    { name: "Bài thi" },
    { name: "Báo cáo" },
    { name: "Giám sát" },
    { name: "Câu hỏi" },
    { name: "Hệ thống" },
    { name: "Cron" },
    { name: "Tài liệu API" },
  ],
  paths: {
    "/api/auth/dang-nhap": {
      post: {
        tags: ["Xác thực"],
        summary: "Đăng nhập bằng mã số và mật khẩu",
        operationId: "dangNhap",
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/DangNhapRequest" }),
        },
        responses: {
          "200": {
            description: "Đăng nhập thành công và tạo cookie phiên",
            ...json({
              type: "object",
              required: ["phai_doi_mat_khau"],
              properties: { phai_doi_mat_khau: { type: "boolean" } },
            }),
          },
          "400": simpleError("Dữ liệu đăng nhập không hợp lệ"),
          "401": simpleError("Sai mã số hoặc mật khẩu"),
          "503": simpleError("Dịch vụ xác thực chưa sẵn sàng"),
        },
      },
    },
    "/api/auth/dang-xuat": {
      post: {
        tags: ["Xác thực"],
        summary: "Đăng xuất và xóa cookie phiên",
        operationId: "dangXuat",
        security: cookieSecurity,
        responses: {
          "200": {
            description: "Đăng xuất thành công",
            ...json({
              type: "object",
              required: ["success"],
              properties: { success: { type: "boolean", example: true } },
            }),
          },
        },
      },
    },
    "/api/auth/doi-mat-khau": {
      post: {
        tags: ["Xác thực"],
        summary: "Đổi mật khẩu của tài khoản đang đăng nhập",
        operationId: "doiMatKhau",
        security: cookieSecurity,
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/DoiMatKhauRequest" }),
        },
        responses: {
          "200": {
            description: "Đổi mật khẩu thành công",
            ...json({
              type: "object",
              required: ["success"],
              properties: { success: { type: "boolean", example: true } },
            }),
          },
          "400": simpleError("Mật khẩu chưa hợp lệ"),
          "401": simpleError("Chưa đăng nhập hoặc mật khẩu cũ không đúng"),
          "500": simpleError("Không thể cập nhật mật khẩu"),
        },
      },
    },
    "/api/auth/google/connect": {
      get: {
        tags: ["Xác thực"],
        summary: "Bắt đầu liên kết tài khoản Google",
        operationId: "googleConnect",
        security: cookieSecurity,
        responses: {
          "302": { description: "Chuyển hướng đến Google OAuth hoặc trang quản trị" },
          "403": simpleError("Chỉ quản trị viên được liên kết Gmail"),
        },
      },
    },
    "/api/auth/google/callback": {
      get: {
        tags: ["Xác thực"],
        summary: "Nhận callback từ Google OAuth",
        operationId: "googleCallback",
        security: cookieSecurity,
        parameters: [
          { name: "code", in: "query", schema: { type: "string" } },
          { name: "state", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "302": { description: "Chuyển hướng về trang quản trị sau khi xử lý" },
        },
      },
    },
    "/api/bai-thi/vao-thi": {
      post: {
        tags: ["Bài thi"],
        summary: "Tạo hoặc mở bài làm của học sinh",
        operationId: "vaoThi",
        security: cookieSecurity,
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/VaoThiRequest" }),
        },
        responses: {
          "200": success({ $ref: "#/components/schemas/VaoThiResponse" }, "Mở lại bài làm hiện có"),
          "201": success({ $ref: "#/components/schemas/VaoThiResponse" }, "Tạo bài làm mới"),
          "403": apiError("Không có quyền vào thi"),
          "404": apiError("Không tìm thấy ca thi"),
          "409": apiError("Trạng thái bài thi xung đột"),
          "422": apiError("Dữ liệu không hợp lệ"),
          "423": apiError("Ca thi đang bị khóa"),
        },
      },
    },
    "/api/bai-thi/autosave": {
      post: {
        tags: ["Bài thi"],
        summary: "Tự động lưu câu trả lời",
        operationId: "autosaveBaiThi",
        security: cookieSecurity,
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/AutosaveRequest" }),
        },
        responses: {
          "200": success({ $ref: "#/components/schemas/AutosaveResponse" }),
          "400": apiError("Thiếu idempotency key"),
          "403": apiError("Không có quyền sửa bài làm"),
          "404": apiError("Không tìm thấy bài làm"),
          "409": apiError("Bài làm không còn cho phép cập nhật"),
          "422": apiError("Dữ liệu câu trả lời không hợp lệ"),
          "500": apiError("Không thể lưu bài"),
        },
      },
    },
    "/api/bai-thi/nop-bai": {
      post: {
        tags: ["Bài thi"],
        summary: "Nộp và chấm bài thi",
        operationId: "nopBai",
        security: cookieSecurity,
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/NopBaiRequest" }),
        },
        responses: {
          "200": success({ $ref: "#/components/schemas/NopBaiResponse" }),
          "400": apiError("Thiếu idempotency key"),
          "403": apiError("Không có quyền nộp bài"),
          "404": apiError("Không tìm thấy bài làm"),
          "409": apiError("Trạng thái bài làm xung đột"),
          "422": apiError("Dữ liệu không hợp lệ"),
          "500": apiError("Không thể chấm hoặc nộp bài"),
        },
      },
    },
    "/api/bai-thi/vi-pham": {
      post: {
        tags: ["Bài thi"],
        summary: "Ghi nhận vi phạm trong lúc làm bài",
        operationId: "ghiNhanViPham",
        security: cookieSecurity,
        requestBody: {
          required: true,
          ...json({ $ref: "#/components/schemas/ViPhamRequest" }),
        },
        responses: {
          "200": success({ $ref: "#/components/schemas/ViPhamResponse" }),
          "403": apiError("Không có quyền ghi nhận vi phạm"),
          "409": apiError("Bài làm không còn hoạt động"),
          "422": apiError("Dữ liệu vi phạm không hợp lệ"),
          "500": apiError("Không thể ghi nhận vi phạm"),
        },
      },
    },
    "/api/bao-cao/tuy-chon": {
      get: {
        tags: ["Báo cáo"],
        summary: "Lấy lựa chọn lớp và ca thi cho bộ lọc báo cáo",
        operationId: "layTuyChonBaoCao",
        security: cookieSecurity,
        parameters: [
          { name: "monId", in: "query", required: true, schema: uuid },
          { name: "lopId", in: "query", schema: uuid },
        ],
        responses: {
          "200": {
            description: "Danh sách tùy chọn theo phạm vi của người dùng",
            ...json({
              oneOf: [
                {
                  type: "object",
                  required: ["lopOptions"],
                  properties: { lopOptions: { type: "array", items: { type: "object" } } },
                },
                {
                  type: "object",
                  required: ["caThiOptions"],
                  properties: { caThiOptions: { type: "array", items: { type: "object" } } },
                },
              ],
            }),
          },
          "400": simpleError("Thiếu monId"),
          "403": simpleError("Không có quyền xem báo cáo"),
        },
      },
    },
    "/api/bao-cao/xuat": {
      get: {
        tags: ["Báo cáo"],
        summary: "Xuất báo cáo kết quả",
        operationId: "xuatBaoCao",
        security: cookieSecurity,
        parameters: [
          {
            name: "format",
            in: "query",
            schema: { type: "string", enum: ["xlsx", "pdf"], default: "xlsx" },
          },
          { name: "lopId", in: "query", schema: uuid },
          { name: "monId", in: "query", schema: uuid },
          { name: "caThiMonId", in: "query", schema: uuid },
        ],
        responses: {
          "200": {
            description: "Tệp XLSX hoặc PDF",
            content: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" },
              },
              "application/pdf": { schema: { type: "string", format: "binary" } },
            },
          },
          "403": {
            description: "Không có quyền xuất báo cáo",
            ...json({ $ref: "#/components/schemas/ReportError" }),
          },
          "500": {
            description: "Không thể tạo báo cáo",
            ...json({ $ref: "#/components/schemas/ReportError" }),
          },
        },
      },
    },
    "/api/cau-hoi/mau-import": {
      get: {
        tags: ["Câu hỏi"],
        summary: "Tải tệp Excel mẫu để nhập câu hỏi",
        operationId: "taiMauImportCauHoi",
        security: cookieSecurity,
        responses: {
          "200": {
            description: "Tệp mẫu XLSX",
            content: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" },
              },
            },
          },
          "403": simpleError("Chỉ giáo viên được tải tệp mẫu"),
        },
      },
    },
    "/api/audit-log": {
      get: {
        tags: ["Hệ thống"],
        summary: "Tra cứu lịch sử thay đổi",
        operationId: "layAuditLog",
        security: cookieSecurity,
        parameters: [
          { name: "tuNgay", in: "query", schema: dateTime },
          { name: "denNgay", in: "query", schema: dateTime },
          { name: "hanhDong", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "doiTuong", in: "query", schema: { type: "string", maxLength: 100 } },
          { name: "nguoiThucHien", in: "query", schema: uuid },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", enum: [25, 50, 100], default: 25 },
          },
        ],
        responses: {
          "200": success({ $ref: "#/components/schemas/AuditLogResponse" }),
          "403": apiError("Chỉ quản trị viên được truy cập"),
          "422": apiError("Bộ lọc không hợp lệ"),
          "500": apiError("Không thể truy vấn lịch sử"),
        },
      },
    },
    "/api/giam-sat": {
      get: {
        tags: ["Giám sát"],
        summary: "Lấy danh sách bài làm đang được giám sát",
        operationId: "layDuLieuGiamSat",
        security: cookieSecurity,
        responses: {
          "200": success({ type: "array", items: { type: "object", additionalProperties: true } }),
          "403": apiError("Chỉ quản trị viên được truy cập"),
          "500": apiError("Không thể tải dữ liệu giám sát"),
        },
      },
    },
    "/api/giam-sat/realtime-token": {
      get: {
        tags: ["Giám sát"],
        summary: "Cấp token Supabase Realtime ngắn hạn",
        operationId: "layRealtimeToken",
        security: cookieSecurity,
        responses: {
          "200": success({
            type: "object",
            required: ["token", "expiresInSeconds"],
            properties: {
              token: { type: "string" },
              expiresInSeconds: { type: "integer", example: 300 },
            },
          }),
          "403": apiError("Chỉ quản trị viên được truy cập"),
          "503": apiError("Realtime chưa được cấu hình"),
        },
      },
    },
    "/api/email-preview/{baiLamId}": {
      get: {
        tags: ["Hệ thống"],
        summary: "Xem trước nội dung email kết quả",
        operationId: "xemTruocEmailKetQua",
        security: cookieSecurity,
        parameters: [
          { name: "baiLamId", in: "path", required: true, schema: uuid },
        ],
        responses: {
          "200": {
            description: "Dữ liệu email xem trước",
            ...json({ type: "object", additionalProperties: true }),
          },
          "403": simpleError("Chỉ quản trị viên được truy cập"),
          "404": simpleError("Không tìm thấy bài làm"),
          "422": simpleError("Bài làm chưa đủ dữ liệu để xem trước email"),
        },
      },
    },
    "/api/cron/kiem-tra-san-sang": {
      get: {
        tags: ["Cron"],
        summary: "Kiểm tra và cập nhật trạng thái sẵn sàng của ca thi",
        operationId: "cronKiemTraSanSang",
        security: [{ cronBearer: [] }],
        responses: {
          "200": success({ type: "object", additionalProperties: true }),
          "401": apiError("Bearer token không hợp lệ"),
          "500": apiError("Tác vụ thất bại"),
        },
      },
    },
    "/api/cron/xu-ly-hang-doi": {
      get: {
        tags: ["Cron"],
        summary: "Xử lý các công việc đang chờ",
        operationId: "cronXuLyHangDoi",
        security: [{ cronBearer: [] }],
        responses: {
          "200": success({ type: "object", additionalProperties: true }),
          "401": apiError("Bearer token không hợp lệ"),
          "500": apiError("Tác vụ thất bại"),
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["Tài liệu API"],
        summary: "Lấy tài liệu OpenAPI dạng JSON",
        operationId: "layOpenApiDocument",
        responses: {
          "200": {
            description: "Tài liệu OpenAPI 3.0.3",
            ...json({ type: "object", additionalProperties: true }),
          },
          "404": apiError("Swagger không được bật trên môi trường này"),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session",
        description: "Cookie phiên được tạo sau khi đăng nhập.",
      },
      cronBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "CRON_SECRET",
        description: "Secret dành riêng cho tác vụ cron.",
      },
    },
    parameters: {
      IdempotencyKey: {
        name: "idempotency-key",
        in: "header",
        required: true,
        description: "UUID duy nhất cho mỗi thao tác để chống gửi lặp.",
        schema: uuid,
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { nullable: true },
        },
      },
      SimpleError: {
        type: "object",
        required: ["error"],
        properties: { error: { type: "string" } },
      },
      ReportError: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      DangNhapRequest: {
        type: "object",
        required: ["ma_so", "mat_khau"],
        properties: {
          ma_so: { type: "string", minLength: 4, maxLength: 20, example: "HS001" },
          mat_khau: { type: "string", format: "password", minLength: 1 },
        },
      },
      DoiMatKhauRequest: {
        type: "object",
        required: ["mat_khau_cu", "mat_khau_moi"],
        properties: {
          mat_khau_cu: { type: "string", format: "password" },
          mat_khau_moi: { type: "string", format: "password" },
        },
      },
      VaoThiRequest: {
        type: "object",
        required: ["caThiMonId"],
        properties: { caThiMonId: uuid },
      },
      VaoThiResponse: {
        type: "object",
        required: ["baiLamId", "maDeId", "gioKetThuc"],
        properties: { baiLamId: uuid, maDeId: uuid, gioKetThuc: dateTime },
      },
      TraLoiAutosave: {
        type: "object",
        required: ["cauHoiSnapshotId"],
        properties: {
          cauHoiSnapshotId: uuid,
          chiTietThuTu: { type: "integer", minimum: 0, maximum: 4, default: 0 },
          dapAnLuaChonId: { ...uuid, nullable: true },
          dapAnDungSai: { type: "boolean", nullable: true },
          dapAnChuoi: { type: "string", pattern: "^[0-9,.-]{0,4}$", nullable: true },
        },
      },
      AutosaveRequest: {
        type: "object",
        required: ["baiLamId", "traLoi"],
        properties: {
          baiLamId: uuid,
          traLoi: {
            type: "array",
            maxItems: 500,
            items: { $ref: "#/components/schemas/TraLoiAutosave" },
          },
        },
      },
      AutosaveResponse: {
        type: "object",
        required: ["daLuu"],
        properties: {
          daLuu: { type: "integer" },
          thoiDiem: dateTime,
          idempotencyReplay: { type: "boolean" },
        },
      },
      NopBaiRequest: {
        type: "object",
        required: ["baiLamId", "lyDo"],
        properties: {
          baiLamId: uuid,
          lyDo: { type: "string", enum: ["TuNop", "HetGio", "ViPham"] },
          canhBaoLuuCuoi: { type: "boolean", default: false },
        },
      },
      NopBaiResponse: {
        type: "object",
        required: ["diemTong", "soCauDung", "soCauSai", "thoiDiemNop", "daNopTruoc"],
        properties: {
          diemTong: { type: "number" },
          soCauDung: { type: "integer" },
          soCauSai: { type: "integer" },
          thoiDiemNop: dateTime,
          daNopTruoc: { type: "boolean" },
          idempotencyReplay: { type: "boolean" },
        },
      },
      ViPhamRequest: {
        type: "object",
        required: ["baiLamId", "loai", "eventId"],
        properties: {
          baiLamId: uuid,
          loai: { type: "string", enum: ["Copy", "ChuyenTab", "MatKetNoi"] },
          thoiLuongGiay: { type: "number", minimum: 0, maximum: 86400 },
          eventId: uuid,
        },
      },
      ViPhamResponse: {
        type: "object",
        required: ["daGhiNhan", "soViPham", "tuDongThuBai"],
        properties: {
          daGhiNhan: { type: "boolean" },
          soViPham: { type: "integer" },
          tuDongThuBai: { type: "boolean" },
        },
      },
      AuditLogResponse: {
        type: "object",
        required: ["items", "page", "pageSize", "total", "boLoc"],
        properties: {
          items: { type: "array", items: { type: "object", additionalProperties: true } },
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          boLoc: { type: "object", additionalProperties: true },
        },
      },
    },
  },
} as const;
