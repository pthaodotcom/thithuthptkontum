import { NextRequest } from "next/server";
import { z } from "zod";
import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const querySchema = z.object({
  tuNgay: z.string().datetime({ offset: true }).optional(),
  denNgay: z.string().datetime({ offset: true }).optional(),
  hanhDong: z.string().trim().min(1).max(100).optional(),
  doiTuong: z.string().trim().min(1).max(100).optional(),
  nguoiThucHien: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number()
    .pipe(z.union([z.literal(25), z.literal(50), z.literal(100)]))
    .default(25),
}).refine(
  (value) => !value.tuNgay || !value.denNgay ||
    new Date(value.tuNgay) <= new Date(value.denNgay),
  { message: "Thời gian bắt đầu phải trước thời gian kết thúc", path: ["tuNgay"] },
);

type AuditRow = {
  id: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_id: string | null;
  nguoi_thuc_hien_tai_khoan_id: string | null;
  du_lieu: unknown;
  du_lieu_truoc: unknown;
  du_lieu_sau: unknown;
  thoi_diem: string;
};

export async function GET(request: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    return apiLoi("KHONG_CO_QUYEN", "Chỉ Admin được xem nhật ký kiểm toán", 403);
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return apiLoi("DU_LIEU_KHONG_HOP_LE", "Bộ lọc audit log không hợp lệ", 422,
      parsed.error.flatten());
  }

  const input = parsed.data;
  const supabase = taoSupabaseServiceRole();
  let query = supabase.from("audit_log").select(
    "id,hanh_dong,doi_tuong,doi_tuong_id,nguoi_thuc_hien_tai_khoan_id,du_lieu,du_lieu_truoc,du_lieu_sau,thoi_diem",
    { count: "exact" },
  ).order("thoi_diem", { ascending: false }).order("id", { ascending: false });

  if (input.tuNgay) query = query.gte("thoi_diem", input.tuNgay);
  if (input.denNgay) query = query.lte("thoi_diem", input.denNgay);
  if (input.hanhDong) query = query.eq("hanh_dong", input.hanhDong);
  if (input.doiTuong) query = query.eq("doi_tuong", input.doiTuong);
  if (input.nguoiThucHien) {
    query = query.eq("nguoi_thuc_hien_tai_khoan_id", input.nguoiThucHien);
  }

  const from = (input.page - 1) * input.pageSize;
  const { data, error, count } = await query.range(from, from + input.pageSize - 1);
  if (error) {
    console.error("audit_log query failed", error);
    return apiLoi("TRUY_VAN_THAT_BAI", "Không thể tải nhật ký kiểm toán", 500);
  }

  const rows = (data ?? []) as AuditRow[];
  const { data: facets, error: facetsError } = await supabase.from("audit_log")
    .select("hanh_dong,doi_tuong,nguoi_thuc_hien_tai_khoan_id").limit(10_000);
  if (facetsError) {
    console.error("audit facets query failed", facetsError);
    return apiLoi("TRUY_VAN_THAT_BAI", "Không thể tải bộ lọc audit log", 500);
  }

  const actorIds = [...new Set([
    ...rows.map((row) => row.nguoi_thuc_hien_tai_khoan_id),
    ...(facets ?? []).map((row) => row.nguoi_thuc_hien_tai_khoan_id as string | null),
  ].filter((id): id is string => Boolean(id)))];
  const { data: actors, error: actorError } = actorIds.length
    ? await supabase.from("tai_khoan").select("tai_khoan_id,ma_so,ho_ten")
      .in("tai_khoan_id", actorIds)
    : { data: [], error: null };
  if (actorError) {
    console.error("audit actor query failed", actorError);
    return apiLoi("TRUY_VAN_THAT_BAI", "Không thể tải người thực hiện", 500);
  }

  const actorMap = new Map((actors ?? []).map((actor) => [
    actor.tai_khoan_id as string,
    { maSo: actor.ma_so as string, hoTen: actor.ho_ten as string },
  ]));

  return apiThanhCong({
    items: rows.map((row) => ({
      ...row,
      nguoi_thuc_hien: row.nguoi_thuc_hien_tai_khoan_id
        ? actorMap.get(row.nguoi_thuc_hien_tai_khoan_id) ?? null : null,
      la_du_lieu_legacy: row.du_lieu_truoc == null && row.du_lieu_sau == null,
    })),
    page: input.page,
    pageSize: input.pageSize,
    total: count ?? 0,
    boLoc: {
      hanhDong: [...new Set((facets ?? []).map((row) => row.hanh_dong as string))].sort(),
      doiTuong: [...new Set((facets ?? []).map((row) => row.doi_tuong as string))].sort(),
      nguoiThucHien: actorIds.map((id) => ({ id, ...actorMap.get(id) }))
        .filter((actor) => actor.maSo && actor.hoTen)
        .sort((a, b) => a.maSo!.localeCompare(b.maSo!, "vi")),
    },
  });
}
