import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\4400006e-d0c6-4d9a-824e-39c53b18ea3c";
const baseUrl = "https://thithuthptkontum.vercel.app";

async function run() {
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina 2x for sharp screenshots
  });
  const page = await context.newPage();

  console.log("Navigating to login page...");
  await page.goto(`${baseUrl}/dang-nhap`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "to_truong_01_dang_nhap.png") });

  console.log("Logging in as totruongvatly...");
  await page.fill("#ma_so", "totruongvatly");
  await page.fill("#mat_khau", "ToTruong@123");
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle" });
  console.log("Logged in successfully. Current URL:", page.url());

  const pagesToCapture = [
    { name: "to_truong_02_khung_chuyen_de.png", url: `${baseUrl}/khung-chuyen-de`, title: "Khung chuyên đề" },
    { name: "to_truong_03_duyet_cau_hoi.png", url: `${baseUrl}/duyet-cau-hoi`, title: "Duyệt câu hỏi" },
    { name: "to_truong_04_ngan_hang_cau_hoi.png", url: `${baseUrl}/ngan-hang-cau-hoi`, title: "Ngân hàng câu hỏi" },
    { name: "to_truong_05_de_thi.png", url: `${baseUrl}/de-thi`, title: "Đề thi" },
    { name: "to_truong_06_bao_cao_mon.png", url: `${baseUrl}/bao-cao-mon`, title: "Báo cáo môn" },
    { name: "to_truong_07_thong_tin_tai_khoan.png", url: `${baseUrl}/thong-tin-tai-khoan`, title: "Thông tin tài khoản" },
    { name: "to_truong_08_tra_cuu.png", url: `${baseUrl}/tra-cuu`, title: "Tra cứu" },
  ];

  for (const p of pagesToCapture) {
    console.log(`Navigating to ${p.title} (${p.url})...`);
    await page.goto(p.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // allow dynamic charts/elements to stabilize
    await page.screenshot({ path: path.join(artifactDir, p.name), fullPage: true });
    console.log(`Saved screenshot: ${p.name}`);
  }

  // Check if there is an exam to view in detail
  await page.goto(`${baseUrl}/de-thi`, { waitUntil: "networkidle" });
  const viewExamLink = await page.$('a[href^="/de-thi/"]');
  if (viewExamLink) {
    const href = await viewExamLink.getAttribute("href");
    console.log(`Found exam detail link: ${href}`);
    await page.goto(`${baseUrl}${href}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "to_truong_09_chi_tiet_de_thi.png"), fullPage: true });
    console.log("Saved screenshot: to_truong_09_chi_tiet_de_thi.png");
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
