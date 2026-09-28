// Draws the app icon (gold dumbbell on Saints navy) and writes the PNG sizes iOS and the manifest need.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#12284C"/>
  <rect x="248" y="232" width="84" height="560" rx="14" fill="#E8B321"/>
  <rect x="692" y="232" width="84" height="560" rx="14" fill="#E8B321"/>
  <rect x="160" y="352" width="56" height="320" rx="12" fill="#E8B321"/>
  <rect x="808" y="352" width="56" height="320" rx="12" fill="#E8B321"/>
  <rect x="332" y="472" width="360" height="80" fill="#FFFFFF"/>
</svg>`;

mkdirSync("public", { recursive: true });
const sizes = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
for (const [name, size] of Object.entries(sizes)) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/${name}`);
}
console.log("icons written");
