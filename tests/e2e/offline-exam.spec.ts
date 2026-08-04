import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const required = [
  "E2E_HOC_SINH_MA_SO",
  "E2E_HOC_SINH_MAT_KHAU",
  "E2E_OFFLINE_BAI_LAM_ID",
  "E2E_OFFLINE_CA_THI_MON_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const missing = required.filter((name) => !process.env[name]);

async function login(page: import("@playwright/test").Page) {
  await page.goto("/dang-nhap");
  await page.locator("#ma_so").fill(process.env.E2E_HOC_SINH_MA_SO!);
  await page.locator("#mat_khau").fill(process.env.E2E_HOC_SINH_MAT_KHAU!);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("dang-nhap")),
    page.getByRole("button", { name: /đăng nhập/i }).click(),
  ]);
  // The home page performs a second role-based navigation to /ho-so. Wait for
  // that client navigation so it cannot race the explicit exam navigation.
  await page.waitForURL((url) => url.pathname === "/ho-so", {
    timeout: 10_000,
  }).catch(() => undefined);
}

test.describe("M4 offline exam", () => {
  test.skip(missing.length > 0,
    `Thiếu biến môi trường offline E2E: ${missing.join(", ")}`);

  test("reloads from IndexedDB, syncs sequentially and grades only once", async ({
    context,
    page,
  }) => {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const attemptId = process.env.E2E_OFFLINE_BAI_LAM_ID!;
    const { count: auditBefore } = await db.from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("hanh_dong", "NopBai")
      .eq("doi_tuong_id", attemptId);

    await login(page);
    await page.goto(`/lam-bai/${process.env.E2E_OFFLINE_CA_THI_MON_ID}`);
    const firstAnswer = page.locator('input[type="radio"]').first();
    await expect(firstAnswer).toBeVisible();

    // Ensure the service worker has cached the current exam shell before the
    // browser loses connectivity.
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await new Promise<void>((resolve) => {
        const handler = (event: MessageEvent) => {
          if (event.data?.type !== "EXAM_CACHED") return;
          navigator.serviceWorker.removeEventListener("message", handler);
          resolve();
        };
        navigator.serviceWorker.addEventListener("message", handler);
        registration.active?.postMessage({
          type: "CACHE_EXAM",
          urls: [
            location.href,
            ...performance.getEntriesByType("resource").map((entry) => entry.name),
          ],
        });
      });
    });

    await context.setOffline(true);
    await firstAnswer.check();
    await expect(page.getByTestId("sync-status"))
      .toContainText(/Đã lưu offline|còn 1/, { timeout: 5_000 });

    // Keep application API traffic disconnected while allowing the browser to
    // fetch the document shell for a deterministic reload in every Playwright
    // browser. navigator.onLine remains false across that reload.
    await page.route("**/api/bai-thi/**", (route) => route.abort("internetdisconnected"));
    await page.evaluate(() => localStorage.setItem("m4-force-offline", "1"));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        get: () => localStorage.getItem("m4-force-offline") !== "1",
      });
    });
    await context.setOffline(false);
    await page.reload({ waitUntil: "domcontentloaded" });
    const restored = page.locator('input[type="radio"]').first();
    await expect(restored).toBeChecked({ timeout: 10_000 });

    // Submitting now opens an in-app confirmation dialog instead of the
    // native window.confirm() — open it, then confirm inside the dialog.
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")]
        .find((item) => item.textContent?.includes("Nộp bài"));
      button?.click();
    });
    await page.getByRole("button", { name: /xác nhận nộp bài/i }).click();
    await expect(page.getByTestId("sync-status"))
      .toContainText(/Đã lưu offline|còn/, { timeout: 5_000 });

    await page.unroute("**/api/bai-thi/**");
    await page.evaluate(() => localStorage.removeItem("m4-force-offline"));
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForURL(/\/ket-qua/, { timeout: 30_000 });

    const remaining = await page.evaluate(async (id) => {
      return new Promise<number>((resolve, reject) => {
        const request = indexedDB.open("thi-thu-offline", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const tx = database.transaction("exam-operations", "readonly");
          const all = tx.objectStore("exam-operations").getAll();
          all.onsuccess = () => resolve(
            all.result.filter((item: { baiLamId: string }) => item.baiLamId === id).length,
          );
          all.onerror = () => reject(all.error);
        };
      });
    }, attemptId);
    expect(remaining).toBe(0);

    const [{ data: attempt }, { count: auditAfter }] = await Promise.all([
      db.from("bai_lam_thi")
        .select("trang_thai,diem_tong,so_cau_dung,so_cau_sai")
        .eq("bai_lam_id", attemptId).single(),
      db.from("audit_log").select("id", { count: "exact", head: true })
        .eq("hanh_dong", "NopBai").eq("doi_tuong_id", attemptId),
    ]);
    expect(attempt).toMatchObject({
      trang_thai: "DaNopBai",
      diem_tong: 10,
      so_cau_dung: 1,
      so_cau_sai: 0,
    });
    expect((auditAfter ?? 0) - (auditBefore ?? 0)).toBe(1);
  });
});
