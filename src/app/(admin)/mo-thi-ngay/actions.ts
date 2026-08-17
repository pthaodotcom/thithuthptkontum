"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { laySessionHienHanh } from "@/lib/auth/session";
import { demoBypassDangBat } from "@/lib/demo/bypass";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import type { KetQuaMoCaBypass, LoiMoCaBypass } from "./types";

const cauHinhCaSchema = z.object({
  caThiId: z.string().uuid(),
  trangThai: z.enum(["MacDinh", "VaoThi", "SapDienRa"]),
  gioBatDau: z.string().datetime().nullable(),
  gioKetThuc: z.string().datetime().nullable(),
});

const schema = z.object({
  dotThiId: z.string().uuid(),
  cauHinhCa: z.array(cauHinhCaSchema).min(1).max(20),
  lyDo: z.string().trim().min(5).max(500),
  daXacNhan: z.literal(true),
}).superRefine((value, context) => {
  const ids = value.cauHinhCa.map((item) => item.caThiId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["cauHinhCa"], message: "Ca thi bị trùng." });
  }
  for (const [index, item] of value.cauHinhCa.entries()) {
    if (item.trangThai === "MacDinh") continue;
    const batDau = item.gioBatDau ? new Date(item.gioBatDau) : null;
    const ketThuc = item.gioKetThuc ? new Date(item.gioKetThuc) : null;
    if (!batDau || !ketThuc || Number.isNaN(batDau.getTime()) || Number.isNaN(ketThuc.getTime()) || ketThuc <= batDau) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cauHinhCa", index, "gioKetThuc"],
        message: "Giờ kết thúc phải sau giờ bắt đầu.",
      });
    }
  }
});

type MonRow = {
  id: string;
  caThiId: string;
  monId: string;
  tenMon: string;
};

type CaRow = {
  ca_thi_id: string;
  dot_thi_id: string;
  so_thu_tu_ca: number;
  ca_thi_mon: Array<{
    id: string;
    mon_id: string;
    mon: { ten_mon: string } | Array<{ ten_mon: string }> | null;
  }>;
};

function loiChung(message?: string) {
  if (message?.includes("demo_bypass_ca_thi_mon")) {
    return "Chưa cài đặt bảng cấu hình demo. Vui lòng chạy migration 0038 trước.";
  }
  return "Chưa áp dụng được lịch demo. Vui lòng tải lại và thử lại.";
}

