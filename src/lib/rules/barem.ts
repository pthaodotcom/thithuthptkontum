/**
 * FR-M1-01: validate barem/cau truc de cua 1 Mon hoc.
 * - Tong diem toi da cua Mon phai = 10.
 * - Thang luy tien Phan II bat buoc tang dan (1y < 2y < 3y < 4y).
 * - Phan nao khong co thi tat ca cot lien quan phai deu null (khong duoc nua vay).
 *
 * Ham nay THUAN (khong goi DB) de unit test doc lap - dung lai o ca client
 * (validate truoc khi submit form UC-CAT-01) lan server (double-check truoc INSERT,
 * vi CHECK constraint trong 0001_init_schema.sql da chan o tang DB nhung van nen
 * bao loi ro rang o tang API truoc khi cham DB).
 */

export interface CauHinhBaremMon {
  phan1SoCau?: number | null;
  phan1DiemMoiCau?: number | null;
  phan2SoCau?: number | null;
  phan2Diem1Y?: number | null;
  phan2Diem2Y?: number | null;
  phan2Diem3Y?: number | null;
  phan2Diem4Y?: number | null;
  phan3SoCau?: number | null;
  phan3DiemMoiCau?: number | null;
}

export interface KetQuaValidateBarem {
  hopLe: boolean;
  loi: string[];
  tongDiem: number;
}

export function validateBaremMon(cauHinh: CauHinhBaremMon): KetQuaValidateBarem {
  const loi: string[] = [];

  const phan1Dong = (cauHinh.phan1SoCau == null) === (cauHinh.phan1DiemMoiCau == null);
  if (!phan1Dong) loi.push("Phần I: nhập cả số câu và điểm mỗi câu, hoặc để trống cả hai.");

  const phan3Dong = (cauHinh.phan3SoCau == null) === (cauHinh.phan3DiemMoiCau == null);
  if (!phan3Dong) loi.push("Phần III: nhập cả số câu và điểm mỗi câu, hoặc để trống cả hai.");

  const phan2CotDiem = [cauHinh.phan2Diem1Y, cauHinh.phan2Diem2Y, cauHinh.phan2Diem3Y, cauHinh.phan2Diem4Y];
  const phan2DongBo =
    (cauHinh.phan2SoCau == null && phan2CotDiem.every((c) => c == null)) ||
    (cauHinh.phan2SoCau != null && phan2CotDiem.every((c) => c != null));
  if (!phan2DongBo) loi.push("Phần II: nhập đủ số câu và bốn mức điểm, hoặc để trống tất cả.");

  if (
    cauHinh.phan2SoCau != null &&
    cauHinh.phan2Diem1Y != null &&
    cauHinh.phan2Diem2Y != null &&
    cauHinh.phan2Diem3Y != null &&
    cauHinh.phan2Diem4Y != null
  ) {
    const tangDan =
      cauHinh.phan2Diem1Y < cauHinh.phan2Diem2Y &&
      cauHinh.phan2Diem2Y < cauHinh.phan2Diem3Y &&
      cauHinh.phan2Diem3Y < cauHinh.phan2Diem4Y;
    if (!tangDan) loi.push("Phần II: điểm phải tăng dần theo số ý đúng (1 ý < 2 ý < 3 ý < 4 ý).");
  }

  const tongDiem =
    (cauHinh.phan1SoCau ?? 0) * (cauHinh.phan1DiemMoiCau ?? 0) +
    (cauHinh.phan2SoCau ?? 0) * (cauHinh.phan2Diem4Y ?? 0) +
    (cauHinh.phan3SoCau ?? 0) * (cauHinh.phan3DiemMoiCau ?? 0);

  // So sanh voi sai so nho de tranh loi lam tron floating point
  if (Math.abs(tongDiem - 10) > 0.001) {
    loi.push(`Tổng điểm tối đa phải bằng 10; hiện tại là ${tongDiem.toFixed(2)} điểm.`);
  }

  return { hopLe: loi.length === 0, loi, tongDiem };
}
