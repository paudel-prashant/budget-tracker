/**
 * Flood-fills the outer background (from corners) to transparent.
 * Run: node scripts/make-icon-transparent.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "app", "icon-source.png");
const input = existsSync(source) ? source : path.join(root, "app", "icon.png");

const targets = [
  path.join(root, "app", "icon.png"),
  path.join(root, "app", "apple-icon.png"),
  path.join(root, "public", "brand-icon.png"),
];

const TOLERANCE = 42;

function colorClose(r1, g1, b1, r2, g2, b2) {
  return (
    Math.abs(r1 - r2) <= TOLERANCE &&
    Math.abs(g1 - g2) <= TOLERANCE &&
    Math.abs(b1 - b2) <= TOLERANCE
  );
}

function floodFillTransparent(pixels, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const bgSamples = corners.map(([x, y]) => {
    const i = (y * width + x) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  });

  const bgR = Math.round(bgSamples.reduce((s, c) => s + c[0], 0) / 4);
  const bgG = Math.round(bgSamples.reduce((s, c) => s + c[1], 0) / 4);
  const bgB = Math.round(bgSamples.reduce((s, c) => s + c[2], 0) / 4);

  for (const [x, y] of corners) {
    const pos = y * width + x;
    if (!visited[pos]) queue.push([x, y]);
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const pos = y * width + x;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const i = pos * 4;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (!colorClose(r, g, b, bgR, bgG, bgB)) continue;

    pixels[i + 3] = 0;

    if (x > 0) queue.push([x - 1, y]);
    if (x < width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < height - 1) queue.push([x, y + 1]);
  }
}

async function process(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  floodFillTransparent(pixels, info.width, info.height);

  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Updated ${path.relative(root, outputPath)}`);
}

for (const target of targets) {
  await process(input, target);
}

console.log("Done — outer background removed (transparent).");
