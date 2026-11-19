import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = "/opt/cursor/artifacts";

const shots = [
  { file: "shop-direction-a-album.html", name: "shop-direction-a-full", width: 1200, height: 2200, fullPage: true },
  { file: "shop-direction-a-album.html", name: "shop-direction-a-mobile", width: 390, height: 1400, fullPage: true },
  { file: "shop-direction-b-vitrine.html", name: "shop-direction-b-full", width: 1200, height: 2400, fullPage: true },
  { file: "shop-direction-b-vitrine.html", name: "shop-direction-b-mobile", width: 390, height: 1500, fullPage: true },
];

const browser = await chromium.launch();
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: 900 } });
  await page.goto(`file://${path.join(dir, shot.file)}`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(outDir, `${shot.name}.png`),
    fullPage: shot.fullPage,
  });
  await page.close();
}
await browser.close();
console.log("Captures enregistrées dans", outDir);