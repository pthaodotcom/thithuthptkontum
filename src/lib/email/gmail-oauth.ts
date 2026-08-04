import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const SCOPE = "https://www.googleapis.com/auth/gmail.send";

function cauHinhOAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) throw new Error("GOOGLE_OAUTH_CHUA_CAU_HINH");
  return { clientId, clientSecret, redirectUri };
}

function khoaMaHoa() {
  const secret = process.env.SESSION_COOKIE_SECRET;
  if (!secret) throw new Error("SESSION_COOKIE_SECRET_CHUA_CAU_HINH");
  return createHash("sha256").update(secret).digest();
}

function maHoa(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", khoaMaHoa(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function giaiMa(value: string) {
  const [ivText, tagText, dataText] = value.split(".");
  if (!ivText || !tagText || !dataText) throw new Error("GOOGLE_REFRESH_TOKEN_KHONG_HOP_LE");
  const decipher = createDecipheriv("aes-256-gcm", khoaMaHoa(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataText, "base64url")), decipher.final()]).toString("utf8");
}

export function taoUrlKetNoiGmail(state: string) {
  const { clientId, redirectUri } = cauHinhOAuth();
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: SCOPE,
    access_type: "offline", prompt: "consent", include_granted_scopes: "true", state,
    login_hint: process.env.GMAIL_SENDER_EMAIL || "",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function doiCodeLayToken(code: string) {
  const { clientId, clientSecret, redirectUri } = cauHinhOAuth();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const body = await response.json() as { refresh_token?: string; error?: string };
  if (!response.ok || !body.refresh_token) throw new Error(body.error || "KHONG_NHAN_DUOC_REFRESH_TOKEN");
  return body.refresh_token;
}

export async function luuKetNoiGmail(refreshToken: string) {
  const email = process.env.GMAIL_SENDER_EMAIL;
  if (!email) throw new Error("GMAIL_SENDER_EMAIL_CHUA_CAU_HINH");
  const db = taoSupabaseServiceRole();
  const { error } = await db.from("tich_hop_email").upsert({
    nha_cung_cap: "gmail-api", email_gui: email, refresh_token_ma_hoa: maHoa(refreshToken),
    cap_nhat_luc: new Date().toISOString(),
  }, { onConflict: "nha_cung_cap" });
  if (error) throw new Error(error.message);
}

export async function layTrangThaiGmail() {
  const db = taoSupabaseServiceRole();
  const { data } = await db.from("tich_hop_email").select("email_gui,da_ket_noi_luc").eq("nha_cung_cap", "gmail-api").maybeSingle();
  return data as { email_gui: string; da_ket_noi_luc: string } | null;
}

export async function layAccessTokenGmail() {
  const db = taoSupabaseServiceRole();
  const { data, error } = await db.from("tich_hop_email").select("refresh_token_ma_hoa").eq("nha_cung_cap", "gmail-api").maybeSingle();
  if (error || !data) throw new Error("GMAIL_CHUA_KET_NOI");
  const { clientId, clientSecret } = cauHinhOAuth();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: giaiMa(data.refresh_token_ma_hoa), grant_type: "refresh_token" }),
  });
  const body = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error || "GOOGLE_REFRESH_TOKEN_HET_HAN");
  return body.access_token;
}

