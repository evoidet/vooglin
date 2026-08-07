import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const [, , modulesRoot, backgroundPath, outputDirectory] = process.argv;

if (!modulesRoot || !backgroundPath || !outputDirectory) {
  throw new Error("Usage: node render-brand-assets.mjs <node_modules> <background> <output-directory>");
}

const runtimeRequire = createRequire(path.join(modulesRoot, "package.json"));
const sharp = runtimeRequire("sharp");

const socialOverlay = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="rgba(0,0,0,0.08)"/>
    <text x="72" y="92" fill="#ddff6a" font-family="monospace" font-size="16" letter-spacing="3">WORKFLOW AUTOMATION / ESTONIA</text>
    <text x="62" y="334" fill="#f7f7f2" font-family="Arial, sans-serif" font-size="156" font-weight="600" letter-spacing="-10">VOOGLIN</text>
    <line x1="72" y1="395" x2="1128" y2="395" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>
    <text x="72" y="462" fill="#d0d0ca" font-family="Arial, sans-serif" font-size="34" font-weight="400">Automate the work that slows you down.</text>
    <text x="72" y="554" fill="#8d8d87" font-family="monospace" font-size="14" letter-spacing="1.6">PRACTICAL SYSTEMS · FEWER MANUAL STEPS</text>
  </svg>
`);

// This is the single source artwork for every raster version of the Vooglin mark.
// The website only ships the rendered PNG assets; it never reconstructs the mark in CSS.
const markArtwork = Buffer.from(`
  <svg width="1280" height="992" viewBox="-3 -0.5 40 31" xmlns="http://www.w3.org/2000/svg">
    <path d="M-1.666 6.758 L9 26 M35.666 6.758 L25 26" fill="none" stroke="#f7f7f2" stroke-width="2" stroke-linecap="butt"/>
    <rect x="1" y="0.5" width="6" height="6" fill="none" stroke="#f7f7f2" stroke-width="1"/>
    <rect x="27" y="0.5" width="6" height="6" fill="none" stroke="#f7f7f2" stroke-width="1"/>
    <rect x="13.5" y="23" width="7" height="7" fill="#ddff6a"/>
  </svg>
`);

function roundedBackground(size) {
  const radius = Math.round(size * 0.18);
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#090909"/>
    </svg>
  `);
}

async function renderSquareIcon(size, markBuffer) {
  const markWidth = Math.round(size * 0.72);
  const markHeight = Math.round(markWidth * (31 / 40));
  const left = Math.round((size - markWidth) / 2);
  const top = Math.round((size - markHeight) / 2);
  const resizedMark = await sharp(markBuffer)
    .resize({ width: markWidth })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return sharp(roundedBackground(size))
    .composite([{ input: resizedMark, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function createIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(frames.length * 16);
  let offset = header.length + directory.length;

  frames.forEach(({ size, buffer }, index) => {
    const entryOffset = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, entryOffset);
    directory.writeUInt8(size >= 256 ? 0 : size, entryOffset + 1);
    directory.writeUInt8(0, entryOffset + 2);
    directory.writeUInt8(0, entryOffset + 3);
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(buffer.length, entryOffset + 8);
    directory.writeUInt32LE(offset, entryOffset + 12);
    offset += buffer.length;
  });

  return Buffer.concat([header, directory, ...frames.map(({ buffer }) => buffer)]);
}

const mark = await sharp(markArtwork)
  .png({ compressionLevel: 9 })
  .toBuffer();
const socialMark = await sharp(mark)
  .resize({ width: 120 })
  .png({ compressionLevel: 9 })
  .toBuffer();

const iconSizes = [16, 32, 48, 96, 180, 192, 256, 512];
const iconEntries = await Promise.all(iconSizes.map(async (size) => ({
  size,
  buffer: await renderSquareIcon(size, mark),
})));
const iconBySize = new Map(iconEntries.map(({ size, buffer }) => [size, buffer]));
const faviconIco = createIco(iconEntries.filter(({ size }) => [16, 32, 48, 96, 256].includes(size)));

await Promise.all([
  sharp(backgroundPath)
    .resize(1200, 630, { fit: "cover" })
    .composite([
      { input: socialOverlay },
      { input: socialMark, left: 1018, top: 68 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, "og-brand.png")),
  sharp(mark).toFile(path.join(outputDirectory, "vooglin-mark.png")),
  sharp(iconBySize.get(48)).toFile(path.join(outputDirectory, "favicon-48x48.png")),
  sharp(iconBySize.get(96)).toFile(path.join(outputDirectory, "favicon-96x96.png")),
  sharp(iconBySize.get(192)).toFile(path.join(outputDirectory, "favicon-192x192.png")),
  sharp(iconBySize.get(512)).toFile(path.join(outputDirectory, "favicon-512x512.png")),
  sharp(iconBySize.get(180)).toFile(path.join(outputDirectory, "apple-touch-icon.png")),
  sharp(iconBySize.get(512)).toFile(path.join(outputDirectory, "vooglin-organization-logo.png")),
  sharp(iconBySize.get(512)).toFile(path.join(outputDirectory, "favicon.png")),
  writeFile(path.join(outputDirectory, "favicon.ico"), faviconIco),
]);

console.log("Rendered the canonical Vooglin mark, favicon set and organisation logo.");
