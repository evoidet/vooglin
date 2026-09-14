import { createRequire } from "node:module";
import path from "node:path";
const [, , modulesRoot, outputDirectory] = process.argv;
if (!modulesRoot || !outputDirectory) throw new Error("Usage: node render-brand-assets.mjs <node_modules> <output-directory>");
const sharp = createRequire(path.join(modulesRoot, "package.json"))("sharp");
const artwork = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#10130f"/>
  <text x="72" y="116" fill="#ddff6a" font-family="Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="-2">Vooglin</text>
  <text x="68" y="292" fill="#f8faf4" font-family="Arial, sans-serif" font-size="82" font-weight="600" letter-spacing="-3">Less busywork.</text>
  <text x="68" y="394" fill="#f8faf4" font-family="Arial, sans-serif" font-size="82" font-weight="600" letter-spacing="-3">More time for your team.</text>
  <line x1="72" y1="472" x2="1128" y2="472" stroke="#455337"/>
  <text x="72" y="548" fill="#c7cebf" font-family="Arial, sans-serif" font-size="28">Simple automation for small businesses and organisations.</text>
</svg>`);
await sharp(artwork).png({ compressionLevel: 9 }).toFile(path.join(outputDirectory, "og-brand.png"));
console.log("Rendered the Vooglin text social preview.");
