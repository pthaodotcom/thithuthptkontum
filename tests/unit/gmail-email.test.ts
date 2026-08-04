import { describe, expect, it, vi } from "vitest";
import { chuanHoaEmail, guiEmailKetQua, layCauHinhGmail, phanLoaiLoiEmail, taoNoiDungEmail } from "@/lib/email/gmail";

const input = {
  email: " PHUHUYNH@example.com ", hoTen: "Nguyễn Văn A", mon: "Toán",
  dotThi: "Thi thử lần 1", diem: 7.5, nhom: "Khá",
  nhanXet: "Nắm kiến thức khá tốt.", lienKetBaoCao: "https://example.com/ket-qua",
};

describe("Gmail notification", () => {
  it("chuẩn hóa và kiểm tra email", () => {
    expect(chuanHoaEmail(input.email)).toBe("phuhuynh@example.com");
    expect(chuanHoaEmail("sai-dia-chi")).toBeNull();
  });
  it("render cả HTML và plain text, không lộ đáp án", () => {
    const result = taoNoiDungEmail(input);
    expect(result.html).toContain("7.50/10");
    expect(result.text).toContain("Nguyễn Văn A");
    expect(result.text.toLowerCase()).not.toContain("đáp án");
  });
  it("phân loại lỗi tạm thời và lỗi xác thực", () => {
    expect(phanLoaiLoiEmail({ code: "ETIMEDOUT", message: "timeout" }).retry).toBe(true);
    expect(phanLoaiLoiEmail({ code: "EAUTH", responseCode: 535, message: "auth" }).retry).toBe(false);
  });
  it("gửi qua transporter khi bật email", async () => {
    vi.stubEnv("EMAIL_ENABLED", "true");
    vi.stubEnv("GMAIL_SMTP_USER", "sender@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "app-password");
    const sendMail = vi.fn().mockResolvedValue({ messageId: "m-1" });
    await expect(guiEmailKetQua(input, { sendMail } as never)).resolves.toEqual({ thanhCong: true, messageId: "m-1" });
    expect(sendMail).toHaveBeenCalledOnce();
    vi.unstubAllEnvs();
  });
  it("không thử lại khi bật email nhưng thiếu App Password", async () => {
    vi.stubEnv("EMAIL_ENABLED", "true");
    vi.stubEnv("GMAIL_SMTP_USER", "sender@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    await expect(guiEmailKetQua(input)).resolves.toMatchObject({
      thanhCong: false, retry: false, maLoi: "GMAIL_CHUA_CAU_HINH",
    });
    vi.unstubAllEnvs();
  });
  it("chuẩn hóa App Password có khoảng trắng và kiểm tra Reply-To", () => {
    vi.stubEnv("EMAIL_ENABLED", "true");
    vi.stubEnv("GMAIL_SMTP_USER", "SENDER@gmail.com");
    vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
    vi.stubEnv("GMAIL_REPLY_TO", " SUPPORT@example.com ");
    expect(layCauHinhGmail()).toMatchObject({
      enabled: true, user: "sender@gmail.com", pass: "abcdefghijklmnop",
      replyTo: "support@example.com",
    });
    vi.unstubAllEnvs();
  });
});
