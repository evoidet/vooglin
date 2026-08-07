import { createRequire } from "node:module";
import path from "node:path";

const [, , modulesRoot, portraitPath, outputDirectory] = process.argv;

if (!modulesRoot || !portraitPath || !outputDirectory) {
  throw new Error("Usage: node render-portrait-asset.mjs <node_modules> <portrait> <output-directory>");
}

const runtimeRequire = createRequire(path.join(modulesRoot, "package.json"));
const sharp = runtimeRequire("sharp");

await sharp(portraitPath)
  .rotate()
  .resize({ width: 1200, withoutEnlargement: true })
  .webp({ quality: 86, effort: 6, smartSubsample: true })
  .toFile(path.join(outputDirectory, "egor-portrait.webp"));

console.log("Rendered the optimized Vooglin founder portrait.");
