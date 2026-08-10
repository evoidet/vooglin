import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { normaliseBookingPolicy } from "./booking-runtime.mjs";
import { localizePage } from "./localize.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(projectRoot, "dist");
const serverDirectory = path.join(distDirectory, "server");
const publicDirectory = path.join(projectRoot, "public");
const publicPricingDirectory = path.join(publicDirectory, "pricing");
const publicPrivacyDirectory = path.join(publicDirectory, "privacy");
const publicEtDirectory = path.join(publicDirectory, "et");
const publicRuDirectory = path.join(publicDirectory, "ru");
const publicEtPricingDirectory = path.join(publicEtDirectory, "pricing");
const publicRuPricingDirectory = path.join(publicRuDirectory, "pricing");
const publicEtPrivacyDirectory = path.join(publicEtDirectory, "privacy");
const publicRuPrivacyDirectory = path.join(publicRuDirectory, "privacy");
const partnerSourceDirectory = path.join(projectRoot, "images", "partners");
const publicPartnerDirectory = path.join(publicDirectory, "images", "partners");
const peopleSourceDirectory = path.join(projectRoot, "images", "people");
const publicPeopleDirectory = path.join(publicDirectory, "images", "people");

const imageAssetTypes = new Map([
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
]);

const binaryAssetDefinitions = [
  { url: "/og-brand.png", filename: "og-brand.png", type: "image/png" },
  { url: "/og-savings.png", filename: "og-brand.png", outputFilename: "og-savings.png", type: "image/png" },
  { url: "/cosmic-convergence.png", filename: "cosmic-convergence.png", type: "image/png" },
  { url: "/vooglin-mark.png", filename: "vooglin-mark.png", type: "image/png" },
  { url: "/vooglin-v-black.png", filename: "vooglin-v-black.png", type: "image/png" },
  { url: "/egor-portrait.webp", filename: "egor-portrait.webp", type: "image/webp" },
  { url: "/favicon.ico", filename: "favicon.ico", type: "image/x-icon" },
  { url: "/favicon-16x16.png", filename: "favicon-16x16.png", type: "image/png" },
  { url: "/favicon-32x32.png", filename: "favicon-32x32.png", type: "image/png" },
  { url: "/favicon-48x48.png", filename: "favicon-48x48.png", type: "image/png" },
  { url: "/favicon-96x96.png", filename: "favicon-96x96.png", type: "image/png" },
  { url: "/favicon-192x192.png", filename: "favicon-192x192.png", type: "image/png" },
  { url: "/favicon-512x512.png", filename: "favicon-512x512.png", type: "image/png" },
  { url: "/apple-touch-icon.png", filename: "apple-touch-icon.png", type: "image/png" },
  { url: "/vooglin-organization-logo.png", filename: "vooglin-organization-logo.png", type: "image/png" },
  { url: "/favicon.png", filename: "favicon.png", type: "image/png" },
];

