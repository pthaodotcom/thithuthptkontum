import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase dung SERVICE ROLE KEY - chi dung trong API routes / server
 * actions / cron, KHONG BAO GIO import vao code chay o client (bo qua RLS
 * hoan toan). Moi kiem tra phan quyen khi dung client nay phai lam THU CONG
 * trong application code truoc khi query/ghi.
 */
export function taoSupabaseServiceRole(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Client Supabase dung JWT tu-ky cua nguoi dung hien hanh (xem lib/auth/jwt.ts)
 * - RLS o 0002_rls_policies.sql se ap dung theo dung claim trong JWT nay.
 * Dung khi muon Postgres tu chan theo RLS thay vi tu kiem tra tay (uu tien
 * dung cach nay cho cac truy van doc don gian).
 */
export function taoSupabaseTheoSessionJwt(sessionJwt: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Thieu NEXT_PUBLIC_SUPABASE_URL hoac NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${sessionJwt}` } },
  });
}
