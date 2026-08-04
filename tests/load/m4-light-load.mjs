import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.K6_HOC_SINH_MAT_KHAU;
const attemptIds = JSON.parse(process.env.K6_BAI_LAM_IDS_JSON || "[]");
const answers = JSON.parse(process.env.K6_TRA_LOI_JSON || "[]");
if (!password || attemptIds.length < 20 || !answers.length) {
  throw new Error("Missing 20-session M4 fixture variables");
}

const startedAt = new Date().toISOString();
const durations = [];
const failures = [];
const post = async (path, body, cookie, key) => {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: JSON.stringify(body),
  });
  const duration = performance.now() - started;
  const json = await response.json().catch(() => null);
  return { response, json, duration };
};

await Promise.all(attemptIds.slice(0, 20).map(async (attemptId, index) => {
  const code = `m4-load-${String(index + 1).padStart(2, "0")}`;
  const login = await post("/api/auth/dang-nhap", { ma_so: code, mat_khau: password });
  const setCookie = login.response.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  if (!login.response.ok || !cookie) {
    failures.push(`${code}: login ${login.response.status}`);
    return;
  }

  const saveKey = randomUUID();
  const saveBody = { baiLamId: attemptId, traLoi: answers };
  const save = await post("/api/bai-thi/autosave", saveBody, cookie, saveKey);
  durations.push({ type: "autosave", ms: save.duration });
  const saveReplay = await post("/api/bai-thi/autosave", saveBody, cookie, saveKey);
  if (!save.response.ok || !saveReplay.response.ok
    || !saveReplay.json?.idempotencyReplay) {
    failures.push(`${code}: autosave/idempotency`);
    return;
  }

  const submitKey = randomUUID();
  const submitBody = {
    baiLamId: attemptId,
    lyDo: "TuNop",
    canhBaoLuuCuoi: false,
  };
  const submit = await post("/api/bai-thi/nop-bai", submitBody, cookie, submitKey);
  durations.push({ type: "submit", ms: submit.duration });
  const replay = await post("/api/bai-thi/nop-bai", submitBody, cookie, submitKey);
  if (!submit.response.ok || !replay.response.ok
    || submit.json?.data?.daNopTruoc !== false
    || !replay.json?.idempotencyReplay) {
    failures.push(`${code}: submit/idempotency`);
  }
}));

const percentile95 = (type) => {
  const sorted = durations.filter((item) => item.type === type)
    .map((item) => item.ms).sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? Infinity;
};
const p95 = {
  autosave: percentile95("autosave"),
  submit: percentile95("submit"),
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [{ count: submitted, error: submittedError }, { count: audits, error: auditError }] =
    await Promise.all([
      db.from("bai_lam_thi").select("bai_lam_id", { count: "exact", head: true })
        .in("bai_lam_id", attemptIds.slice(0, 20)).eq("trang_thai", "DaNopBai"),
      db.from("audit_log").select("id", { count: "exact", head: true })
        .in("doi_tuong_id", attemptIds.slice(0, 20))
        .eq("hanh_dong", "NopBai").gte("thoi_diem", startedAt),
    ]);
  if (submittedError || submitted !== 20) failures.push(`postcheck: submitted=${submitted}`);
  if (auditError || audits !== 20) failures.push(`postcheck: audits=${audits}`);
}

const summary = {
  sessions: 20,
  failures,
  p95Ms: p95,
  thresholdMs: 1500,
  passed: failures.length === 0 && p95.autosave < 1500 && p95.submit < 1500,
};
console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) process.exitCode = 1;
