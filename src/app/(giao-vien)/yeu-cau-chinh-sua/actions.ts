"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { cauHoiSchema, type DuLieuCauHoi } from "@/lib/rules/cau-hoi";
import { PHAN_LOAI_LOI, type PhanLoaiLoi } from "@/lib/rules/yeu-cau-chinh-sua";

const schema = z.object({
  cauHoiId: z.string().uuid(),
  lyDo: z.string().trim().min(5, "Lý do phải có ít nhất 5 ký tự").max(500, "Lý do tối đa 500 ký tự"),
  phanLoaiLoi: z.enum(PHAN_LOAI_LOI).optional(),
  deXuat: cauHoiSchema,
});

export async function guiYeuCauChinhSua(input: { cauHoiId: string; lyDo: string; phanLoaiLoi?: PhanLoaiLoi; deXuat: DuLieuCauHoi }) {
  try {
    const data = schema.parse(input);
    const session = await laySessionHienHanh();
    if (!session || session.vai_tro !== "GiaoVien") throw new Error("Không có quyền thực hiện");
    const supabase = taoSupabaseServiceRole();
    const { data: taiKhoan } = await supabase.from("tai_khoan").select("mon_id").eq("tai_khoan_id", session.sub).maybeSingle();
    if (!taiKhoan?.mon_id) throw new Error("Giáo viên chưa được gán môn");
    const { data: cauHoi } = await supabase
      .from("cau_hoi")
      .select("cau_hoi_id, phan, trang_thai_duyet, bai_hoc!inner(chuyen_de!inner(mon_id))")
      .eq("cau_hoi_id", data.cauHoiId)
      .eq("nguoi_tao_tai_khoan_id", session.sub)
      .eq("bai_hoc.chuyen_de.mon_id", taiKhoan.mon_id)
      .maybeSingle();
    if (!cauHoi || cauHoi.trang_thai_duyet !== "DaDuyet") throw new Error("Câu hỏi không thuộc môn hoặc chưa được duyệt");
    if (cauHoi.phan !== data.deXuat.phan) throw new Error("Không thể đổi Phần của câu hỏi đã duyệt");
    const { data: baiHoc } = await supabase
      .from("bai_hoc")
      .select("bai_hoc_id, chuyen_de!inner(mon_id)")
      .eq("bai_hoc_id", data.deXuat.baiHocId)
      .eq("chuyen_de.mon_id", taiKhoan.mon_id)
      .maybeSingle();
    if (!baiHoc) throw new Error("Bài học đề xuất không thuộc môn");
    const { error } = await supabase.rpc("gui_yeu_cau_chinh_sua", {
      p_cau_hoi_id: data.cauHoiId,
      p_nguoi_de_xuat_id: session.sub,
      p_noi_dung_de_xuat: {
        ly_do: data.lyDo,
        phan_loai_loi: data.phanLoaiLoi ?? null,
        bai_hoc_id: data.deXuat.baiHocId,
        muc_do_id: data.deXuat.mucDoId,
        noi_dung: data.deXuat.noiDung,
        dap_an_phan3: data.deXuat.phan === "III" ? data.deXuat.dapAnPhan3 : null,
        chi_tiet_cau_hoi: data.deXuat.chiTiet.map((item, index) => ({ thu_tu: index + 1, noi_dung: item.noiDung, la_dap_an_dung: item.laDapAnDung })),
      }
    });
    if (error) {
      if (error.code === "23505") throw new Error("Câu hỏi đã có một yêu cầu chỉnh sửa đang chờ");
    throw new Error("Chưa gửi được yêu cầu chỉnh sửa. Vui lòng thử lại.");
    }
    revalidatePath("/yeu-cau-chinh-sua");
    revalidatePath("/ngan-hang-cau-hoi-mon");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof z.ZodError ? error.issues[0]?.message : error instanceof Error ? error.message : "Có lỗi xảy ra" };
  }
}
