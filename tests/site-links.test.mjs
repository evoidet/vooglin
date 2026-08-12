import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicRoot = path.join(projectRoot, "public");
const pages = [
  "index.html",
  "pricing/index.html",
  "privacy/index.html",
  "et/index.html",
  "et/pricing/index.html",
  "et/privacy/index.html",
  "ru/index.html",
  "ru/pricing/index.html",
  "ru/privacy/index.html",
];

function publicFileForPathname(pathname) {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!relativePath || relativePath.endsWith("/")) {
    return path.join(publicRoot, relativePath, "index.html");
  }
  return path.join(publicRoot, relativePath);
}

function idsIn(html) {
  return new Set(
    [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]),
  );
}

test("all production-page internal links resolve to an asset, route, and valid fragment", async () => {
  const htmlByPath = new Map();
  for (const relativePath of pages) {
    htmlByPath.set(
      path.join(publicRoot, relativePath),
      await readFile(path.join(publicRoot, relativePath), "utf8"),
    );
  }

  for (const relativePath of pages) {
    const sourcePath = path.join(publicRoot, relativePath);
    const html = htmlByPath.get(sourcePath);
    const pageUrl = new URL(`https://vooglin.ee/${relativePath.replace(/index\.html$/, "")}`);
    const references = [
      ...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi),
    ].map((match) => match[1]);

    for (const reference of references) {
      if (/^(?:mailto:|tel:|data:|javascript:)/i.test(reference)) continue;

      const targetUrl = new URL(reference, pageUrl);
      if (targetUrl.origin !== pageUrl.origin) continue;

      const targetPath = publicFileForPathname(targetUrl.pathname);
      await assert.doesNotReject(
        access(targetPath),
        undefined,
        `${relativePath}: ${reference} must resolve to a production file`,
      );

      if (!targetUrl.hash) continue;

      const targetHtml = htmlByPath.get(targetPath) ?? await readFile(targetPath, "utf8");
      const fragment = decodeURIComponent(targetUrl.hash.slice(1));
      assert.ok(
        idsIn(targetHtml).has(fragment),
        `${relativePath}: ${reference} must target an existing id`,
      );
    }
  }
});

test("Vercel and Sites deployments apply the same baseline security policy", async () => {
  const vercel = JSON.parse(await readFile(path.join(projectRoot, "vercel.json"), "utf8"));
  assert.deepEqual(vercel.regions, ["arn1"]);

  const globalHeaders = vercel.headers.find((entry) => entry.source === "/(.*)")?.headers;
  assert.ok(globalHeaders, "Vercel must define headers for every route");
  const vercelHeaders = Object.fromEntries(
    globalHeaders.map(({ key, value }) => [key, value]),
  );

  const requiredHeaders = [
    "Content-Security-Policy",
    "Permissions-Policy",
    "Referrer-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
  ];
  for (const header of requiredHeaders) {
    assert.ok(vercelHeaders[header], `Vercel must send ${header}`);
  }
  assert.match(vercelHeaders["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(vercelHeaders["X-Frame-Options"], "DENY");

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("security-header-test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("https://vooglin.ee/"), {});
  for (const header of requiredHeaders) {
    assert.equal(
      response.headers.get(header),
      vercelHeaders[header],
      `Sites and Vercel must agree on ${header}`,
    );
  }
});

test("social previews expose accessible image descriptions on every production page", async () => {
  for (const relativePath of pages) {
    const html = await readFile(path.join(publicRoot, relativePath), "utf8");
    assert.match(html, /<meta property="og:image:alt" content="[^"]+">/);
    assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
  }
});

test("the hero serves an optimized WebP with a PNG compatibility fallback", async () => {
  const [webp, png, css] = await Promise.all([
    readFile(path.join(publicRoot, "cosmic-convergence.webp")),
    readFile(path.join(publicRoot, "cosmic-convergence.png")),
    readFile(path.join(publicRoot, "styles.css"), "utf8"),
  ]);
  assert.ok(webp.byteLength > 0);
  assert.ok(webp.byteLength < png.byteLength / 10, "WebP should materially reduce the critical image transfer");
  assert.match(css, /image-set\([\s\S]*cosmic-convergence\.webp[\s\S]*cosmic-convergence\.png/);

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("optimized-image-test", String(Date.now()));
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("https://vooglin.ee/cosmic-convergence.webp"), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "image/webp");
});
