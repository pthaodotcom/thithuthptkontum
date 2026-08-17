import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import {
  apDungDemoBypass,
  demoBypassDangBat,
  type DemoBypassOverride,
} from "@/lib/demo/bypass";
import ExamClient from "./ExamClient";

export const dynamic = "force-dynamic";

type CauThi = {
  snapshotId: string;
  phan: "I" | "II" | "III";
  noiDung: string;
  chiTiet: Array<{ id: string; thuTu: number; noiDung: string }>;
};

export default async function LamBaiPage({
  params,
}: {
  params: Promise<{ caThiMonId: string }>;
}) {
  const session = await laySessionHienHanh();
  if (!session || session.vai_tro !== "HocSinh") redirect("/dang-nhap");

  const { caThiMonId } = await params;
  const supabase = taoSupabaseServiceRole();
  const { data: baiLam } = await supabase
    .from("bai_lam_thi")
    .select(
      "bai_lam_id,trang_thai,de_thi_id,ma_de_id,thu_tu_hien_thi,ca_thi_mon!inner(ca_thi!inner(gio_bat_dau,gio_ket_thuc,trang_thai)),tra_loi(*)",
    )
    .eq("ca_thi_mon_id", caThiMonId)
    .eq("hoc_sinh_tai_khoan_id", session.sub)
    .maybeSingle();

  if (!baiLam) return <p className="p-6">Bạn không thuộc danh sách ca thi này.</p>;
  if (baiLam.trang_thai === "DaNopBai") redirect("/ket-qua");

  let cauHoi: CauThi[] = [];
  if (baiLam.de_thi_id) {
    const { data } = await supabase
      .from("cau_hoi_snapshot")
      .select("snapshot_id,phan,noi_dung,chi_tiet_cau_hoi_snapshot(id,thu_tu,noi_dung)")
      .eq("de_thi_id", baiLam.de_thi_id);
    const order = Array.isArray(baiLam.thu_tu_hien_thi) ? baiLam.thu_tu_hien_thi : [];
    const byId = new Map((data ?? []).map((item) => [item.snapshot_id, item]));
    cauHoi = order
      .map((orderItem) => {
        if (!orderItem || typeof orderItem !== "object") return null;
        const snapshotId = "snapshot_id" in orderItem ? String(orderItem.snapshot_id) : "";
        const item = byId.get(snapshotId);
        if (!item) return null;
        const optionOrder: unknown[] = "thu_tu_phuong_an" in orderItem && Array.isArray(orderItem.thu_tu_phuong_an)
          ? orderItem.thu_tu_phuong_an
          : [];
        const rank = new Map(optionOrder.map((value: unknown, index: number) => [Number(value), index]));
        return {
          snapshotId: item.snapshot_id,
          phan: item.phan as CauThi["phan"],
          noiDung: item.noi_dung,
          chiTiet: (item.chi_tiet_cau_hoi_snapshot ?? [])
            .map((detail) => ({ id: detail.id, thuTu: detail.thu_tu, noiDung: detail.noi_dung }))
            .sort((a, b) => (rank.get(a.thuTu) ?? a.thuTu) - (rank.get(b.thuTu) ?? b.thuTu)),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (!cauHoi.length) {
      cauHoi = (data ?? []).map((item) => ({
        snapshotId: item.snapshot_id,
        phan: item.phan as CauThi["phan"],
        noiDung: item.noi_dung,
        chiTiet: (item.chi_tiet_cau_hoi_snapshot ?? []).map((detail) => ({
          id: detail.id,
          thuTu: detail.thu_tu,
          noiDung: detail.noi_dung,
        })),
      }));
    }
  }

  const caThiMon = Array.isArray(baiLam.ca_thi_mon) ? baiLam.ca_thi_mon[0] : baiLam.ca_thi_mon;
  const caThi = Array.isArray(caThiMon?.ca_thi) ? caThiMon.ca_thi[0] : caThiMon?.ca_thi;
  let gioKetThuc = caThi?.gio_ket_thuc;

  if (caThi && demoBypassDangBat()) {
    const { data: demoRow } = await supabase
      .from("demo_bypass_ca_thi_mon")
      .select("trang_thai,gio_bat_dau,gio_ket_thuc")
      .eq("ca_thi_mon_id", caThiMonId)
      .maybeSingle();
    const demoOverride = demoRow
      ? {
          trang_thai: demoRow.trang_thai as DemoBypassOverride["trang_thai"],
          gio_bat_dau: demoRow.gio_bat_dau,
          gio_ket_thuc: demoRow.gio_ket_thuc,
        }
      : null;
    gioKetThuc = apDungDemoBypass(
      {
        trangThai: caThi.trang_thai,
        gioBatDau: caThi.gio_bat_dau,
        gioKetThuc: caThi.gio_ket_thuc,
      },
      demoOverride,
    ).gioKetThuc;
  }

  const banDau = (baiLam.tra_loi ?? []).map((answer) => ({
    cauHoiSnapshotId: answer.cau_hoi_snapshot_id,
    chiTietThuTu: answer.chi_tiet_thu_tu,
    dapAnLuaChonId: answer.dap_an_lua_chon_id,
    dapAnDungSai: answer.dap_an_dung_sai,
    dapAnChuoi: answer.dap_an_chuoi,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <ExamClient
        caThiMonId={caThiMonId}
        baiLamId={baiLam.trang_thai === "DangThi" ? baiLam.bai_lam_id : undefined}
        gioKetThuc={gioKetThuc}
        cauHoi={cauHoi}
        banDau={banDau}
      />
    </div>
  );
}
