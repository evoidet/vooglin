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

const [html, pricingHtml, privacyHtml, css, javascript, siteConfig, robots, sitemap, manifest] = await Promise.all([
  readFile(path.join(projectRoot, "index.html"), "utf8"),
  readFile(path.join(projectRoot, "pricing", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "privacy", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "styles.css"), "utf8"),
  readFile(path.join(projectRoot, "script.js"), "utf8"),
  readFile(path.join(projectRoot, "site-config.js"), "utf8"),
  readFile(path.join(projectRoot, "robots.txt"), "utf8"),
  readFile(path.join(projectRoot, "sitemap.xml"), "utf8"),
  readFile(path.join(projectRoot, "site.webmanifest"), "utf8"),
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

const etHtml = localizePage(html, "et", "home");
const ruHtml = localizePage(html, "ru", "home");
const etPricingHtml = localizePage(pricingHtml, "et", "pricing");
const ruPricingHtml = localizePage(pricingHtml, "ru", "pricing");
const etPrivacyHtml = localizePage(privacyHtml, "et", "privacy");
const ruPrivacyHtml = localizePage(privacyHtml, "ru", "privacy");

const workerSource = `
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

function bookingJson(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function normaliseBookingText(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\\s+/g, " ").slice(0, maximumLength);
}

function tallinnDateKey(daysFromNow) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + daysFromNow,
  )).toISOString().slice(0, 10);
}

function bookingDateEpoch(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return Number.NaN;
  const [year, month, day] = value.split("-").map(Number);
  const epoch = Date.UTC(year, month - 1, day);
  const date = new Date(epoch);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? epoch
    : Number.NaN;
}

function validateBookingRequest(body) {
  const booking = {
    name: normaliseBookingText(body.name, 120),
    organisation: normaliseBookingText(body.organisation, 120),
    email: normaliseBookingText(body.email, 254).toLowerCase(),
    phone: normaliseBookingText(body.phone, 40),
    message: normaliseBookingText(body.message, 2000),
    preferredDate: normaliseBookingText(body.preferredDate, 10),
    preferredTime: normaliseBookingText(body.preferredTime, 5),
    locale: normaliseBookingText(body.locale, 5),
    sourcePage: normaliseBookingText(body.sourcePage, 500),
    durationMinutes: bookingPolicy.durationMinutes,
  };
  const emailIsValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(booking.email);
  const timeIsValid = bookingPolicy.preferredTimes.includes(booking.preferredTime);
  const requestedDate = bookingDateEpoch(booking.preferredDate);
  const earliestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.minimumLeadDays));
  const latestDate = bookingDateEpoch(tallinnDateKey(bookingPolicy.maximumDaysAhead));
  const dateInRange = Number.isFinite(requestedDate)
    && requestedDate >= earliestDate
    && requestedDate <= latestDate;

  if (!booking.name || !booking.organisation || !booking.message || !emailIsValid || !timeIsValid || !dateInRange) {
    return null;
  }

  return booking;
}

async function handleBookingRequest(request, env) {
  if (request.method !== "POST") {
    return bookingJson({ ok: false, code: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!origin) return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
  try {
    if (new URL(origin).host !== requestUrl.host) {
      return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
    }
  } catch {
    return bookingJson({ ok: false, code: "origin_not_allowed" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentType.toLowerCase().startsWith("application/json") || contentLength > 16384) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return bookingJson({ ok: false, code: "invalid_json" }, 400);
  }
  if (new TextEncoder().encode(rawBody).byteLength > 16384) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return bookingJson({ ok: false, code: "invalid_json" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  if (normaliseBookingText(body.website, 200)) {
    return bookingJson({ ok: true });
  }

  const formStartedAt = Number(body.formStartedAt);
  const submittedAt = Number(body.submittedAt);
  const formAge = submittedAt - formStartedAt;
  if (!Number.isFinite(formStartedAt)
    || !Number.isFinite(submittedAt)
    || formAge < 600
    || formAge > 7200000) {
    return bookingJson({ ok: false, code: "invalid_request" }, 400);
  }

  const booking = validateBookingRequest(body);
  if (!booking) return bookingJson({ ok: false, code: "validation_failed" }, 400);

  const webhookValue = typeof env?.BOOKING_WEBHOOK_URL === "string" ? env.BOOKING_WEBHOOK_URL : "";
  let webhookUrl;
  try {
    webhookUrl = new URL(webhookValue);
  } catch {
    return bookingJson({ ok: false, code: "delivery_not_configured" }, 503);
  }
  if (webhookUrl.protocol !== "https:") {
    return bookingJson({ ok: false, code: "delivery_not_configured" }, 503);
  }

  const requestId = crypto.randomUUID();
  const webhookHeaders = {
    "Content-Type": "application/json",
    "X-Vooglin-Request-Id": requestId,
  };
  if (typeof env?.BOOKING_WEBHOOK_TOKEN === "string" && env.BOOKING_WEBHOOK_TOKEN) {
    webhookHeaders.Authorization = "Bearer " + env.BOOKING_WEBHOOK_TOKEN;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let deliveryResponse;

  try {
    deliveryResponse = await fetch(webhookUrl.href, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify({
        event: "vooglin.booking_request",
        requestId,
        receivedAt: new Date().toISOString(),
        recipient: typeof env?.BOOKING_RECIPIENT_EMAIL === "string" && env.BOOKING_RECIPIENT_EMAIL
          ? env.BOOKING_RECIPIENT_EMAIL
          : "egor@vooglin.ee",
        contact: {
          name: booking.name,
          organisation: booking.organisation,
          email: booking.email,
          phone: booking.phone,
        },
        meeting: {
          preferredDate: booking.preferredDate,
          preferredTime: booking.preferredTime,
          timezone: "Europe/Tallinn",
          durationMinutes: booking.durationMinutes,
        },
        request: booking.message,
        context: {
          locale: booking.locale,
          sourcePage: booking.sourcePage,
        },
      }),
      signal: controller.signal,
    });
  } catch {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!deliveryResponse.ok) {
    return bookingJson({ ok: false, code: "delivery_failed" }, 502);
  }

  return bookingJson({ ok: true, requestId });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.vooglin.ee") {
      url.hostname = "vooglin.ee";
      return Response.redirect(url, 308);
    }

    if (url.pathname === "/api/booking") {
      return handleBookingRequest(request, env);
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
