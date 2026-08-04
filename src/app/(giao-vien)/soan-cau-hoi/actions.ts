"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { cauHoiSchema, tachDapAnPhan2, type DuLieuCauHoi, type PhanCauHoi } from "@/lib/rules/cau-hoi";

type ActionResult = { success: boolean; error?: string; id?: string };
export type LoiImport = { dong: number; ma: string; noiDung: string };
export type KetQuaImport = { success: boolean; error?: string; daNhap: number; tong: number; loi: LoiImport[] };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const cotBatBuoc = z.coerce.string().trim().min(1);
const cotTuyChon = z.coerce.string().trim().optional().default("");
const headerSchema = z.object({
  Phan: cotBatBuoc,
  // Uu tien khop theo Ma (on dinh, khong nham khac dau/khac cach viet); ChuyenDe/BaiHoc
  // (ten day du) van duoc chap nhan de tuong thich nguoc voi file import cu chua co cot Ma.
  MaChuyenDe: cotTuyChon,
  MaBaiHoc: cotTuyChon,
  ChuyenDe: cotTuyChon,
  BaiHoc: cotTuyChon,
  MucDo: cotBatBuoc,
  NoiDung: cotBatBuoc,
}).passthrough();

async function layNguCanhGiaoVien() {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "GiaoVien") throw new Error("Không có quyền thực hiện");
  const supabase = taoSupabaseServiceRole();
  const { data: taiKhoan } = await supabase
    .from("tai_khoan")
    .select("mon_id, mon:mon!tai_khoan_mon_id_fkey(mon_id, ten_mon, ho_tro_ngan_hang_cau_hoi, phan1_so_cau, phan2_so_cau, phan3_so_cau)")
    .eq("tai_khoan_id", session.sub)
    .maybeSingle();
  const mon = Array.isArray(taiKhoan?.mon) ? taiKhoan.mon[0] : taiKhoan?.mon;
  if (!taiKhoan?.mon_id || !mon) throw new Error("Giáo viên chưa được gán môn");
  if (!mon.ho_tro_ngan_hang_cau_hoi) throw new Error(`Môn ${mon.ten_mon} không thuộc phạm vi ngân hàng câu hỏi và chấm tự động`);
  return { supabase, session, mon, monId: taiKhoan.mon_id };
}

function phanDuocCauHinh(mon: { phan1_so_cau: number | null; phan2_so_cau: number | null; phan3_so_cau: number | null }, phan: PhanCauHoi) {
  return phan === "I" ? mon.phan1_so_cau !== null : phan === "II" ? mon.phan2_so_cau !== null : mon.phan3_so_cau !== null;
}

async function damBaoMetadata(monId: string, baiHocId: string, mucDoId: string, supabase: ReturnType<typeof taoSupabaseServiceRole>) {
  const [{ data: baiHoc }, { data: mucDo }] = await Promise.all([
    supabase
      .from("bai_hoc")
      .select("bai_hoc_id, trang_thai, chuyen_de!inner(mon_id, trang_thai)")
      .eq("bai_hoc_id", baiHocId)
      .eq("chuyen_de.mon_id", monId)
      .eq("trang_thai", "DangDung")
      .eq("chuyen_de.trang_thai", "DangDung")
      .maybeSingle(),
    supabase.from("muc_do_nhan_thuc").select("muc_do_id").eq("muc_do_id", mucDoId).maybeSingle(),
  ]);
  if (!baiHoc) throw new Error("Bài học không hoạt động hoặc không thuộc môn của giáo viên");
  if (!mucDo) throw new Error("Mức độ nhận thức không tồn tại");
}

