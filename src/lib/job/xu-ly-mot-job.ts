import type { SupabaseClient } from "@supabase/supabase-js";

import { nhanXetFallback, sinhNhanXetGemini } from "@/lib/ai/gemini";
import { guiEmailKetQua, taoNoiDungEmail } from "@/lib/email/gmail";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";

export type JobHangDoi = {
  id: string;
  loai_job: string;
  tham_chieu_id: string;
  demo_luot_thi_id: string | null;
  so_lan_thu: number;
};

export type KetQuaXuLyJob = {
  ketQua: Record<string, unknown>;
  trangThaiLuotDemo: string | null;
};

function laJobDemo(job: JobHangDoi) {
  return job.loai_job === "demo_phan_tich" || job.loai_job === "demo_ai" || job.loai_job === "demo_email";
}

export async function capNhatTrangThaiLuotDemo(supabase: SupabaseClient, demoLuotThiId: string | null) {
  if (!demoLuotThiId) return null;
  const [{ count: conDangChay }, { count: thatBai }] = await Promise.all([
    supabase
      .from("job_hang_doi")
      .select("id", { count: "exact", head: true })
      .eq("demo_luot_thi_id", demoLuotThiId)
      .in("trang_thai", ["ChoXuLy", "DangXuLy"]),
    supabase
      .from("job_hang_doi")
      .select("id", { count: "exact", head: true })
      .eq("demo_luot_thi_id", demoLuotThiId)
      .eq("trang_thai", "ThatBai"),
  ]);
  const trangThai = (thatBai ?? 0) > 0 ? "CanXuLy" : (conDangChay ?? 0) > 0 ? "DangXuLy" : "HoanTat";
  await supabase
    .from("demo_luot_thi")
    .update({ trang_thai: trangThai, ket_thuc_luc: trangThai === "HoanTat" ? new Date().toISOString() : null })
    .eq("demo_luot_thi_id", demoLuotThiId)
    .eq("trang_thai", "DangXuLy");
  return trangThai;
}

async function taiDuLieuNhanXet(supabase: SupabaseClient, baiLamId: string) {
  const { data: bai } = await supabase
    .from("bai_lam_thi")
    .select("bai_lam_id,diem_tong,hoc_sinh_tai_khoan_id,ca_thi_mon!inner(mon_id,ca_thi_id),phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de))")
    .eq("bai_lam_id", baiLamId)
    .single();
  if (!bai) throw new Error("KHONG_TIM_THAY_BAI_LAM");
  const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
  if (!ctm) throw new Error("BAI_LAM_THIEU_MON");
  return { bai, ctm };
}

