import { NextRequest, NextResponse } from "next/server";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { nhanXetFallback, sinhNhanXetGemini } from "@/lib/ai/gemini";
import { guiEmailKetQua, taoNoiDungEmail } from "@/lib/email/gmail";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";

/**
 * GET /api/cron/xu-ly-hang-doi - FR-M6-01, FR-M6-02, FR-M6-06
 * Vercel Cron goi moi 1 phut. Quet bang `job_hang_doi` co chay_luc <= now(), xu ly
 * theo loai_job:
 *  - "phan_tich_ket_qua": chay truc tiep trong SQL/RPC, phai xong trong 2 gio sau khi
 *    Ca ket thuc (FR-M6-01).
 *  - "sinh_nhan_xet_ai": goi lib/ai/gemini.ts, retry toi da 3 lan cach 2 phut; het retry
 *    thi dung mau fallback theo nhom nang luc, thu lai ngam trong 24h (FR-M6-02).
 *  - "gui_email": gui Gmail SMTP (hoac stub), retry loi tam thoi 3 lan cach 15 phut.
 * Dung FOR UPDATE SKIP LOCKED khi SELECT job de tranh xu ly trung neu cron chay chong lan.
 * TODO: implement day du, hien la stub tra ve 501.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiLoi("KHONG_CO_QUYEN", "Cron secret không hợp lệ", 401);
  }
  const supabase = taoSupabaseServiceRole();
  const { data: jobs, error } = await supabase.rpc("nhan_job_hang_doi");
  if (error) return apiLoi("NHAN_JOB_THAT_BAI", error.message, 500);
  const job = jobs?.[0];
  if (!job) return apiThanhCong({ daXuLy: false });
  try {
    if (job.loai_job === "phan_tich_ket_qua") {
      const { data, error: analysisError } = await supabase.rpc("phan_tich_ket_qua_ca", {
        p_ca_thi_id: job.tham_chieu_id,
      });
      if (analysisError) throw new Error(analysisError.message);
      await supabase.rpc("hoan_tat_job_hang_doi", {
        p_id: job.id, p_thanh_cong: true, p_ket_qua: data, p_chay_lai_luc: null,
      });
      return apiThanhCong({ daXuLy: true, jobId: job.id, loaiJob: job.loai_job, ketQua: data });
    } else if (job.loai_job === "sinh_nhan_xet_ai" || job.loai_job === "thu_lai_nhan_xet_ai") {
      const { data: bai } = await supabase.from("bai_lam_thi")
        .select("bai_lam_id,diem_tong,hoc_sinh_tai_khoan_id,ca_thi_mon!inner(mon_id),phan_tich_chuyen_de(ty_le_dung,chuyen_de(ten_chuyen_de))")
        .eq("bai_lam_id", job.tham_chieu_id).single();
      if (!bai) throw new Error("KHONG_TIM_THAY_BAI_LAM");
      const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
      if (!ctm) throw new Error("BAI_LAM_THIEU_MON");
      const nhom = xepNhomNangLuc(Number(bai.diem_tong));
      const chuyenDeYeu = (bai.phan_tich_chuyen_de || [])
        .filter((item) => Number(item.ty_le_dung) < 60)
        .map((item) => {
          const cd = Array.isArray(item.chuyen_de) ? item.chuyen_de[0] : item.chuyen_de;
          return cd?.ten_chuyen_de || "";
        })
        .filter(Boolean);
      const tongSoChuyenDe = (bai.phan_tich_chuyen_de || []).length;
      let noiDung: string;
      let nguon = "AI";
      try {
        noiDung = await sinhNhanXetGemini({ diem: Number(bai.diem_tong), nhom, chuyenDeYeu, tongSoChuyenDe });
      } catch (errorAi) {
        if (job.so_lan_thu < 3) throw errorAi;
        noiDung = nhanXetFallback(nhom, chuyenDeYeu, Number(bai.diem_tong), tongSoChuyenDe);
        nguon = "Fallback";
      }
      await supabase.from("nhan_xet_ai").upsert({ bai_lam_id: bai.bai_lam_id, noi_dung: noiDung, nguon, so_lan_thu_lai: job.so_lan_thu, thoi_diem_sinh: new Date().toISOString() }, { onConflict: "bai_lam_id" });
      if (nguon === "Fallback" && job.loai_job !== "thu_lai_nhan_xet_ai") {
        await supabase.from("job_hang_doi").insert({
          loai_job: "thu_lai_nhan_xet_ai", tham_chieu_id: bai.bai_lam_id,
          khoa_idempotency: `ai-background:${bai.bai_lam_id}`,
          chay_luc: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
        });
      }
      if (job.loai_job !== "thu_lai_nhan_xet_ai") {
        await supabase.from("job_hang_doi").insert({ loai_job: "gui_email", tham_chieu_id: bai.bai_lam_id, khoa_idempotency: `email:${bai.bai_lam_id}` });
      }
    } else if (job.loai_job === "gui_email") {
      const { data: emailDaGui } = await supabase.from("email_log")
        .select("message_id")
        .eq("bai_lam_id", job.tham_chieu_id)
        .eq("trang_thai", "DaGui")
        .maybeSingle();
      if (emailDaGui) {
        await supabase.rpc("hoan_tat_job_hang_doi", {
          p_id: job.id, p_thanh_cong: true,
          p_ket_qua: { boQua: true, lyDo: "EMAIL_DA_GUI", messageId: emailDaGui.message_id },
          p_chay_lai_luc: null,
        });
        return apiThanhCong({ daXuLy: true, boQua: true, jobId: job.id, loaiJob: job.loai_job });
      }
      const { data: bai } = await supabase.from("bai_lam_thi").select("bai_lam_id,diem_tong,hoc_sinh_tai_khoan_id,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ho_ten,email_phu_huynh),nhan_xet_ai(noi_dung),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(gio_ket_thuc,dot_thi!inner(ten_dot_thi)))").eq("bai_lam_id", job.tham_chieu_id).single();
      if (!bai) throw new Error("KHONG_TIM_THAY_BAI_LAM");
      const tk = Array.isArray(bai.tai_khoan) ? bai.tai_khoan[0] : bai.tai_khoan;
      const nx = Array.isArray(bai.nhan_xet_ai) ? bai.nhan_xet_ai[0] : bai.nhan_xet_ai;
      const ctm = Array.isArray(bai.ca_thi_mon) ? bai.ca_thi_mon[0] : bai.ca_thi_mon;
      const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
      const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
      const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
      const tieuDe = taoNoiDungEmail({
        email: tk?.email_phu_huynh || "", hoTen: tk?.ho_ten || "Học sinh",
        mon: mon?.ten_mon || "Môn thi", dotThi: dot?.ten_dot_thi || "Đợt thi",
        diem: Number(bai.diem_tong), nhom: xepNhomNangLuc(Number(bai.diem_tong)),
        nhanXet: nx?.noi_dung || "", lienKetBaoCao: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ket-qua`,
      }).tieuDe;
      if (!tk?.email_phu_huynh) {
        await supabase.from("email_log").upsert({ bai_lam_id: bai.bai_lam_id, tieu_de: tieuDe, trang_thai: "KhongGui_ThieuEmail", so_lan_thu: job.so_lan_thu }, { onConflict: "bai_lam_id" });
      } else {
        const ketQua = await guiEmailKetQua({
          email: tk.email_phu_huynh, hoTen: tk.ho_ten, mon: mon?.ten_mon || "Môn thi",
          dotThi: dot?.ten_dot_thi || "Đợt thi", diem: Number(bai.diem_tong),
          nhom: xepNhomNangLuc(Number(bai.diem_tong)), nhanXet: nx?.noi_dung || "",
          lienKetBaoCao: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ket-qua`,
        });
        if (!ketQua.thanhCong) {
          await supabase.from("email_log").upsert({
            bai_lam_id: bai.bai_lam_id, email_gui: tk.email_phu_huynh, tieu_de: tieuDe,
            trang_thai: ketQua.retry ? "ThatBaiTamThoi" : "CanXuLyThuCong",
            so_lan_thu: job.so_lan_thu, ma_loi: ketQua.maLoi, chi_tiet_loi: ketQua.chiTiet,
            han_gui_luc: ca?.gio_ket_thuc ? new Date(new Date(ca.gio_ket_thuc).getTime() + 48 * 60 * 60_000).toISOString() : null,
          }, { onConflict: "bai_lam_id" });
          throw new Error(`${ketQua.retry ? "RETRY" : "STOP"}:${ketQua.maLoi}`);
        }
        await supabase.from("email_log").upsert({
          bai_lam_id: bai.bai_lam_id, email_gui: tk.email_phu_huynh, tieu_de: tieuDe,
          trang_thai: "DaGui", so_lan_thu: job.so_lan_thu, message_id: ketQua.messageId,
          thoi_diem_gui: new Date().toISOString(),
        }, { onConflict: "bai_lam_id" });
      }
    }
    await supabase.rpc("hoan_tat_job_hang_doi", { p_id: job.id, p_thanh_cong: true, p_ket_qua: { ok: true }, p_chay_lai_luc: null });
    return apiThanhCong({ daXuLy: true, jobId: job.id, loaiJob: job.loai_job });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Lỗi không xác định";
    let chayLai: string | null = null;
    if (job.loai_job === "sinh_nhan_xet_ai" && job.so_lan_thu < 3) chayLai = new Date(Date.now() + 2 * 60_000).toISOString();
    if (job.loai_job === "gui_email" && job.so_lan_thu < 3 && !message.startsWith("STOP:")) chayLai = new Date(Date.now() + 15 * 60_000).toISOString();
    if (job.loai_job === "gui_email" && !chayLai) {
      await supabase.from("thong_bao_admin").insert({
        loai: "EmailThatBai", tham_chieu_id: job.tham_chieu_id,
        noi_dung: `Email kết quả cần xử lý thủ công: ${message}`,
      });
    }
    await supabase.rpc("hoan_tat_job_hang_doi", { p_id: job.id, p_thanh_cong: false, p_ket_qua: { error: message }, p_chay_lai_luc: chayLai });
    return apiLoi("XU_LY_JOB_THAT_BAI", message, chayLai ? 503 : 500, { jobId: job.id, chayLai });
  }
}
