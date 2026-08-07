const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const year = document.querySelector("[data-year]");
const mainContent = document.querySelector("main");
const footer = document.querySelector("footer");
const networkCanvases = document.querySelectorAll("[data-wordmark-network]");
const cosmicCanvases = document.querySelectorAll("[data-cosmic-field]");

if (year) {
  year.textContent = new Date().getFullYear();
}

function setPageInert(shouldBeInert) {
  if (mainContent) mainContent.inert = shouldBeInert;
  if (footer) footer.inert = shouldBeInert;
}

function closeMenu(restoreFocus = false) {
  if (!header || !menuToggle) return;

  header.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  setPageInert(false);
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("span").textContent = menuToggle.dataset.menuLabel || "Menu";

  if (restoreFocus) menuToggle.focus();
}

if (header && menuToggle) {
  menuToggle.addEventListener("click", () => {
    const shouldOpen = !header.classList.contains("is-open");

    header.classList.toggle("is-open", shouldOpen);
    document.body.classList.toggle("menu-open", shouldOpen);
    setPageInert(shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.querySelector("span").textContent = shouldOpen
      ? (menuToggle.dataset.closeLabel || "Close")
      : (menuToggle.dataset.menuLabel || "Menu");

    if (shouldOpen) {
      requestAnimationFrame(() => mobileLinks[0]?.focus());
    }
  });

  mobileLinks.forEach((link) => link.addEventListener("click", () => closeMenu(false)));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu(true);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMenu();
  });
}

const siteConfig = window.vooglinSiteConfig || { stats: {}, collaborations: [] };
const pageLocale = document.documentElement.lang || "en";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function formatEstimate(value, forceWholeNumber = false) {
  const useDecimal = !forceWholeNumber && value < 10 && !Number.isInteger(value);
  return new Intl.NumberFormat(pageLocale, {
    maximumFractionDigits: useDecimal ? 1 : 0,
  }).format(value);
}

