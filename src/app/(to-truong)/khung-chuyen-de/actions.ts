"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const tenSchema = z.string().trim().min(1, "Tên không được để trống").max(150, "Tên tối đa 150 ký tự");
const maSchema = z.string().trim().min(1, "Mã không được để trống").max(20, "Mã tối đa 20 ký tự")
  .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ gồm chữ, số, gạch ngang, gạch dưới (không dấu, không khoảng trắng)");
type ActionResult = { success: boolean; error?: string };

async function layMonToTruong() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") throw new Error("Không có quyền thực hiện");
  const supabase = taoSupabaseServiceRole();
  const { data: mon } = await supabase
    .from("mon")
    .select("mon_id")
    .eq("to_truong_tai_khoan_id", session.sub)
    .maybeSingle();
  if (!mon) throw new Error("Tài khoản chưa được bổ nhiệm Tổ trưởng");
  return { supabase, monId: mon.mon_id };
}

async function damBaoChuyenDeThuocMon(chuyenDeId: string) {
  const context = await layMonToTruong();
  const { data } = await context.supabase
    .from("chuyen_de")
    .select("chuyen_de_id")
    .eq("chuyen_de_id", chuyenDeId)
    .eq("mon_id", context.monId)
    .maybeSingle();
  if (!data) throw new Error("Chuyên đề không thuộc môn được phân quyền");
  return context;
}

async function damBaoBaiHocThuocMon(baiHocId: string) {
  const context = await layMonToTruong();
  const { data } = await context.supabase
    .from("bai_hoc")
    .select("bai_hoc_id, chuyen_de!inner(mon_id)")
    .eq("bai_hoc_id", baiHocId)
    .eq("chuyen_de.mon_id", context.monId)
    .maybeSingle();
  if (!data) throw new Error("Bài học không thuộc môn được phân quyền");
  return context;
}

function loi(error: unknown) {
  return { success: false, error: error instanceof Error ? error.message : "Có lỗi xảy ra" };
}

