import { describe, expect, it } from "vitest";
import { lamSachNhanXet, nhanXetFallback } from "@/lib/ai/gemini";

describe("nhận xét học tập Gemini", () => {
  it("loại bỏ lời dẫn và Markdown, giữ đúng ba dòng có điểm", () => {
    const input = [
      "Dưới đây là nhận xét học tập:",
      "* **Điểm mạnh:** Đã nắm được kiến thức cơ bản.",
      "* **Nội dung nên ôn:** Cần ôn Chuyên đề A.",
    ].join("\n");

    expect(lamSachNhanXet(input, 7.25)).toBe(
      "Điểm bài thi: 7.25/10\nNhận xét chung: Đã nắm được kiến thức cơ bản.\nNội dung nên ôn: Cần ôn Chuyên đề A.",
    );
  });

  it("không bị lặp dòng điểm bài thi khi nội dung đã có sẵn điểm", () => {
    const input = [
      "Điểm bài thi: 1.75/10",
      "Nhận xét chung: Kết quả bài thi phản ánh mức độ nắm bắt còn hạn chế.",
      "Nội dung nên ôn: Cần rà soát lại toàn bộ kiến thức nền tảng.",
    ].join("\n");

    expect(lamSachNhanXet(input, 1.75)).toBe(
      "Điểm bài thi: 1.75/10\nNhận xét chung: Kết quả bài thi phản ánh mức độ nắm bắt còn hạn chế.\nNội dung nên ôn: Cần rà soát lại toàn bộ kiến thức nền tảng.",
    );
  });

  it("mẫu dự phòng cũng tuân thủ định dạng hai ý", () => {
    expect(nhanXetFallback("TrungBinh", ["Chuyên đề A"], 6)).toBe(
      "Điểm bài thi: 6.00/10\nNhận xét chung: Đã nắm được một phần kiến thức cơ bản của môn học.\nNội dung nên ôn: Cần củng cố các chuyên đề: Chuyên đề A.",
    );
  });
});
