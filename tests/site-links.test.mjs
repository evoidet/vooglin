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
      heading: "A typical workflow starts with a conversation.",
      exampleLabel: "Example workflow conversation",
      ariaLabel: "Example workflow conversation between MTÜ Noortealgatuste Tugi and Vooglin",
      messages: [
        "Hi! We currently manage applications and some of our finances in several Google Forms and Sheets.",
        "Got it. What takes the most manual work?",
        "Checking duplicates, updating statuses, moving data between sheets and sending confirmations.",
        "We can connect the forms and sheets, then automate those checks, updates and messages.",
        "We’d also like the financial overview to be easier to follow.",
        "We can bring incoming data, approvals and reporting into the same workflow.",
        "That sounds exactly like what we need.",
        "Perfect. First we’ll map the current process, then automate the parts that genuinely save your team time.",
      ],
      pauseLabel: "Pause conversation",
      resumeLabel: "Resume conversation",
      replayLabel: "Replay conversation",
    },
    {
      relativePath: "et/index.html",
      heading: "Tüüpiline töövoog algab vestlusest.",
      exampleLabel: "Töövoo näidisvestlus",
      ariaLabel: "Töövoo näidisvestlus MTÜ Noortealgatuste Tugi ja Vooglini vahel",
      messages: [
        "Tere! Praegu haldame taotlusi ja osa rahaasju mitmes Google Formsi vormis ja Google Sheetsi tabelis.",
        "Selge. Mis võtab praegu kõige rohkem käsitööd?",
        "Duplikaatide kontrollimine, olekute uuendamine, andmete tabelite vahel liigutamine ja kinnituste saatmine.",
        "Saame vormid ja tabelid ühendada ning need kontrollid, uuendused ja sõnumid automatiseerida.",
        "Soovime ka, et rahaasjadest oleks lihtsam ülevaadet saada.",
        "Saame saabuvad andmed, kinnitused ja aruandluse tuua samasse töövoogu.",
        "Just seda meil vaja ongi.",
        "Suurepärane. Kõigepealt kaardistame praeguse protsessi ja seejärel automatiseerime osad, mis sinu tiimil päriselt aega säästavad.",
      ],
      pauseLabel: "Peata vestlus",
      resumeLabel: "Jätka vestlust",
      replayLabel: "Esita vestlus uuesti",
    },
    {
      relativePath: "ru/index.html",
      heading: "Обычный рабочий процесс начинается с разговора.",
      exampleLabel: "Пример диалога о рабочем процессе",
      ariaLabel: "Пример диалога о рабочем процессе между MTÜ Noortealgatuste Tugi и Vooglin",
      messages: [
        "Здравствуйте! Сейчас мы ведём заявки и часть финансов в нескольких формах и таблицах Google.",
        "Понятно. Что сейчас требует больше всего ручной работы?",
        "Проверка дубликатов, обновление статусов, перенос данных между таблицами и отправка подтверждений.",
        "Мы можем связать формы и таблицы, а затем автоматизировать проверки, обновления и сообщения.",
        "Мы также хотим, чтобы финансовую картину было проще отслеживать.",
        "Мы можем объединить входящие данные, согласования и отчётность в одном рабочем процессе.",
        "Именно это нам и нужно.",
        "Отлично. Сначала разберём текущий процесс, а затем автоматизируем те части, которые действительно экономят время вашей команды.",
      ],
      pauseLabel: "Приостановить диалог",
      resumeLabel: "Продолжить диалог",
      replayLabel: "Повторить диалог",
    },
  ];

  for (const homepage of homepages) {
    const html = await readFile(path.join(publicRoot, homepage.relativePath), "utf8");
    const messenger = html.match(/<section class="workflow-conversation[\s\S]*?<\/section>/)?.[0] || "";
    assert.equal((html.match(/\sdata-messenger(?:\s|>)/g) || []).length, 1);
    assert.equal((html.match(/\sdata-messenger-message(?:\s|>)/g) || []).length, 8);
    assert.equal((html.match(/<time datetime="17:3[1-8]">17:3[1-8]<\/time>/g) || []).length, 8);
    assert.match(html, /<ol class="messenger-thread" data-messenger-thread role="list">/);
    assert.match(html, /data-messenger-typing[^>]+aria-hidden="true" hidden/);
    const controlMarkup = html.match(/<button\s+class="messenger-control"[\s\S]*?<\/button>/)?.[0];
    assert.ok(controlMarkup, "the messenger control must be present");
    assert.match(controlMarkup, /\shidden\s*>/);
    assert.match(controlMarkup, /data-control-mode="pause"/);
    assert.match(controlMarkup, new RegExp(`aria-label="${homepage.pauseLabel}"`));
    assert.match(controlMarkup, /class="messenger-control-icon" aria-hidden="true"/);
    assert.match(controlMarkup, /data-messenger-control-label/);
    assert.doesNotMatch(controlMarkup, /aria-pressed/);
    assert.ok(html.includes(`data-messenger-window role="region" aria-label="${homepage.ariaLabel}" tabindex="0"`));
    assert.ok(html.includes(homepage.heading));
    assert.ok(html.includes(homepage.exampleLabel));
    homepage.messages.forEach((message) => assert.ok(html.includes(message), `${homepage.relativePath} must contain every localized message`));
    assert.ok(html.includes(`data-pause-label="${homepage.pauseLabel}"`));
    assert.ok(html.includes(`data-resume-label="${homepage.resumeLabel}"`));
    assert.ok(html.includes(`data-replay-label="${homepage.replayLabel}"`));
    assert.equal((messenger.match(/\/images\/partners\/noortealgatuste-tugi-logo\.png/g) || []).length, 6);
    assert.ok(html.includes("/vooglin-v-black.png"));
    assert.doesNotMatch(html, /class="messenger-intro"/);
    assert.doesNotMatch(html, /class="messenger-frame-footer"/);
    assert.doesNotMatch(html, /class="messenger-frame"[^>]*data-reveal/);
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
  assert.match(css, /\.workflow-conversation \{[\s\S]*?min-height: 100svh;[\s\S]*?padding: 0;/);
  assert.match(css, /\.messenger-layout \{[\s\S]*?min-height: 100svh;[\s\S]*?max-width: none;/);
  assert.match(css, /\.messenger-frame \{[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/);
  assert.match(css, /\.messenger-message \{[\s\S]*?width: min\(58%, 1050px\);/);
  assert.match(css, /\.messenger-participants \.messenger-avatar--organisation \{[\s\S]*?width: clamp\(62px, 5vw, 82px\);/);
  assert.match(css, /\.messenger-avatar--organisation img \{[\s\S]*?object-fit: contain;/);
  assert.match(css, /\.messenger-window \{[\s\S]*?overscroll-behavior-y: auto;/);
  assert.match(css, /\.messenger-window:focus-visible \{/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.messenger-window \{[\s\S]*?overflow-y: auto;/);
  const narrowViewportCss = css.match(/@media \(max-width: 480px\) \{([\s\S]*?)@media \(prefers-reduced-motion: reduce\)/)?.[1] || "";
  assert.doesNotMatch(narrowViewportCss, /\.messenger-(?:control|typing)[\s\S]*?display:\s*none/);
  assert.doesNotMatch(narrowViewportCss, /\.messenger-window[\s\S]*?overflow:\s*visible/);
  assert.match(javascript, /observer\?\.observe\(frame\)/, "the sequence must wait until the messenger frame is visible");
  assert.match(javascript, /control\.dataset\.controlMode = mode/);
  assert.match(javascript, /transcriptWindow\.scrollTo\(\{[\s\S]*?top: transcriptWindow\.scrollHeight,[\s\S]*?behavior,/);
  assert.match(javascript, /scrollTranscript\("smooth", true\)/);
});

test("the Estonian hero heading preserves complete words at every breakpoint", async () => {
  const [html, css] = await Promise.all([
    readFile(path.join(publicRoot, "et/index.html"), "utf8"),
    readFile(path.join(publicRoot, "styles.css"), "utf8"),
  ]);
  const heading = html.match(/<h1 id="hero-title">([\s\S]*?)<\/h1>/)?.[1];
  assert.equal(heading, "Praktiline automatiseerimine ettevõtetele ja organisatsioonidele.");
  assert.doesNotMatch(heading, /(?:&shy;|\u00ad|<wbr\b)/i);
  assert.match(css, /html\[lang="et"\] \.hero h1 \{[\s\S]*?overflow-wrap: normal;[\s\S]*?word-break: normal;[\s\S]*?hyphens: none;/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?html\[lang="et"\] \.hero h1 \{[\s\S]*?font-size: clamp\(31px, 9\.8vw, 49px\);/);
});

test("the Vooglin brand sculpture is minimal, clickable, and motion-safe", async () => {
  const labels = new Map([
    ["index.html", "Vooglin digital environment"],
    ["et/index.html", "Vooglini digitaalne keskkond"],
    ["ru/index.html", "Цифровая среда Vooglin"],
  ]);

  for (const [relativePath, label] of labels) {
    const html = await readFile(path.join(publicRoot, relativePath), "utf8");
    const sculpture = html.match(/<section class="brand-sculpture[\s\S]*?<\/section>/)?.[0];
    assert.ok(sculpture, `${relativePath} must include the brand sculpture`);
    assert.ok(sculpture.includes(label));
    assert.match(sculpture, /class="brand-sculpture-logo" href="#top" aria-label="[^"]+"/);
    assert.equal((sculpture.match(/class="brand-sculpture-client brand-sculpture-client--noorte"/g) || []).length, 1);
    assert.match(sculpture, /class="brand-sculpture-client brand-sculpture-client--noorte"[\s\S]*?href="https:\/\/noortetugi\.ee\/"[\s\S]*?aria-label="MTÜ Noortealgatuste Tugi"/);
    assert.equal((sculpture.match(/src="\/images\/partners\/noortealgatuste-tugi-logo\.png"/g) || []).length, 1);
    assert.match(sculpture, /data-brand-sculpture-control/);
    assert.match(sculpture, /data-pause-label="[^"]+"/);
    assert.match(sculpture, /data-resume-label="[^"]+"/);
    assert.equal((sculpture.match(/src="\/vooglin-v-black\.png"/g) || []).length, 2);
    assert.doesNotMatch(sculpture, /client-stage-(?:meta|copy)|client-motion-toggle|client-logo-action/);
    assert.doesNotMatch(sculpture, />\s*(?:noortetugi\.ee|MTÜ Noortealgatuste Tugi)\s*</i);
  }

  const [css, javascript] = await Promise.all([
    readFile(path.join(publicRoot, "styles.css"), "utf8"),
    readFile(path.join(publicRoot, "script.js"), "utf8"),
  ]);
  assert.match(css, /\.brand-sculpture-stage\[data-brand-motion="running"\]/);
  assert.match(css, /\.brand-sculpture-client \{[\s\S]*?animation: brand-client-drift/);
  assert.match(css, /@keyframes brand-client-drift/);
  assert.match(css, /\.brand-sculpture-control\[hidden\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.brand-sculpture-stage/);
  assert.match(javascript, /function initialiseBrandSculpture\(\)/);
  assert.match(javascript, /querySelectorAll\("\.brand-sculpture-logo, \.brand-sculpture-client"\)/);
  assert.match(javascript, /isUserPaused/);
  assert.match(javascript, /pauseForInteraction/);
  assert.match(javascript, /stage\.dataset\.brandMotion = staticMode/);
});