export async function taoChuyenDe(ten: string, ma: string): Promise<ActionResult> {
  try {
    const tenHopLe = tenSchema.parse(ten);
    const maHopLe = maSchema.parse(ma);
    const { supabase, monId } = await layMonToTruong();
    const { data: trungTen } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).ilike("ten_chuyen_de", tenHopLe).maybeSingle();
    if (trungTen) return { success: false, error: "Tên chuyên đề đã tồn tại trong môn" };
    const { data: trungMa } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).ilike("ma_chuyen_de", maHopLe).maybeSingle();
    if (trungMa) return { success: false, error: "Mã chuyên đề đã tồn tại trong môn" };
    const { error } = await supabase.from("chuyen_de").insert({ mon_id: monId, ten_chuyen_de: tenHopLe, ma_chuyen_de: maHopLe });
    if (error) return { success: false, error: "Chưa tạo được chuyên đề. Vui lòng kiểm tra thông tin và thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function suaChuyenDe(chuyenDeId: string, ten: string, ma: string): Promise<ActionResult> {
  try {
    const tenHopLe = tenSchema.parse(ten);
    const maHopLe = maSchema.parse(ma);
    const { supabase, monId } = await damBaoChuyenDeThuocMon(chuyenDeId);
    const { data: trungTen } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).ilike("ten_chuyen_de", tenHopLe).neq("chuyen_de_id", chuyenDeId).maybeSingle();
    if (trungTen) return { success: false, error: "Tên chuyên đề đã tồn tại trong môn" };
    const { data: trungMa } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).ilike("ma_chuyen_de", maHopLe).neq("chuyen_de_id", chuyenDeId).maybeSingle();
    if (trungMa) return { success: false, error: "Mã chuyên đề đã tồn tại trong môn" };
    const { error } = await supabase.from("chuyen_de").update({ ten_chuyen_de: tenHopLe, ma_chuyen_de: maHopLe }).eq("chuyen_de_id", chuyenDeId);
    if (error) return { success: false, error: "Chưa cập nhật được chuyên đề. Vui lòng thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function taoBaiHoc(chuyenDeId: string, ten: string, ma: string): Promise<ActionResult> {
  try {
    const tenHopLe = tenSchema.parse(ten);
    const maHopLe = maSchema.parse(ma);
    const { supabase } = await damBaoChuyenDeThuocMon(chuyenDeId);
    const { data: trungTen } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", chuyenDeId).ilike("ten_bai_hoc", tenHopLe).maybeSingle();
    if (trungTen) return { success: false, error: "Tên bài học đã tồn tại trong chuyên đề" };
    const { data: trungMa } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", chuyenDeId).ilike("ma_bai_hoc", maHopLe).maybeSingle();
    if (trungMa) return { success: false, error: "Mã bài học đã tồn tại trong chuyên đề" };
    const { error } = await supabase.from("bai_hoc").insert({ chuyen_de_id: chuyenDeId, ten_bai_hoc: tenHopLe, ma_bai_hoc: maHopLe });
    if (error) return { success: false, error: "Chưa tạo được bài học. Vui lòng kiểm tra thông tin và thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function suaBaiHoc(baiHocId: string, ten: string, ma: string): Promise<ActionResult> {
  try {
    const tenHopLe = tenSchema.parse(ten);
    const maHopLe = maSchema.parse(ma);
    const { supabase } = await damBaoBaiHocThuocMon(baiHocId);
    const { data: baiHoc } = await supabase.from("bai_hoc").select("chuyen_de_id").eq("bai_hoc_id", baiHocId).single();
    if (!baiHoc) return { success: false, error: "Không tìm thấy bài học" };
    const { data: trungTen } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", baiHoc.chuyen_de_id).ilike("ten_bai_hoc", tenHopLe).neq("bai_hoc_id", baiHocId).maybeSingle();
    if (trungTen) return { success: false, error: "Tên bài học đã tồn tại trong chuyên đề" };
    const { data: trungMa } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", baiHoc.chuyen_de_id).ilike("ma_bai_hoc", maHopLe).neq("bai_hoc_id", baiHocId).maybeSingle();
    if (trungMa) return { success: false, error: "Mã bài học đã tồn tại trong chuyên đề" };
    const { error } = await supabase.from("bai_hoc").update({ ten_bai_hoc: tenHopLe, ma_bai_hoc: maHopLe }).eq("bai_hoc_id", baiHocId);
    if (error) return { success: false, error: "Chưa cập nhật được bài học. Vui lòng thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function doiTrangThaiChuyenDe(chuyenDeId: string, trangThai: "DangDung" | "VoHieuHoa"): Promise<ActionResult> {
  try {
    const { supabase } = await damBaoChuyenDeThuocMon(chuyenDeId);
    const { error } = await supabase.from("chuyen_de").update({ trang_thai: trangThai }).eq("chuyen_de_id", chuyenDeId);
    if (error) return { success: false, error: "Chưa thay đổi được trạng thái chuyên đề. Vui lòng thử lại." };
    if (trangThai === "VoHieuHoa") await supabase.from("bai_hoc").update({ trang_thai: "VoHieuHoa" }).eq("chuyen_de_id", chuyenDeId);
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function doiTrangThaiBaiHoc(baiHocId: string, trangThai: "DangDung" | "VoHieuHoa"): Promise<ActionResult> {
  try {
    const { supabase } = await damBaoBaiHocThuocMon(baiHocId);
    const { error } = await supabase.from("bai_hoc").update({ trang_thai: trangThai }).eq("bai_hoc_id", baiHocId);
    if (error) return { success: false, error: "Chưa thay đổi được trạng thái bài học. Vui lòng thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function xoaBaiHoc(baiHocId: string): Promise<ActionResult> {
  try {
    const { supabase } = await damBaoBaiHocThuocMon(baiHocId);
    const { count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).eq("bai_hoc_id", baiHocId);
    if ((count || 0) > 0) return { success: false, error: "Bài học đã có câu hỏi nên không thể xóa. Bạn có thể chọn ngừng sử dụng." };
    const { error } = await supabase.from("bai_hoc").delete().eq("bai_hoc_id", baiHocId);
    if (error) return { success: false, error: "Chưa xóa được bài học. Vui lòng thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}

export async function xoaChuyenDe(chuyenDeId: string): Promise<ActionResult> {
  try {
    const { supabase } = await damBaoChuyenDeThuocMon(chuyenDeId);
    const { data: baiHoc } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", chuyenDeId);
    const ids = (baiHoc || []).map(item => item.bai_hoc_id);
    if (ids.length) {
      const { count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", ids);
      if ((count || 0) > 0) return { success: false, error: "Chuyên đề đã có câu hỏi nên không thể xóa. Bạn có thể chọn ngừng sử dụng." };
      await supabase.from("bai_hoc").delete().eq("chuyen_de_id", chuyenDeId);
    }
    const { error } = await supabase.from("chuyen_de").delete().eq("chuyen_de_id", chuyenDeId);
    if (error) return { success: false, error: "Chưa xóa được chuyên đề. Vui lòng thử lại." };
    revalidatePath("/khung-chuyen-de");
    return { success: true };
  } catch (error) { return loi(error); }
}
