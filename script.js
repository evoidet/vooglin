/*
 * ================================================================
 * VOOGLIN — EASY-TO-EDIT SITE CONTENT
 * The public identity and all service chapters live below.
 * Add, remove, or reorder service objects; the page updates itself.
 * ================================================================
 */
const siteConfig = {
  company: "VOOGLIN",
  email: "info@vooglin.ee",
};

const services = [
  {
    label: "REGISTRATIONS",
    title: "Applications, registrations and participants",
    description: "Create systems for collecting applications, registrations, participant information, confirmations, notifications, statuses, limits, waiting lists, reminders, and final statistics.",
    subtitle: "Keep every participant and application organised without repetitive manual copying.",
    outcomes: ["Automatic confirmations", "Participant status tracking", "Waiting lists and reminders"],
    code: "REG-01",
    icon: "◎",
    type: "registration",
    hash: "registrations",
    colors: ["#79d9ff", "#1768a6", "#061a3b"],
    ring: "rgba(111, 214, 255, .45)",
    size: 1.02,
    rings: false,
    layout: "left",
    entry: [-460, 110],
    exit: [360, -100],
    exitScale: 1.42,
  },
  {
    label: "FEEDBACK",
    title: "Surveys, feedback and results",
    description: "Collect feedback, organise responses, calculate results, create charts, group comments, and prepare clear summaries.",
    subtitle: "Turn scattered responses into useful information that is ready for reports and decisions.",
    outcomes: ["Automatic result calculations", "Charts and response summaries", "Report-ready statistics"],
    code: "FDB-02",
    icon: "⌁",
    type: "survey",
    hash: "feedback",
    colors: ["#d3a4ff", "#6c3d9b", "#1a113d"],
    ring: "rgba(211, 164, 255, .42)",
    size: .9,
    rings: false,
    layout: "right",
    entry: [470, -120],
    exit: [-360, 80],
    exitScale: 1.58,
  },
  {
    label: "DATA",
    title: "Tables, dashboards and reports",
    description: "Create structured working systems with calculations, statuses, warnings, filters, charts, dashboards, and management overviews.",
    subtitle: "See the important information clearly instead of searching through several disconnected files.",
    outcomes: ["Automatic calculations", "Status and warning systems", "Clear management dashboards"],
    code: "DAT-03",
    icon: "▦",
    type: "dashboard",
    hash: "reports",
    colors: ["#8e9dff", "#263d8b", "#080d27"],
    ring: "rgba(142, 157, 255, .45)",
    size: 1.08,
    rings: false,
    layout: "low",
    entry: [-70, 440],
    exit: [100, -380],
    exitScale: 1.5,
  },
  {
    label: "PROJECTS",
    title: "Tasks and deadlines",
    description: "Help teams track tasks, responsible people, deadlines, progress, reminders, missing documents, and overall project status.",
    subtitle: "Give the team one clear view of what is finished, what is late, and what needs attention.",
    outcomes: ["Task and deadline tracking", "Automatic reminders", "Project status overview"],
    code: "PRJ-04",
    icon: "◷",
    type: "tasks",
    hash: "tasks",
    colors: ["#d39cff", "#6a318d", "#1d0a38"],
    ring: "rgba(211, 156, 255, .46)",
    size: .95,
    rings: true,
    layout: "left",
    entry: [-480, -90],
    exit: [440, 160],
    exitScale: 1.48,
  },
  {
    label: "FINANCE",
    title: "Budgets, expenses and documents",
    description: "Organise planned budgets, actual expenses, remaining funds, invoices, receipts, missing documents, and information for a project manager or accountant.",
    subtitle: "Keep project expenses and supporting documents organised in one understandable system.",
    outcomes: ["Budget and expense tracking", "Missing-document checks", "Accountant-ready information"],
    note: "Vooglin organises information and automates workflows but does not provide accounting, tax, or legal services.",
    code: "FIN-05",
    icon: "◈",
    type: "finance",
    hash: "budget",
    colors: ["#f1c978", "#8e5a28", "#26150b"],
    ring: "rgba(241, 201, 120, .56)",
    size: 1.04,
    rings: true,
    layout: "right",
    entry: [500, 150],
    exit: [-440, -120],
    exitScale: 1.46,
  },
  {
    label: "COMMUNICATION",
    title: "Automated documents and emails",
    description: "Create personalised emails, documents, PDFs, certificates, notifications, templates, and organised file records automatically.",
    subtitle: "Create repetitive documents and messages faster while keeping the process consistent.",
    outcomes: ["Personalised email generation", "Automatic PDFs and certificates", "Organised document records"],
    code: "COM-06",
    icon: "▤",
    type: "documents",
    hash: "documents",
    colors: ["#ff9f91", "#a9414d", "#351022"],
    ring: "rgba(255, 159, 145, .45)",
    size: .88,
    rings: false,
    layout: "high",
    entry: [-80, -430],
    exit: [130, 400],
    exitScale: 1.56,
  },
  {
    label: "WEB",
    title: "Websites and forms",
    description: "Create responsive project pages, landing pages, forms, contact sections, domains, mobile adaptation, and publishing.",
    subtitle: "Give clients and participants a clear online place to find information and submit requests.",
    outcomes: ["Responsive landing pages", "Integrated forms", "Domain and publishing setup"],
    code: "WEB-07",
    icon: "◇",
    type: "web",
    hash: "websites",
    colors: ["#72c8ff", "#2458b0", "#071837"],
    ring: "rgba(114, 200, 255, .48)",
    size: 1,
    rings: false,
    layout: "left",
    entry: [-470, 20],
    exit: [510, -50],
    exitScale: 1.52,
  },
  {
    label: "AUTOMATION",
    title: "Integrations and workflow automation",
    description: "Connect forms, spreadsheets, email, documents, tasks, reports, Google Workspace, n8n, Make, Zapier, and other suitable tools into one workflow.",
    subtitle: "Connect separate tools so information moves automatically from one step to the next.",
    outcomes: ["Connected applications", "Automatic data transfer", "Complete workflow automation"],
    code: "AUT-08",
    icon: "⌬",
    type: "integration",
    hash: "integrations",
    colors: ["#8bffbd", "#208269", "#052b32"],
    ring: "rgba(139, 255, 189, .52)",
    size: 1.16,
    rings: true,
    layout: "finale",
    entry: [0, 470],
    exit: [0, -520],
    exitScale: 1.68,
  },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCompactDevice = () => window.matchMedia("(max-width: 700px)").matches;
const qualityProfiles = {
  high: { dprDesktop: 1.5, dprMobile: 1.25, textureSizes: [768, 1024, 1254], starFactor: 1, dustDesktop: 18, dustMobile: 8 },
  balanced: { dprDesktop: 1.25, dprMobile: 1.1, textureSizes: [768, 1024], starFactor: .72, dustDesktop: 10, dustMobile: 5 },
  performance: { dprDesktop: 1, dprMobile: 1, textureSizes: [768], starFactor: .46, dustDesktop: 4, dustMobile: 0 },
};

function chooseInitialQuality() {
  if (reducedMotion || navigator.connection?.saveData) return "performance";
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (memory <= 2 || cores <= 2) return "performance";
  if (isCompactDevice() || memory <= 4 || cores <= 4) return "balanced";
  return "high";
}

let qualityLevel = chooseInitialQuality();
document.documentElement.dataset.quality = qualityLevel;

/* Apply the public identity from one central config object. */
function applySiteConfig() {
  document.querySelectorAll(".brand > span:last-child").forEach((element) => {
    element.textContent = siteConfig.company;
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `mailto:${siteConfig.email}`;
  });

  const footerEmail = document.querySelector(".footer-email");
  if (footerEmail) footerEmail.innerHTML = `${siteConfig.email} <span>↗</span>`;

  const contactEmail = document.querySelector(".contact-email");
  if (contactEmail) contactEmail.textContent = siteConfig.email;
}

/* Keep addressable service anchors without turning them into a long scrub timeline. */
const triggerContainer = document.querySelector("[data-service-triggers]");
services.forEach((service, index) => {
  const trigger = document.createElement("div");
  trigger.className = "service-trigger";
  trigger.id = service.hash;
  trigger.dataset.index = index;
  trigger.setAttribute("aria-hidden", "true");
  triggerContainer.appendChild(trigger);
});

const planetSystem = document.querySelector("[data-planet-system]");
const incomingSystem = document.querySelector("[data-incoming-system]");
const planetImage = document.querySelector("[data-planet-image]");
const incomingPlanetImage = document.querySelector("[data-incoming-planet-image]");
const serviceCard = document.querySelector(".service-card");
const titleElement = document.querySelector("[data-service-title]");
const descriptionElement = document.querySelector("[data-service-description]");
const subtitleElement = document.querySelector("[data-service-subtitle]");
const numberElement = document.querySelector("[data-service-number]");
const iconElement = document.querySelector("[data-service-icon]");
const codeElement = document.querySelector("[data-service-code]");
const statusElement = document.querySelector(".service-status");
const examplesLabelElement = document.querySelector(".service-examples-label");
const tagsElement = document.querySelector("[data-service-tags]");
const noteElement = document.querySelector("[data-service-note]");
const serviceActionsElement = document.querySelector(".service-actions");
const progressLabel = document.querySelector("[data-progress-label]");
const progressBar = document.querySelector("[data-progress-bar]");
const journey = document.querySelector("[data-journey]");
const journeyStage = document.querySelector(".journey-stage");
const previousServiceButton = document.querySelector("[data-service-prev]");
const nextServiceButton = document.querySelector("[data-service-next]");
const heroCopy = document.querySelector(".hero-copy");
const heroMeta = document.querySelector(".hero-meta");
let currentService = -1;
let currentIncomingService = -1;
let incomingCompactMode = null;
let incomingDetailMode = null;
const decodedPlanetAssets = new Set();
let preparedPlanetKey = "";
let preparedPlanetPromise = Promise.resolve();
let preparedPlanetImage = null;
let serviceTransitionActive = false;
let serviceTransitionSerial = 0;
let journeyEscaping = false;
const activeServiceAnimations = new Set();

const layoutPositions = {
  left: [27, 50],
  right: [73, 50],
  low: [76, 63],
  high: [74, 36],
  finale: [24, 50],
};

function servicePosition(service) {
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  const tablet = window.matchMedia("(max-width: 900px)").matches;
  const short = window.matchMedia("(max-height: 760px)").matches;
  if (mobile && window.matchMedia("(max-height: 700px)").matches) return [50, 7];
  if (mobile) return [50, 24];
  if (tablet && short) return ["right", "low", "high"].includes(service.layout) ? [79, 50] : [21, 50];
  if (tablet) return [50, 18];
  return layoutPositions[service.layout] || layoutPositions.left;
}

function planetAsset(type, size) {
  return `assets/planets/${type}-${size}.webp`;
}

function renderPlanetAsset(image, service, preview = false) {
  const renderKey = preview ? `${service.type}:preview` : `${service.type}:${qualityLevel}`;
  if (!image || image.dataset.renderKey === renderKey) return;
  image.dataset.planet = service.type;
  image.dataset.renderKey = renderKey;

  if (preview) {
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = planetAsset(service.type, 320);
    return;
  }

  const textureSizes = qualityProfiles[qualityLevel].textureSizes;
  image.srcset = textureSizes
    .map((size) => `${planetAsset(service.type, size)} ${size}w`)
    .join(", ");
  image.sizes = "(max-width: 600px) 86vw, (max-width: 900px) 58vw, 48vw";
  image.src = planetAsset(service.type, 768);
}

/* Keep only the next full render explicitly primed and decoded. */
function primePlanetAsset(service) {
  if (!service) return Promise.resolve();
  const preloadKey = `${service.type}:${qualityLevel}`;
  if (decodedPlanetAssets.has(preloadKey)) return Promise.resolve();
  if (preparedPlanetKey === preloadKey) return preparedPlanetPromise;

  const loader = new Image();
  preparedPlanetKey = preloadKey;
  preparedPlanetImage = loader;
  loader.decoding = "async";
  loader.srcset = qualityProfiles[qualityLevel].textureSizes
    .map((size) => `${planetAsset(service.type, size)} ${size}w`)
    .join(", ");
  loader.sizes = "(max-width: 600px) 86vw, (max-width: 900px) 58vw, 48vw";

  const loaded = new Promise((resolve) => {
    loader.addEventListener("load", resolve, { once: true });
    loader.addEventListener("error", resolve, { once: true });
  });
  loader.src = planetAsset(service.type, 768);

  const decoded = typeof loader.decode === "function"
    ? loader.decode().catch(() => loaded)
    : loaded;
  preparedPlanetPromise = Promise.resolve(decoded).then(() => {
    decodedPlanetAssets.add(preloadKey);
    if (incomingSystem.dataset.type === service.type) incomingSystem.dataset.detailReady = "true";
  });
  return preparedPlanetPromise;
}

function renderServiceContent(index) {
  const nextService = services[index];
  if (!nextService) return;
  const [a] = nextService.colors;
  serviceCard.style.setProperty("--planet-a", a);
  journeyStage.dataset.layout = nextService.layout;
  titleElement.textContent = nextService.title;
  descriptionElement.textContent = nextService.description;
  subtitleElement.textContent = nextService.subtitle;
  iconElement.textContent = nextService.icon;
  codeElement.textContent = nextService.code;
  numberElement.textContent = `${String(index + 1).padStart(2, "0")} / ${nextService.label}`;
  tagsElement.replaceChildren(...nextService.outcomes.map((outcome) => {
    const item = document.createElement("li");
    item.textContent = outcome;
    return item;
  }));
  noteElement.hidden = !nextService.note;
  noteElement.textContent = nextService.note || "";
}

function renderService(index) {
  const nextService = services[index];
  if (!nextService) return;
  const [a, b, c] = nextService.colors;
  const [left, top] = servicePosition(nextService);
  planetSystem.style.setProperty("--planet-a", a);
  planetSystem.style.setProperty("--planet-b", b);
  planetSystem.style.setProperty("--planet-c", c);
  planetSystem.style.setProperty("--ring-color", nextService.ring);
  planetSystem.style.setProperty("--planet-scale-base", nextService.size);
  planetSystem.dataset.rings = String(nextService.rings);
  planetSystem.dataset.type = nextService.type;
  planetSystem.style.left = `${left}%`;
  planetSystem.style.top = `${top}%`;
  renderPlanetAsset(planetImage, nextService);
  renderServiceContent(index);
  currentService = index;
}

/* The stable preview stays low-detail; it is promoted only after its full asset decodes. */
function renderIncomingService(index, detailed = false) {
  const compact = window.matchMedia("(max-width: 900px)").matches;
  if (index === currentIncomingService && compact === incomingCompactMode && detailed === incomingDetailMode) return;
  currentIncomingService = index;
  incomingCompactMode = compact;
  incomingDetailMode = detailed;

  if (index < 0 || !services[index]) {
    incomingSystem.dataset.active = "false";
    incomingPlanetImage.removeAttribute("src");
    incomingPlanetImage.removeAttribute("data-planet");
    return;
  }

  const service = services[index];
  const [a, b, c] = service.colors;
  const [left, top] = servicePosition(service);
  incomingSystem.style.setProperty("--incoming-a", a);
  incomingSystem.style.setProperty("--incoming-b", b);
  incomingSystem.style.setProperty("--incoming-c", c);
  incomingSystem.style.setProperty("--incoming-ring", service.ring);
  incomingSystem.style.left = `${left}%`;
  incomingSystem.style.top = `${top}%`;
  incomingSystem.dataset.rings = String(service.rings);
  incomingSystem.dataset.type = service.type;
  incomingSystem.dataset.active = "true";
  incomingSystem.dataset.detailReady = String(decodedPlanetAssets.has(`${service.type}:${qualityLevel}`));
  renderPlanetAsset(incomingPlanetImage, service, !detailed);
  if (!detailed) primePlanetAsset(service);
}

function setQualityLevel(nextLevel) {
  if (!qualityProfiles[nextLevel] || nextLevel === qualityLevel) return;
  qualityLevel = nextLevel;
  document.documentElement.dataset.quality = qualityLevel;
  planetImage.removeAttribute("data-render-key");
  if (currentService >= 0) renderPlanetAsset(planetImage, services[currentService]);
  if (currentIncomingService >= 0) primePlanetAsset(services[currentIncomingService]);
  resizeSpace();
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from, to, amount) => from + (to - from) * amount;
const smoothstep = (start, end, value) => {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};
const smootherstep = (start, end, value) => {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
};
const powerIn = (start, end, value, power = 2) => Math.pow(clamp((value - start) / (end - start)), power);
const stagedVisibility = (value, enterStart, enterEnd, exitStart, exitEnd) => {
  const enter = smootherstep(enterStart, enterEnd, value);
  const exit = smootherstep(exitStart, exitEnd, value);
  return clamp(enter * (1 - exit));
};

function setReveal(element, visibility, distance = 9) {
  if (!element) return;
  const amount = reducedMotion ? 1 : visibility;
  element.style.opacity = String(amount);
  element.style.transform = `translate3d(0, ${mix(distance, 0, amount).toFixed(2)}px, 0)`;
}

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function serviceContentElements() {
  return [
    statusElement,
    numberElement,
    iconElement,
    titleElement,
    descriptionElement,
    subtitleElement,
    examplesLabelElement,
    ...tagsElement.children,
    noteElement,
    serviceActionsElement,
  ].filter((element) => element && !element.hidden);
}

function setServiceContentVisibility(visibility) {
  serviceContentElements().forEach((element) => {
    element.style.opacity = String(visibility);
    element.style.transform = `translate3d(0, ${visibility ? 0 : 10}px, 0)`;
  });
}

function playServiceAnimation(element, keyframes, options) {
  if (!element) return null;
  const animation = element.animate(keyframes, { fill: "both", ...options });
  activeServiceAnimations.add(animation);
  animation.finished.catch(() => {});
  return animation;
}

function cancelServiceAnimations() {
  activeServiceAnimations.forEach((animation) => animation.cancel());
  activeServiceAnimations.clear();
}

function updateServiceControls(index) {
  const previousLabel = previousServiceButton.querySelector("b");
  const nextLabel = nextServiceButton.querySelector("b");
  previousLabel.textContent = index === 0 ? "Overview" : "Previous";
  nextLabel.textContent = index === services.length - 1 ? "Continue" : "Next";
  previousServiceButton.setAttribute("aria-label", index === 0 ? "Back to service overview" : `Previous service: ${services[index - 1].title}`);
  nextServiceButton.setAttribute("aria-label", index === services.length - 1 ? "Continue to the service directory" : `Next service: ${services[index + 1].title}`);
  progressLabel.textContent = String(index + 1).padStart(2, "0");
  progressBar.style.setProperty("--journey-progress", (index + 1) / services.length);
}

function setIncomingPreview(index) {
  renderIncomingService(index);
  if (!services[index]) {
    incomingSystem.style.setProperty("--incoming-opacity", 0);
    return;
  }

  const preview = services[index];
  const horizontalFactor = isCompactDevice() ? .17 : .24;
  const verticalFactor = isCompactDevice() ? .16 : .2;
  incomingSystem.style.setProperty("--incoming-x", `${preview.entry[0] * horizontalFactor}px`);
  incomingSystem.style.setProperty("--incoming-y", `${preview.entry[1] * verticalFactor}px`);
  incomingSystem.style.setProperty("--incoming-scale", preview.size * (isCompactDevice() ? .13 : .16));
  incomingSystem.style.setProperty("--incoming-opacity", isCompactDevice() ? .2 : .28);
  incomingSystem.style.setProperty("--incoming-rotation", `${index % 2 ? -1.8 : 1.4}deg`);
}

function applyStableServiceState(index) {
  const service = services[index];
  if (!service) return;
  renderService(index);
  planetSystem.style.setProperty("--journey-x", "0px");
  planetSystem.style.setProperty("--journey-y", "0px");
  planetSystem.style.setProperty("--journey-scale", service.size);
  planetSystem.style.setProperty("--journey-opacity", .96);
  planetSystem.style.setProperty("--journey-rotation", `${index % 2 ? -.35 : .35}deg`);
  planetSystem.style.setProperty("--atmosphere-opacity", .2);
  serviceCard.style.setProperty("--card-opacity", 1);
  serviceCard.style.setProperty("--card-shift", "0px");
  serviceCard.style.setProperty("--card-x", "0px");
  serviceCard.style.setProperty("--card-scale", 1);
  serviceCard.style.setProperty("--status-fill", 1);
  setServiceContentVisibility(1);
  setIncomingPreview(index < services.length - 1 ? index + 1 : -1);
  updateServiceControls(index);
  journeyStage.style.setProperty("--orbit-shift", `${(index - 3.5) * .42}deg`);
  journeyStage.dataset.serviceIndex = String(index);
  journeyStage.dataset.transitioning = "false";
  journeyStage.setAttribute("aria-busy", "false");
}

function contentExitAnimations(duration) {
  const lowerContent = [examplesLabelElement, ...tagsElement.children, noteElement, serviceActionsElement, subtitleElement, descriptionElement];
  const titleContent = [titleElement, iconElement];
  const markerContent = [numberElement, statusElement];
  return [
    ...lowerContent.map((element, index) => !element?.hidden && playServiceAnimation(element, [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(0, -8px, 0)" },
    ], { duration, delay: index * 12, easing: "cubic-bezier(.55, 0, .8, .45)" })),
    ...titleContent.map((element, index) => playServiceAnimation(element, [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(0, -12px, 0)" },
    ], { duration, delay: duration * .35 + index * 14, easing: "cubic-bezier(.55, 0, .8, .45)" })),
    ...markerContent.map((element, index) => playServiceAnimation(element, [
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
      { opacity: 0, transform: "translate3d(0, -6px, 0)" },
    ], { duration: duration * .72, delay: duration * .55 + index * 12, easing: "ease-in" })),
  ].filter(Boolean);
}

function contentEntranceAnimations(duration) {
  const plans = [
    [titleElement, 0, 12],
    [numberElement, 15, 7],
    [statusElement, 25, 6],
    [iconElement, 35, 8],
    [descriptionElement, 75, 10],
    [subtitleElement, 125, 9],
    [examplesLabelElement, 170, 7],
    ...Array.from(tagsElement.children).map((element, index) => [element, 190 + index * 25, 6]),
    [noteElement, 220, 6],
    [serviceActionsElement, 250, 7],
  ];
  return plans
    .filter(([element]) => element && !element.hidden)
    .map(([element, delay, distance]) => playServiceAnimation(element, [
      { opacity: 0, transform: `translate3d(0, ${distance}px, 0)` },
      { opacity: 1, transform: "translate3d(0, 0, 0)" },
    ], { duration, delay: reducedMotion ? delay * .35 : delay, easing: "cubic-bezier(.22, 1, .36, 1)" }));
}

async function transitionToService(targetIndex, updateHistory = true) {
  if (serviceTransitionActive || !services[targetIndex] || targetIndex === currentService) return;
  const fromIndex = currentService;
  const outgoing = services[fromIndex];
  const incoming = services[targetIndex];
  const serial = ++serviceTransitionSerial;
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const duration = reducedMotion ? 360 : compact ? 720 : 820;
  serviceTransitionActive = true;
  journeyStage.dataset.transitioning = "true";
  journeyStage.setAttribute("aria-busy", "true");

  await Promise.race([primePlanetAsset(incoming), wait(140)]);
  if (serial !== serviceTransitionSerial) return;
  renderIncomingService(targetIndex, true);
  if (typeof incomingPlanetImage.decode === "function") {
    await Promise.race([incomingPlanetImage.decode().catch(() => {}), wait(60)]);
  }
  if (serial !== serviceTransitionSerial) return;

  const horizontalFactor = compact ? .24 : .5;
  const verticalFactor = compact ? .22 : .48;
  const outgoingEndX = reducedMotion ? 0 : outgoing.exit[0] * horizontalFactor;
  const outgoingEndY = reducedMotion ? 0 : outgoing.exit[1] * verticalFactor;
  const incomingStartX = reducedMotion ? 0 : incoming.entry[0] * horizontalFactor;
  const incomingStartY = reducedMotion ? 0 : incoming.entry[1] * verticalFactor;
  const outgoingScale = reducedMotion ? outgoing.size * .97 : outgoing.size * outgoing.exitScale;
  const incomingScale = reducedMotion ? incoming.size * .92 : incoming.size * (compact ? .2 : .16);
  const easing = reducedMotion ? "cubic-bezier(.22, .8, .3, 1)" : "cubic-bezier(.64, .02, .26, 1)";

  const planetAnimations = [
    playServiceAnimation(planetSystem, [
      { opacity: .96, transform: `translate3d(-50%, -50%, 0) scale(${outgoing.size}) rotate(0deg)` },
      { opacity: reducedMotion ? 0 : .1, transform: `translate3d(calc(-50% + ${outgoingEndX}px), calc(-50% + ${outgoingEndY}px), 0) scale(${outgoingScale}) rotate(${reducedMotion ? 0 : 3.2}deg)` },
    ], { duration, easing }),
    playServiceAnimation(incomingSystem, [
      { opacity: reducedMotion ? 0 : .22, transform: `translate3d(calc(-50% + ${incomingStartX}px), calc(-50% + ${incomingStartY}px), 0) scale(${incomingScale}) rotate(${reducedMotion ? 0 : -2.4}deg)` },
      { opacity: .96, transform: `translate3d(-50%, -50%, 0) scale(${incoming.size}) rotate(0deg)` },
    ], { duration: duration * .84, delay: duration * .16, easing: "cubic-bezier(.2, .72, .24, 1)" }),
  ];

  const exitAnimations = contentExitAnimations(reducedMotion ? 90 : 190);
  await wait(reducedMotion ? 105 : 315);
  if (serial !== serviceTransitionSerial) return;
  exitAnimations.forEach((animation) => animation.cancel());
  renderServiceContent(targetIndex);
  setServiceContentVisibility(0);
  const entranceAnimations = contentEntranceAnimations(reducedMotion ? 150 : 250);

  await Promise.allSettled([
    ...planetAnimations,
    ...entranceAnimations,
  ].filter(Boolean).map((animation) => animation.finished));
  if (serial !== serviceTransitionSerial) return;

  cancelServiceAnimations();
  applyStableServiceState(targetIndex);
  serviceTransitionActive = false;
  if (updateHistory) {
    const nextHash = `#${incoming.hash}`;
    if (window.location.hash !== nextHash) history.pushState({ service: targetIndex }, "", nextHash);
  }
}

function cancelServiceTransition() {
  serviceTransitionSerial += 1;
  cancelServiceAnimations();
  serviceTransitionActive = false;
  journeyStage.dataset.transitioning = "false";
  journeyStage.setAttribute("aria-busy", "false");
}

function journeyIsControlled() {
  const stageRect = journeyStage.getBoundingClientRect();
  const journeyRect = journey.getBoundingClientRect();
  return journeyRect.top <= 1 && journeyRect.bottom >= window.innerHeight * .92 && stageRect.top <= 1 && stageRect.bottom >= window.innerHeight - 2;
}

function exitJourney(direction, updateHistory = true) {
  if (journeyEscaping) return;
  journeyEscaping = true;
  const movingForward = direction > 0;
  const target = movingForward ? document.querySelector("#all-services") : document.querySelector("#services");
  const hash = movingForward ? "#all-services" : "#services";
  if (updateHistory && window.location.hash !== hash) history.pushState({}, "", hash);
  target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  window.setTimeout(() => {
    journeyEscaping = false;
    updatePageState();
  }, reducedMotion ? 80 : 850);
}

function requestServiceStep(direction) {
  if (serviceTransitionActive || !direction) return;
  const targetIndex = currentService + direction;
  if (!services[targetIndex]) {
    exitJourney(direction);
    return;
  }
  transitionToService(targetIndex);
}

function updatePageState() {
  const rect = journey.getBoundingClientRect();
  const heroProgress = smootherstep(0, 1, clamp(window.scrollY / (window.innerHeight * .72)));
  heroCopy.style.opacity = String(1 - heroProgress);
  heroCopy.style.transform = `translate3d(0, ${-heroProgress * 54}px, 0)`;
  heroMeta.style.opacity = String(1 - heroProgress * 1.35);
  document.body.classList.toggle("journey-active", rect.top < window.innerHeight && rect.bottom > 0);
  document.body.classList.toggle("journey-controlled", journeyIsControlled() && !journeyEscaping);
  document.body.classList.toggle("past-journey", rect.bottom < window.innerHeight * .4);
}

function serviceIndexFromHash(hash = window.location.hash) {
  const value = hash.replace(/^#/, "");
  return services.findIndex((service) => service.hash === value);
}

function serviceScrollTarget(index) {
  const journeyTop = window.scrollY + journey.getBoundingClientRect().top;
  return journeyTop + 1;
}

function navigateToService(index, behavior = "instant") {
  if (!services[index]) return;
  cancelServiceTransition();
  applyStableServiceState(index);
  const top = serviceScrollTarget(index);
  if (behavior === "instant") {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    updatePageState();
    queueMicrotask(() => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });
    return;
  }
  window.scrollTo({ top, behavior });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-service-jump]");
  if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const index = Number(link.dataset.serviceJump);
  if (!services[index]) return;
  event.preventDefault();
  const nextHash = `#${services[index].hash}`;
  if (window.location.hash !== nextHash) history.pushState({ service: index }, "", nextHash);
  navigateToService(index);
});

