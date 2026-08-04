import { z } from "zod";

export const CAC_PHAN = ["I", "II", "III"] as const;
export type PhanCauHoi = (typeof CAC_PHAN)[number];

const kyTuPhan3 = /^[0-9,-]{4}$/;

export const cauHoiSchema = z
  .object({
    phan: z.enum(CAC_PHAN),
    baiHocId: z.string().uuid("Bài học không hợp lệ"),
    mucDoId: z.string().uuid("Mức độ không hợp lệ"),
    noiDung: z.string().trim().min(1, "Nội dung câu hỏi không được để trống"),
    chiTiet: z
      .array(
        z.object({
          noiDung: z.string().trim().min(1, "Nội dung đáp án/ý không được để trống"),
          laDapAnDung: z.boolean(),
        }),
      )
      .default([]),
    dapAnPhan3: z.string().trim().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.phan === "III") {
      if (!value.dapAnPhan3 || !kyTuPhan3.test(value.dapAnPhan3)) {
        context.addIssue({
          code: "custom",
          path: ["dapAnPhan3"],
          message: "Đáp án Phần III phải gồm đúng 4 ký tự: 0–9, dấu trừ hoặc dấu phẩy",
        });
      }
      if (value.chiTiet.length) {
        context.addIssue({ code: "custom", path: ["chiTiet"], message: "Phần III không có danh sách đáp án" });
      }
      return;
    }

    if (value.chiTiet.length !== 4) {
      context.addIssue({ code: "custom", path: ["chiTiet"], message: `${value.phan === "I" ? "Phần I" : "Phần II"} phải có đúng 4 ${value.phan === "I" ? "phương án" : "ý"}` });
      return;
    }

    if (value.phan === "I" && value.chiTiet.filter((item) => item.laDapAnDung).length !== 1) {
      context.addIssue({ code: "custom", path: ["chiTiet"], message: "Phần I phải có đúng 1 đáp án đúng" });
    }
  });

export type DuLieuCauHoi = z.infer<typeof cauHoiSchema>;

export function tachDapAnPhan2(giaTri: string) {
  const tokens = giaTri
    .split(/[,;|]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length !== 4) return null;
  const dung = new Set(["đ", "d", "đúng", "dung", "true", "1"]);
  const sai = new Set(["s", "sai", "false", "0"]);
  if (tokens.some((token) => !dung.has(token) && !sai.has(token))) return null;
  return tokens.map((token) => dung.has(token));
}

