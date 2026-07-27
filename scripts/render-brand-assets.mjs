import { createRequire } from "node:module";
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
    <g transform="translate(1030 64)">
      <path d="M12 14 L64 112 L116 14" fill="none" stroke="#f7f7f2" stroke-width="10" stroke-linecap="square"/>
      <rect x="5" y="7" width="14" height="14" fill="#f7f7f2"/>
      <rect x="109" y="7" width="14" height="14" fill="#f7f7f2"/>
      <rect x="53" y="101" width="22" height="22" fill="#ddff6a"/>
    </g>
    <text x="72" y="92" fill="#ddff6a" font-family="monospace" font-size="16" letter-spacing="3">WORKFLOW AUTOMATION / ESTONIA</text>
    <text x="62" y="334" fill="#f7f7f2" font-family="Arial, sans-serif" font-size="156" font-weight="600" letter-spacing="-10">VOOGLIN</text>
    <line x1="72" y1="395" x2="1128" y2="395" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>
    <text x="72" y="462" fill="#d0d0ca" font-family="Arial, sans-serif" font-size="34" font-weight="400">Automate the work that slows you down.</text>
    <text x="72" y="554" fill="#8d8d87" font-family="monospace" font-size="14" letter-spacing="1.6">PRACTICAL SYSTEMS · FEWER MANUAL STEPS</text>
  </svg>
`);

const favicon = Buffer.from(`
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="84" fill="#090909"/>
    <path d="M112 116 L256 394 L400 116" fill="none" stroke="#f7f7f2" stroke-width="34" stroke-linecap="square" stroke-linejoin="miter"/>
    <rect x="88" y="92" width="48" height="48" fill="#f7f7f2"/>
    <rect x="376" y="92" width="48" height="48" fill="#f7f7f2"/>
    <rect x="226" y="364" width="60" height="60" fill="#ddff6a"/>
  </svg>
`);

await Promise.all([
  sharp(backgroundPath)
    .resize(1200, 630, { fit: "cover" })
    .composite([{ input: socialOverlay }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, "og-brand.png")),
  sharp(favicon)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, "favicon.png")),
]);

console.log("Rendered og-brand.png and favicon.png.");
