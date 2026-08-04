// TODO[Open Item]: "Phân loại lỗi" không có trong FR-M3-02 đã chốt — thêm theo yêu cầu
// người dùng để Tổ trưởng phân loại nhanh yêu cầu khi duyệt. Danh sách giá trị là giả
// định, cần xác nhận lại nếu nghiệp vụ muốn danh mục khác hoặc quản lý qua bảng riêng.
export const PHAN_LOAI_LOI = ["SaiDe", "SaiDapAn", "LoiChinhTa", "CapNhatKienThuc"] as const;
export type PhanLoaiLoi = (typeof PHAN_LOAI_LOI)[number];

export const NHAN_PHAN_LOAI_LOI: Record<PhanLoaiLoi, string> = {
  SaiDe: "Sai đề",
  SaiDapAn: "Sai đáp án",
  LoiChinhTa: "Lỗi chính tả/Format",
  CapNhatKienThuc: "Cập nhật kiến thức",
};
