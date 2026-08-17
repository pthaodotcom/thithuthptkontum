import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..", "..");
const sourcePath = path.join(projectDir, "so-do-use-case-theo-phan-he.md");
const outputDir = path.join(projectDir, "use-case-diagrams-rendered");
const source = await fs.readFile(sourcePath, "utf8");
const diagrams = [...source.matchAll(/```mermaid\s*([\s\S]*?)\s*```/g)].map((match) => match[1]);

if (diagrams.length !== 7) {
  throw new Error(`Expected 7 Mermaid diagrams, found ${diagrams.length}`);
}

await fs.mkdir(outputDir, { recursive: true });
for (const entry of await fs.readdir(outputDir, { withFileTypes: true })) {
  if (entry.isFile() && [".png", ".svg"].includes(path.extname(entry.name))) {
    await fs.unlink(path.join(outputDir, entry.name));
  }
}
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>");
  await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" });
  await page.evaluate(() => {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      flowchart: { curve: "basis", htmlLabels: true, useMaxWidth: false },
    });
  });

  const names = [
    "00-khung-chuc-nang-tong-quan",
    "01-m1-danh-muc-cau-hinh",
    "02-m2-nguoi-dung-phan-quyen",
    "03-m3-ngan-hang-cau-hoi-de-thi",
    "04-m4-quan-ly-thuc-hien-ky-thi",
    "05-m5-bao-cao-nhan-xet-thong-bao",
    "06-sys-chuc-nang-dung-chung",
  ];

  for (let index = 0; index < diagrams.length; index += 1) {
    const svg = await page.evaluate(
      async ({ code, id }) => {
        const result = await window.mermaid.render(id, code);
        return result.svg;
      },
      { code: diagrams[index], id: `use-case-diagram-${index}` },
    );
    await fs.writeFile(path.join(outputDir, `${names[index]}.svg`), svg, "utf8");
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:24px;background:#fff}</style></head><body>${svg}</body></html>`);
    await page.locator("svg").screenshot({ path: path.join(outputDir, `${names[index]}.png`) });
  }

  console.log(`Rendered ${diagrams.length} diagrams to ${outputDir}`);
} finally {
  await browser.close();
}