function navigateToStaticHash(hash = window.location.hash) {
  const targetId = decodeURIComponent(hash.replace(/^#/, ""));
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return false;
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  cancelServiceTransition();
  document.documentElement.style.scrollBehavior = "auto";
  target.scrollIntoView();
  updatePageState();
  queueMicrotask(() => {
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
  return true;
}

window.addEventListener("popstate", () => {
  const index = serviceIndexFromHash();
  if (index >= 0) {
    navigateToService(index);
    return;
  }
  navigateToStaticHash();
});

applyStableServiceState(0);
updatePageState();
const initialServiceIndex = serviceIndexFromHash();
if (initialServiceIndex >= 0) {
  const openInitialService = () => navigateToService(initialServiceIndex, "instant");
  openInitialService();
  window.addEventListener("load", openInitialService, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(openInitialService);
} else if (window.location.hash) {
  const openInitialSection = () => navigateToStaticHash();
  openInitialSection();
  window.addEventListener("load", openInitialSection, { once: true });
}

previousServiceButton.addEventListener("click", () => requestServiceStep(-1));
nextServiceButton.addEventListener("click", () => requestServiceStep(1));

let wheelIntent = 0;
let wheelArmed = true;
let wheelIdleTimer = null;
window.addEventListener("wheel", (event) => {
  if (event.ctrlKey || journeyEscaping || !journeyIsControlled()) return;
  event.preventDefault();
  window.clearTimeout(wheelIdleTimer);
  wheelIdleTimer = window.setTimeout(() => {
    wheelIntent = 0;
    wheelArmed = true;
  }, 190);
  if (!wheelArmed || serviceTransitionActive) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
  wheelIntent += event.deltaY * unit;
  if (Math.abs(wheelIntent) < 26) return;
  const direction = Math.sign(wheelIntent);
  wheelIntent = 0;
  wheelArmed = false;
  requestServiceStep(direction);
}, { passive: false });

document.addEventListener("keydown", (event) => {
  if (journeyEscaping || !journeyIsControlled()) return;
  if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;
  let direction = 0;
  if (["ArrowDown", "PageDown"].includes(event.key)) direction = 1;
  if (["ArrowUp", "PageUp"].includes(event.key)) direction = -1;
  if (event.key === " ") {
    if (event.target.closest("a, button")) return;
    direction = event.shiftKey ? -1 : 1;
  }
  if (!direction) return;
  event.preventDefault();
  if (!event.repeat) requestServiceStep(direction);
});

let touchStartY = null;
let touchStartedInJourney = false;
document.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1 || journeyEscaping || !journeyIsControlled()) return;
  touchStartY = event.touches[0].clientY;
  touchStartedInJourney = true;
}, { passive: true });

document.addEventListener("touchmove", (event) => {
  if (!touchStartedInJourney || touchStartY === null) return;
  event.preventDefault();
}, { passive: false });

document.addEventListener("touchend", (event) => {
  if (!touchStartedInJourney || touchStartY === null) return;
  const endY = event.changedTouches[0]?.clientY ?? touchStartY;
  const distance = touchStartY - endY;
  touchStartY = null;
  touchStartedInJourney = false;
  if (Math.abs(distance) >= (isCompactDevice() ? 38 : 48)) requestServiceStep(Math.sign(distance));
}, { passive: true });

document.addEventListener("touchcancel", () => {
  touchStartY = null;
  touchStartedInJourney = false;
}, { passive: true });

/* Hide the main header after launch; reveal it when the user travels upward. */
const header = document.querySelector("[data-header]");
let lastScrollY = 0;
let pageFrame = null;
window.addEventListener("scroll", () => {
  const currentY = window.scrollY;
  const hasLaunched = currentY > 100;
  header.classList.toggle("is-hidden", hasLaunched && currentY > lastScrollY - 2);
  if (!hasLaunched) header.classList.remove("is-hidden");
  lastScrollY = currentY;

  if (!pageFrame) {
    pageFrame = requestAnimationFrame(() => {
      updatePageState();
      pageFrame = null;
    });
  }
}, { passive: true });

/* Pointer glow, subtle hero parallax, and magnetic interactive controls. */
const cursorGlow = document.querySelector(".cursor-glow");
const heroSun = document.querySelector(".hero-sun");

if (window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
  document.body.classList.add("has-pointer");
  window.addEventListener("pointermove", (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
    const x = (event.clientX / window.innerWidth - .5) * 14;
    const y = (event.clientY / window.innerHeight - .5) * 10;
    heroSun.style.setProperty("--sun-pointer-x", `${x}px`);
    heroSun.style.setProperty("--sun-pointer-y", `${y}px`);
  }, { passive: true });

  document.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .13;
      const y = (event.clientY - rect.top - rect.height / 2) * .13;
      item.style.transform = `translate(${x}px, ${y}px)`;
    });
    item.addEventListener("pointerleave", () => {
      item.style.transform = "translate(0, 0)";
    });
  });
}

