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

export function layTenNguoiGui(): string {
  const raw = process.env.GMAIL_FROM_NAME?.trim();
  if (!raw || raw.includes("?")) {
    return "Hệ thống Thi thử THPT";
  }
  return raw;
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
    fromName: layTenNguoiGui(),
    replyTo,
  };
}

export function tachCacDongNhanXet(nhanXet?: string | null): string[] {
  if (!nhanXet || !nhanXet.trim()) return [];
  const voiXuongDong = nhanXet.trim()
    .replace(/(?:^|\s*)(Điểm bài thi:[^\n]*)/gi, "\n$1\n")
    .replace(/(?:^|\s*)(Nhận xét chung|Nhận xét|Đánh giá chung):/gi, "\n$1:")
    .replace(/(?:^|\s*)(Nội dung nên ôn|Nội dung cần ôn|Cần ôn thêm|Cần củng cố|Định hướng ôn tập):/gi, "\n$1:")
    .trim();

  return voiXuongDong
    .split(/\r?\n/)
    .map((dong) => dong.trim())
    .filter(Boolean);
}

export function taoNoiDungEmail(input: DuLieuEmailKetQua) {
  const tieuDe = `[Thi thử THPT] Kết quả môn ${input.mon} của ${input.hoTen}`;
  const dongNhanXet = tachCacDongNhanXet(input.nhanXet);
  const text = [
    `Kính gửi Phụ huynh em ${input.hoTen},`,
    `Nhà trường gửi kết quả ${input.dotThi} của em ${input.hoTen}.`,
    `Môn ${input.mon}: ${input.diem.toFixed(2)}/10 (${input.nhom}).`,
    `Nhận xét:\n${dongNhanXet.length > 0 ? dongNhanXet.join("\n") : input.nhanXet}`,
    `Xem báo cáo chi tiết: ${input.lienKetBaoCao}`,
    "Đây là email tự động từ Hệ thống Thi thử THPT của nhà trường. Email không chứa đáp án hoặc thông tin đăng nhập.",
  ].join("\n\n");
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);

  const nhanXetHtml = dongNhanXet.length > 0
    ? dongNhanXet.map((dong) => {
        const escaped = escape(dong);
        const dongCoDam = escaped.replace(
          /^(Điểm bài thi:[^\s]+|Nhận xét chung:|Nhận xét:|Đánh giá chung:|Nội dung nên ôn:|Nội dung cần ôn:|Cần ôn thêm:|Cần củng cố:|Định hướng ôn tập:)/i,
          "<strong>$1</strong>",
        );
        return `<p style="margin:0 0 8px;line-height:1.6;color:#334155">${dongCoDam}</p>`;
      }).join("")
    : `<p style="margin:0;font-size:15px;line-height:1.6;color:#334155">${escape(input.nhanXet)}</p>`;

  const html = `<!doctype html>
<html lang="vi"><body style="margin:0;padding:0;background:#f1f5f9;color:#172033;font-family:Arial,'Helvetica Neue',sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:28px 12px;background:#f1f5f9"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,.10)">
      <tr><td style="padding:28px 32px;background:#0f4c5c;color:#ffffff">
        <p style="margin:0 0 7px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#f8d77b">Hệ thống Thi thử THPT</p>
        <h1 style="margin:0;font-size:25px;line-height:1.3">Kết quả học tập của học sinh</h1>
      </td></tr>
      <tr><td style="padding:30px 32px 12px">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6">Kính gửi Phụ huynh em <strong>${escape(input.hoTen)}</strong>,</p>
        <p style="margin:0;font-size:15px;line-height:1.65;color:#475569">Nhà trường gửi kết quả <strong>${escape(input.dotThi)}</strong> của em để gia đình cùng theo dõi và hỗ trợ việc ôn tập.</p>
      </td></tr>
      <tr><td style="padding:16px 32px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc"><tr>
          <td style="padding:18px 20px;border-right:1px solid #cbd5e1"><p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px">Môn thi</p><p style="margin:0;font-size:18px;font-weight:700;color:#0f172a">${escape(input.mon)}</p></td>
          <td align="center" style="padding:18px 20px"><p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px">Điểm số</p><p style="margin:0;font-size:26px;font-weight:700;color:#0f766e">${input.diem.toFixed(2)}<span style="font-size:15px">/10</span></p></td>
          <td style="padding:18px 20px;border-left:1px solid #cbd5e1"><p style="margin:0 0 5px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px">Nhóm năng lực</p><p style="margin:0;font-size:18px;font-weight:700;color:#0f172a">${escape(input.nhom)}</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:8px 32px 16px"><div style="padding:16px 18px;border-left:4px solid #0f766e;background:#f0fdfa;border-radius:0 8px 8px 0"><p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:.5px">Nhận xét</p>${nhanXetHtml}</div></td></tr>
      <tr><td align="center" style="padding:8px 32px 32px"><a href="${escape(input.lienKetBaoCao)}" style="display:inline-block;padding:13px 22px;border-radius:8px;background:#0f766e;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Xem báo cáo chi tiết</a></td></tr>
      <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0"><p style="margin:0;font-size:12px;line-height:1.55;color:#64748b">Đây là email tự động từ Hệ thống Thi thử THPT của nhà trường. Email không chứa đáp án hoặc thông tin đăng nhập.</p></td></tr>
    </table>
  </td></tr></table>
</body></html>`;
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

async function taoRawGmailApi(input: {
  from: string;
  fromName: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<string> {
  const streamTransporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });

  const info = await streamTransporter.sendMail({
    from: { name: input.fromName, address: input.from },
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return (info.message as Buffer).toString("base64url");
}

async function guiQuaGmailApi(email: string, noiDung: ReturnType<typeof taoNoiDungEmail>): Promise<KetQuaGuiEmail> {
  try {
    const { layAccessTokenGmail } = await import("@/lib/email/gmail-oauth");
    const token = await layAccessTokenGmail();
    const sender = chuanHoaEmail(process.env.GMAIL_SENDER_EMAIL);
    if (!sender) throw new Error("GMAIL_SENDER_EMAIL_CHUA_CAU_HINH");
    const raw = await taoRawGmailApi({
      from: sender,
      fromName: layTenNguoiGui(),
      replyTo: chuanHoaEmail(process.env.GMAIL_REPLY_TO) ?? undefined,
      to: email,
      subject: noiDung.tieuDe,
      text: noiDung.text,
      html: noiDung.html,
    });
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ raw }),
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