async function luuCauHoi(duLieu: DuLieuCauHoi): Promise<ActionResult> {
  try {
    const input = cauHoiSchema.parse(duLieu);
    const { supabase, session, mon, monId } = await layNguCanhGiaoVien();
    if (!phanDuocCauHinh(mon, input.phan)) return { success: false, error: `Môn không cấu hình Phần ${input.phan}` };
    await damBaoMetadata(monId, input.baiHocId, input.mucDoId, supabase);
    const { data, error } = await supabase.rpc("tao_cau_hoi_cho_duyet", {
      p_bai_hoc_id: input.baiHocId,
      p_phan: input.phan,
      p_muc_do_id: input.mucDoId,
      p_noi_dung: input.noiDung,
      p_dap_an_phan3: input.phan === "III" ? input.dapAnPhan3 : null,
      p_chi_tiet: input.chiTiet.map((item) => ({ noi_dung: item.noiDung, la_dap_an_dung: item.laDapAnDung })),
      p_nguoi_tao_id: session.sub,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data as string };
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Có lỗi xảy ra";
    return { success: false, error: message };
  }
}

export async function taoCauHoi(duLieu: DuLieuCauHoi): Promise<ActionResult> {
  const result = await luuCauHoi(duLieu);
  if (result.success) revalidatePath("/soan-cau-hoi");
  return result;
}

export async function guiLaiCauHoi(cauHoiId: string, duLieu: DuLieuCauHoi): Promise<ActionResult> {
  try {
    const id = z.string().uuid().parse(cauHoiId);
    const input = cauHoiSchema.parse(duLieu);
    const { supabase, session, mon, monId } = await layNguCanhGiaoVien();
    if (!phanDuocCauHinh(mon, input.phan)) return { success: false, error: `Môn không cấu hình Phần ${input.phan}` };
    await damBaoMetadata(monId, input.baiHocId, input.mucDoId, supabase);
    const { data: cauHoi } = await supabase
      .from("cau_hoi")
      .select("phan,trang_thai_duyet")
      .eq("cau_hoi_id", id)
      .eq("nguoi_tao_tai_khoan_id", session.sub)
      .maybeSingle();
    if (!cauHoi || cauHoi.trang_thai_duyet !== "CanChinhSua") return { success: false, error: "Câu hỏi không ở trạng thái cần chỉnh sửa" };
    if (cauHoi.phan !== input.phan) return { success: false, error: "Không thể đổi Phần của câu hỏi khi gửi lại" };
    const { error } = await supabase.rpc("gui_lai_cau_hoi_can_chinh_sua", {
      p_cau_hoi_id: id,
      p_nguoi_tao_id: session.sub,
      p_bai_hoc_id: input.baiHocId,
      p_muc_do_id: input.mucDoId,
      p_noi_dung: input.noiDung,
      p_dap_an_phan3: input.phan === "III" ? input.dapAnPhan3 : null,
      p_chi_tiet: input.chiTiet.map((item) => ({ noi_dung: item.noiDung, la_dap_an_dung: item.laDapAnDung })),
    });
    if (error) return { success: false, error: error.message.replaceAll("_", " ") };
    revalidatePath("/soan-cau-hoi");
    revalidatePath("/duyet-cau-hoi");
    return { success: true, id };
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Có lỗi xảy ra";
    return { success: false, error: message };
  }
}

function chuanHoaPhan(value: unknown): PhanCauHoi | null {
  const normalized = String(value ?? "").trim().toUpperCase().replace("PHẦN", "").replace("PHAN", "").trim();
  return normalized === "1" ? "I" : normalized === "2" ? "II" : normalized === "3" ? "III" : ["I", "II", "III"].includes(normalized) ? normalized as PhanCauHoi : null;
}

function rowsTuHtml(html: string): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];
  for (const table of tables) {
    const tableHtml = table[0] ?? "";
    const tr = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((match) =>
      [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => (cell[1] ?? "").trim()),
    );
    if (tr.length < 2) continue;
    const headers = (tr[0] ?? []).map((header) => boHtml(header));
    for (const cells of tr.slice(1)) rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }
  return rows;
}

async function docRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { value } = await mammoth.convertToHtml({ buffer });
  return rowsTuHtml(value);
}

async function excelRows(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  if (!workbook.SheetNames.length) return [];
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName]!, { defval: "" });
}

function lay(row: Record<string, unknown>, ...keys: string[]) {
  const found = Object.entries(row).find(([key]) => keys.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase()));
  return boHtml(String(found?.[1] ?? ""));
}

function layHtml(row: Record<string, unknown>, ...keys: string[]) {
  const found = Object.entries(row).find(([key]) => keys.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase()));
  return String(found?.[1] ?? "").trim();
}

