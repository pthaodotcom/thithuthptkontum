import { describe, expect, it } from "vitest";

function khoaDemo(demoLuotThiId: string, loai: "analysis" | "ai" | "email", baiLamId: string) {
  return `demo:${demoLuotThiId}:${loai}:${baiLamId}`;
}

describe("khóa idempotency của lượt demo", () => {
  it("có định dạng ổn định cho analysis, AI và email", () => {
    expect(khoaDemo("run-a", "analysis", "bai-1")).toBe("demo:run-a:analysis:bai-1");
    expect(khoaDemo("run-a", "ai", "bai-1")).toBe("demo:run-a:ai:bai-1");
    expect(khoaDemo("run-a", "email", "bai-1")).toBe("demo:run-a:email:bai-1");
  });

  it("không trùng giữa hai lượt demo", () => {
    expect(khoaDemo("run-a", "ai", "bai-1")).not.toBe(khoaDemo("run-b", "ai", "bai-1"));
  });
});
