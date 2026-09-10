"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { laySessionHienHanh } from "@/lib/auth/session";
import { demoBypassDangBat, phanLoaiBaiLamKetThucDemo } from "@/lib/demo/bypass";
import { capNhatTrangThaiLuotDemo, xuLyMotJob, type JobHangDoi } from "@/lib/job/xu-ly-mot-job";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import type { LuotThiDemo, TrangThaiBaiDemo } from "./types";

const taoSchema = z.object({
  dotThiId: z.string().uuid(),
  baiLamIds: z.array(z.string().uuid()).min(1).max(200).refine((ids) => new Set(ids).size === ids.length),
  trangThaiHienThi: z.enum(["VaoThi", "SapDienRa"]),
  gioBatDau: z.string().datetime(),
  gioKetThuc: z.string().datetime(),
  lyDo: z.string().trim().min(5).max(500),
  daXacNhan: z.literal(true),
}).refine((x) => new Date(x.gioKetThuc) > new Date(x.gioBatDau), { message: "Giờ kết thúc phải sau giờ bắt đầu." });

function loi(message: string) { return { success: false as const, error: message }; }
async function admin() {
  if (!demoBypassDangBat()) return null;
  const session = await laySessionHienHanh();
  return session?.vai_tro === "Admin" ? session : null;
}

export async function taoLuotThiDemo(input: z.input<typeof taoSchema>) {
  const session = await admin();
  if (!session) return loi("Chỉ Quản trị viên được dùng công cụ demo khi chế độ này được bật.");
  const parsed = taoSchema.safeParse(input);
  if (!parsed.success) return loi("Dữ liệu tạo lượt demo chưa hợp lệ.");
  const supabase = taoSupabaseServiceRole();
  const { data: baiLam, error } = await supabase
    .from("bai_lam_thi")
    .select("bai_lam_id,trang_thai,ca_thi_mon!inner(ca_thi!inner(dot_thi_id))")
    .in("bai_lam_id", parsed.data.baiLamIds);
  if (error || (baiLam?.length ?? 0) !== parsed.data.baiLamIds.length) return loi("Không tìm đủ bài làm đã chọn.");
  const thuocDot = (baiLam ?? []).every((bai) => {
    const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
    const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
    return ca?.dot_thi_id === parsed.data.dotThiId;
  });
  if (!thuocDot) return loi("Mọi bài làm phải thuộc đúng đợt thi đã chọn.");
  const hopLe = new Set(["ChuaDangNhap", "VangMat", "BiKhoaChoXuLy"]);
  if ((baiLam ?? []).some((bai) => !hopLe.has(bai.trang_thai))) return loi("Chỉ được chọn bài chưa vào thi hoặc bài bị khóa/vắng mặt để chạy demo.");
  const { data: emailDaGui } = await supabase.from("email_log").select("bai_lam_id").in("bai_lam_id", parsed.data.baiLamIds).eq("trang_thai", "DaGui");
  if (emailDaGui?.length) return loi("Không thể tạo lại demo cho bài đã gửi email kết quả.");

  const { data: luot, error: loiTao } = await supabase.from("demo_luot_thi").insert({
    dot_thi_id: parsed.data.dotThiId, ly_do: parsed.data.lyDo, nguoi_tao_tai_khoan_id: session.sub,
  }).select("demo_luot_thi_id").single();
  if (loiTao || !luot) return loi(loiTao?.code === "23505" ? "Đang có một lượt demo khác hoạt động." : "Không tạo được lượt demo.");
  const { error: loiGan } = await supabase.from("demo_luot_thi_bai_lam").insert(parsed.data.baiLamIds.map((baiLamId) => ({
    demo_luot_thi_id: luot.demo_luot_thi_id, bai_lam_id: baiLamId, trang_thai_hien_thi: parsed.data.trangThaiHienThi,
    gio_bat_dau: parsed.data.gioBatDau, gio_ket_thuc: parsed.data.gioKetThuc,
  })));
  if (loiGan) {
    await supabase.from("demo_luot_thi").delete().eq("demo_luot_thi_id", luot.demo_luot_thi_id);
    return loi("Không gán được danh sách học sinh vào lượt demo.");
  }
  await supabase.from("bai_lam_thi").update({ trang_thai: "ChuaDangNhap", de_thi_id: null, ma_de_id: null, thoi_diem_vao_thi: null, thoi_diem_nop: null, diem_tong: null, so_cau_dung: null, so_cau_sai: null, thu_tu_hien_thi: [] }).in("bai_lam_id", parsed.data.baiLamIds).in("trang_thai", ["VangMat", "BiKhoaChoXuLy"]);
  await supabase.from("audit_log").insert({
    hanh_dong: "TaoLuotThiDemo", doi_tuong: "DemoLuotThi", doi_tuong_id: luot.demo_luot_thi_id,
    nguoi_thuc_hien_tai_khoan_id: session.sub, du_lieu: { dot_thi_id: parsed.data.dotThiId, bai_lam_ids: parsed.data.baiLamIds, ly_do: parsed.data.lyDo },
  });
  revalidatePath("/mo-thi-ngay"); revalidatePath("/ho-so");
  return { success: true as const, demoLuotThiId: luot.demo_luot_thi_id, soHocSinh: parsed.data.baiLamIds.length };
}