async function xuLyNhanXet(supabase: SupabaseClient, job: JobHangDoi) {
  const { bai, ctm } = await taiDuLieuNhanXet(supabase, job.tham_chieu_id);
  const nhom = xepNhomNangLuc(Number(bai.diem_tong));
  let phanTich = bai.phan_tich_chuyen_de || [];
  if (phanTich.length === 0 && ctm.ca_thi_id && !laJobDemo(job)) {
    await supabase.rpc("phan_tich_ket_qua_ca", { p_ca_thi_id: ctm.ca_thi_id });
    const { data } = await supabase
      .from("phan_tich_chuyen_de")
      .select("ty_le_dung,chuyen_de(ten_chuyen_de)")
      .eq("bai_lam_id", bai.bai_lam_id);
    if (data?.length) phanTich = data;
  }
  const chuyenDeYeu = phanTich
    .filter((item) => Number(item.ty_le_dung) < 60)
    .map((item) => {
      const chuyenDe = Array.isArray(item.chuyen_de) ? item.chuyen_de[0] : item.chuyen_de;
      return chuyenDe?.ten_chuyen_de || "";
    })
    .filter(Boolean);
  let noiDung: string;
  let nguon = "AI";
  try {
    noiDung = await sinhNhanXetGemini({ diem: Number(bai.diem_tong), nhom, chuyenDeYeu, tongSoChuyenDe: phanTich.length });
  } catch (cause) {
    if (job.so_lan_thu < 3) throw cause;
    noiDung = nhanXetFallback(nhom, chuyenDeYeu, Number(bai.diem_tong), phanTich.length);
    nguon = "Fallback";
  }
  await supabase.from("nhan_xet_ai").upsert({
    bai_lam_id: bai.bai_lam_id,
    noi_dung: noiDung,
    nguon,
    so_lan_thu_lai: job.so_lan_thu,
    thoi_diem_sinh: new Date().toISOString(),
  }, { onConflict: "bai_lam_id" });

  if (nguon === "Fallback" && job.loai_job === "sinh_nhan_xet_ai") {
    await supabase.from("job_hang_doi").insert({
      loai_job: "thu_lai_nhan_xet_ai", tham_chieu_id: bai.bai_lam_id,
      khoa_idempotency: `ai-background:${bai.bai_lam_id}`,
      chay_luc: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    });
  }
  if (job.loai_job !== "thu_lai_nhan_xet_ai") {
    const laDemo = job.loai_job === "demo_ai";
    await supabase.from("job_hang_doi").insert({
      loai_job: laDemo ? "demo_email" : "gui_email",
      tham_chieu_id: bai.bai_lam_id,
      demo_luot_thi_id: laDemo ? job.demo_luot_thi_id : null,
      khoa_idempotency: laDemo
        ? `demo:${job.demo_luot_thi_id}:email:${bai.bai_lam_id}`
        : `email:${bai.bai_lam_id}`,
    });
  }
  return { baiLamId: bai.bai_lam_id, nguon };
}

