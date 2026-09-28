// Draws the app icon (an original navy and gold shield with a dumbbell) and writes the PNG sizes iOS and the manifest need.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#12284C"/>
  <path d="M512 150 L800 240 V500 C800 690 680 810 512 880 C344 810 224 690 224 500 V240 Z"
        fill="#12284C" stroke="#E8B321" stroke-width="44" stroke-linejoin="round"/>
  <g fill="#E8B321">
    <rect x="352" y="390" width="54" height="240" rx="12"/>
    <rect x="618" y="390" width="54" height="240" rx="12"/>
    <rect x="300" y="450" width="40" height="120" rx="10"/>
    <rect x="684" y="450" width="40" height="120" rx="10"/>
  </g>
  <rect x="406" y="488" width="212" height="44" fill="#FFFFFF"/>
</svg>`;

mkdirSync("public", { recursive: true });
const sizes = { "apple-touch-icon.png": 180, "icon-192.png": 192, "icon-512.png": 512 };
for (const [name, size] of Object.entries(sizes)) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/${name}`);
}
console.log("icons written");