export async function ketThucLuotDemo(input: { demoLuotThiId: string }) {
  const session = await admin();
  if (!session || !z.string().uuid().safeParse(input.demoLuotThiId).success) return loi("Không có quyền hoặc lượt demo không hợp lệ.");
  const supabase = taoSupabaseServiceRole();
  const { data: luot } = await supabase.from("demo_luot_thi").select("trang_thai").eq("demo_luot_thi_id", input.demoLuotThiId).maybeSingle();
  if (luot?.trang_thai !== "DangMo") return loi("Lượt demo không còn ở trạng thái đang mở.");
  const { data: bai } = await supabase.from("demo_luot_thi_bai_lam").select("bai_lam_id,bai_lam_thi!inner(trang_thai,diem_tong)").eq("demo_luot_thi_id", input.demoLuotThiId);
  const danhSach = (bai ?? []).map((x) => {
    const bl = Array.isArray(x.bai_lam_thi) ? x.bai_lam_thi[0] : x.bai_lam_thi;
    return { bai_lam_id: x.bai_lam_id, trang_thai: bl?.trang_thai ?? "", diem_tong: bl?.diem_tong ?? null };
  });
  const { idsDuocXuLy, idsChuaNop } = phanLoaiBaiLamKetThucDemo(danhSach);

  // Nếu không có bài nào đã nộp có điểm: gỡ toàn bộ khỏi demo và đóng lượt demo sang Hoàn tất
  if (!idsDuocXuLy.length) {
    if (idsChuaNop.length) {
      const { error: loiGo } = await supabase
        .from("demo_luot_thi_bai_lam")
        .delete()
        .eq("demo_luot_thi_id", input.demoLuotThiId);
      if (loiGo) return loi("Không thể gỡ các bài làm khỏi lượt demo: " + loiGo.message);
    }
    const { error: loiDong } = await supabase
      .from("demo_luot_thi")
      .update({ trang_thai: "HoanTat", ket_thuc_luc: new Date().toISOString() })
      .eq("demo_luot_thi_id", input.demoLuotThiId);
    if (loiDong) return loi("Không thể đóng lượt demo: " + loiDong.message);

    await supabase.from("audit_log").insert({
      hanh_dong: "KetThucLuotThiDemo",
      doi_tuong: "DemoLuotThi",
      doi_tuong_id: input.demoLuotThiId,
      nguoi_thuc_hien_tai_khoan_id: session.sub,
      du_lieu: { bai_lam_ids_xu_ly: [], bai_lam_ids_khong_xu_ly: idsChuaNop, ly_do: "KetThucSomKhongCoBaiNop" },
    });
    revalidatePath("/mo-thi-ngay");
    return { success: true as const, soHocSinh: 0, soBaiKhongXuLy: idsChuaNop.length };
  }

  // Có ít nhất 1 bài đã nộp: gỡ bài chưa nộp và chuyển sang phân tích/Gemini/email
  if (idsChuaNop.length) {
    const { error: loiGo } = await supabase
      .from("demo_luot_thi_bai_lam")
      .delete()
      .eq("demo_luot_thi_id", input.demoLuotThiId)
      .in("bai_lam_id", idsChuaNop);
    if (loiGo) return loi("Không thể gỡ các bài chưa nộp khỏi lượt demo: " + loiGo.message);
  }
  const { error: loiChuyen } = await supabase.from("demo_luot_thi").update({ trang_thai: "DangXuLy" }).eq("demo_luot_thi_id", input.demoLuotThiId).eq("trang_thai", "DangMo");
  if (loiChuyen) return loi("Không thể chuyển lượt demo sang xử lý.");
  const { error: loiPhanTich } = await supabase.rpc("phan_tich_ket_qua_cac_bai", { p_bai_lam_ids: idsDuocXuLy, p_demo_luot_thi_id: input.demoLuotThiId });
  if (loiPhanTich) { await supabase.from("demo_luot_thi").update({ trang_thai: "CanXuLy" }).eq("demo_luot_thi_id", input.demoLuotThiId); return loi("Không tạo được hàng đợi phân tích: " + loiPhanTich.message); }
  await supabase.from("audit_log").insert({ hanh_dong: "KetThucLuotThiDemo", doi_tuong: "DemoLuotThi", doi_tuong_id: input.demoLuotThiId, nguoi_thuc_hien_tai_khoan_id: session.sub, du_lieu: { bai_lam_ids_xu_ly: idsDuocXuLy, bai_lam_ids_khong_xu_ly: idsChuaNop } });
  revalidatePath("/mo-thi-ngay");
  return { success: true as const, soHocSinh: idsDuocXuLy.length, soBaiKhongXuLy: idsChuaNop.length };
}