function initialiseSavingsCalculator() {
  const calculator = document.querySelector("[data-savings-calculator]");
  if (!calculator) return;

  const inputs = Array.from(calculator.querySelectorAll("[data-calculator-input]"));
  const resultsPanel = calculator.querySelector(".calculator-results");
  const liveStatus = calculator.querySelector("[data-calculator-live]");
  const resultElements = new Map(
    Array.from(calculator.querySelectorAll("[data-result]"))
      .map((element) => [element.dataset.result, element])
  );
  let latestSavings = null;

  function updateInput(input) {
    const value = Number(input.value);
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const progress = ((value - minimum) / (maximum - minimum)) * 100;
    const output = input.closest(".calculator-field")?.querySelector("[data-range-output]");

    input.style.setProperty("--range-progress", `${progress}%`);
    if (output) {
      const number = output.querySelector("[data-range-number]");
      if (number) number.textContent = formatEstimate(value, true);
    }
  }

  function updateResult(name, value, forceWholeNumber = false) {
    const element = resultElements.get(name);
    if (element) element.textContent = formatEstimate(value, forceWholeNumber);
  }

  function calculateSavings(animate = true) {
    const values = Object.fromEntries(
      inputs.map((input) => [input.name, Number(input.value)])
    );
    const weeklySaved = values.weeklyManualHours * values.people * (values.automationPercentage / 100);
    const monthlySaved = weeklySaved * 4.33;
    const yearlySaved = weeklySaved * 52;
    const workingDaysSaved = yearlySaved / 8;
    latestSavings = { yearlySaved, workingDaysSaved };

    updateResult("weekly", weeklySaved);
    updateResult("monthly", monthlySaved);
    updateResult("yearly", yearlySaved, true);
    updateResult("yearlySecondary", yearlySaved, true);
    updateResult("days", workingDaysSaved);

    if (animate && !prefersReducedMotion.matches && typeof resultsPanel?.animate === "function") {
      resultsPanel.animate(
        [
          { opacity: 0.88, transform: "translateY(2px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 180, easing: "ease-out" }
      );
    }
  }

  function announceSavings() {
    if (!liveStatus || !latestSavings) return;
    const template = liveStatus.dataset.template || "";
    liveStatus.textContent = template
      .replace("{hours}", formatEstimate(latestSavings.yearlySaved, true))
      .replace("{days}", formatEstimate(latestSavings.workingDaysSaved));
  }

  inputs.forEach((input) => {
    updateInput(input);
    input.addEventListener("input", () => {
      updateInput(input);
      calculateSavings();
    });
    input.addEventListener("change", announceSavings);
  });

  calculateSavings(false);
}

function animateCounter(element, target) {
  if (prefersReducedMotion.matches || typeof requestAnimationFrame !== "function") {
    element.textContent = new Intl.NumberFormat(pageLocale).format(target);
    return;
  }

  const duration = 720;
  let startTime;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * easedProgress);
    element.textContent = new Intl.NumberFormat(pageLocale).format(current);

    if (progress < 1) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

function initialiseStatistics() {
  const section = document.querySelector("[data-statistics-section]");
  if (!section) return;

  const stats = siteConfig.stats || {};
  const visibleCards = Array.from(section.querySelectorAll("[data-stat-card]"))
    .map((card) => ({
      card,
      value: Number(stats[card.dataset.statCard]),
      number: card.querySelector("[data-stat-value]"),
    }))
    .filter(({ value, number }) => Number.isFinite(value) && value > 0 && number);

  if (!visibleCards.length) return;

  visibleCards.forEach(({ card }) => {
    card.hidden = false;
  });
  section.hidden = false;

  let hasAnimated = false;
  const showCounters = () => {
    if (hasAnimated) return;
    hasAnimated = true;
    visibleCards.forEach(({ number, value }) => animateCounter(number, Math.round(value)));
  };

  if (typeof IntersectionObserver !== "function") {
    showCounters();
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    showCounters();
  }, { threshold: 0.2 });

  observer.observe(section);
}

function localisedConfigText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[pageLocale] || value.en || value.et || value.ru || "";
}

function safeWebUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value, document.baseURI);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function initialiseCollaborations() {
  const section = document.querySelector("[data-collaborations-section]");
  const grid = section?.querySelector("[data-collaboration-grid]");
  const collaborations = Array.isArray(siteConfig.collaborations)
    ? siteConfig.collaborations.filter((item) => localisedConfigText(item?.name))
    : [];

  if (!section || !grid || !collaborations.length) return;

  collaborations.forEach((item) => {
    const name = localisedConfigText(item.name);
    const description = localisedConfigText(item.description);
    const website = safeWebUrl(item.url);
    const card = document.createElement(website ? "a" : "div");
    const inner = document.createElement("div");
    const nameElement = document.createElement("strong");

    card.className = "collaboration-card";
    inner.className = "collaboration-card-inner";
    nameElement.textContent = name;

    if (website) card.href = website;

    if (typeof item.logo === "string" && item.logo.trim()) {
      const image = document.createElement("img");
      image.src = item.logo;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      inner.append(image);
    }

    inner.append(nameElement);

    if (description) {
      const descriptionElement = document.createElement("small");
      descriptionElement.textContent = description;
      inner.append(descriptionElement);
    }

    card.append(inner);
    grid.append(card);
  });

  section.hidden = false;
}

initialiseSavingsCalculator();
initialiseStatistics();
initialiseCollaborations();

