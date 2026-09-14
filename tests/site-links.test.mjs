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

test("every footer includes one accessible Vooglin LinkedIn link", async () => {
  const labels = new Map([
    ["en", "Vooglin on LinkedIn (opens in a new tab)"],
    ["et", "Vooglin LinkedInis (avaneb uuel vahelehel)"],
    ["ru", "Vooglin в LinkedIn (откроется в новой вкладке)"],
  ]);

  for (const relativePath of pages) {
    const html = await readFile(path.join(publicRoot, relativePath), "utf8");
    const language = relativePath.startsWith("et/") ? "et" : relativePath.startsWith("ru/") ? "ru" : "en";
    const footer = html.match(/<footer>[\s\S]*?<\/footer>/)?.[0] || "";
    const links = footer.match(/<a class="footer-social-link"[\s\S]*?<\/a>/g) || [];

    assert.equal(links.length, 1, `${relativePath} must include one LinkedIn footer icon`);
    assert.match(links[0], /href="https:\/\/www\.linkedin\.com\/company\/vooglin\/about\/\?viewAsMember=true"/);
    assert.match(links[0], /target="_blank" rel="noopener noreferrer"/);
    assert.ok(links[0].includes(`aria-label="${labels.get(language)}"`));
    assert.match(links[0], /<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">/);
  }

  const css = await readFile(path.join(publicRoot, "styles.css"), "utf8");
  assert.match(css, /\.footer-bottom \.footer-social-link \{[\s\S]*?width: 38px;[\s\S]*?height: 38px;[\s\S]*?padding: 5px;/);
  assert.match(css, /\.footer-social-link svg \{[\s\S]*?width: 28px;[\s\S]*?height: 28px;[\s\S]*?fill: currentColor;/);
});

test("the fictional demo is complete and localized on all homepages", async () => {
  const copy = JSON.parse(await readFile(path.join(projectRoot, "redesign-copy.json"), "utf8"));
  const dialogue = copy.slice(17, 25);
  for (const [relativePath, index, client] of [["index.html", 0, "Client"], ["et/index.html", 1, "Klient"], ["ru/index.html", 2, "Клиент"]]) {
    const html = await readFile(path.join(publicRoot, relativePath), "utf8");
    assert.equal((html.match(/ data-messenger-message /g) || []).length, 8);
    assert.ok(html.includes('data-speaker="' + client + '"'));
    for (const row of dialogue) assert.ok(html.includes(row[index]), `${relativePath}: ${row[index]}`);
    if (index !== 0) for (const row of dialogue) assert.ok(!html.includes(row[0]));
    assert.match(html, /data-messenger-control/);
    assert.match(html, /data-pause-label="[^"]+"/);
    assert.match(html, /data-resume-label="[^"]+"/);
    assert.match(html, /data-replay-label="[^"]+"/);
    assert.match(html, /data-messenger-window role="region" aria-label="[^"]+" tabindex="0"/);
    assert.match(html, /<ol class="messenger-thread" data-messenger-thread role="list">/);
    assert.match(html, /id="process-title">[^<]+<\/h2>/);
    assert.doesNotMatch(html, /<img[^>]+partners/);
  }
});

test("all pages use a text brand and a decorative mascot with no controls", async () => {
  for (const relativePath of pages) {
    const html = await readFile(path.join(publicRoot, relativePath), "utf8");
    const brands = html.match(/<a class="brand"[\s\S]*?<\/a>/g) || [];
    assert.equal(brands.length, 2);
    for (const brand of brands) {
      assert.match(brand, /<span>Vooglin<\/span>/);
      assert.doesNotMatch(brand, /<img/);
    }
    const mascot = html.match(/<div class="robot-perch"[\s\S]*?<\/div>/)?.[0];
    assert.ok(mascot);
    assert.match(mascot, /aria-hidden="true"/);
    assert.match(mascot, /focusable="false"/);
    assert.doesNotMatch(mascot, /<(?:button|a|input)\b|tabindex|onclick/);
  }
  const config = await readFile(path.join(publicRoot, "site-config.js"), "utf8");
  assert.match(config, /clients: Object.freeze\(\[\]\)/);
});

test("reduced motion and narrow layouts keep the decorative mascot quiet", async () => {
  const css = await readFile(path.join(publicRoot, "styles.css"), "utf8");
  const mascot = css.match(/\.robot-perch \{([^}]+)\}/)?.[1] || "";
  assert.match(mascot, /position: relative/);
  assert.doesNotMatch(mascot, /position: (?:fixed|absolute)/);
  assert.match(css, /@media \(max-width: 359px\)[\s\S]*?\.robot-perch \{ display: none/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.robot-perch:hover \.robot-body[\s\S]*?transform: none/);
});
