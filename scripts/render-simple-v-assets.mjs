import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const [, , modulesRoot, outputDirectory] = process.argv;

if (!modulesRoot || !outputDirectory) {
  throw new Error("Usage: node render-simple-v-assets.mjs <node_modules> <output-directory>");
}

const runtimeRequire = createRequire(path.join(modulesRoot, "package.json"));
const sharp = runtimeRequire("sharp");

// Dedicated compact mark. The previous detailed Vooglin artwork remains separate.
const simpleVArtwork = Buffer.from(`
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#000000"/>
    <path d="M96 104H156L256 344L356 104H416L286 408H226Z" fill="#ffffff"/>
  </svg>
`);

async function renderIcon(size) {
  return sharp(simpleVArtwork)
    .resize({ width: size, height: size, fit: "contain", background: "#000000" })
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

const sizes = [16, 32, 48, 96, 180, 192, 256, 512];
const entries = await Promise.all(sizes.map(async (size) => ({ size, buffer: await renderIcon(size) })));
const bySize = new Map(entries.map(({ size, buffer }) => [size, buffer]));
const favicon = createIco(entries.filter(({ size }) => [16, 32, 48, 96, 256].includes(size)));

await Promise.all([
  writeFile(path.join(outputDirectory, "vooglin-v-black.png"), bySize.get(512)),
  writeFile(path.join(outputDirectory, "vooglin-v-black-48x48.png"), bySize.get(48)),
  writeFile(path.join(outputDirectory, "vooglin-v-black-96x96.png"), bySize.get(96)),
  writeFile(path.join(outputDirectory, "vooglin-v-black-192x192.png"), bySize.get(192)),
  writeFile(path.join(outputDirectory, "vooglin-v-black-apple-touch-icon.png"), bySize.get(180)),
  writeFile(path.join(outputDirectory, "vooglin-v-black-organization-logo.png"), bySize.get(512)),
  writeFile(path.join(outputDirectory, "vooglin-v-black.ico"), favicon),
]);

console.log("Rendered the dedicated black-and-white Vooglin V asset suite.");