async function readImageAssets(sourceDirectory, publicPath) {
  let entries = [];

  try {
    entries = await readdir(sourceDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(entries
    .filter((entry) => entry.isFile() && imageAssetTypes.has(path.extname(entry.name).toLowerCase()))
    .map(async (entry) => ({
      filename: entry.name,
      url: `${publicPath}/${encodeURIComponent(entry.name)}`,
      type: imageAssetTypes.get(path.extname(entry.name).toLowerCase()),
      body: await readFile(path.join(sourceDirectory, entry.name)),
    })));
}

const [html, pricingHtml, privacyHtml, css, javascript, siteConfig, robots, sitemap, manifest, bookingRuntimeSource] = await Promise.all([
  readFile(path.join(projectRoot, "index.html"), "utf8"),
  readFile(path.join(projectRoot, "pricing", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "privacy", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "styles.css"), "utf8"),
  readFile(path.join(projectRoot, "script.js"), "utf8"),
  readFile(path.join(projectRoot, "site-config.js"), "utf8"),
  readFile(path.join(projectRoot, "robots.txt"), "utf8"),
  readFile(path.join(projectRoot, "sitemap.xml"), "utf8"),
  readFile(path.join(projectRoot, "site.webmanifest"), "utf8"),
  readFile(path.join(projectRoot, "booking-runtime.mjs"), "utf8"),
]);
const binaryAssets = await Promise.all(binaryAssetDefinitions.map(async (asset) => ({
  ...asset,
  body: await readFile(path.join(projectRoot, asset.filename)),
})));
const [partnerAssets, peopleAssets] = await Promise.all([
  readImageAssets(partnerSourceDirectory, "/images/partners"),
  readImageAssets(peopleSourceDirectory, "/images/people"),
]);

const configContext = { window: {} };
runInNewContext(siteConfig, configContext, { filename: "site-config.js" });
const publicBookingConfig = configContext.window.vooglinSiteConfig?.booking || {};
const bookingPolicy = normaliseBookingPolicy(publicBookingConfig);
const workerBookingRuntime = bookingRuntimeSource.replace(/^export\s+/gm, "");

const etHtml = localizePage(html, "et", "home");
const ruHtml = localizePage(html, "ru", "home");
const etPricingHtml = localizePage(pricingHtml, "et", "pricing");
const ruPricingHtml = localizePage(pricingHtml, "ru", "pricing");
const etPrivacyHtml = localizePage(privacyHtml, "et", "privacy");
const ruPrivacyHtml = localizePage(privacyHtml, "ru", "privacy");

const workerSource = `
${workerBookingRuntime}

const bookingPolicy = ${JSON.stringify(bookingPolicy)};

const assets = new Map([
  ["/", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/index.html", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/pricing/", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/pricing/index.html", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/privacy/", { body: ${JSON.stringify(privacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/privacy/index.html", { body: ${JSON.stringify(privacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/", { body: ${JSON.stringify(etHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/index.html", { body: ${JSON.stringify(etHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/pricing/", { body: ${JSON.stringify(etPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/pricing/index.html", { body: ${JSON.stringify(etPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/privacy/", { body: ${JSON.stringify(etPrivacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/et/privacy/index.html", { body: ${JSON.stringify(etPrivacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/", { body: ${JSON.stringify(ruHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/index.html", { body: ${JSON.stringify(ruHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/pricing/", { body: ${JSON.stringify(ruPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/pricing/index.html", { body: ${JSON.stringify(ruPricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/privacy/", { body: ${JSON.stringify(ruPrivacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/ru/privacy/index.html", { body: ${JSON.stringify(ruPrivacyHtml)}, type: "text/html; charset=utf-8" }],
  ["/styles.css", { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" }],
  ["/script.js", { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" }],
  ["/site-config.js", { body: ${JSON.stringify(siteConfig)}, type: "text/javascript; charset=utf-8" }],
  ["/robots.txt", { body: ${JSON.stringify(robots)}, type: "text/plain; charset=utf-8" }],
  ["/sitemap.xml", { body: ${JSON.stringify(sitemap)}, type: "application/xml; charset=utf-8" }],
  ["/site.webmanifest", { body: ${JSON.stringify(manifest)}, type: "application/manifest+json; charset=utf-8" }],
]);

const binaryAssets = new Map([
${binaryAssets.map((asset) => `  [${JSON.stringify(asset.url)}, { body: ${JSON.stringify(asset.body.toString("base64"))}, type: ${JSON.stringify(asset.type)} }]`).join(",\n")}
]);

const partnerAssets = new Map([
${partnerAssets.map((asset) => `  [${JSON.stringify(asset.url)}, { body: ${JSON.stringify(asset.body.toString("base64"))}, type: ${JSON.stringify(asset.type)} }]`).join(",\n")}
]);

const peopleAssets = new Map([
${peopleAssets.map((asset) => `  [${JSON.stringify(asset.url)}, { body: ${JSON.stringify(asset.body.toString("base64"))}, type: ${JSON.stringify(asset.type)} }]`).join(",\n")}
]);

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
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.vooglin.ee") {
      url.hostname = "vooglin.ee";
      return Response.redirect(url, 308);
    }

    if (url.pathname === "/api/meeting" || url.pathname === "/api/booking") {
      return handleBookingRequest(request, env, bookingPolicy);
    }

    const trailingSlashRoutes = new Map([
      ["/pricing", "/pricing/"],
      ["/privacy", "/privacy/"],
      ["/et", "/et/"],
      ["/et/pricing", "/et/pricing/"],
      ["/et/privacy", "/et/privacy/"],
      ["/ru", "/ru/"],
      ["/ru/pricing", "/ru/pricing/"],
      ["/ru/privacy", "/ru/privacy/"],
    ]);
    const redirectPath = trailingSlashRoutes.get(url.pathname);
    if (redirectPath) {
      return Response.redirect(new URL(redirectPath, url), 308);
    }

    const binaryAsset = binaryAssets.get(url.pathname);
    if (binaryAsset) {
      return new Response(decodeBase64(binaryAsset.body), {
        headers: securityHeaders(binaryAsset.type),
      });
    }

    const partnerAsset = partnerAssets.get(url.pathname);
    if (partnerAsset) {
      return new Response(decodeBase64(partnerAsset.body), {
        headers: securityHeaders(partnerAsset.type),
      });
    }

    const peopleAsset = peopleAssets.get(url.pathname);
    if (peopleAsset) {
      return new Response(decodeBase64(peopleAsset.body), {
        headers: securityHeaders(peopleAsset.type),
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
  mkdir(publicPrivacyDirectory, { recursive: true }),
  mkdir(publicEtPricingDirectory, { recursive: true }),
  mkdir(publicRuPricingDirectory, { recursive: true }),
  mkdir(publicEtPrivacyDirectory, { recursive: true }),
  mkdir(publicRuPrivacyDirectory, { recursive: true }),
  mkdir(publicPartnerDirectory, { recursive: true }),
  mkdir(publicPeopleDirectory, { recursive: true }),
]);

await Promise.all([
  writeFile(path.join(serverDirectory, "index.js"), workerSource),
  writeFile(path.join(publicDirectory, "index.html"), html),
  writeFile(path.join(publicPricingDirectory, "index.html"), pricingHtml),
  writeFile(path.join(publicPrivacyDirectory, "index.html"), privacyHtml),
  writeFile(path.join(publicEtDirectory, "index.html"), etHtml),
  writeFile(path.join(publicEtPricingDirectory, "index.html"), etPricingHtml),
  writeFile(path.join(publicEtPrivacyDirectory, "index.html"), etPrivacyHtml),
  writeFile(path.join(publicRuDirectory, "index.html"), ruHtml),
  writeFile(path.join(publicRuPricingDirectory, "index.html"), ruPricingHtml),
  writeFile(path.join(publicRuPrivacyDirectory, "index.html"), ruPrivacyHtml),
  writeFile(path.join(publicDirectory, "styles.css"), css),
  writeFile(path.join(publicDirectory, "script.js"), javascript),
  writeFile(path.join(publicDirectory, "site-config.js"), siteConfig),
  writeFile(path.join(publicDirectory, "robots.txt"), robots),
  writeFile(path.join(publicDirectory, "sitemap.xml"), sitemap),
  writeFile(path.join(publicDirectory, "site.webmanifest"), manifest),
  ...binaryAssets.map((asset) => writeFile(path.join(publicDirectory, asset.outputFilename || asset.filename), asset.body)),
  ...partnerAssets.map((asset) => writeFile(path.join(publicPartnerDirectory, asset.filename), asset.body)),
  ...peopleAssets.map((asset) => writeFile(path.join(publicPeopleDirectory, asset.filename), asset.body)),
]);

console.log("Built Vooglin site for Sites and Vercel deployment.");
