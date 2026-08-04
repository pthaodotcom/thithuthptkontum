"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase dung trong Client Components (trinh duyet). Dung cho
 * Realtime subscriptions (FR-M5-02 giam sat ca thi) va cac man hinh doc du
 * lieu don gian duoc RLS bao ve. Session JWT duoc doc tu cookie (khong luu
 * trong localStorage - xem canh bao browser storage trong rule chung).
 *
 * TODO: truyen sessionJwt hien hanh vao header Authorization moi khi tao
 * client nay (goi tu 1 API route nho /api/auth/session-token de lay JWT hien
 * hanh, vi cookie httpOnly khong doc duoc tu JS phia client).
 */
export function taoSupabaseBrowserClient(sessionJwt: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${sessionJwt}` } },
  });
}