function createWordmarkNetwork(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const isContactVariant = canvas.dataset.networkVariant === "contact";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const trackSteps = 180;
  const trackPoints = new Float32Array((trackSteps + 1) * 2);
  const nodes = Array.from({ length: 7 }, () => ({ x: 0, y: 0 }));
  const tau = Math.PI * 2;
  const loopDuration = isContactVariant ? 28000 : 18000;
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";

  let width = 0;
  let height = 0;
  let policyWidth = 0;
  let centerX = 0;
  let centerY = 0;
  let radiusX = 0;
  let radiusY = 0;
  let nodeCount = 7;
  let frameRate = 30;
  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let resizeFrame = 0;
  let isInView = !supportsIntersectionObserver;
  let isDestroyed = false;

  function writePoint(target, phase) {
    const sine = Math.sin(phase);
    target.x = centerX + (radiusX * sine);
    target.y = centerY + (radiusY * sine * Math.cos(phase));
  }

  function rebuildTrack() {
    for (let index = 0; index <= trackSteps; index += 1) {
      const phase = (index / trackSteps) * tau;
      const sine = Math.sin(phase);
      const pointIndex = index * 2;

      trackPoints[pointIndex] = centerX + (radiusX * sine);
      trackPoints[pointIndex + 1] = centerY + (radiusY * sine * Math.cos(phase));
    }
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = bounds.width;
    height = bounds.height;
    policyWidth = isContactVariant ? (canvas.parentElement?.clientWidth || width) : width;
    centerX = width * (isContactVariant ? 0.5 : 0.47);
    centerY = height * 0.51;
    radiusX = Math.min(width * 0.43, isContactVariant ? 480 : 540);
    radiusY = height * (isContactVariant ? 0.62 : 0.72);
    nodeCount = isContactVariant ? (policyWidth < 720 ? 2 : 3) : policyWidth < 720 ? 5 : 7;
    frameRate = isContactVariant ? 20 : policyWidth < 720 ? 24 : 30;
    canvas.dataset.networkNodes = String(nodeCount);
    canvas.dataset.networkFps = String(frameRate);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    rebuildTrack();
    draw(elapsed);
  }

  function drawTrack() {
    context.beginPath();
    context.moveTo(trackPoints[0], trackPoints[1]);

    for (let index = 1; index <= trackSteps; index += 1) {
      const pointIndex = index * 2;
      context.lineTo(trackPoints[pointIndex], trackPoints[pointIndex + 1]);
    }

    context.strokeStyle = "rgba(247, 247, 242, 0.17)";
    context.lineWidth = 0.8;
    context.stroke();
  }

  function drawAnchors() {
    const anchorIndexes = [0, 45, 135];
    context.strokeStyle = "rgba(247, 247, 242, 0.38)";
    context.lineWidth = 0.75;

    for (const index of anchorIndexes) {
      const pointIndex = index * 2;
      const x = trackPoints[pointIndex];
      const y = trackPoints[pointIndex + 1];
      context.strokeRect(x - 2.25, y - 2.25, 4.5, 4.5);
    }
  }

  function drawConnections() {
    const maximumDistance = Math.min(width * 0.21, 168);

    for (let firstIndex = 0; firstIndex < nodeCount; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < nodeCount; secondIndex += 1) {
        const first = nodes[firstIndex];
        const second = nodes[secondIndex];
        const deltaX = first.x - second.x;
        const deltaY = first.y - second.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance >= maximumDistance) continue;

        const strength = 1 - (distance / maximumDistance);
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = `rgba(247, 247, 242, ${0.055 + (strength * 0.13)})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
    }
  }

  function drawNodes() {
    for (let index = 0; index < nodeCount; index += 1) {
      const node = nodes[index];
      const isSignal = index === 0;
      const size = isSignal ? 5 : 3;

      context.fillStyle = isSignal ? "#ddff6a" : "rgba(247, 247, 242, 0.82)";
      context.fillRect(node.x - (size / 2), node.y - (size / 2), size, size);
    }
  }

  function draw(time) {
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);
    drawTrack();
    drawAnchors();

    const basePhase = ((time % loopDuration) / loopDuration) * tau;
    for (let index = 0; index < nodeCount; index += 1) {
      writePoint(nodes[index], basePhase + ((index / nodeCount) * tau));
    }

    if (!isContactVariant) drawConnections();
    drawNodes();
  }

  function stopAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
  }

  function canAnimate() {
    return (
      isInView
      && !document.hidden
      && !reducedMotion.matches
      && !saveData
      && !lowMemory
      && policyWidth >= 340
    );
  }

  function animate(timestamp) {
    if (!canAnimate()) {
      stopAnimation();
      return;
    }

    const frameInterval = 1000 / frameRate;
    if (!lastFrame) lastFrame = timestamp;
    const delta = timestamp - lastFrame;

    if (delta >= frameInterval) {
      elapsed += Math.min(delta, 50);
      lastFrame = timestamp - (delta % frameInterval);
      draw(elapsed);
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (isDestroyed) return;

    stopAnimation();

    if (canAnimate()) {
      canvas.dataset.networkState = "running";
      animationFrame = requestAnimationFrame(animate);
    } else {
      const usesStaticFrame = reducedMotion.matches || saveData || lowMemory || policyWidth < 340;
      canvas.dataset.networkState = usesStaticFrame ? "static" : "paused";
      draw(elapsed || loopDuration * 0.18);
    }
  }

  function handleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
      syncAnimation();
    });
  }

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(handleResize)
    : null;

  if (resizeObserver) {
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", handleResize, { passive: true });
  }

  const visibilityObserver = supportsIntersectionObserver
    ? new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        syncAnimation();
      }, { rootMargin: "80px" })
    : null;

  visibilityObserver?.observe(canvas);

  const handleMotionChange = syncAnimation;
  const handleVisibilityChange = syncAnimation;
  const handlePageHide = stopAnimation;
  const handlePageShow = syncAnimation;
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);

  resizeCanvas();
  syncAnimation();

  return {
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stopAnimation();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", handleResize);
      if (typeof reducedMotion.removeEventListener === "function") {
        reducedMotion.removeEventListener("change", handleMotionChange);
      } else {
        reducedMotion.removeListener(handleMotionChange);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    },
  };
}

networkCanvases.forEach(createWordmarkNetwork);

function createCosmicField(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const variant = canvas.dataset.cosmicVariant || "hero";
  const settingsByVariant = {
    hero: {
      counts: [24, 16, 10],
      frameRates: [30, 24, 20],
      lifetime: [9000, 18000],
      particleAlpha: 0.78,
      ringAlpha: 1,
    },
    pricing: {
      counts: [16, 11, 8],
      frameRates: [24, 22, 20],
      lifetime: [12000, 22000],
      particleAlpha: 0.58,
      ringAlpha: 0.72,
    },
    privacy: {
      counts: [12, 8, 6],
      frameRates: [24, 20, 18],
      lifetime: [15000, 26000],
      particleAlpha: 0.46,
      ringAlpha: 0.58,
    },
  };
  const settings = settingsByVariant[variant] || settingsByVariant.hero;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  const particles = [];
  const tau = Math.PI * 2;
  const sourceWidth = 1672;
  const sourceHeight = 940;
  const sourceHoleX = 1515;
  const sourceHoleY = 479;
  const orbitScaleY = 0.68;
  const particlePoint = { x: 0, y: 0 };
  const particleTail = { x: 0, y: 0 };

  let width = 0;
  let height = 0;
  let policyWidth = 0;
  let holeX = 0;
  let holeY = 0;
  let horizonRadius = 22;
  let particleCount = 0;
  let frameRate = 24;
  let sceneTime = 4200;
  let lastFrame = 0;
  let animationFrame = 0;
  let resizeFrame = 0;
  let isInView = !supportsIntersectionObserver;
  let isDestroyed = false;

  function randomBetween(minimum, maximum) {
    return minimum + (Math.random() * (maximum - minimum));
  }

  function respawnParticle(particle, initialProgress = 0) {
    let startX = 0;
    let startY = 0;
    let startRadius = 0;
    let attempts = 0;

    do {
      startX = randomBetween(width * 0.02, width * 0.98);
      startY = randomBetween(height * 0.04, height * 0.96);
      const deltaX = startX - holeX;
      const deltaY = (startY - holeY) / orbitScaleY;
      startRadius = Math.hypot(deltaX, deltaY);
      attempts += 1;
    } while (startRadius < horizonRadius * 4.2 && attempts < 12);

    particle.startRadius = Math.max(startRadius, horizonRadius * 4.2);
    particle.startAngle = Math.atan2((startY - holeY) / orbitScaleY, startX - holeX);
    particle.direction = Math.random() > 0.5 ? 1 : -1;
    particle.turns = randomBetween(0.22, 0.58);
    particle.lifetime = randomBetween(settings.lifetime[0], settings.lifetime[1]);
    particle.age = particle.lifetime * initialProgress;
    particle.size = randomBetween(0.7, 1.85);
    particle.opacity = randomBetween(0.38, 0.92) * settings.particleAlpha;
    particle.signal = Math.random() > 0.9;
  }

  function rebuildParticles() {
    const tier = policyWidth <= 480 ? 2 : policyWidth < 900 ? 1 : 0;
    particleCount = settings.counts[tier];
    frameRate = settings.frameRates[tier];

    while (particles.length < particleCount) particles.push({});
    particles.length = particleCount;
    particles.forEach((particle, index) => {
      const progress = (index + Math.random()) / Math.max(1, particleCount);
      respawnParticle(particle, Math.min(progress, 0.96));
    });

    canvas.dataset.cosmicParticles = String(particleCount);
    canvas.dataset.cosmicFps = String(frameRate);
  }

  function mapBlackHole() {
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const mobileShift = policyWidth <= 720
      ? Math.min(82, Math.max(56, policyWidth * 0.19))
      : 0;

    holeX = width - (sourceWidth * scale) + (sourceHoleX * scale) + mobileShift;
    holeY = ((height - (sourceHeight * scale)) / 2) + (sourceHoleY * scale);
    horizonRadius = Math.max(18, Math.min(44, 18 * scale * 1.22));
  }

  function pointAtProgress(particle, progress, target) {
    const fall = progress ** 2.35;
    const radius = particle.startRadius + ((horizonRadius * 0.72 - particle.startRadius) * fall);
    const angle = particle.startAngle + (
      particle.direction
      * tau
      * ((0.08 * progress) + (particle.turns * (progress ** 1.65)))
    );

    target.x = holeX + (Math.cos(angle) * radius);
    target.y = holeY + (Math.sin(angle) * radius * orbitScaleY);
  }

  function drawAccretionRing(time, foreground = false) {
    const pulse = 1 + (Math.sin((time / 7000) * tau) * 0.07);
    const rotation = (time / 32000) * tau;
    const ringRadius = horizonRadius * (foreground ? 1.42 : 1.68) * pulse;
    const baseAlpha = settings.ringAlpha * (foreground ? 0.42 : 0.13);

    context.save();
    context.translate(holeX, holeY);
    context.rotate(rotation * (foreground ? 1 : -0.46));
    context.scale(1, foreground ? 0.42 : 0.5);
    context.beginPath();
    context.arc(0, 0, ringRadius, foreground ? -0.18 : 0.52, foreground ? 2.72 : 4.86);
    context.strokeStyle = `rgba(247, 247, 242, ${baseAlpha})`;
    context.lineWidth = foreground ? 1.35 : 2.6;
    context.stroke();

    context.beginPath();
    context.arc(0, 0, ringRadius * 1.07, foreground ? 3.04 : -0.72, foreground ? 5.92 : 1.42);
    context.strokeStyle = `rgba(221, 255, 106, ${baseAlpha * 0.62})`;
    context.lineWidth = foreground ? 0.85 : 1.4;
    context.stroke();
    context.restore();
  }

  function drawParticles() {
    particles.forEach((particle) => {
      const progress = Math.min(1, particle.age / particle.lifetime);
      const tailProgress = Math.max(0, progress - 0.018 - (progress * 0.016));
      pointAtProgress(particle, progress, particlePoint);
      pointAtProgress(particle, tailProgress, particleTail);

      const fadeIn = Math.min(1, progress / 0.08);
      const fadeOut = progress > 0.82 ? Math.max(0, (1 - progress) / 0.18) : 1;
      const alpha = particle.opacity * fadeIn * fadeOut;
      const size = Math.max(0.25, particle.size * (1 - (progress * 0.82)));
      const red = particle.signal ? 221 : 247;
      const green = particle.signal ? 255 : 247;
      const blue = particle.signal ? 106 : 242;

      context.beginPath();
      context.moveTo(particleTail.x, particleTail.y);
      context.lineTo(particlePoint.x, particlePoint.y);
      context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.28})`;
      context.lineWidth = Math.max(0.45, size * 0.58);
      context.stroke();

      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      context.fillRect(particlePoint.x - (size / 2), particlePoint.y - (size / 2), size, size);
    });
  }

  function draw(time) {
    if (!width || !height) return;

    context.clearRect(0, 0, width, height);
    drawAccretionRing(time, false);
    drawParticles();

    context.beginPath();
    context.ellipse(holeX, holeY, horizonRadius, horizonRadius * 0.58, 0, 0, tau);
    context.fillStyle = "rgba(0, 0, 0, 0.94)";
    context.fill();
    drawAccretionRing(time, true);
  }

  function advanceParticles(delta) {
    particles.forEach((particle) => {
      particle.age += delta;
      if (particle.age >= particle.lifetime) respawnParticle(particle, 0);
    });
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;

    width = bounds.width;
    height = bounds.height;
    policyWidth = canvas.parentElement?.clientWidth || width;
    const pixelRatio = policyWidth <= 720 ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    mapBlackHole();
    rebuildParticles();
    draw(sceneTime);
  }

  function stopAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
  }

  function canAnimate() {
    return (
      isInView
      && !document.hidden
      && !reducedMotion.matches
      && connection?.saveData !== true
      && !lowMemory
    );
  }

  function animate(timestamp) {
    if (!canAnimate()) {
      stopAnimation();
      return;
    }

    const frameInterval = 1000 / frameRate;
    if (!lastFrame) lastFrame = timestamp;
    const delta = timestamp - lastFrame;

    if (delta >= frameInterval) {
      const safeDelta = Math.min(delta, 80);
      sceneTime += safeDelta;
      advanceParticles(safeDelta);
      lastFrame = timestamp - (delta % frameInterval);
      draw(sceneTime);
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (isDestroyed) return;
    stopAnimation();

    if (canAnimate()) {
      canvas.dataset.cosmicState = "running";
      animationFrame = requestAnimationFrame(animate);
    } else {
      const isStatic = reducedMotion.matches || connection?.saveData === true || lowMemory;
      canvas.dataset.cosmicState = isStatic ? "static" : "paused";
      draw(sceneTime);
    }
  }

  function handleResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
      syncAnimation();
    });
  }

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(handleResize)
    : null;

  if (resizeObserver) {
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", handleResize, { passive: true });
  }

  const visibilityObserver = supportsIntersectionObserver
    ? new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        syncAnimation();
      }, { rootMargin: "100px" })
    : null;

  visibilityObserver?.observe(canvas);

  const handleMotionChange = syncAnimation;
  const handleConnectionChange = syncAnimation;
  const handleVisibilityChange = syncAnimation;
  const handlePageHide = stopAnimation;
  const handlePageShow = syncAnimation;

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }
  connection?.addEventListener?.("change", handleConnectionChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);

  resizeCanvas();
  syncAnimation();

  return {
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stopAnimation();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", handleResize);
      if (typeof reducedMotion.removeEventListener === "function") {
        reducedMotion.removeEventListener("change", handleMotionChange);
      } else {
        reducedMotion.removeListener(handleMotionChange);
      }
      connection?.removeEventListener?.("change", handleConnectionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    },
  };
}

cosmicCanvases.forEach(createCosmicField);
