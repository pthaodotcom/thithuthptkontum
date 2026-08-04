import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type Loai = "autosave" | "submit";

export function payloadHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function batDauIdempotency(
  supabase: SupabaseClient,
  input: {
    taiKhoanId: string;
    baiLamId: string;
    loai: Loai;
    key: string;
    hash: string;
  },
) {
  const row = {
    tai_khoan_id: input.taiKhoanId,
    bai_lam_id: input.baiLamId,
    loai: input.loai,
    idempotency_key: input.key,
    payload_hash: input.hash,
  };
  const { error } = await supabase.from("idempotency_request").insert(row);
  if (!error) return { replay: false as const };
  if (error.code !== "23505") throw error;

  const { data, error: readError } = await supabase
    .from("idempotency_request")
    .select("payload_hash,response_body,response_status")
    .match({
      tai_khoan_id: input.taiKhoanId,
      bai_lam_id: input.baiLamId,
      loai: input.loai,
      idempotency_key: input.key,
    })
    .single();
  if (readError) throw readError;
  if (data.payload_hash !== input.hash) return { conflict: true as const };
  return {
    replay: true as const,
    body: data.response_body,
    status: data.response_status ?? 200,
  };
}

export async function hoanTatIdempotency(
  supabase: SupabaseClient,
  input: {
    taiKhoanId: string;
    baiLamId: string;
    loai: Loai;
    key: string;
    body: unknown;
    status: number;
  },
) {
  await supabase
    .from("idempotency_request")
    .update({
      response_body: input.body,
      response_status: input.status,
      completed_at: new Date().toISOString(),
    })
    .match({
      tai_khoan_id: input.taiKhoanId,
      bai_lam_id: input.baiLamId,
      loai: input.loai,
      idempotency_key: input.key,
    });
}

