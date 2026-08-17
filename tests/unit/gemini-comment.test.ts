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
      "Điểm bài thi: 7.25/10\nĐiểm mạnh: Đã nắm được kiến thức cơ bản.\nNội dung nên ôn: Cần ôn Chuyên đề A.",
    );
  });

  it("mẫu dự phòng cũng tuân thủ định dạng hai ý", () => {
    expect(nhanXetFallback("TrungBinh", ["Chuyên đề A"], 6)).toBe(
      "Điểm bài thi: 6.00/10\nĐiểm mạnh: Đã nắm được một phần kiến thức cơ bản của môn học.\nNội dung nên ôn: Cần củng cố các chuyên đề: Chuyên đề A.",
    );
  });
});
