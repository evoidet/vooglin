import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const sourcePages = [
  "index.html",
  "pricing/index.html",
  "privacy/index.html",
];

const builtPages = [
  "public/index.html",
  "public/pricing/index.html",
  "public/privacy/index.html",
  "public/et/index.html",
  "public/et/pricing/index.html",
  "public/et/privacy/index.html",
  "public/ru/index.html",
  "public/ru/pricing/index.html",
  "public/ru/privacy/index.html",
];

const faviconMarkup = [
  '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 96x96 256x256">',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
  '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">',
  '<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
];

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual(buffer.subarray(0, 8), signature);
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function icoDimensions(buffer) {
  assert.equal(buffer.readUInt16LE(0), 0);
  assert.equal(buffer.readUInt16LE(2), 1);
  const count = buffer.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    const width = buffer.readUInt8(offset) || 256;
    const height = buffer.readUInt8(offset + 1) || 256;
    assert.equal(width, height);
    return width;
  });
}

test("every source and production page exposes the canonical favicon stack", async () => {
  for (const relativePath of [...sourcePages, ...builtPages]) {
    const html = await readFile(path.join(projectRoot, relativePath), "utf8");

    for (const markup of faviconMarkup) {
      assert.equal(
        countOccurrences(html, markup),
        1,
        `${relativePath} must include ${markup} exactly once`,
      );
    }

    assert.doesNotMatch(html, /sizes="any"/i);
    assert.doesNotMatch(html, /(?:localhost|noortetugi\.ee)[^>]*favicon|favicon[^>]*(?:localhost|noortetugi\.ee)/i);
  }
});

test("favicon, Apple, and manifest files expose their declared square sizes", async () => {
  const pngAssets = new Map([
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["favicon-48x48.png", 48],
    ["favicon-96x96.png", 96],
    ["favicon-192x192.png", 192],
    ["favicon-512x512.png", 512],
    ["apple-touch-icon.png", 180],
    ["vooglin-organization-logo.png", 512],
  ]);

  for (const [filename, size] of pngAssets) {
    const source = await readFile(path.join(projectRoot, filename));
    const built = await readFile(path.join(projectRoot, "public", filename));
    assert.deepEqual(pngDimensions(source), [size, size]);
    assert.deepEqual(built, source, `public/${filename} must match its source asset`);
  }

  const ico = await readFile(path.join(projectRoot, "favicon.ico"));
  assert.deepEqual(icoDimensions(ico), [16, 32, 48, 96, 256]);
  assert.deepEqual(await readFile(path.join(projectRoot, "public/favicon.ico")), ico);
});

test("manifest and crawl metadata reference only the canonical V assets", async () => {
  const manifest = JSON.parse(await readFile(path.join(projectRoot, "site.webmanifest"), "utf8"));
  assert.equal(manifest.name, "Vooglin");
  assert.equal(manifest.short_name, "Vooglin");
  assert.deepEqual(manifest.icons, [
    {
      src: "/favicon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/favicon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
  ]);

  const robots = await readFile(path.join(projectRoot, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*\r?\nAllow: \/$/m);
  assert.match(robots, /Sitemap: https:\/\/vooglin\.ee\/sitemap\.xml/);
  assert.doesNotMatch(robots, /Disallow:\s*\//i);
});

test("generated Sites routes serve every public favicon resource with the expected MIME type", async () => {
  const workerUrl = pathToFileURL(path.join(projectRoot, "dist/server/index.js"));
  workerUrl.searchParams.set("favicon-test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const resources = new Map([
    ["/favicon.ico", "image/x-icon"],
    ["/favicon-16x16.png", "image/png"],
    ["/favicon-32x32.png", "image/png"],
    ["/favicon-48x48.png", "image/png"],
    ["/favicon-96x96.png", "image/png"],
    ["/favicon-192x192.png", "image/png"],
    ["/favicon-512x512.png", "image/png"],
    ["/apple-touch-icon.png", "image/png"],
    ["/vooglin-organization-logo.png", "image/png"],
    ["/site.webmanifest", "application/manifest+json; charset=utf-8"],
    ["/robots.txt", "text/plain; charset=utf-8"],
  ]);

  for (const [pathname, contentType] of resources) {
    const response = await worker.fetch(new Request(`https://vooglin.ee${pathname}`), {});
    assert.equal(response.status, 200, `${pathname} must be publicly available`);
    assert.equal(response.headers.get("Content-Type"), contentType);
    assert.notEqual((await response.arrayBuffer()).byteLength, 0, `${pathname} must not be empty`);
  }

  const wwwResponse = await worker.fetch(new Request("https://www.vooglin.ee/favicon.ico"), {});
  assert.equal(wwwResponse.status, 308);
  assert.equal(wwwResponse.headers.get("Location"), "https://vooglin.ee/favicon.ico");
});

test("homepage identity metadata consistently describes Vooglin on its canonical host", async () => {
  const html = await readFile(path.join(projectRoot, "index.html"), "utf8");
  assert.match(html, /<title>[^<]+\| Vooglin<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/vooglin\.ee\/">/);
  assert.match(html, /<meta property="og:site_name" content="Vooglin">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/vooglin\.ee\/">/);

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(jsonLdMatch, "homepage must include JSON-LD identity metadata");
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  const organization = jsonLd["@graph"].find((item) => item["@type"] === "Organization");
  const website = jsonLd["@graph"].find((item) => item["@type"] === "WebSite");

  assert.deepEqual(
    {
      id: organization["@id"],
      name: organization.name,
      url: organization.url,
      logo: organization.logo.url,
    },
    {
      id: "https://vooglin.ee/#organization",
      name: "Vooglin",
      url: "https://vooglin.ee/",
      logo: "https://vooglin.ee/vooglin-organization-logo.png",
    },
  );
  assert.deepEqual(
    {
      id: website["@id"],
      name: website.name,
      alternateName: website.alternateName,
      url: website.url,
      publisher: website.publisher["@id"],
    },
    {
      id: "https://vooglin.ee/#website",
      name: "Vooglin",
      alternateName: "vooglin.ee",
      url: "https://vooglin.ee/",
      publisher: "https://vooglin.ee/#organization",
    },
  );
});
