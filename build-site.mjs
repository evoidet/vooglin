import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(projectRoot, "dist");
const serverDirectory = path.join(distDirectory, "server");

const [html, pricingHtml, css, javascript, socialImage, favicon] = await Promise.all([
  readFile(path.join(projectRoot, "index.html"), "utf8"),
  readFile(path.join(projectRoot, "pricing", "index.html"), "utf8"),
  readFile(path.join(projectRoot, "styles.css"), "utf8"),
  readFile(path.join(projectRoot, "script.js"), "utf8"),
  readFile(path.join(projectRoot, "og-brand.png")),
  readFile(path.join(projectRoot, "favicon.png")),
]);

const workerSource = `
const assets = new Map([
  ["/", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/index.html", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/pricing/", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/pricing/index.html", { body: ${JSON.stringify(pricingHtml)}, type: "text/html; charset=utf-8" }],
  ["/styles.css", { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" }],
  ["/script.js", { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" }],
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

    if (url.pathname === "/pricing") {
      return Response.redirect(new URL("/pricing/", url), 308);
    }

    if (url.pathname === "/og-brand.png") {
      return new Response(decodeBase64(socialImageBase64), {
        headers: securityHeaders("image/png"),
      });
    }

    if (url.pathname === "/favicon.png") {
      return new Response(decodeBase64(faviconBase64), {
        headers: securityHeaders("image/png"),
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

await rm(distDirectory, { recursive: true, force: true });
await mkdir(serverDirectory, { recursive: true });
await writeFile(path.join(serverDirectory, "index.js"), workerSource);

console.log("Built Vooglin site for deployment.");
