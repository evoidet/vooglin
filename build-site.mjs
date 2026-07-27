import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.join(projectRoot, "dist");
const serverDirectory = path.join(distDirectory, "server");

const [html, css, javascript, socialImage] = await Promise.all([
  readFile(path.join(projectRoot, "index.html"), "utf8"),
  readFile(path.join(projectRoot, "styles.css"), "utf8"),
  readFile(path.join(projectRoot, "script.js"), "utf8"),
  readFile(path.join(projectRoot, "og.png")),
]);

const workerSource = `
const assets = new Map([
  ["/", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/index.html", { body: ${JSON.stringify(html)}, type: "text/html; charset=utf-8" }],
  ["/styles.css", { body: ${JSON.stringify(css)}, type: "text/css; charset=utf-8" }],
  ["/script.js", { body: ${JSON.stringify(javascript)}, type: "text/javascript; charset=utf-8" }],
]);

const socialImageBase64 = ${JSON.stringify(socialImage.toString("base64"))};

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

    if (url.pathname === "/og.png") {
      return new Response(decodeBase64(socialImageBase64), {
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
