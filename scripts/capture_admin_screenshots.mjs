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
    deviceScaleFactor: 2, // 2x Retina for crisp rendering
  });
  const page = await context.newPage();

  console.log("Navigating to login page...");
  await page.goto(`${baseUrl}/dang-nhap`, { waitUntil: "networkidle" });

  console.log("Logging in as admin01...");
  await page.fill("#ma_so", "admin01");
  await page.fill("#mat_khau", "Admin@123");
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle" });
  console.log("Logged in successfully as Admin. Current URL:", page.url());

  const pagesToCapture = [
    { name: "admin_01_mon_hoc.png", url: `${baseUrl}/mon-hoc`, title: "Quản lý Môn học" },
    { name: "admin_02_khung_gio.png", url: `${baseUrl}/khung-gio`, title: "Quản lý Khung giờ ca thi" },
    { name: "admin_03_lop_hoc.png", url: `${baseUrl}/lop-hoc`, title: "Quản lý Lớp học" },
    { name: "admin_04_tat_ca_tai_khoan.png", url: `${baseUrl}/tai-khoan`, title: "Tất cả tài khoản" },
    { name: "admin_05_quan_ly_hoc_sinh.png", url: `${baseUrl}/tai-khoan?loai=HocSinh`, title: "Quản lý Học sinh" },
    { name: "admin_06_quan_ly_giao_vien.png", url: `${baseUrl}/tai-khoan?loai=GiaoVien`, title: "Quản lý Giáo viên" },
    { name: "admin_07_to_truong_bo_mon.png", url: `${baseUrl}/to-truong-bo-mon`, title: "Bổ nhiệm Tổ trưởng bộ môn" },
    { name: "admin_08_dot_thi.png", url: `${baseUrl}/dot-thi`, title: "Quản lý Đợt thi" },
    { name: "admin_09_quan_ly_vi_pham.png", url: `${baseUrl}/quan-ly-vi-pham`, title: "Quản lý Vi phạm" },
    { name: "admin_10_audit_log.png", url: `${baseUrl}/audit-log`, title: "Lịch sử thay đổi (Audit Log)" },
    { name: "admin_11_bao_cao.png", url: `${baseUrl}/bao-cao`, title: "Báo cáo thống kê toàn trường" },
    { name: "admin_12_bao_cao_hoc_sinh.png", url: `${baseUrl}/bao-cao-hoc-sinh`, title: "Báo cáo tiến độ học sinh" },
    { name: "admin_13_thong_bao_email.png", url: `${baseUrl}/thong-bao-email`, title: "Email kết quả" },
    { name: "admin_14_mo_thi_ngay.png", url: `${baseUrl}/mo-thi-ngay`, title: "Thiết lập lịch demo" },
    { name: "admin_15_thong_tin_tai_khoan.png", url: `${baseUrl}/thong-tin-tai-khoan`, title: "Thông tin tài khoản Admin" },
  ];

  for (const p of pagesToCapture) {
    try {
      console.log(`Navigating to ${p.title} (${p.url})...`);
      await page.goto(p.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, p.name), fullPage: true });
      console.log(`Saved screenshot: ${p.name}`);
    } catch (e) {
      console.warn(`Failed to capture ${p.title}:`, e.message);
    }
  }

  await browser.close();
  console.log("All Admin screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error capturing Admin screenshots:", err);
  process.exit(1);
});
