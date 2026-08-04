import http from "k6/http";
import exec from "k6/execution";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

export const options = {
  scenarios: {
    m4_light_load: {
      executor: "shared-iterations",
      vus: Number(__ENV.K6_VUS || 20),
      iterations: Number(__ENV.K6_ITERATIONS || 20),
      maxDuration: __ENV.K6_MAX_DURATION || "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    autosave_duration: ["p(95)<1500"],
    submit_duration: ["p(95)<1500"],
    idempotency_failure: ["rate==0"],
  },
};

const idempotencyFailure = new Rate("idempotency_failure");
const autosaveDuration = new Trend("autosave_duration", true);
const submitDuration = new Trend("submit_duration", true);
const baseUrl = __ENV.E2E_BASE_URL;
const password = __ENV.K6_HOC_SINH_MAT_KHAU;
const attemptIds = JSON.parse(__ENV.K6_BAI_LAM_IDS_JSON || "[]");
const answers = JSON.parse(__ENV.K6_TRA_LOI_JSON || "[]");

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    return (char === "x" ? random : (random & 3) | 8).toString(16);
  });
}

function post(path, body, key) {
  return http.post(`${baseUrl}${path}`, JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "Idempotency-Key": key } : {}),
    },
  });
}

export function setup() {
  if (!baseUrl || !password || attemptIds.length < 20 || !answers.length) {
    throw new Error("Missing E2E_BASE_URL or 20-session M4 fixture variables");
  }
}

export default function m4LightLoad() {
  const index = exec.scenario.iterationInTest;
  const code = `m4-load-${String(index + 1).padStart(2, "0")}`;
  const attemptId = attemptIds[index];
  const login = post("/api/auth/dang-nhap", { ma_so: code, mat_khau: password });
  check(login, { "login succeeds": (response) => response.status === 200 });

  const saveKey = uuid();
  const saveBody = { baiLamId: attemptId, traLoi: answers };
  const save = post("/api/bai-thi/autosave", saveBody, saveKey);
  autosaveDuration.add(save.timings.duration);
  check(save, { "autosave succeeds": (response) => response.status === 200 });
  const saveReplay = post("/api/bai-thi/autosave", saveBody, saveKey);
  const saveReplayOk = saveReplay.status === 200
    && Boolean(saveReplay.json("idempotencyReplay"));
  idempotencyFailure.add(!saveReplayOk);

  const submitKey = uuid();
  const submitBody = {
    baiLamId: attemptId,
    lyDo: "TuNop",
    canhBaoLuuCuoi: false,
  };
  const submit = post("/api/bai-thi/nop-bai", submitBody, submitKey);
  submitDuration.add(submit.timings.duration);
  check(submit, {
    "submit succeeds": (response) => response.status === 200,
    "first submit grades once": (response) => response.json("data.daNopTruoc") === false,
  });
  const submitReplay = post("/api/bai-thi/nop-bai", submitBody, submitKey);
  const submitReplayOk = submitReplay.status === 200
    && Boolean(submitReplay.json("idempotencyReplay"));
  idempotencyFailure.add(!submitReplayOk);
}
