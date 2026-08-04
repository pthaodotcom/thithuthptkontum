import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  serviceRole: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  laySessionHienHanh: mocks.session,
}));
vi.mock("@/lib/supabase/server", () => ({
  taoSupabaseServiceRole: mocks.serviceRole,
}));

import { GET } from "@/app/api/audit-log/route";

function request(query = "") {
  return new NextRequest(`http://localhost/api/audit-log${query}`);
}

describe("GET /api/audit-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("từ chối phiên chưa đăng nhập", async () => {
    mocks.session.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(mocks.serviceRole).not.toHaveBeenCalled();
  });

  it("từ chối vai trò không phải Admin", async () => {
    mocks.session.mockResolvedValue({ vai_tro: "HocSinh", sub: crypto.randomUUID() });
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(mocks.serviceRole).not.toHaveBeenCalled();
  });

  it("validate khoảng thời gian và pageSize", async () => {
    mocks.session.mockResolvedValue({ vai_tro: "Admin", sub: crypto.randomUUID() });
    const invalidSize = await GET(request("?pageSize=10"));
    expect(invalidSize.status).toBe(422);
    const invalidRange = await GET(request(
      "?tuNgay=2026-08-02T00%3A00%3A00%2B07%3A00&denNgay=2026-08-01T00%3A00%3A00%2B07%3A00",
    ));
    expect(invalidRange.status).toBe(422);
    expect(mocks.serviceRole).not.toHaveBeenCalled();
  });

  it("áp dụng bộ lọc, phân trang server và serialize legacy", async () => {
    mocks.session.mockResolvedValue({ vai_tro: "Admin", sub: crypto.randomUUID() });
    const actorId = crypto.randomUUID();
    const row = {
      id: crypto.randomUUID(),
      hanh_dong: "CapNhatDotThi",
      doi_tuong: "DotThi",
      doi_tuong_id: crypto.randomUUID(),
      nguoi_thuc_hien_tai_khoan_id: actorId,
      du_lieu: { legacy: true },
      du_lieu_truoc: null,
      du_lieu_sau: null,
      thoi_diem: "2026-07-30T12:00:00.000Z",
    };

    const pageQuery = {
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [row], error: null, count: 26 }),
    };
    const facetsQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [{
          hanh_dong: row.hanh_dong,
          doi_tuong: row.doi_tuong,
          nguoi_thuc_hien_tai_khoan_id: actorId,
        }],
        error: null,
      }),
    };
    const actorsQuery = {
      in: vi.fn().mockResolvedValue({
        data: [{ tai_khoan_id: actorId, ma_so: "admin01", ho_ten: "Admin Test" }],
        error: null,
      }),
    };
    const from = vi.fn()
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(pageQuery) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(facetsQuery) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(actorsQuery) });
    mocks.serviceRole.mockReturnValue({ from });

    const response = await GET(request(
      `?page=2&pageSize=25&hanhDong=CapNhatDotThi&doiTuong=DotThi&nguoiThucHien=${actorId}` +
      "&tuNgay=2026-07-01T00%3A00%3A00%2B07%3A00&denNgay=2026-07-31T23%3A59%3A59%2B07%3A00",
    ));
    expect(response.status).toBe(200);
    expect(pageQuery.eq).toHaveBeenCalledTimes(3);
    expect(pageQuery.range).toHaveBeenCalledWith(25, 49);
    const body = await response.json();
    expect(body.data).toMatchObject({
      page: 2,
      pageSize: 25,
      total: 26,
      items: [{
        la_du_lieu_legacy: true,
        nguoi_thuc_hien: { maSo: "admin01", hoTen: "Admin Test" },
      }],
    });
  });
});
