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
    label: "Applications and events",
    title: "Applications, Registrations and Events",
    description: "Registration systems that collect applications, organise participant information, and keep the full event flow under control.",
    outcomes: ["Confirmations and notifications", "Limits, statuses and waiting lists", "Reminders and final statistics"],
    icon: "◎",
    type: "registration",
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
    label: "Surveys and results",
    title: "Surveys, Feedback and Results",
    description: "Collect feedback, organise responses, calculate results, group comments, and turn raw answers into clear summaries.",
    outcomes: ["Automatic result calculations", "Charts and visual summaries", "Organised comment groups"],
    icon: "⌁",
    type: "survey",
    colors: ["#80ffe2", "#167d82", "#082d45"],
    ring: "rgba(128, 255, 226, .42)",
    size: .9,
    rings: false,
    layout: "right",
    entry: [470, -120],
    exit: [-360, 80],
    exitScale: .38,
  },
  {
    label: "Tables and reports",
    title: "Tables, Dashboards and Reports",
    description: "Create one clear working system for data, calculations, statuses, warnings, filters, charts, and management overviews.",
    outcomes: ["Structured working tables", "Live warnings and statuses", "Clear dashboards and reports"],
    icon: "▦",
    type: "dashboard",
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
    label: "Tasks and deadlines",
    title: "Tasks and Deadlines",
    description: "Help teams track tasks, responsible people, deadlines, progress, reminders, missing items, and overall project status.",
    outcomes: ["Clear ownership and priorities", "Deadline and reminder flows", "At-a-glance project progress"],
    icon: "◷",
    type: "tasks",
    colors: ["#d39cff", "#6a318d", "#1d0a38"],
    ring: "rgba(211, 156, 255, .46)",
    size: .95,
    rings: true,
    layout: "left",
    entry: [-480, -90],
    exit: [440, 160],
    exitScale: .42,
  },
  {
    label: "Budgets and expenses",
    title: "Budgets, Expenses and Financial Documents",
    description: "Organise planned budgets, actual expenses, remaining funds, document status, and missing invoices or receipts.",
    outcomes: ["Planned versus actual overview", "Document and receipt status", "Accountant-ready information"],
    note: "Vooglin organises and automates information; it does not provide accounting, tax, or legal services.",
    icon: "◈",
    type: "finance",
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
    label: "Documents and emails",
    title: "Automated Documents and Emails",
    description: "Automatically create personalised emails, documents, PDFs, certificates, notifications, and organised file records.",
    outcomes: ["Personalised documents and PDFs", "Timed emails and notifications", "Consistent organised records"],
    icon: "▤",
    type: "documents",
    colors: ["#ff9f91", "#a9414d", "#351022"],
    ring: "rgba(255, 159, 145, .45)",
    size: .88,
    rings: false,
    layout: "high",
    entry: [-80, -430],
    exit: [130, 400],
    exitScale: .34,
  },
  {
    label: "Websites and forms",
    title: "Websites and Forms",
    description: "Build simple responsive project pages and landing pages with forms, contact information, domains, and reliable publishing.",
    outcomes: ["Responsive project pages", "Forms connected to workflows", "Domain and publishing support"],
    icon: "◇",
    type: "web",
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
    label: "Complete automation",
    title: "Integrations and Complete Automation",
    description: "Connect forms, spreadsheets, email, documents, tasks, reports, Google Workspace, n8n, Make, Zapier, and other suitable tools.",
    outcomes: ["Connected end-to-end workflows", "Less copying between tools", "One scalable operating system"],
    icon: "⌬",
    type: "integration",
    colors: ["#8bffbd", "#208269", "#052b32"],
    ring: "rgba(139, 255, 189, .52)",
    size: 1.16,
    rings: true,
    layout: "finale",
    entry: [0, 470],
    exit: [0, -520],
    exitScale: .28,
  },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCompactDevice = () => window.matchMedia("(max-width: 700px)").matches;

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

/* Generate generous scroll chapters from the service data. */
const triggerContainer = document.querySelector("[data-service-triggers]");
services.forEach((service, index) => {
  const trigger = document.createElement("div");
  trigger.className = "service-trigger";
  trigger.dataset.index = index;
  trigger.setAttribute("aria-hidden", "true");
  triggerContainer.appendChild(trigger);
});

