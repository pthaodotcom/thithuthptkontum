import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import { xepNhomNangLuc } from "@/lib/rules/ky-thi";

export type ReportRow = {
  baiLamId: string;
  hocSinhId: string;
  maSo: string;
  hoTen: string;
  lopId: string | null;
  lop: string;
  khoi?: string;
  monId: string;
  mon: string;
  dotThi: string;
  diem: number;
  soCauDung: number;
  soCauSai: number;
  nhom: ReturnType<typeof xepNhomNangLuc>;
  nopLuc: string | null;
  soViPham: number;
  loaiViPham: string[];
  viPhamGanNhat: string | null;
  tuDongThuBaiDoViPham: boolean;
};

export type ReportSummary = {
  rows: ReportRow[];
  diemTrungBinh: number;
  phoDiem: { nhan: string; soLuong: number }[];
  nhomNangLuc: { nhom: string; soLuong: number }[];
  tongViPham: number;
  soBaiCoViPham: number;
  soBaiTuDongThu: number;
};

export type SubjectClassSummary = {
  lopId: string | null;
  lop: string;
  soBai: number;
  diemTrungBinh: number;
  tyLeDat: number;
  nhomNangLuc: Record<ReportRow["nhom"], number>;
};

export function tongHopMonTheoLop(rows: ReportRow[]): SubjectClassSummary[] {
  const groups = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const key = row.lopId ?? `unassigned:${row.lop}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((classRows) => {
    const first = classRows[0]!;
    const total = classRows.length;
    const average = classRows.reduce((sum, row) => sum + row.diem, 0) / total;
    return {
      lopId: first.lopId,
      lop: first.lop,
      soBai: total,
      diemTrungBinh: Math.round(average * 100) / 100,
      tyLeDat: Math.round(classRows.filter((row) => row.diem >= 5).length / total * 10_000) / 100,
      nhomNangLuc: {
        CanOnTapGap: classRows.filter((row) => row.nhom === "CanOnTapGap").length,
        TrungBinh: classRows.filter((row) => row.nhom === "TrungBinh").length,
        Kha: classRows.filter((row) => row.nhom === "Kha").length,
        DaNamVung: classRows.filter((row) => row.nhom === "DaNamVung").length,
      },
    };
  }).sort((a, b) => b.diemTrungBinh - a.diemTrungBinh || a.lop.localeCompare(b.lop, "vi"));
}

export async function layBaoCao(filters: { lopId?: string; monId?: string; caThiMonId?: string } = {}): Promise<ReportSummary> {
  const session = await laySessionHienHanh();
  if (!session || !["Admin", "GiaoVien"].includes(session.vai_tro)) throw new Error("KHONG_CO_QUYEN");
  const supabase = taoSupabaseServiceRole();
  let lopDuocXem: Set<string> | null = null;
  let monBatBuoc: string | null = null;

  if (session.vai_tro === "GiaoVien") {
    const [{ data: gv }, { data: boNhiem }] = await Promise.all([
      supabase.from("tai_khoan").select("mon_id").eq("tai_khoan_id", session.sub).single(),
      supabase.from("mon").select("mon_id").eq("to_truong_tai_khoan_id", session.sub).maybeSingle(),
    ]);
    monBatBuoc = boNhiem?.mon_id || gv?.mon_id || null;
    if (!boNhiem) {
      const { data: phanCong } = await supabase.from("phan_cong_giang_day").select("lop_id").eq("giao_vien_tai_khoan_id", session.sub);
      lopDuocXem = new Set((phanCong || []).map((x) => x.lop_id));
    }
  }
  if (filters.monId && monBatBuoc && filters.monId !== monBatBuoc) throw new Error("KHONG_CO_QUYEN_MON");
  if (filters.lopId && lopDuocXem && !lopDuocXem.has(filters.lopId)) throw new Error("KHONG_CO_QUYEN_LOP");

  let query = supabase.from("bai_lam_thi")
    .select("bai_lam_id,hoc_sinh_tai_khoan_id,diem_tong,so_cau_dung,so_cau_sai,thoi_diem_nop,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ma_so,ho_ten,lop_id,lop(ten_lop,khoi)),ca_thi_mon!inner(mon_id,mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),vi_pham(id,loai_vi_pham,thoi_diem)")
    .eq("trang_thai", "DaNopBai")
    .not("diem_tong", "is", null)
    .order("thoi_diem_nop", { ascending: false });
  if (filters.caThiMonId) query = query.eq("ca_thi_mon_id", filters.caThiMonId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows: ReportRow[] = [];
  for (const raw of data || []) {
    const tk = Array.isArray(raw.tai_khoan) ? raw.tai_khoan[0] : raw.tai_khoan;
    const lop = Array.isArray(tk?.lop) ? tk.lop[0] : tk?.lop;
    const ctm = Array.isArray(raw.ca_thi_mon) ? raw.ca_thi_mon[0] : raw.ca_thi_mon;
    const mon = Array.isArray(ctm?.mon) ? ctm.mon[0] : ctm?.mon;
    const ca = Array.isArray(ctm?.ca_thi) ? ctm.ca_thi[0] : ctm?.ca_thi;
    const dot = Array.isArray(ca?.dot_thi) ? ca.dot_thi[0] : ca?.dot_thi;
    if (!tk || !ctm || !mon) continue;
    if (monBatBuoc && ctm.mon_id !== monBatBuoc) continue;
    if (lopDuocXem && (!tk.lop_id || !lopDuocXem.has(tk.lop_id))) continue;
    if (filters.monId && ctm.mon_id !== filters.monId) continue;
    if (filters.lopId && tk.lop_id !== filters.lopId) continue;
    const diem = Number(raw.diem_tong);
    const viPham = [...(raw.vi_pham || [])].sort((a, b) => Date.parse(b.thoi_diem) - Date.parse(a.thoi_diem));
    rows.push({
      baiLamId: raw.bai_lam_id, hocSinhId: raw.hoc_sinh_tai_khoan_id,
      maSo: tk.ma_so, hoTen: tk.ho_ten, lopId: tk.lop_id, lop: lop?.ten_lop || "Chưa xếp lớp", khoi: lop?.khoi || "Chưa xác định",
      monId: ctm.mon_id, mon: mon.ten_mon, dotThi: dot?.ten_dot_thi || "Đợt thi",
      diem, soCauDung: raw.so_cau_dung || 0, soCauSai: raw.so_cau_sai || 0,
      nhom: xepNhomNangLuc(diem), nopLuc: raw.thoi_diem_nop,
      soViPham: viPham.length,
      loaiViPham: [...new Set(viPham.map((item) => item.loai_vi_pham))],
      viPhamGanNhat: viPham[0]?.thoi_diem || null,
      tuDongThuBaiDoViPham: viPham.length >= 3,
    });
  }
  const diemTrungBinh = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.diem, 0) / rows.length * 100) / 100 : 0;
  const bins = [
    { nhan: "0-<5", test: (d: number) => d < 5 },
    { nhan: "5-<6.5", test: (d: number) => d >= 5 && d < 6.5 },
    { nhan: "6.5-<8", test: (d: number) => d >= 6.5 && d < 8 },
    { nhan: "8-10", test: (d: number) => d >= 8 },
  ];
  const nhomLabels = ["CanOnTapGap", "TrungBinh", "Kha", "DaNamVung"];
  return {
    rows, diemTrungBinh,
    phoDiem: bins.map((bin) => ({ nhan: bin.nhan, soLuong: rows.filter((row) => bin.test(row.diem)).length })),
    nhomNangLuc: nhomLabels.map((nhom) => ({ nhom, soLuong: rows.filter((row) => row.nhom === nhom).length })),
    tongViPham: rows.reduce((sum, row) => sum + row.soViPham, 0),
    soBaiCoViPham: rows.filter((row) => row.soViPham > 0).length,
    soBaiTuDongThu: rows.filter((row) => row.tuDongThuBaiDoViPham).length,
  };
}
