/**
 * Generates PWA icon sizes from app/icon.png into public/icons/
 * Run: npm run pwa:icons
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "app", "icon.png");
const outDir = path.join(root, "public", "icons");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const target = path.join(outDir, `icon-${size}.png`);
  await sharp(source)
    .resize(size, size, { fit: "contain", background: { r: 91, g: 79, b: 207, alpha: 1 } })
    .png()
    .toFile(target);
  console.log("Wrote", target);
}

const maskable = path.join(outDir, "icon-maskable-512.png");
await sharp(source)
  .resize(512, 512, { fit: "cover", position: "center" })
  .extend({
    top: 64,
    bottom: 64,
    left: 64,
    right: 64,
    background: { r: 91, g: 79, b: 207, alpha: 1 },
  })
  .png()
  .toFile(maskable);
console.log("Wrote", maskable);
