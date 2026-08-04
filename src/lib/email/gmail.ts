import nodemailer, { type Transporter } from "nodemailer";

export type KetQuaGuiEmail =
  | { thanhCong: true; messageId: string }
  | { thanhCong: false; retry: boolean; maLoi: string; chiTiet: string };

export type DuLieuEmailKetQua = {
  email: string;
  hoTen: string;
  mon: string;
  dotThi: string;
  diem: number;
  nhom: string;
  nhanXet: string;
  lienKetBaoCao: string;
};

export type CauHinhGmail = {
  enabled: boolean;
  user: string | null;
  pass: string | null;
  fromName: string;
  replyTo?: string;
};

export function chuanHoaEmail(value?: string | null) {
  const email = value?.trim().toLowerCase() || null;
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function layCauHinhGmail(): CauHinhGmail {
  const enabled = process.env.EMAIL_ENABLED === "true";
  const user = chuanHoaEmail(process.env.GMAIL_SMTP_USER);
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") || null;
  const replyToRaw = process.env.GMAIL_REPLY_TO?.trim();
  const replyTo = replyToRaw ? (chuanHoaEmail(replyToRaw) ?? undefined) : undefined;

  if (enabled && (!user || !pass)) throw new Error("GMAIL_CHUA_CAU_HINH");
  if (enabled && replyToRaw && !replyTo) throw new Error("GMAIL_REPLY_TO_KHONG_HOP_LE");

  return {
    enabled,
    user,
    pass,
    fromName: process.env.GMAIL_FROM_NAME?.trim() || "Hệ thống Thi thử THPT",
    replyTo,
  };
}

export function taoNoiDungEmail(input: DuLieuEmailKetQua) {
  const tieuDe = `Kết quả thi thử môn ${input.mon} - ${input.hoTen}`;
  const text = [
    `Kính gửi Phụ huynh em ${input.hoTen},`,
    `Kết quả ${input.dotThi} - môn ${input.mon}: ${input.diem.toFixed(2)}/10.`,
    `Nhóm năng lực: ${input.nhom}.`,
    input.nhanXet,
    `Xem báo cáo chi tiết: ${input.lienKetBaoCao}`,
  ].join("\n\n");
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
  const html = `<main style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033">
    <h1 style="color:#0f766e;font-size:22px">Kết quả thi thử</h1>
    <p>Kính gửi Phụ huynh em <strong>${escape(input.hoTen)}</strong>,</p>
    <p>Kết quả <strong>${escape(input.dotThi)}</strong> - môn <strong>${escape(input.mon)}</strong>:
      <strong>${input.diem.toFixed(2)}/10</strong>.</p>
    <p>Nhóm năng lực: <strong>${escape(input.nhom)}</strong>.</p>
    <div style="background:#f0fdfa;border-left:4px solid #0f766e;padding:12px">${escape(input.nhanXet)}</div>
    <p><a href="${escape(input.lienKetBaoCao)}">Xem báo cáo chi tiết</a></p>
    <p style="font-size:12px;color:#64748b">Email tự động, không chứa đáp án hoặc thông tin đăng nhập.</p>
  </main>`;
  return { tieuDe, text, html };
}

export function phanLoaiLoiEmail(error: unknown): Exclude<KetQuaGuiEmail, { thanhCong: true }> {
  const value = error as { code?: string; responseCode?: number; message?: string };
  const code = value.code || "EMAIL_UNKNOWN";
  const retry = ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ESOCKET"].includes(code)
    || (value.responseCode != null && value.responseCode >= 400 && value.responseCode < 500 && value.responseCode !== 401);
  return {
    thanhCong: false,
    retry,
    maLoi: code,
    chiTiet: (value.message || "Không gửi được email").replace(/(pass(word)?|token|secret)=[^ ,;]+/gi, "$1=[REDACTED]").slice(0, 500),
  };
}

function taoRawGmailApi(input: { from: string; fromName: string; replyTo?: string; to: string; subject: string; text: string; html: string }) {
  const boundary = `thi-thu-${Date.now().toString(36)}`;
  const subject = `=?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`;
  const fromName = `=?UTF-8?B?${Buffer.from(input.fromName).toString("base64")}?=`;
  const lines = [
    `From: ${fromName} <${input.from}>`, `To: ${input.to}`, `Subject: ${subject}`,
    ...(input.replyTo ? [`Reply-To: ${input.replyTo}`] : []),
    "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`, "",
    `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
    Buffer.from(input.text).toString("base64"), "",
    `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
    Buffer.from(input.html).toString("base64"), "", `--${boundary}--`,
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

async function guiQuaGmailApi(email: string, noiDung: ReturnType<typeof taoNoiDungEmail>): Promise<KetQuaGuiEmail> {
  try {
    const { layAccessTokenGmail } = await import("@/lib/email/gmail-oauth");
    const token = await layAccessTokenGmail();
    const sender = chuanHoaEmail(process.env.GMAIL_SENDER_EMAIL);
    if (!sender) throw new Error("GMAIL_SENDER_EMAIL_CHUA_CAU_HINH");
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ raw: taoRawGmailApi({
        from: sender, fromName: process.env.GMAIL_FROM_NAME?.trim() || "Hệ thống Thi thử THPT",
        replyTo: chuanHoaEmail(process.env.GMAIL_REPLY_TO) ?? undefined,
        to: email, subject: noiDung.tieuDe, text: noiDung.text, html: noiDung.html,
      }) }),
    });
    const body = await response.json() as { id?: string; error?: { message?: string } };
    if (!response.ok || !body.id) {
      const error = new Error(body.error?.message || "GMAIL_API_GUI_THAT_BAI") as Error & { responseCode: number; code: string };
      error.responseCode = response.status;
      error.code = response.status === 401 || response.status === 403 ? "GMAIL_OAUTH" : "GMAIL_API";
      throw error;
    }
    return { thanhCong: true, messageId: body.id };
  } catch (error) {
    return phanLoaiLoiEmail(error);
  }
}

