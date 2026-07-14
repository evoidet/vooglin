/*
 * ================================================================
 * NOVA SYSTEMS — EASY-TO-EDIT SITE CONTENT
 * Replace the placeholder identity and service objects below.
 * Add, remove, or reorder service objects; the page updates itself.
 * ================================================================
 */
const siteConfig = {
  company: "NOVA//SYSTEMS", // PLACEHOLDER: your company name
  email: "hello@yourcompany.com", // PLACEHOLDER: your email
};

const services = [
  {
    title: "Workflow Automation",
    description: "Connect the tools you already use and let routine work move itself from start to finish.",
    tags: ["System design", "API connections", "No-code"],
    icon: "⌁",
    colors: ["#a88aff", "#4a22aa", "#100a35"],
    ring: "rgba(201, 180, 255, .55)",
    size: 1.0,
    rings: true,
  },
  {
    title: "Forms & Sheets Systems",
    description: "Turn submissions and spreadsheets into dependable operations with validation, routing, and live reporting.",
    tags: ["Google Workspace", "Dashboards", "Data flows"],
    icon: "⊞",
    colors: ["#5fffd1", "#087a74", "#062a39"],
    ring: "rgba(95, 255, 209, .42)",
    size: 0.88,
    rings: false,
  },
  {
    title: "AI Integrations",
    description: "Put language models to practical work: classify, extract, draft, assist, and act inside your real processes.",
    tags: ["Applied AI", "Agents", "Knowledge systems"],
    icon: "✦",
    colors: ["#ffb86b", "#c24425", "#35101b"],
    ring: "rgba(255, 184, 107, .46)",
    size: 1.08,
    rings: true,
  },
  {
    title: "Website Development",
    description: "Fast, focused websites and web tools that feel distinctive, communicate clearly, and convert attention into action.",
    tags: ["Web design", "Development", "Interactive UI"],
    icon: "◇",
    colors: ["#72b7ff", "#164caf", "#08163e"],
    ring: "rgba(114, 183, 255, .5)",
    size: 0.94,
    rings: false,
  },
  {
    title: "Business Process Automation",
    description: "Map complex operations, remove friction, and build a scalable backbone across teams, tools, and decisions.",
    tags: ["Process mapping", "Operations", "Scale"],
    icon: "⌬",
    colors: ["#eb72ff", "#7e198f", "#2a073b"],
    ring: "rgba(235, 114, 255, .44)",
    size: 1.12,
    rings: true,
  },
  {
    title: "Event Registration Systems",
    description: "Create a seamless path from registration to confirmation, attendance, follow-up, and useful event insight.",
    tags: ["Registration", "Ticketing", "Notifications"],
    icon: "◎",
    colors: ["#ffdb66", "#bb6d13", "#3b1d0a"],
    ring: "rgba(255, 219, 102, .5)",
    size: 0.82,
    rings: true,
  },
  {
    title: "Document & Email Automation",
    description: "Generate polished documents and send the right message at the right moment, without the copy-paste loop.",
    tags: ["Documents", "Email flows", "Templates"],
    icon: "▤",
    colors: ["#77e7ff", "#16798f", "#062b42"],
    ring: "rgba(119, 231, 255, .48)",
    size: 0.97,
    rings: false,
  },
  {
    title: "Support & Training",
    description: "Clear documentation, calm technical support, and hands-on training so your new system becomes second nature.",
    tags: ["Enablement", "Documentation", "Ongoing care"],
    icon: "△",
    colors: ["#86ff9d", "#278c5a", "#092f2a"],
    ring: "rgba(134, 255, 157, .42)",
    size: 0.9,
    rings: true,
  },
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactDevice = window.matchMedia("(max-width: 700px)").matches;

/* Apply the placeholder identity from one central config object. */
function applySiteConfig() {
  document.querySelectorAll(".brand > span:last-child").forEach((element) => {
    const [first, second = "SYSTEMS"] = siteConfig.company.split("//");
    element.innerHTML = `${first}<span class="brand-dim">//</span>${second}`;
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `mailto:${siteConfig.email}`;
  });

  const footerEmail = document.querySelector(".footer-email");
  if (footerEmail) footerEmail.innerHTML = `${siteConfig.email} <span>↗</span>`;
}

/* Generate scroll trigger panels from the service data. */
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
const progressLabel = document.querySelector("[data-progress-label]");
const progressBar = document.querySelector("[data-progress-bar]");
let currentService = 0;
let transitionTimer = null;

function renderService(index, immediate = false) {
  if (index === currentService && !immediate) return;
  const nextService = services[index];
  if (!nextService) return;

  clearTimeout(transitionTimer);
  const changeContent = () => {
    const [a, b, c] = nextService.colors;
    planetSystem.style.setProperty("--planet-a", a);
    planetSystem.style.setProperty("--planet-b", b);
    planetSystem.style.setProperty("--planet-c", c);
    planetSystem.style.setProperty("--ring-color", nextService.ring);
    planetSystem.style.setProperty("--planet-size", `calc(clamp(290px, 37vw, 590px) * ${nextService.size})`);
    planetSystem.dataset.rings = String(nextService.rings);
    serviceCard.style.setProperty("--planet-a", a);

    titleElement.textContent = nextService.title;
    descriptionElement.textContent = nextService.description;
    iconElement.textContent = nextService.icon;
    numberElement.textContent = `${String(index + 1).padStart(2, "0")} / ${String(services.length).padStart(2, "0")}`;
    progressLabel.textContent = String(index + 1).padStart(2, "0");
    progressBar.style.width = `${((index + 1) / services.length) * 100}%`;
    tagsElement.replaceChildren(...nextService.tags.map((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      return chip;
    }));

    planetSystem.classList.remove("is-exiting");
    serviceCard.classList.remove("is-exiting");
    planetSystem.classList.add("is-entering");
    serviceCard.classList.add("is-entering");
    window.setTimeout(() => {
      planetSystem.classList.remove("is-entering");
      serviceCard.classList.remove("is-entering");
    }, 950);
    currentService = index;
  };

  if (immediate || reducedMotion) {
    changeContent();
    return;
  }

  planetSystem.classList.add("is-exiting");
  serviceCard.classList.add("is-exiting");
  createPlanetBurst(nextService.colors[0]);
  transitionTimer = window.setTimeout(changeContent, 380);
}

/* Particle burst sells the planet-to-cosmic-dust transition. */
function createPlanetBurst(color) {
  if (reducedMotion || compactDevice) return;
  const rect = planetSystem.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const count = Math.min(52, Math.round(window.innerWidth / 24));
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement("i");
    const angle = (Math.PI * 2 * index) / count + Math.random() * .25;
    const distance = rect.width * (.35 + Math.random() * .68);
    particle.className = "burst-particle";
    particle.style.left = `${centerX + (Math.random() - .5) * rect.width * .35}px`;
    particle.style.top = `${centerY + (Math.random() - .5) * rect.height * .35}px`;
    particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--size", `${2 + Math.random() * 5}px`);
    particle.style.setProperty("--color", Math.random() > .3 ? color : "#ffffff");
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
    fragment.appendChild(particle);
  }
  document.body.appendChild(fragment);
}

const serviceObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) renderService(Number(visible.target.dataset.index));
}, { rootMargin: "-38% 0px -38% 0px", threshold: 0 });

document.querySelectorAll(".service-trigger").forEach((trigger) => serviceObserver.observe(trigger));
renderService(0, true);

/* Hide the header shortly after launch; reveal it on upward travel. */
const header = document.querySelector("[data-header]");
let lastScrollY = 0;
window.addEventListener("scroll", () => {
  const currentY = window.scrollY;
  const hasLaunched = currentY > 100;
  header.classList.toggle("is-hidden", hasLaunched && currentY > lastScrollY - 2);
  if (!hasLaunched) header.classList.remove("is-hidden");
  lastScrollY = currentY;
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

  const starCount = reducedMotion ? 60 : Math.min(compactDevice ? 95 : 180, Math.round((width * height) / 7200));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.15 + .15,
    alpha: Math.random() * .7 + .16,
    speed: Math.random() * .075 + .015,
    phase: Math.random() * Math.PI * 2,
  }));
}

function spawnShootingStar() {
  if (reducedMotion || compactDevice || document.hidden || Math.random() > .007) return;
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

  stars.forEach((star) => {
    star.y += star.speed;
    if (star.y > height) star.y = 0;
    const y = (star.y + scrollShift) % height;
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
