import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { localizePage } from "./localize.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(projectRoot, "dist");
const serverDirectory = path.join(distDirectory, "server");
const publicDirectory = path.join(projectRoot, "public");
const publicPricingDirectory = path.join(publicDirectory, "pricing");
const publicEtDirectory = path.join(publicDirectory, "et");
const publicRuDirectory = path.join(publicDirectory, "ru");
const publicEtPricingDirectory = path.join(publicEtDirectory, "pricing");
const publicRuPricingDirectory = path.join(publicRuDirectory, "pricing");
const partnerSourceDirectory = path.join(projectRoot, "images", "partners");
const publicPartnerDirectory = path.join(publicDirectory, "images", "partners");

const partnerAssetTypes = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
]);

async function readPartnerAssets() {
  let entries = [];

  try {
    entries = await readdir(partnerSourceDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(entries
    .filter((entry) => entry.isFile() && partnerAssetTypes.has(path.extname(entry.name).toLowerCase()))
    .map(async (entry) => ({
      filename: entry.name,
      url: `/images/partners/${encodeURIComponent(entry.name)}`,
      type: partnerAssetTypes.get(path.extname(entry.name).toLowerCase()),
      body: await readFile(path.join(partnerSourceDirectory, entry.name)),
    })));
}

const [html, pricingHtml, css, javascript, siteConfig, socialImage, favicon] = await Promise.all([
  readFile(path.join(projectRoot, "index.html"), "utf8"),
  readFile(path.join(projectRoot, "pricing", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "styles.css"), "utf8"),
  readFile(path.join(projectRoot, "script.js"), "utf8"),
  readFile(path.join(projectRoot, "site-config.js"), "utf8"),
  readFile(path.join(projectRoot, "og-savings.png")),
  readFile(path.join(projectRoot, "favicon.png")),
]);
const partnerAssets = await readPartnerAssets();

const etHtml = localizePage(html, "et", "home");
const ruHtml = localizePage(html, "ru", "home");
const etPricingHtml = localizePage(pricingHtml, "et", "pricing");
const ruPricingHtml = localizePage(pricingHtml, "ru", "pricing");

const workerSource = `
const assets = new Map([
  ["/", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/index.html", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/pricing/", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/pricing/index.html", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/", { body: ${JSON.stringify(etHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/index.html", { body: ${JSON.stringify(etHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/pricing/", { body: ${JSON.stringify(etPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/pricing/index.html", { body: ${JSON.stringify(etPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/", { body: ${JSON.stringify(ruHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/index.html", { body: ${JSON.stringify(ruHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/pricing/", { body: ${JSON.stringify(ruPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/pricing/index.html", { body: ${JSON.stringify(ruPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/styles.css", { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" }],
  ["/script.js", { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" }],
  ["/site-config.js", { body: ${JSON.stringify(siteConfig)}, type: "text/javascript; charset=utf-8" }],
]);

const partnerAssets = new Map([
${partnerAssets.map((asset) => `  [${JSON.stringify(asset.url)}, { body: ${JSON.stringify(asset.body.toString("base64"))}, type: ${JSON.stringify(asset.type)} }]`).join(",\n")}
]);

const socialImageBase64 = ${JSON.stringify(socialImage.toString("base64"))};
const faviconBase64 = ${JSON.stringify(favicon.toString("base64"))};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function securityHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": contentType.startsWith("text/html")
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=86400",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    const trailingSlashRoutes = new Map([
      ["/pricing", "/pricing/"],
      ["/et", "/et/"],
      ["/et/pricing", "/et/pricing/"],
      ["/ru", "/ru/"],
      ["/ru/pricing", "/ru/pricing/"],
    ]);
    const redirectPath = trailingSlashRoutes.get(url.pathname);
    if (redirectPath) {
      return Response.redirect(new URL(redirectPath, url), 308);
    }

    if (url.pathname === "/og-savings.png") {
      return new Response(decodeBase64(socialImageBase64), {
        headers: securityHeaders("image/png"),
      });
    }

    if (url.pathname === "/favicon.png") {
      return new Response(decodeBase64(faviconBase64), {
        headers: securityHeaders("image/png"),
      });
    }

    const partnerAsset = partnerAssets.get(url.pathname);
    if (partnerAsset) {
      return new Response(decodeBase64(partnerAsset.body), {
        headers: securityHeaders(partnerAsset.type),
      });
    }

    const asset = assets.get(url.pathname);
    if (asset) {
      return new Response(asset.body, {
        headers: securityHeaders(asset.type),
      });
    }

    return new Response("Not found", {
      status: 404,
      headers: securityHeaders("text/plain; charset=utf-8"),
    });
  },
};
`.trimStart();

await Promise.all([
  rm(distDirectory, { recursive: true, force: true }),
  rm(publicDirectory, { recursive: true, force: true }),
]);

await Promise.all([
  mkdir(serverDirectory, { recursive: true }),
  mkdir(publicPricingDirectory, { recursive: true }),
  mkdir(publicEtPricingDirectory, { recursive: true }),
  mkdir(publicRuPricingDirectory, { recursive: true }),
  mkdir(publicPartnerDirectory, { recursive: true }),
]);

await Promise.all([
  writeFile(path.join(serverDirectory, "index.js"), workerSource),
  writeFile(path.join(publicDirectory, "index.html"), html),
  writeFile(path.join(publicPricingDirectory, "index.html"), pricingHtml),
  writeFile(path.join(publicEtDirectory, "index.html"), etHtml),
  writeFile(path.join(publicEtPricingDirectory, "index.html"), etPricingHtml),
  writeFile(path.join(publicRuDirectory, "index.html"), ruHtml),
  writeFile(path.join(publicRuPricingDirectory, "index.html"), ruPricingHtml),
  writeFile(path.join(publicDirectory, "styles.css"), css),
  writeFile(path.join(publicDirectory, "script.js"), javascript),
  writeFile(path.join(publicDirectory, "site-config.js"), siteConfig),
  writeFile(path.join(publicDirectory, "og-savings.png"), socialImage),
  writeFile(path.join(publicDirectory, "favicon.png"), favicon),
  ...partnerAssets.map((asset) => writeFile(path.join(publicPartnerDirectory, asset.filename), asset.body)),
]);

console.log("Built Vooglin site for Sites and Vercel deployment.");