function boHtml(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function chuanHoaChuoi(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim().toLowerCase();
}

export async function importCauHoi(formData: FormData): Promise<KetQuaImport> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Chưa chọn file", daNhap: 0, tong: 0, loi: [] };
  if (file.size > MAX_FILE_SIZE) return { success: false, error: "File vượt quá 10 MB", daNhap: 0, tong: 0, loi: [] };
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "docx"].includes(extension || "")) return { success: false, error: "Chỉ hỗ trợ .xlsx, .xls hoặc .docx", daNhap: 0, tong: 0, loi: [] };

  let rows: Record<string, unknown>[];
  try {
    rows = extension === "docx" ? await docRows(file) : await excelRows(file);
  } catch {
    return { success: false, error: "Không thể đọc file hoặc file sai định dạng", daNhap: 0, tong: 0, loi: [] };
  }
  if (!rows.length) return { success: false, error: "File không có dòng dữ liệu hợp lệ", daNhap: 0, tong: 0, loi: [] };

  let context: Awaited<ReturnType<typeof layNguCanhGiaoVien>>;
  try {
    context = await layNguCanhGiaoVien();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không có quyền", daNhap: 0, tong: rows.length, loi: [] };
  }
  const [{ data: chuyenDe }, { data: mucDo }] = await Promise.all([
    context.supabase.from("chuyen_de").select("chuyen_de_id, ten_chuyen_de, ma_chuyen_de, bai_hoc(bai_hoc_id, ten_bai_hoc, ma_bai_hoc, trang_thai)").eq("mon_id", context.monId).eq("trang_thai", "DangDung"),
    context.supabase.from("muc_do_nhan_thuc").select("muc_do_id, ten_muc"),
  ]);
  const loi: LoiImport[] = [];
  let daNhap = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const dong = index + 2;
    const parsedHeader = headerSchema.safeParse({
      Phan: lay(row, "Phan", "Phần"),
      MaChuyenDe: lay(row, "MaChuyenDe", "Mã chuyên đề", "Ma chuyen de"),
      MaBaiHoc: lay(row, "MaBaiHoc", "Mã bài học", "Ma bai hoc"),
      ChuyenDe: lay(row, "ChuyenDe", "Chuyên đề"),
      BaiHoc: lay(row, "BaiHoc", "Bài học"),
      MucDo: lay(row, "MucDo", "Mức độ"),
      NoiDung: lay(row, "NoiDung", "Nội dung"),
    });
    if (!parsedHeader.success || (!parsedHeader.data.MaChuyenDe && !parsedHeader.data.ChuyenDe) || (!parsedHeader.data.MaBaiHoc && !parsedHeader.data.BaiHoc)) {
      loi.push({ dong, ma: "THIEU_COT", noiDung: "Thiếu cột bắt buộc (Phần, Nội dung, Mức độ và Mã/Tên Chuyên đề + Mã/Tên Bài học)" });
      continue;
    }
    const phan = chuanHoaPhan(parsedHeader.data.Phan);
    // Uu tien khop theo Ma (chinh xac, khong phan biet hoa/thuong); chi khop theo ten
    // day du khi file khong co cot Ma (tuong thich nguoc).
    const cd = (chuyenDe || []).find((item) =>
      parsedHeader.data.MaChuyenDe
        ? item.ma_chuyen_de.toLowerCase() === parsedHeader.data.MaChuyenDe.toLowerCase()
        : chuanHoaChuoi(item.ten_chuyen_de) === chuanHoaChuoi(parsedHeader.data.ChuyenDe));
    const bh = cd?.bai_hoc?.find((item: { ten_bai_hoc: string; ma_bai_hoc: string; trang_thai: string }) =>
      item.trang_thai === "DangDung" && (
        parsedHeader.data.MaBaiHoc
          ? item.ma_bai_hoc.toLowerCase() === parsedHeader.data.MaBaiHoc.toLowerCase()
          : chuanHoaChuoi(item.ten_bai_hoc) === chuanHoaChuoi(parsedHeader.data.BaiHoc)));
    const md = (mucDo || []).find((item) => chuanHoaChuoi(item.ten_muc) === chuanHoaChuoi(parsedHeader.data.MucDo));
    if (!phan || !bh || !md) {
      loi.push({ dong, ma: "METADATA_KHONG_HOP_LE", noiDung: "Phần, Chuyên đề, Bài học hoặc Mức độ không khớp danh mục" });
      continue;
    }
    const noiDungChiTiet = [1, 2, 3, 4].map((i) => layHtml(row, `DapAn${i}`, `DapAn_${i}`, `Đáp án ${i}`, `Y${i}`, `Ý ${i}`));
    let dapAnDung: boolean[] = [];
    if (phan === "I") {
      const viTri = Number(lay(row, "DapAnDung", "Đáp án đúng"));
      dapAnDung = [1, 2, 3, 4].map((i) => i === viTri);
    } else if (phan === "II") {
      dapAnDung = tachDapAnPhan2(lay(row, "DapAnDung", "Đáp án đúng")) || [];
    }
    const result = await luuCauHoi({
      phan,
      baiHocId: bh.bai_hoc_id,
      mucDoId: md.muc_do_id,
      noiDung: layHtml(row, "NoiDung", "Nội dung"),
      chiTiet: phan === "III" ? [] : noiDungChiTiet.map((noiDung, i) => ({ noiDung, laDapAnDung: dapAnDung[i] ?? false })),
      dapAnPhan3: phan === "III" ? lay(row, "DapAnDung", "Đáp án đúng") : null,
    });
    if (result.success) daNhap += 1;
    else loi.push({ dong, ma: "DU_LIEU_KHONG_HOP_LE", noiDung: result.error || "Không thể lưu" });
  }
  revalidatePath("/soan-cau-hoi");
  return { success: true, daNhap, tong: rows.length, loi };
}
