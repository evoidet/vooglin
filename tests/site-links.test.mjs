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

test("the messenger story is semantic, localized, and motion-safe", async () => {
  const homepages = [
    {
      relativePath: "index.html",
      heading: "A workflow usually starts like this.",
      messages: [
        "We collect requests through forms, then copy them into Sheets and chase updates by email.",
        "That gives us a useful place to start. I’d first map where the same information is entered again and who needs each status.",
        "Duplicates are common, nobody is quite sure what is current, and finance tracking happens in another file.",
        "We can connect the intake, check duplicates automatically, and keep one clear status visible to the team.",
        "Approvals and reporting are the other pain points. We want them clearer without adding more admin.",
        "Then one record can route approvals, notify the right person, and keep finance and reporting current — with less repetitive admin and a clearer view of what needs attention.",
      ],
      pauseLabel: "Pause conversation",
      resumeLabel: "Resume conversation",
      replayLabel: "Replay conversation",
      cta: "Let’s review your workflow",
    },
    {
      relativePath: "et/index.html",
      heading: "Töövoog algab tavaliselt nii.",
      messages: [
        "Kogume päringud vormide kaudu, kopeerime need seejärel Google Sheetsi ja küsime olekuuuendusi e-posti teel.",
        "Siit on hea alustada. Kõigepealt kaardistaksin, kus sama infot uuesti sisestatakse ja kellel on iga olekut vaja.",
        "Duplikaate tekib sageli, keegi pole päris kindel, milline info on ajakohane, ning rahaasjade jälgimine toimub eraldi failis.",
        "Saame sisendi ühendada, duplikaate automaatselt kontrollida ja hoida ühe selge oleku kogu tiimile nähtavana.",
        "Teised valukohad on kinnitused ja aruandlus. Soovime need selgemaks teha ilma haldustööd juurde tekitamata.",
        "Siis saab üks kirje suunata kinnitused, teavitada õiget inimest ning hoida rahaasjad ja aruandluse ajakohasena — vähem korduvat haldustööd ja selgem ülevaade sellest, mis tähelepanu vajab.",
      ],
      pauseLabel: "Peata vestlus",
      resumeLabel: "Jätka vestlust",
      replayLabel: "Esita vestlus uuesti",
      cta: "Vaatame sinu töövoo üle",
    },
    {
      relativePath: "ru/index.html",
      heading: "Обычно работа над процессом начинается так.",
      messages: [
        "Мы собираем запросы через формы, затем копируем их в Google Таблицы и по почте запрашиваем обновления статусов.",
        "Это хорошая отправная точка. Сначала я бы выяснил, где одни и те же данные вводятся повторно и кому нужен каждый статус.",
        "Дубликаты появляются часто, никто точно не знает, какие данные актуальны, а финансы отслеживаются в отдельном файле.",
        "Мы можем связать приём данных, автоматически проверять дубликаты и показывать команде один понятный актуальный статус.",
        "Другие проблемные места — согласования и отчётность. Мы хотим сделать их понятнее, не добавляя административной работы.",
        "Тогда одна запись сможет направлять согласования, уведомлять нужного человека и поддерживать финансы и отчётность в актуальном состоянии — меньше повторяющейся административной работы и понятнее, что требует внимания.",
      ],
      pauseLabel: "Приостановить диалог",
      resumeLabel: "Продолжить диалог",
      replayLabel: "Повторить диалог",
      cta: "Давайте разберём ваш процесс",
    },
  ];

  for (const homepage of homepages) {
    const html = await readFile(path.join(publicRoot, homepage.relativePath), "utf8");
    assert.equal((html.match(/\sdata-messenger(?:\s|>)/g) || []).length, 1);
    assert.equal((html.match(/\sdata-messenger-message(?:\s|>)/g) || []).length, 6);
    assert.match(html, /<ol class="messenger-thread" data-messenger-thread role="list">/);
    assert.match(html, /data-messenger-typing[^>]+aria-hidden="true" hidden/);
    const controlMarkup = html.match(/<button\s+class="messenger-control"[\s\S]*?<\/button>/)?.[0];
    assert.ok(controlMarkup, "the messenger control must be present");
    assert.match(controlMarkup, /\shidden\s*>/);
    assert.doesNotMatch(controlMarkup, /aria-pressed/);
    assert.match(html, /data-messenger-window role="region" aria-label="[^"]+" tabindex="0"/);
    assert.ok(html.includes(homepage.heading));
    homepage.messages.forEach((message) => assert.ok(html.includes(message), `${homepage.relativePath} must contain every localized message`));
    assert.ok(html.includes(`data-pause-label="${homepage.pauseLabel}"`));
    assert.ok(html.includes(`data-resume-label="${homepage.resumeLabel}"`));
    assert.ok(html.includes(`data-replay-label="${homepage.replayLabel}"`));
    assert.ok(html.includes(`class="button button-dark" href="mailto:egor@vooglin.ee" data-booking-open>${homepage.cta}</a>`));
    assert.doesNotMatch(html, /data-messenger-thread[^>]+(?:aria-live|role="log")/);

    if (homepage.relativePath !== "index.html") {
      homepages[0].messages.forEach((message) => {
        assert.ok(!html.includes(message), `${homepage.relativePath} must not retain English messenger copy`);
      });
    }
  }

  const [css, javascript] = await Promise.all([
    readFile(path.join(publicRoot, "styles.css"), "utf8"),
    readFile(path.join(publicRoot, "script.js"), "utf8"),
  ]);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.workflow-conversation\.is-sequencing \.messenger-message/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.messenger-control,[\s\S]*\.messenger-typing/);
  assert.match(javascript, /observer\?\.observe\(frame\)/, "the sequence must wait until the messenger frame is visible");
});