export async function moCaThiNgay(
  input: z.input<typeof schema>
): Promise<KetQuaMoCaBypass | LoiMoCaBypass> {
  if (!demoBypassDangBat()) {
    return { success: false, error: "Chế độ demo đang tắt. Công cụ này không có trong bản release chính thức." };
  }

  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "Admin") {
    return { success: false, error: "Chỉ Quản trị viên mới được dùng công cụ demo này." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Vui lòng kiểm tra trạng thái, giờ thi và xác nhận thao tác." };
  }

  const supabase = taoSupabaseServiceRole();
  const caIds = parsed.data.cauHinhCa.map((item) => item.caThiId);
  const { data: caRowsRaw, error: caError } = await supabase
    .from("ca_thi")
    .select("ca_thi_id,dot_thi_id,so_thu_tu_ca,ca_thi_mon(id,mon_id,mon(ten_mon))")
    .in("ca_thi_id", caIds);
  if (caError) return { success: false, error: loiChung(caError.message) };

  const caRows = (caRowsRaw ?? []) as CaRow[];
  if (
    caRows.length !== caIds.length ||
    caRows.some((ca) => ca.dot_thi_id !== parsed.data.dotThiId || ca.so_thu_tu_ca < 2 || ca.so_thu_tu_ca > 4)
  ) {
    return { success: false, error: "Chỉ Ca 2, Ca 3 và Ca 4 của đúng đợt thi mới được cấu hình demo." };
  }

  const monRows: MonRow[] = caRows.flatMap((ca) =>
    (ca.ca_thi_mon ?? []).map((row) => {
      const mon = Array.isArray(row.mon) ? row.mon[0] : row.mon;
      return {
        id: row.id,
        caThiId: ca.ca_thi_id,
        monId: row.mon_id,
        tenMon: mon?.ten_mon ?? "Môn chưa xác định",
      };
    })
  );
  if (!monRows.length) return { success: false, error: "Các ca đã chọn chưa có môn thi." };

  const cauHinhTheoCa = new Map(parsed.data.cauHinhCa.map((item) => [item.caThiId, item]));
  const caCoOverride = caRows.filter((ca) => cauHinhTheoCa.get(ca.ca_thi_id)?.trangThai !== "MacDinh");
  const caVaoThi = caRows.filter((ca) => cauHinhTheoCa.get(ca.ca_thi_id)?.trangThai === "VaoThi");
  const caSapDienRa = caRows.filter((ca) => cauHinhTheoCa.get(ca.ca_thi_id)?.trangThai === "SapDienRa");
  const caMacDinh = caRows.filter((ca) => cauHinhTheoCa.get(ca.ca_thi_id)?.trangThai === "MacDinh");
  const idsCaCoOverride = new Set(caCoOverride.map((ca) => ca.ca_thi_id));
  const idsCaVaoThi = new Set(caVaoThi.map((ca) => ca.ca_thi_id));
  const idsCaMacDinh = new Set(caMacDinh.map((ca) => ca.ca_thi_id));
  const monCoOverride = monRows.filter((row) => idsCaCoOverride.has(row.caThiId));
  const monVaoThi = monRows.filter((row) => idsCaVaoThi.has(row.caThiId));
  const monMacDinh = monRows.filter((row) => idsCaMacDinh.has(row.caThiId));
  const caThiMonIds = monRows.map((row) => row.id);

  const { data: baiLamRows, error: baiLamError } = await supabase
    .from("bai_lam_thi")
    .select("bai_lam_id,ca_thi_mon_id,trang_thai")
    .in("ca_thi_mon_id", caThiMonIds);
  if (baiLamError) return { success: false, error: loiChung(baiLamError.message) };

  const monTheoId = new Map(monRows.map((row) => [row.id, row]));
  const caDangCoNguoiThi = new Set(
    (baiLamRows ?? [])
      .filter((row) => row.trang_thai === "DangThi")
      .map((row) => monTheoId.get(row.ca_thi_mon_id)?.caThiId)
      .filter((id): id is string => Boolean(id))
  );
  const caBiLuiLich = caSapDienRa.filter((ca) => caDangCoNguoiThi.has(ca.ca_thi_id));
  if (caBiLuiLich.length) {
    return {
      success: false,
      error: `Không thể chuyển sang “Sắp diễn ra” vì đang có học sinh làm bài ở ${caBiLuiLich.map((ca) => `Ca ${ca.so_thu_tu_ca}`).join(", ")}.`,
    };
  }

  const monIdCanKiemTraDe = [...new Set(monCoOverride.map((row) => row.monId))];
  const monIdCoDeTaiSuDung = new Set<string>();
  if (monIdCanKiemTraDe.length) {
    const { data: deRows, error: deError } = await supabase
      .from("de_thi")
      .select("de_thi_id,ma_de(ma_de_id),ca_thi_mon!inner(mon_id)")
      .in("ca_thi_mon.mon_id", monIdCanKiemTraDe)
      .in("trang_thai", ["DaGiaoChuaBatDau", "DangThi", "DaThiXong"]);
    if (deError) return { success: false, error: loiChung(deError.message) };
    for (const de of deRows ?? []) {
      const ctm = Array.isArray(de.ca_thi_mon) ? de.ca_thi_mon[0] : de.ca_thi_mon;
      if (ctm?.mon_id && (de.ma_de?.length ?? 0) > 0) monIdCoDeTaiSuDung.add(ctm.mon_id);
    }
    const thieuDe = monVaoThi.filter((row) => !monIdCoDeTaiSuDung.has(row.monId));
    if (thieuDe.length) {
      return {
        success: false,
        error: `Chưa thể mở ca vì chưa có đề đã giao để dùng lại cho: ${[...new Set(thieuDe.map((row) => row.tenMon))].join(", ")}.`,
      };
    }
  }

  const overrideRows = monCoOverride.map((row) => {
    const item = cauHinhTheoCa.get(row.caThiId)!;
    return {
      ca_thi_mon_id: row.id,
      trang_thai: item.trangThai,
      gio_bat_dau: item.gioBatDau,
      gio_ket_thuc: item.gioKetThuc,
      ly_do: parsed.data.lyDo,
      nguoi_cap_nhat_tai_khoan_id: session.sub,
      updated_at: new Date().toISOString(),
    };
  });
  if (overrideRows.length) {
    const { error } = await supabase
      .from("demo_bypass_ca_thi_mon")
      .upsert(overrideRows, { onConflict: "ca_thi_mon_id" });
    if (error) return { success: false, error: loiChung(error.message) };
  }
  if (monMacDinh.length) {
    const { error } = await supabase
      .from("demo_bypass_ca_thi_mon")
      .delete()
      .in("ca_thi_mon_id", monMacDinh.map((row) => row.id));
    if (error) return { success: false, error: loiChung(error.message) };
  }

  const idsCanKhoiPhuc = monCoOverride.map((row) => row.id);
  const trangThaiCanKhoiPhuc = ["VangMat", "BiKhoaChoXuLy", "KhongTheDuThi_LoiToChuc"];
  const soBaiDuocKhoiPhuc = (baiLamRows ?? []).filter(
    (row) => idsCanKhoiPhuc.includes(row.ca_thi_mon_id) && trangThaiCanKhoiPhuc.includes(row.trang_thai)
  ).length;
  if (idsCanKhoiPhuc.length) {
    const { error } = await supabase
      .from("bai_lam_thi")
      .update({
        trang_thai: "ChuaDangNhap",
        de_thi_id: null,
        ma_de_id: null,
        thoi_diem_vao_thi: null,
        thoi_diem_nop: null,
        diem_tong: null,
        so_cau_dung: null,
        so_cau_sai: null,
        thu_tu_hien_thi: [],
      })
      .in("ca_thi_mon_id", idsCanKhoiPhuc)
      .in("trang_thai", trangThaiCanKhoiPhuc);
    if (error) return { success: false, error: loiChung(error.message) };
  }

  let soBaiDuocMoKhoa = 0;
  if (monVaoThi.length) {
    const monVaoThiIds = monVaoThi.map((row) => row.id);
    const { data: baiChoVaoThi, error: baiChoError } = await supabase
      .from("bai_lam_thi")
      .select("bai_lam_id")
      .in("ca_thi_mon_id", monVaoThiIds)
      .eq("trang_thai", "ChuaDangNhap");
    if (baiChoError) return { success: false, error: loiChung(baiChoError.message) };

    const baiLamIds = (baiChoVaoThi ?? []).map((row) => row.bai_lam_id);
    if (baiLamIds.length) {
      const { data: logDaCo, error: logCheckError } = await supabase
        .from("log_xu_ly_ngoai_le")
        .select("bai_lam_id")
        .eq("loai_xu_ly", "MoKhoaVaoTre")
        .in("bai_lam_id", baiLamIds);
      if (logCheckError) return { success: false, error: loiChung(logCheckError.message) };
      const daMo = new Set((logDaCo ?? []).map((row) => row.bai_lam_id));
      const canMo = baiLamIds.filter((id) => !daMo.has(id));
      if (canMo.length) {
        const { error } = await supabase.from("log_xu_ly_ngoai_le").insert(
          canMo.map((baiLamId) => ({
            bai_lam_id: baiLamId,
            loai_xu_ly: "MoKhoaVaoTre",
            nguoi_thuc_hien_tai_khoan_id: session.sub,
            ly_do: parsed.data.lyDo,
          }))
        );
        if (error) return { success: false, error: loiChung(error.message) };
        soBaiDuocMoKhoa = canMo.length;
      }
    }
  }

  const { data: dotThi } = await supabase
    .from("dot_thi")
    .select("ten_dot_thi")
    .eq("dot_thi_id", parsed.data.dotThiId)
    .maybeSingle();
  const { error: auditError } = await supabase.from("audit_log").insert({
    hanh_dong: "CauHinhCaThiDemoBypass",
    doi_tuong: "DotThi",
    doi_tuong_id: parsed.data.dotThiId,
    nguoi_thuc_hien_tai_khoan_id: session.sub,
    du_lieu: {
      ly_do: parsed.data.lyDo,
      ca_vao_thi: caVaoThi.map((ca) => ca.so_thu_tu_ca),
      ca_sap_dien_ra: caSapDienRa.map((ca) => ca.so_thu_tu_ca),
      ca_theo_lich_that: caMacDinh.map((ca) => ca.so_thu_tu_ca),
      cho_phep_tai_su_dung_de: true,
      so_bai_khoi_phuc: soBaiDuocKhoiPhuc,
      so_bai_mo_khoa_moi: soBaiDuocMoKhoa,
    },
  });
  if (auditError) return { success: false, error: "Lịch demo đã áp dụng nhưng chưa ghi được lịch sử thay đổi." };

  revalidatePath("/mo-thi-ngay");
  revalidatePath("/ho-so");
  revalidatePath("/ky-thi");
  return {
    success: true,
    data: {
      tenDotThi: dotThi?.ten_dot_thi ?? "Đợt thi",
      soCaVaoThi: caVaoThi.length,
      soCaSapDienRa: caSapDienRa.length,
      soCaTheoLichThat: caMacDinh.length,
      soMonDuocApDung: monCoOverride.length,
      soMonCoDeTaiSuDung: monVaoThi.filter((row) => monIdCoDeTaiSuDung.has(row.monId)).length,
      soBaiDuocKhoiPhuc,
      soBaiDuocMoKhoa,
    },
  };
}
