import { createHash } from "node:crypto";
import sanitizeHtml from "sanitize-html";
import type { DuLieuCauHoi } from "./cau-hoi";

export type DauVanCauHoi = {
  contentHash: string;
  noiDungChuanHoa: string;
  mauCauHoi: string;
  chuKySo: string;
};

function boHtmlVaGiuCauTrucToan(value: string) {
  const coChiSo = value
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, " ^($1) ")
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, " _($1) ")
    .replace(/<br\s*\/?>/gi, " ");
  return sanitizeHtml(coChiSo, { allowedTags: [], allowedAttributes: {} });
}

export function chuanHoaVanBanCauHoi(value: string) {
  return boHtmlVaGiuCauTrucToan(value)
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/^\s*câu\s*(?:hỏi\s*)?\d+\s*[:.)-]?\s*/iu, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/\s*([=+\-*/^<>])\s*/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function noiDungTongHop(input: DuLieuCauHoi) {
  const chiTiet = input.chiTiet
    .map((item) => `${chuanHoaVanBanCauHoi(item.noiDung)}|${item.laDapAnDung ? "dung" : "sai"}`)
    .sort((a, b) => a.localeCompare(b, "vi"));
  return [
    `phan:${input.phan}`,
    `noi-dung:${chuanHoaVanBanCauHoi(input.noiDung)}`,
    ...chiTiet.map((item) => `chi-tiet:${item}`),
    input.phan === "III" ? `dap-an:${chuanHoaVanBanCauHoi(input.dapAnPhan3 || "")}` : "",
  ].filter(Boolean).join(" || ");
}

export function taoDauVanCauHoi(input: DuLieuCauHoi): DauVanCauHoi {
  const noiDungChuanHoa = noiDungTongHop(input);
  const cacSo = noiDungChuanHoa.match(/\d+(?:[.,]\d+)?/g) ?? [];
  const mauCauHoi = noiDungChuanHoa.replace(/\d+(?:[.,]\d+)?/g, "<num>");
  return {
    noiDungChuanHoa,
    mauCauHoi,
    chuKySo: cacSo.join("|"),
    contentHash: createHash("sha256").update(noiDungChuanHoa, "utf8").digest("hex"),
  };
}