export async function guiEmailKetQua(
  input: DuLieuEmailKetQua,
  transporter?: Pick<Transporter, "sendMail">,
): Promise<KetQuaGuiEmail> {
  const email = chuanHoaEmail(input.email);
  if (!email) return { thanhCong: false, retry: false, maLoi: "EMAIL_KHONG_HOP_LE", chiTiet: "Email phụ huynh không hợp lệ" };
  const noiDung = taoNoiDungEmail({ ...input, email });
  if (process.env.EMAIL_ENABLED !== "true") {
    console.info("EMAIL_STUB", { baiNhan: email.replace(/^(.{2}).+(@.+)$/, "$1***$2"), tieuDe: noiDung.tieuDe });
    return { thanhCong: true, messageId: `stub-${Date.now()}` };
  }
  if (process.env.EMAIL_PROVIDER === "gmail-api") return guiQuaGmailApi(email, noiDung);
  let config: CauHinhGmail;
  try {
    config = layCauHinhGmail();
  } catch (error) {
    const maLoi = error instanceof Error ? error.message : "GMAIL_CHUA_CAU_HINH";
    return { thanhCong: false, retry: false, maLoi, chiTiet: "Cấu hình Gmail SMTP không hợp lệ" };
  }
  const mailer = transporter ?? nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.user!, pass: config.pass! },
    connectionTimeout: 20_000,
    socketTimeout: 30_000,
  });
  try {
    const result = await mailer.sendMail({
      from: { name: config.fromName, address: config.user! },
      replyTo: config.replyTo,
      to: email,
      subject: noiDung.tieuDe,
      text: noiDung.text,
      html: noiDung.html,
    });
    return { thanhCong: true, messageId: result.messageId };
  } catch (error) {
    return phanLoaiLoiEmail(error);
  }
}
