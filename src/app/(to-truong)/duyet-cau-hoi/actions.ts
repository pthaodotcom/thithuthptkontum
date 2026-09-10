"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { luuDauVanCauHoi } from "@/lib/cau-hoi/trung-lap";
import { taoDauVanCauHoi } from "@/lib/rules/cau-hoi-trung";

const schema = z.object({
  id: z.string().uuid(),
  quyetDinh: z.enum(["DaDuyet", "TuChoi", "CanChinhSua"]),
  lyDo: z.string().trim().max(1000).optional(),
}).superRefine((x, ctx) => {
  if (["TuChoi", "CanChinhSua"].includes(x.quyetDinh) && !x.lyDo) ctx.addIssue({ code: "custom", path: ["lyDo"], message: "Lý do xử lý là bắt buộc" });
});

async function xuLy(input: z.input<typeof schema>, rpc: "duyet_cau_hoi_moi" | "xu_ly_yeu_cau_chinh_sua") {
  try {
    const data = schema.parse(input);
    if (rpc === "xu_ly_yeu_cau_chinh_sua" && data.quyetDinh === "CanChinhSua") throw new Error("Quyết định không hợp lệ");
    const session = await laySessionHienHanh();
    if (!session || session.vai_tro !== "GiaoVien") throw new Error("Không có quyền thực hiện");
    const supabase = taoSupabaseServiceRole();
    const { data: mon } = await supabase.from("mon").select("mon_id").eq("to_truong_tai_khoan_id", session.sub).maybeSingle();
    if (!mon) throw new Error("Tài khoản không phải Tổ trưởng");
    const args = rpc === "duyet_cau_hoi_moi"
      ? { p_cau_hoi_id: data.id, p_nguoi_duyet_id: session.sub, p_quyet_dinh: data.quyetDinh, p_ly_do: data.lyDo || null }
      : { p_yc_id: data.id, p_nguoi_duyet_id: session.sub, p_quyet_dinh: data.quyetDinh, p_ly_do: data.lyDo || null };
    const { error } = await supabase.rpc(rpc, args);
    if (error) throw new Error("Chưa lưu được quyết định. Vui lòng tải lại trang và thử lại.");

    if (rpc === "xu_ly_yeu_cau_chinh_sua" && data.quyetDinh === "DaDuyet") {
      const { data: yeuCau } = await supabase.from("yeu_cau_chinh_sua").select("cau_hoi_id").eq("yc_id", data.id).maybeSingle();
      if (yeuCau?.cau_hoi_id) {
        const { data: cauHoi } = await supabase
          .from("cau_hoi")
          .select("cau_hoi_id,bai_hoc_id,muc_do_id,phan,noi_dung,dap_an_phan3,updated_at,chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung)")
          .eq("cau_hoi_id", yeuCau.cau_hoi_id)
          .maybeSingle();
        if (cauHoi) {
          const dauVan = taoDauVanCauHoi({
            phan: cauHoi.phan as "I" | "II" | "III",
            baiHocId: cauHoi.bai_hoc_id,
            mucDoId: cauHoi.muc_do_id,
            noiDung: cauHoi.noi_dung,
            dapAnPhan3: cauHoi.dap_an_phan3,
            chiTiet: [...(cauHoi.chi_tiet_cau_hoi ?? [])]
              .sort((a, b) => a.thu_tu - b.thu_tu)
              .map((item) => ({ noiDung: item.noi_dung, laDapAnDung: item.la_dap_an_dung })),
          });
          await luuDauVanCauHoi(supabase, cauHoi.cau_hoi_id, dauVan, cauHoi.updated_at);
        }
      }
    }

    // Không phụ thuộc hoàn toàn vào database trigger: một số môi trường cũ có bảng
    // thông báo nhưng chưa cài trigger 0025. Tạo bù theo cách idempotent để giáo
    // viên luôn nhận được thông báo ngay khi Tổ trưởng yêu cầu sửa.
    if (rpc === "duyet_cau_hoi_moi" && data.quyetDinh === "CanChinhSua") {
      const { data: cauHoi } = await supabase
        .from("cau_hoi")
        .select("cau_hoi_id,nguoi_tao_tai_khoan_id,noi_dung")
        .eq("cau_hoi_id", data.id)
        .maybeSingle();
      if (cauHoi?.nguoi_tao_tai_khoan_id) {
        const { data: daCo } = await supabase
          .from("thong_bao_noi_bo")
          .select("id")
          .eq("nguoi_nhan_tai_khoan_id", cauHoi.nguoi_tao_tai_khoan_id)
          .eq("loai", "CauHoiCanSua")
          .eq("doi_tuong_id", cauHoi.cau_hoi_id)
          .limit(1)
          .maybeSingle();
        if (!daCo) {
          const tomTat = String(cauHoi.noi_dung || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
          const { error: notificationError } = await supabase.from("thong_bao_noi_bo").insert({
            nguoi_nhan_tai_khoan_id: cauHoi.nguoi_tao_tai_khoan_id,
            loai: "CauHoiCanSua",
            tieu_de: "Tổ trưởng yêu cầu chỉnh sửa câu hỏi",
            noi_dung: data.lyDo || tomTat,
            duong_dan: `/soan-cau-hoi?chinhSua=${cauHoi.cau_hoi_id}`,
            doi_tuong_id: cauHoi.cau_hoi_id,
          });
          if (notificationError) throw new Error("Đã lưu quyết định nhưng chưa gửi được thông báo cho giáo viên. Vui lòng thử lại.");
        }
      }
    }
    revalidatePath("/duyet-cau-hoi");
    revalidatePath("/yeu-cau-chinh-sua");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Có lỗi xảy ra" };
  }
}

export async function duyetCauHoi(input: z.input<typeof schema>) { return xuLy(input, "duyet_cau_hoi_moi"); }
export async function duyetYeuCau(input: z.input<typeof schema>) { return xuLy(input, "xu_ly_yeu_cau_chinh_sua"); }

export async function ganNhomCauHoiTrung(cauHoiId: string, cauHoiDaiDienId: string) {
  try {
    const id = z.string().uuid().parse(cauHoiId);
    const daiDienId = z.string().uuid().parse(cauHoiDaiDienId);
    const session = await laySessionHienHanh();
    if (!session || session.vai_tro !== "GiaoVien") throw new Error("Không có quyền thực hiện");
    const supabase = taoSupabaseServiceRole();
    const { data: mon } = await supabase.from("mon").select("mon_id").eq("to_truong_tai_khoan_id", session.sub).maybeSingle();
    if (!mon) throw new Error("Tài khoản không phải Tổ trưởng");
    const { data, error } = await supabase.rpc("gan_nhom_cau_hoi_trung", {
      p_cau_hoi_id: id,
      p_cau_hoi_dai_dien_id: daiDienId,
      p_to_truong_id: session.sub,
    });
    if (error) throw new Error("Chưa gán được nhóm câu hỏi. Vui lòng tải lại trang và thử lại.");
    revalidatePath("/duyet-cau-hoi");
    revalidatePath("/ngan-hang-cau-hoi");
    return { success: true, nhomId: data as string };
  } catch (error) {
    return { success: false, error: error instanceof z.ZodError ? "Câu hỏi không hợp lệ" : error instanceof Error ? error.message : "Có lỗi xảy ra" };
  }
}