export async function xuLyJobDemo(input: { demoLuotThiId: string }) {
  const session = await admin();
  if (!session || !z.string().uuid().safeParse(input.demoLuotThiId).success) return loi("Không có quyền hoặc lượt demo không hợp lệ.");
  const supabase = taoSupabaseServiceRole();
  const { data: luot } = await supabase.from("demo_luot_thi").select("trang_thai").eq("demo_luot_thi_id", input.demoLuotThiId).maybeSingle();
  if (luot?.trang_thai !== "DangXuLy") return loi("Lượt demo không ở trạng thái xử lý.");
  const { data, error } = await supabase.rpc("nhan_job_demo", { p_demo_luot_thi_id: input.demoLuotThiId });
  if (error) return loi("Không nhận được job demo: " + error.message);
  const job = data?.[0] as JobHangDoi | undefined;
  if (job) {
    try { await xuLyMotJob(supabase, job); } catch { /* trang thai loi da duoc xuLyMotJob luu */ }
  } else await capNhatTrangThaiLuotDemo(supabase, input.demoLuotThiId);
  const status = await layTrangThaiLuotDemo(input);
  return status.success ? { success: true as const, coJobXuLy: Boolean(job), trangThaiLuotDemo: status.data.trangThai, soJobConLai: status.data.soJobConLai } : status;
}

function suyRaTrangThai(bai: { trang_thai: string; diem_tong: number | null }, jobs: Array<{ loai_job: string; trang_thai: string }>, email: { trang_thai: string } | null): TrangThaiBaiDemo {
  if (bai.trang_thai !== "DaNopBai" || bai.diem_tong === null) return bai.trang_thai === "DangThi" ? "DangLamBai" : "ChuaVaoThi";
  if (email?.trang_thai === "DaGui" || email?.trang_thai === "KhongGui_ThieuEmail") return email.trang_thai === "DaGui" ? "HoanTat" : "ThieuEmail";
  if (jobs.some((j) => j.trang_thai === "ThatBai")) return "CanXuLy";
  if (jobs.some((j) => j.loai_job === "demo_email" && j.trang_thai === "DangXuLy")) return "DangGuiEmail";
  if (jobs.some((j) => j.loai_job === "demo_ai" && ["ChoXuLy", "DangXuLy"].includes(j.trang_thai))) return "DangTaoNhanXet";
  return "ChoXuLy";
}

