"use server";

import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function damBaoAdmin() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") throw new Error("Không có quyền thực hiện");
}

export async function luuPhanCong(giaoVienId: string, monId: string, lopIds: string[]) {
  await damBaoAdmin();
  const supabase = taoSupabaseServiceRole();
  const { data: giaoVien } = await supabase
    .from("tai_khoan")
    .select("vai_tro")
    .eq("tai_khoan_id", giaoVienId)
    .single();
  if (!giaoVien || giaoVien.vai_tro !== "GiaoVien") {
    return { success: false, error: "Tài khoản không phải giáo viên" };
  }
  const { data: mon } = await supabase
    .from("mon")
    .select("mon_id")
    .eq("mon_id", monId)
    .eq("trang_thai", "DangDung")
    .maybeSingle();
  if (!mon) return { success: false, error: "Môn được chọn không tồn tại hoặc đã ngừng dùng" };

  const { error: monError } = await supabase.from("tai_khoan").update({ mon_id: monId }).eq("tai_khoan_id", giaoVienId);
  if (monError) return { success: false, error: monError.message };

  const uniqueLopIds = [...new Set(lopIds)];
  const { error: deleteError } = await supabase
    .from("phan_cong_giang_day")
    .delete()
    .eq("giao_vien_tai_khoan_id", giaoVienId);
  if (deleteError) return { success: false, error: deleteError.message };
  if (uniqueLopIds.length) {
    const { error } = await supabase.from("phan_cong_giang_day").insert(
      uniqueLopIds.map(lopId => ({ giao_vien_tai_khoan_id: giaoVienId, lop_id: lopId })),
    );
    if (error) return { success: false, error: error.message };
  }
  revalidatePath("/phan-cong-giang-day");
  revalidatePath("/tai-khoan");
  return { success: true };
}

export type DongImportPhanCong = { dong: number; maGiaoVien: string; tenLop: string };

export async function importPhanCong(rows: DongImportPhanCong[]) {
  await damBaoAdmin();
  const supabase = taoSupabaseServiceRole();
  const [{ data: giaoVien }, { data: lop }] = await Promise.all([
    supabase.from("tai_khoan").select("tai_khoan_id, ma_so, vai_tro, mon_id").eq("trang_thai", "HoatDong"),
    supabase.from("lop").select("lop_id, ten_lop").eq("trang_thai", "HoatDong"),
  ]);
  const gvMap = new Map((giaoVien || []).map(x => [x.ma_so.toLowerCase(), x]));
  const lopMap = new Map((lop || []).map(x => [x.ten_lop.toLowerCase(), x.lop_id]));
  const valid = new Map<string, Set<string>>();
  const loi: { dong: number; maLoi: string; chiTiet: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const gv = gvMap.get(row.maGiaoVien.trim().toLowerCase());
    const lopId = lopMap.get(row.tenLop.trim().toLowerCase());
    const pair = `${row.maGiaoVien.toLowerCase()}::${row.tenLop.toLowerCase()}`;
    if (seen.has(pair)) {
      loi.push({ dong: row.dong, maLoi: "TRUNG_TRONG_FILE", chiTiet: "Cặp giáo viên – lớp bị trùng" });
      continue;
    }
    seen.add(pair);
    if (!gv || gv.vai_tro !== "GiaoVien") {
      loi.push({ dong: row.dong, maLoi: "KHONG_TIM_THAY_GIAO_VIEN", chiTiet: row.maGiaoVien });
      continue;
    }
    if (!gv.mon_id) {
      loi.push({ dong: row.dong, maLoi: "GIAO_VIEN_CHUA_CO_MON", chiTiet: row.maGiaoVien });
      continue;
    }
    if (!lopId) {
      loi.push({ dong: row.dong, maLoi: "KHONG_TIM_THAY_LOP", chiTiet: row.tenLop });
      continue;
    }
    if (!valid.has(gv.tai_khoan_id)) valid.set(gv.tai_khoan_id, new Set());
    valid.get(gv.tai_khoan_id)!.add(lopId);
  }

  let thanhCong = 0;
  for (const [giaoVienId, lopIds] of valid) {
    const monId = giaoVien?.find(item => item.tai_khoan_id === giaoVienId)?.mon_id;
    if (!monId) {
      loi.push({ dong: 0, maLoi: "GIAO_VIEN_CHUA_CO_MON", chiTiet: giaoVienId });
      continue;
    }
    const result = await luuPhanCong(giaoVienId, monId, [...lopIds]);
    if (result.success) thanhCong += lopIds.size;
    else loi.push({ dong: 0, maLoi: "LOI_LUU", chiTiet: result.error || giaoVienId });
  }
  revalidatePath("/phan-cong-giang-day");
  revalidatePath("/tai-khoan");
  return { thanhCong, loi };
}