/* Lightweight canvas star field: capped density on smaller devices. */
const canvas = document.querySelector("#space-canvas");
const context = canvas.getContext("2d", { alpha: true });
let stars = [];
let spaceDust = [];
let shootingStars = [];
let animationFrame = null;
let width = 0;
let height = 0;
let pixelRatio = 1;
let previousFrameTime = 0;
let sampledFrames = 0;
let slowFrames = 0;

function monitorFrameRate(time) {
  if (!previousFrameTime) {
    previousFrameTime = time;
    return;
  }
  const frameDuration = time - previousFrameTime;
  previousFrameTime = time;
  if (frameDuration <= 0 || frameDuration >= 250 || document.hidden) return;
  sampledFrames += 1;
  if (frameDuration > 28) slowFrames += 1;
  if (sampledFrames < 120) return;

  const repeatedlySlow = slowFrames >= 24;
  sampledFrames = 0;
  slowFrames = 0;
  if (!repeatedlySlow) return;
  if (qualityLevel === "high") setQualityLevel("balanced");
  else if (qualityLevel === "balanced") setQualityLevel("performance");
}

function resizeSpace() {
  width = window.innerWidth;
  height = window.innerHeight;
  const profile = qualityProfiles[qualityLevel];
  pixelRatio = Math.min(window.devicePixelRatio || 1, isCompactDevice() ? profile.dprMobile : profile.dprDesktop);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const baseStarCount = reducedMotion
    ? 60
    : isCompactDevice()
      ? Math.min(180, Math.max(110, Math.round((width * height) / 2500)))
      : Math.min(480, Math.max(300, Math.round((width * height) / 3500)));
  const starCount = reducedMotion ? baseStarCount : Math.round(baseStarCount * profile.starFactor);
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.15 + .15,
    alpha: Math.random() * .7 + .16,
    speed: Math.random() * .075 + .015,
    phase: Math.random() * Math.PI * 2,
    depth: Math.random() * .82 + .18,
  }));

  const dustCount = reducedMotion ? 0 : isCompactDevice() ? profile.dustMobile : profile.dustDesktop;
  spaceDust = Array.from({ length: dustCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.2 + .5,
    alpha: Math.random() * .11 + .025,
    drift: Math.random() * .12 + .025,
    phase: Math.random() * Math.PI * 2,
  }));

  if (!serviceTransitionActive && currentService >= 0) applyStableServiceState(currentService);
  updatePageState();
}