async function xuLyEmail(supabase: SupabaseClient, job: JobHangDoi) {
  const { data: emailDaGui } = await supabase
    .from("email_log")
    .select("message_id")
    .eq("bai_lam_id", job.tham_chieu_id)
    .eq("trang_thai", "DaGui")
    .maybeSingle();
  if (emailDaGui) return { boQua: true, lyDo: "EMAIL_DA_GUI", messageId: emailDaGui.message_id };

  const { data: bai } = await supabase
    .from("bai_lam_thi")
    .select("bai_lam_id,diem_tong,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,email_phu_huynh),nhan_xet_ai(noi_dung),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(gio_ket_thuc,dot_thi!inner(ten_dot_thi)))")
    .eq("bai_lam_id", job.tham_chieu_id)
    .single();
  if (!bai) throw new Error("KHONG_TIM_THAY_BAI_LAM");
  const tk = Array.isArray(bai.tai_khoan) ? bai.tai_khoan[0] : bai.tai_khoan;
  const nx = Array.isArray(bai.nhan_xet_ai) ? bai.nhan_xet_ai[0] : bai.nhan_xet_ai;
  const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
  const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
  const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
  const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
  const payload = {
    email: tk?.email_phu_huynh || "", hoTen: tk?.ho_ten || "Học sinh", mon: mon?.ten_mon || "Môn thi",
    dotThi: dot?.ten_dot_thi || "Đợt thi", diem: Number(bai.diem_tong), nhom: xepNhomNangLuc(Number(bai.diem_tong)),
    nhanXet: nx?.noi_dung || "", lienKetBaoCao: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ket-qua`,
  };
  const tieuDe = taoNoiDungEmail(payload).tieuDe;
  if (!tk?.email_phu_huynh) {
    await supabase.from("email_log").upsert({ bai_lam_id: bai.bai_lam_id, tieu_de: tieuDe, trang_thai: "KhongGui_ThieuEmail", so_lan_thu: job.so_lan_thu }, { onConflict: "bai_lam_id" });
    return { thieuEmail: true };
  }
  const ketQua = await guiEmailKetQua(payload);
  if (!ketQua.thanhCong) {
    await supabase.from("email_log").upsert({
      bai_lam_id: bai.bai_lam_id, email_gui: tk.email_phu_huynh, tieu_de: tieuDe,
      trang_thai: ketQua.retry ? "ThatBaiTamThoi" : "CanXuLyThuCong", so_lan_thu: job.so_lan_thu,
      ma_loi: ketQua.maLoi, chi_tiet_loi: ketQua.chiTiet,
      han_gui_luc: ca?.gio_ket_thuc ? new Date(new Date(ca.gio_ket_thuc).getTime() + 48 * 60 * 60_000).toISOString() : null,
    }, { onConflict: "bai_lam_id" });
    throw new Error(`${ketQua.retry ? "RETRY" : "STOP"}:${ketQua.maLoi}`);
  }
  await supabase.from("email_log").upsert({
    bai_lam_id: bai.bai_lam_id, email_gui: tk.email_phu_huynh, tieu_de: tieuDe,
    trang_thai: "DaGui", so_lan_thu: job.so_lan_thu, message_id: ketQua.messageId, thoi_diem_gui: new Date().toISOString(),
  }, { onConflict: "bai_lam_id" });
  return { messageId: ketQua.messageId };
}

/** Xu ly mot job da duoc claim bang SKIP LOCKED va dong lai trang thai job. */
export async function xuLyMotJob(supabase: SupabaseClient, job: JobHangDoi): Promise<KetQuaXuLyJob> {
  try {
    let ketQua: Record<string, unknown>;
    if (job.loai_job === "phan_tich_ket_qua") {
      const { data, error } = await supabase.rpc("phan_tich_ket_qua_ca", { p_ca_thi_id: job.tham_chieu_id });
      if (error) throw new Error(error.message);
      ketQua = (data ?? { ok: true }) as Record<string, unknown>;
    } else if (job.loai_job === "demo_phan_tich") {
      const { data: bai } = await supabase.from("demo_luot_thi_bai_lam").select("bai_lam_id").eq("demo_luot_thi_id", job.demo_luot_thi_id!);
      const { data, error } = await supabase.rpc("phan_tich_ket_qua_cac_bai", { p_bai_lam_ids: (bai ?? []).map((x) => x.bai_lam_id), p_demo_luot_thi_id: job.demo_luot_thi_id });
      if (error) throw new Error(error.message);
      ketQua = (data ?? { ok: true }) as Record<string, unknown>;
    } else if (["sinh_nhan_xet_ai", "thu_lai_nhan_xet_ai", "demo_ai"].includes(job.loai_job)) {
      ketQua = await xuLyNhanXet(supabase, job);
    } else if (["gui_email", "demo_email"].includes(job.loai_job)) {
      ketQua = await xuLyEmail(supabase, job);
    } else {
      throw new Error(`LOAI_JOB_KHONG_HO_TRO:${job.loai_job}`);
    }
    await supabase.rpc("hoan_tat_job_hang_doi", { p_id: job.id, p_thanh_cong: true, p_ket_qua: ketQua, p_chay_lai_luc: null });
    return { ketQua, trangThaiLuotDemo: await capNhatTrangThaiLuotDemo(supabase, job.demo_luot_thi_id) };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Lỗi không xác định";
    let chayLai: string | null = null;
    if (["sinh_nhan_xet_ai", "demo_ai"].includes(job.loai_job) && job.so_lan_thu < 3) chayLai = new Date(Date.now() + 2 * 60_000).toISOString();
    if (["gui_email", "demo_email"].includes(job.loai_job) && job.so_lan_thu < 3 && !message.startsWith("STOP:")) chayLai = new Date(Date.now() + 15 * 60_000).toISOString();
    if (job.loai_job === "gui_email" && !chayLai) {
      await supabase.from("thong_bao_admin").insert({ loai: "EmailThatBai", tham_chieu_id: job.tham_chieu_id, noi_dung: `Email kết quả cần xử lý thủ công: ${message}` });
    }
    await supabase.rpc("hoan_tat_job_hang_doi", { p_id: job.id, p_thanh_cong: false, p_ket_qua: { error: message }, p_chay_lai_luc: chayLai });
    await capNhatTrangThaiLuotDemo(supabase, job.demo_luot_thi_id);
    throw new Error(message);
  }
}