export async function layTrangThaiLuotDemo(input: { demoLuotThiId: string }): Promise<{ success: true; data: LuotThiDemo } | { success: false; error: string }> {
  const session = await admin();
  if (!session || !z.string().uuid().safeParse(input.demoLuotThiId).success) return loi("Không có quyền hoặc lượt demo không hợp lệ.");
  const supabase = taoSupabaseServiceRole();
  const { data: luot } = await supabase.from("demo_luot_thi").select("demo_luot_thi_id,trang_thai,ly_do,created_at,ket_thuc_luc").eq("demo_luot_thi_id", input.demoLuotThiId).maybeSingle();
  if (!luot) return loi("Không tìm thấy lượt demo.");
  const { data: dong } = await supabase.from("demo_luot_thi_bai_lam").select("bai_lam_id,bai_lam_thi!inner(bai_lam_id,trang_thai,diem_tong,hoc_sinh_tai_khoan_id,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,ma_so,email_phu_huynh,lop:lop_id(ten_lop)),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(ca_thi_id,so_thu_tu_ca)))").eq("demo_luot_thi_id", input.demoLuotThiId);
  const ids = (dong ?? []).map((x) => x.bai_lam_id);
  const [{ data: jobs }, { data: emails }, { count: soJobConLai }] = await Promise.all([
    supabase.from("job_hang_doi").select("tham_chieu_id,loai_job,trang_thai").eq("demo_luot_thi_id", input.demoLuotThiId),
    ids.length ? supabase.from("email_log").select("bai_lam_id,trang_thai").in("bai_lam_id", ids) : Promise.resolve({ data: [] }),
    supabase.from("job_hang_doi").select("id", { count: "exact", head: true }).eq("demo_luot_thi_id", input.demoLuotThiId).in("trang_thai", ["ChoXuLy", "DangXuLy"]),
  ]);
  const jobTheoBai = new Map<string, Array<{ loai_job: string; trang_thai: string }>>();
  for (const job of jobs ?? []) jobTheoBai.set(job.tham_chieu_id, [...(jobTheoBai.get(job.tham_chieu_id) ?? []), job]);
  const emailTheoBai = new Map((emails ?? []).map((x) => [x.bai_lam_id, x]));
  const cacBai = (dong ?? []).map((row) => {
    const bl = Array.isArray(row.bai_lam_thi) ? row.bai_lam_thi[0] : row.bai_lam_thi;
    const tk = Array.isArray(bl?.tai_khoan) ? bl?.tai_khoan[0] : bl?.tai_khoan;
    const lop = Array.isArray(tk?.lop) ? tk?.lop[0] : tk?.lop;
    const ctm = Array.isArray(bl?.ca_thi_mon) ? bl?.ca_thi_mon[0] : bl?.ca_thi_mon;
    const mon = Array.isArray(ctm?.mon) ? ctm?.mon[0] : ctm?.mon;
    const ca = Array.isArray(ctm?.ca_thi) ? ctm?.ca_thi[0] : ctm?.ca_thi;
    const bai = { trang_thai: bl?.trang_thai ?? "ChuaDangNhap", diem_tong: bl?.diem_tong ?? null };
    return { baiLamId: row.bai_lam_id, caThiId: ca?.ca_thi_id ?? "", hoTen: tk?.ho_ten ?? "Học sinh", maSo: tk?.ma_so ?? "", tenLop: lop?.ten_lop ?? "", tenMon: mon?.ten_mon ?? "", soThuTuCa: ca?.so_thu_tu_ca ?? 0, trangThaiBai: bai.trang_thai, diemTong: bai.diem_tong === null ? null : Number(bai.diem_tong), coEmail: Boolean(tk?.email_phu_huynh), trangThai: suyRaTrangThai(bai, jobTheoBai.get(row.bai_lam_id) ?? [], emailTheoBai.get(row.bai_lam_id) ?? null) };
  });
  return { success: true, data: { demoLuotThiId: luot.demo_luot_thi_id, trangThai: luot.trang_thai as LuotThiDemo["trangThai"], lyDo: luot.ly_do, createdAt: luot.created_at, ketThucLuc: luot.ket_thuc_luc, cacBai, soJobConLai: soJobConLai ?? 0 } };
}

/** Chi dọn dữ liệu bypass theo ca của phiên bản cũ; luot demo moi khong bi xoa. */
export async function ngungBypass() {
  const session = await admin();
  if (!session) return loi("Chỉ Quản trị viên mới được thực hiện.");
  const supabase = taoSupabaseServiceRole();
  const { count } = await supabase.from("demo_bypass_ca_thi_mon").select("ca_thi_mon_id", { count: "exact", head: true });
  const { error } = await supabase.from("demo_bypass_ca_thi_mon").delete().neq("ca_thi_mon_id", "00000000-0000-0000-0000-000000000000");
  if (error) return loi("Không dọn được cấu hình bypass cũ.");
  return { success: true as const, soLuongXoa: count ?? 0 };
}