function spawnShootingStar() {
  if (reducedMotion || qualityLevel !== "high" || isCompactDevice() || document.hidden || Math.random() > .0045) return;
  shootingStars.push({
    x: Math.random() * width * .7,
    y: -20,
    length: 70 + Math.random() * 100,
    speed: 8 + Math.random() * 5,
    life: 1,
  });
}

function drawSpace(time = 0) {
  monitorFrameRate(time);
  context.clearRect(0, 0, width, height);
  const scrollShift = (window.scrollY * .018) % height;

  spaceDust.forEach((particle) => {
    particle.y -= particle.drift;
    particle.x += Math.sin(time * .00035 + particle.phase) * .025;
    if (particle.y < -5) particle.y = height + 5;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(141, 190, 255, ${particle.alpha})`;
    context.fill();
  });

  stars.forEach((star) => {
    star.y += star.speed;
    if (star.y > height) star.y = 0;
    const y = (star.y + scrollShift * star.depth) % height;
    const twinkle = reducedMotion ? 1 : .72 + Math.sin(time * .0014 + star.phase) * .28;
    context.beginPath();
    context.arc(star.x, y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(214, 224, 255, ${star.alpha * twinkle})`;
    context.fill();
  });

  spawnShootingStar();
  shootingStars = shootingStars.filter((star) => star.life > 0);
  shootingStars.forEach((star) => {
    const gradient = context.createLinearGradient(star.x, star.y, star.x - star.length, star.y - star.length * .55);
    gradient.addColorStop(0, `rgba(170, 247, 255, ${star.life})`);
    gradient.addColorStop(1, "rgba(170, 247, 255, 0)");
    context.beginPath();
    context.moveTo(star.x, star.y);
    context.lineTo(star.x - star.length, star.y - star.length * .55);
    context.strokeStyle = gradient;
    context.lineWidth = 1.1;
    context.stroke();
    star.x += star.speed;
    star.y += star.speed * .55;
    star.life -= .018;
  });

  if (!reducedMotion) animationFrame = requestAnimationFrame(drawSpace);
}

resizeSpace();
drawSpace();
window.addEventListener("resize", resizeSpace, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  previousFrameTime = 0;
  if (!document.hidden && !reducedMotion && !animationFrame) animationFrame = requestAnimationFrame(drawSpace);
});

if ("IntersectionObserver" in window) {
  document.body.classList.add("motion-observer");
  const regionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      document.body.classList.toggle(`${entry.target.dataset.motionRegion}-visible`, entry.isIntersecting);
    });
  }, { rootMargin: "0px", threshold: .01 });
  document.querySelectorAll("[data-motion-region]").forEach((region) => regionObserver.observe(region));
}

applySiteConfig();
document.querySelector("[data-year]").textContent = new Date().getFullYear();
