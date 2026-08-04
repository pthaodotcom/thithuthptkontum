import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
  type WebSocketRoute,
} from "@playwright/test";
import { randomUUID } from "node:crypto";

const required = [
  "E2E_ADMIN_MA_SO",
  "E2E_ADMIN_MAT_KHAU",
  "E2E_HOC_SINH_MA_SO",
  "E2E_HOC_SINH_MAT_KHAU",
  "E2E_VI_PHAM_BAI_LAM_ID",
  "E2E_POLLING_BAI_LAM_ID",
] as const;
const missing = required.filter((name) => !process.env[name]);

async function login(page: Page, maSo: string, matKhau: string) {
  await page.goto("/dang-nhap");
  await page.locator("#ma_so").fill(maSo);
  await page.locator("#mat_khau").fill(matKhau);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("dang-nhap")),
    page.getByRole("button", { name: /đăng nhập/i }).click(),
  ]);
}

async function createContexts(browser: Browser) {
  const admin = await browser.newContext();
  const student = await browser.newContext();
  return { admin, student };
}

async function closeContexts(contexts: { admin: BrowserContext; student: BrowserContext }) {
  await Promise.all([contexts.admin.close(), contexts.student.close()]);
}

test.describe("Supabase Realtime smoke", () => {
  test.skip(missing.length > 0,
    `Thiếu biến môi trường smoke test: ${missing.join(", ")}`);

  test("vi phạm xuất hiện ngay trên dashboard Admin", async ({ browser }) => {
    const contexts = await createContexts(browser);
    try {
      const adminPage = await contexts.admin.newPage();
      const studentPage = await contexts.student.newPage();
      await login(adminPage, process.env.E2E_ADMIN_MA_SO!, process.env.E2E_ADMIN_MAT_KHAU!);
      await login(studentPage, process.env.E2E_HOC_SINH_MA_SO!, process.env.E2E_HOC_SINH_MAT_KHAU!);
      await adminPage.goto("/giam-sat-ca-thi");
      await expect(adminPage.getByTestId("realtime-status")).toContainText("Realtime đã kết nối",
        { timeout: 20_000 });

      const baiLamId = process.env.E2E_VI_PHAM_BAI_LAM_ID!;
      const counter = adminPage.getByTestId(`vi-pham-${baiLamId}`);
      const before = Number((await counter.textContent())?.split("/")[0] ?? "0");
      const response = await studentPage.request.post("/api/bai-thi/vi-pham", {
        data: { baiLamId, loai: "Copy", eventId: randomUUID() },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      await expect(counter).toHaveText(`${before + 1}/3`, { timeout: 8_000 });
    } finally {
      await closeContexts(contexts);
    }
  });

  test("polling 30 giây cập nhật khi WebSocket bị chặn", async ({ browser }) => {
    const contexts = await createContexts(browser);
    try {
      const adminPage = await contexts.admin.newPage();
      const studentPage = await contexts.student.newPage();
      await login(adminPage, process.env.E2E_ADMIN_MA_SO!, process.env.E2E_ADMIN_MAT_KHAU!);
      await login(studentPage, process.env.E2E_HOC_SINH_MA_SO!, process.env.E2E_HOC_SINH_MAT_KHAU!);

      await adminPage.routeWebSocket(
        /supabase\.co.*websocket/i,
        (socket: WebSocketRoute) => socket.close(),
      );
      await adminPage.goto("/giam-sat-ca-thi");
      await expect(adminPage.getByTestId("realtime-status")).toContainText("polling 30 giây",
        { timeout: 20_000 });

      const baiLamId = process.env.E2E_POLLING_BAI_LAM_ID!;
      const counter = adminPage.getByTestId(`vi-pham-${baiLamId}`);
      const before = Number((await counter.textContent())?.split("/")[0] ?? "0");
      const response = await studentPage.request.post("/api/bai-thi/vi-pham", {
        data: { baiLamId, loai: "Copy", eventId: randomUUID() },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      await expect(counter).toHaveText(`${before}/3`, { timeout: 5_000 });
      await expect(counter).toHaveText(`${before + 1}/3`, { timeout: 35_000 });
    } finally {
      await closeContexts(contexts);
    }
  });

  test("giữ dữ liệu cũ và phục hồi sau khi HTTP polling bị ngắt", async ({ browser }) => {
    const admin = await browser.newContext();
    try {
      const page = await admin.newPage();
      await login(page, process.env.E2E_ADMIN_MA_SO!, process.env.E2E_ADMIN_MAT_KHAU!);
      await page.goto("/giam-sat-ca-thi");
      await expect(page.getByTestId("realtime-status")).toContainText("Cập nhật");

      await page.route("**/api/giam-sat", (route) => route.abort("internetdisconnected"));
      await expect(page.getByTestId("monitor-stale-banner")).toContainText(/dữ liệu có thể đã cũ/i,
        { timeout: 35_000 });

      await page.unroute("**/api/giam-sat");
      await expect(page.getByTestId("monitor-stale-banner")).toBeHidden({ timeout: 35_000 });
      await expect(page.getByTestId("realtime-status")).toContainText("Cập nhật");
    } finally {
      await admin.close();
    }
  });

  test("nộp bài cập nhật trạng thái ngay", async ({ browser }) => {
    test.skip(!process.env.E2E_SUBMIT_BAI_LAM_ID,
      "Cần E2E_SUBMIT_BAI_LAM_ID riêng vì bài sẽ kết thúc sau test");
    const contexts = await createContexts(browser);
    try {
      const adminPage = await contexts.admin.newPage();
      const studentPage = await contexts.student.newPage();
      await login(adminPage, process.env.E2E_ADMIN_MA_SO!, process.env.E2E_ADMIN_MAT_KHAU!);
      await login(studentPage, process.env.E2E_HOC_SINH_MA_SO!, process.env.E2E_HOC_SINH_MAT_KHAU!);
      await adminPage.goto("/giam-sat-ca-thi");
      await expect(adminPage.getByTestId("realtime-status")).toContainText("Realtime đã kết nối",
        { timeout: 20_000 });

      const baiLamId = process.env.E2E_SUBMIT_BAI_LAM_ID!;
      const row = adminPage.locator(`[data-bai-lam-id="${baiLamId}"]`);
      await expect(row).toContainText("DangThi");
      const response = await studentPage.request.post("/api/bai-thi/nop-bai", {
        headers: { "Idempotency-Key": randomUUID() },
        data: { baiLamId, lyDo: "TuNop", canhBaoLuuCuoi: false },
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      await expect(row).toContainText("DaNopBai", { timeout: 8_000 });
    } finally {
      await closeContexts(contexts);
    }
  });
});
