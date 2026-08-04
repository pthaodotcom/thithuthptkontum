import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { conDuocVaoThi } from "@/lib/rules/ky-thi";

/**
 * POST /api/bai-thi/vao-thi - UC-EXAM-01 / FR-M5-01
 * Dieu kien: Ca dang "Dang mo", trong 15 phut dau ke tu gio bat dau (tru khi Admin da
 * mo khoa ngoai le - FR-M5-03). Phat ngau nhien 1 ma_de cho hoc sinh. Neu hoc sinh dang
 * nhap tu tab/thiet bi khac, phien cu bi huy (chi 1 phien lam bai tai 1 thoi diem).
 * TODO: implement day du, hien la stub tra ve 501.
 */
const schema = z.object({ caThiMonId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") return apiLoi("KHONG_CO_QUYEN", "Không có quyền vào thi", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiLoi("DU_LIEU_KHONG_HOP_LE", "Ca thi không hợp lệ", 422, parsed.error.flatten());

  const supabase = taoSupabaseServiceRole();
  const { data: baiLam } = await supabase
    .from("bai_lam_thi")
    .select("*,ca_thi_mon!inner(mon_id,ca_thi!inner(dot_thi_id,gio_bat_dau,gio_ket_thuc,trang_thai),de_thi(de_thi_id,trang_thai))")
    .eq("ca_thi_mon_id", parsed.data.caThiMonId)
    .eq("hoc_sinh_tai_khoan_id", session.sub)
    .maybeSingle();
  if (!baiLam) return apiLoi("KHONG_TRONG_DANH_SACH", "Học sinh không thuộc danh sách dự thi", 404);
  if (baiLam.trang_thai === "KhongTheDuThi_LoiToChuc") return apiLoi("THIEU_DE_THI", "Môn thi chưa có đề thi", 409);
  if (baiLam.trang_thai === "DaNopBai" || baiLam.trang_thai === "VangMat") return apiLoi("BAI_THI_DA_KET_THUC", "Bài thi đã kết thúc", 409);

  const ctm = Array.isArray(baiLam.ca_thi_mon) ? baiLam.ca_thi_mon[0] : baiLam.ca_thi_mon;
  const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
  if (!ca || ca.trang_thai !== "DangMo") return apiLoi("CA_CHUA_MO", "Ca thi chưa mở hoặc đã kết thúc", 409);
  const { count: soLanMoKhoa } = await supabase
    .from("log_xu_ly_ngoai_le")
    .select("id", { count: "exact", head: true })
    .eq("bai_lam_id", baiLam.bai_lam_id)
    .eq("loai_xu_ly", "MoKhoaVaoTre");
  if (!conDuocVaoThi(new Date(ca.gio_bat_dau), new Date(), Boolean(soLanMoKhoa))) {
    await supabase.from("bai_lam_thi").update({ trang_thai: "BiKhoaChoXuLy" }).eq("bai_lam_id", baiLam.bai_lam_id);
    return apiLoi("QUA_GIO_VAO_THI", "Đã quá 15 phút đầu của ca thi; cần Admin mở khóa", 423);
  }

  if (baiLam.trang_thai === "DangThi" && baiLam.ma_de_id) {
    return apiThanhCong({ baiLamId: baiLam.bai_lam_id, maDeId: baiLam.ma_de_id, gioKetThuc: ca.gio_ket_thuc });
  }
  let de = Array.isArray(ctm?.de_thi) ? ctm.de_thi[0] : ctm?.de_thi;
  // Đề áp dụng theo (đợt thi, môn), nên ca hiện tại có thể tái sử dụng đề
  // được neo ở một ca khác trong cùng đợt.
  if (!de && ctm?.mon_id && ca.dot_thi_id) {
    const { data: deTheoDot } = await supabase
      .from("de_thi")
      .select("de_thi_id,trang_thai,ca_thi_mon!inner(mon_id,ca_thi!inner(dot_thi_id))")
      .eq("ca_thi_mon.mon_id", ctm.mon_id)
      .eq("ca_thi_mon.ca_thi.dot_thi_id", ca.dot_thi_id)
      .in("trang_thai", ["DaGiaoChuaBatDau", "DangThi", "DaThiXong"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    de = deTheoDot;
  }
  if (!de || de.trang_thai === "DangSoan") return apiLoi("THIEU_DE_THI", "Môn thi chưa có đề đã giao", 409);
  const { data: cacMa } = await supabase.from("ma_de").select("ma_de_id,thu_tu_hien_thi").eq("de_thi_id", de.de_thi_id);
  if (!cacMa?.length) return apiLoi("THIEU_MA_DE", "Đề thi chưa có mã đề", 409);
  const maDe = cacMa[Math.floor(Math.random() * cacMa.length)];
  if (!maDe) return apiLoi("THIEU_MA_DE", "Không thể phát mã đề", 409);
  // ma_de already contains the frozen shuffled question/answer order. Never
  // reshuffle here: the exact order assigned to the attempt must be reproducible.
  const thuTuHienThi = Array.isArray(maDe.thu_tu_hien_thi) ? maDe.thu_tu_hien_thi : [];
  const { error } = await supabase.from("bai_lam_thi").update({
    de_thi_id: de.de_thi_id,
    ma_de_id: maDe.ma_de_id,
    trang_thai: "DangThi",
    thoi_diem_vao_thi: new Date().toISOString(),
    thu_tu_hien_thi: thuTuHienThi,
  }).eq("bai_lam_id", baiLam.bai_lam_id).in("trang_thai", ["ChuaDangNhap", "BiKhoaChoXuLy"]);
  if (error) return apiLoi("KHONG_THE_VAO_THI", error.message, 409);
  return apiThanhCong({ baiLamId: baiLam.bai_lam_id, maDeId: maDe.ma_de_id, gioKetThuc: ca.gio_ket_thuc }, 201);
}