const planetSystem = document.querySelector("[data-planet-system]");
const serviceCard = document.querySelector(".service-card");
const titleElement = document.querySelector("[data-service-title]");
const descriptionElement = document.querySelector("[data-service-description]");
const numberElement = document.querySelector("[data-service-number]");
const iconElement = document.querySelector("[data-service-icon]");
const tagsElement = document.querySelector("[data-service-tags]");
const noteElement = document.querySelector("[data-service-note]");
const progressLabel = document.querySelector("[data-progress-label]");
const progressBar = document.querySelector("[data-progress-bar]");
const journey = document.querySelector("[data-journey]");
const journeyStage = document.querySelector(".journey-stage");
const heroCopy = document.querySelector(".hero-copy");
const heroMeta = document.querySelector(".hero-meta");
let currentService = -1;

function renderService(index) {
  if (index === currentService) return;
  const nextService = services[index];
  if (!nextService) return;

  const [a, b, c] = nextService.colors;
  planetSystem.style.setProperty("--planet-a", a);
  planetSystem.style.setProperty("--planet-b", b);
  planetSystem.style.setProperty("--planet-c", c);
  planetSystem.style.setProperty("--ring-color", nextService.ring);
  planetSystem.style.setProperty("--planet-scale-base", nextService.size);
  planetSystem.dataset.rings = String(nextService.rings);
  planetSystem.dataset.type = nextService.type;
  journeyStage.dataset.layout = nextService.layout;
  serviceCard.style.setProperty("--planet-a", a);

  titleElement.textContent = nextService.title;
  descriptionElement.textContent = nextService.description;
  iconElement.textContent = nextService.icon;
  numberElement.textContent = `${String(index + 1).padStart(2, "0")} / ${String(services.length).padStart(2, "0")} · ${nextService.label}`;
  progressLabel.textContent = String(index + 1).padStart(2, "0");
  tagsElement.replaceChildren(...nextService.outcomes.map((outcome) => {
    const item = document.createElement("li");
    item.textContent = outcome;
    return item;
  }));

  noteElement.hidden = !nextService.note;
  noteElement.textContent = nextService.note || "";
  currentService = index;
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from, to, amount) => from + (to - from) * amount;
const smoothstep = (start, end, value) => {
  const progress = clamp((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
};

/*
 * The user's scroll position is the timeline: no timers, carousel, or explosions.
 * Every chapter has an approach, readable hold, and departure phase.
 */
function updateJourney() {
  const rect = journey.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  const journeyProgress = clamp(-rect.top / scrollable);
  const chapterPosition = journeyProgress * services.length;
  const index = Math.min(services.length - 1, Math.floor(chapterPosition));
  const chapterProgress = index === services.length - 1 && journeyProgress === 1
    ? 1
    : chapterPosition - index;
  const service = services[index];

  renderService(index);

  const enter = smoothstep(0, .24, chapterProgress);
  const depart = smoothstep(.72, 1, chapterProgress);
  const planetOpacity = reducedMotion ? 1 : clamp(enter * (1 - depart) * 1.35);
  const cardEnter = smoothstep(.16, .34, chapterProgress);
  const cardDepart = smoothstep(.62, .8, chapterProgress);
  const cardOpacity = reducedMotion ? 1 : clamp(cardEnter * (1 - cardDepart) * 1.45);
  const cardEntryX = ["right", "low", "high"].includes(service.layout) ? -68 : 68;
  const cardExitX = cardEntryX * -.65;
  const cardX = mix(cardEntryX, 0, cardEnter) + cardExitX * cardDepart;
  const deviceFactor = isCompactDevice() ? .44 : 1;
  const verticalFactor = isCompactDevice() ? .42 : 1;
  const journeyX = mix(service.entry[0] * deviceFactor, 0, enter) + service.exit[0] * deviceFactor * depart;
  const journeyY = mix(service.entry[1] * verticalFactor, 0, enter) + service.exit[1] * verticalFactor * depart;
  const approachScale = mix(.42, 1, enter);
  const journeyScale = mix(approachScale, service.exitScale, depart) * service.size;

  planetSystem.style.setProperty("--journey-x", `${reducedMotion ? 0 : journeyX}px`);
  planetSystem.style.setProperty("--journey-y", `${reducedMotion ? 0 : journeyY}px`);
  planetSystem.style.setProperty("--journey-scale", reducedMotion ? service.size : journeyScale);
  planetSystem.style.setProperty("--journey-opacity", reducedMotion ? 1 : planetOpacity);
  planetSystem.style.setProperty("--journey-rotation", `${reducedMotion ? 0 : mix(-7, 8, chapterProgress)}deg`);
  serviceCard.style.setProperty("--card-opacity", cardOpacity);
  serviceCard.style.setProperty("--card-x", `${reducedMotion ? 0 : cardX}px`);
  serviceCard.style.setProperty("--card-shift", `${reducedMotion ? 0 : mix(30, -24, cardEnter) + cardDepart * 30}px`);
  progressBar.style.width = `${clamp(chapterPosition / services.length) * 100}%`;

  const heroProgress = clamp(window.scrollY / (window.innerHeight * .72));
  heroCopy.style.opacity = String(1 - heroProgress);
  heroCopy.style.transform = `translateY(${-heroProgress * 54}px)`;
  heroMeta.style.opacity = String(1 - heroProgress * 1.35);
  document.body.classList.toggle("journey-active", rect.top < window.innerHeight && rect.bottom > 0);
  document.body.classList.toggle("past-journey", rect.bottom < window.innerHeight * .4);
}

renderService(0);
updateJourney();

/* Hide the main header after launch; reveal it when the user travels upward. */
const header = document.querySelector("[data-header]");
let lastScrollY = 0;
let journeyFrame = null;
window.addEventListener("scroll", () => {
  const currentY = window.scrollY;
  const hasLaunched = currentY > 100;
  header.classList.toggle("is-hidden", hasLaunched && currentY > lastScrollY - 2);
  if (!hasLaunched) header.classList.remove("is-hidden");
  lastScrollY = currentY;

  if (!journeyFrame) {
    journeyFrame = requestAnimationFrame(() => {
      updateJourney();
      journeyFrame = null;
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
    heroSun.style.marginRight = `${x}px`;
    heroSun.style.marginTop = `${y}px`;
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

function resizeSpace() {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const starCount = reducedMotion ? 60 : Math.min(isCompactDevice() ? 95 : 190, Math.round((width * height) / 6800));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.15 + .15,
    alpha: Math.random() * .7 + .16,
    speed: Math.random() * .075 + .015,
    phase: Math.random() * Math.PI * 2,
    depth: Math.random() * .82 + .18,
  }));

  const dustCount = reducedMotion ? 0 : isCompactDevice() ? 12 : 28;
  spaceDust = Array.from({ length: dustCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2.2 + .5,
    alpha: Math.random() * .11 + .025,
    drift: Math.random() * .12 + .025,
    phase: Math.random() * Math.PI * 2,
  }));

  updateJourney();
}

function spawnShootingStar() {
  if (reducedMotion || isCompactDevice() || document.hidden || Math.random() > .007) return;
  shootingStars.push({
    x: Math.random() * width * .7,
    y: -20,
    length: 70 + Math.random() * 100,
    speed: 8 + Math.random() * 5,
    life: 1,
  });
}

function drawSpace(time = 0) {
  context.clearRect(0, 0, width, height);
  const scrollShift = (window.scrollY * .018) % height;

  const nebulaX = width * (.25 + Math.sin(time * .00007) * .04);
  const nebulaY = height * (.42 + Math.cos(time * .00006) * .05);
  const nebula = context.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, Math.max(width, height) * .62);
  nebula.addColorStop(0, "rgba(81, 45, 145, .055)");
  nebula.addColorStop(.42, "rgba(31, 72, 126, .025)");
  nebula.addColorStop(1, "rgba(2, 4, 10, 0)");
  context.fillStyle = nebula;
  context.fillRect(0, 0, width, height);

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
  if (document.hidden && animationFrame) cancelAnimationFrame(animationFrame);
  if (!document.hidden && !reducedMotion) animationFrame = requestAnimationFrame(drawSpace);
});

applySiteConfig();
document.querySelector("[data-year]").textContent = new Date().getFullYear();
