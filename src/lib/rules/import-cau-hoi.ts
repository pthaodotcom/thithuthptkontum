import { cauHoiSchema, tachDapAnPhan2, type DuLieuCauHoi, type PhanCauHoi } from "./cau-hoi";

export const MA_LOI_IMPORT = {
  THIEU_COT: "THIEU_COT",
  PHAN_KHONG_HOP_LE: "PHAN_KHONG_HOP_LE",
  METADATA_KHONG_HOP_LE: "METADATA_KHONG_HOP_LE",
  DU_LIEU_KHONG_HOP_LE: "DU_LIEU_KHONG_HOP_LE",
  FILE_KHONG_DOC_DUOC: "FILE_KHONG_DOC_DUOC",
} as const;

export type MetadataImport = {
  baiHoc: { id: string; chuyenDe: string; baiHoc: string }[];
  mucDo: { id: string; ten: string }[];
};
export type ImportParseResult = { data?: DuLieuCauHoi; code?: keyof typeof MA_LOI_IMPORT; message?: string };

export function chuanHoa(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim().toLowerCase();
}
function lay(row: Record<string, unknown>, ...keys: string[]) {
  const entry = Object.entries(row).find(([key]) => keys.some(k => chuanHoa(key) === chuanHoa(k)));
  return String(entry?.[1] ?? "").trim();
}
export function chuanHoaPhan(value: unknown): PhanCauHoi | null {
  const v = chuanHoa(value).replace("phan", "").trim();
  return v === "1" || v === "i" ? "I" : v === "2" || v === "ii" ? "II" : v === "3" || v === "iii" ? "III" : null;
}
export function parseDongImport(row: Record<string, unknown>, meta: MetadataImport): ImportParseResult {
  const required = ["Phan","ChuyenDe","BaiHoc","MucDo","NoiDung"];
  if (required.some(k => !lay(row, k))) return { code: "THIEU_COT", message: "Thiếu dữ liệu bắt buộc" };
  const phan = chuanHoaPhan(lay(row,"Phan"));
  if (!phan) return { code: "PHAN_KHONG_HOP_LE", message: "Phần chỉ nhận I, II hoặc III" };
  const bh = meta.baiHoc.find(x => chuanHoa(x.chuyenDe)===chuanHoa(lay(row,"ChuyenDe")) && chuanHoa(x.baiHoc)===chuanHoa(lay(row,"BaiHoc")));
  const md = meta.mucDo.find(x => chuanHoa(x.ten)===chuanHoa(lay(row,"MucDo")));
  if (!bh || !md) return { code: "METADATA_KHONG_HOP_LE", message: "Chuyên đề, Bài học hoặc Mức độ không khớp" };
  const correct = lay(row,"DapAnDung");
  const flags = phan === "I" ? [1,2,3,4].map(x=>x===Number(correct)) : phan === "II" ? tachDapAnPhan2(correct) ?? [] : [];
  const candidate = {
    phan, baiHocId: bh.id, mucDoId: md.id, noiDung: lay(row,"NoiDung"),
    chiTiet: phan === "III" ? [] : [1,2,3,4].map((i,index)=>({noiDung:lay(row,`DapAn${i}`),laDapAnDung:flags[index]??false})),
    dapAnPhan3: phan === "III" ? correct : null,
  };
  const parsed = cauHoiSchema.safeParse(candidate);
  return parsed.success ? { data: parsed.data } : { code: "DU_LIEU_KHONG_HOP_LE", message: parsed.error.issues[0]?.message };
}
