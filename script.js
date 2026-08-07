const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const year = document.querySelector("[data-year]");
const mainContent = document.querySelector("main");
const footer = document.querySelector("footer");
const networkCanvases = document.querySelectorAll("[data-wordmark-network]");
const cosmicCanvases = document.querySelectorAll("[data-cosmic-field]");
const automationCanvases = document.querySelectorAll("[data-automation-field]");

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
    if (event.key === "Escape" && header.classList.contains("is-open")) closeMenu(true);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMenu();
  });
}

const siteConfig = window.vooglinSiteConfig || { stats: [], clients: [], booking: {} };
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

function animateCounter(element, target, suffix = "") {
  const formatter = new Intl.NumberFormat(pageLocale);
  const writeValue = (value) => {
    element.textContent = `${formatter.format(value)}${suffix}`;
  };

  if (prefersReducedMotion.matches || typeof requestAnimationFrame !== "function") {
    writeValue(target);
    return;
  }

  const duration = 720;
  let startTime;

  function draw(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * easedProgress);
    writeValue(current);

    if (progress < 1) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

function initialiseStatistics() {
  const section = document.querySelector("[data-statistics-section]");
  const grid = section?.querySelector("[data-statistics-grid]");
  if (!section || !grid) return;

  const verifiedClientCount = configuredClients().length;
  const stats = Array.isArray(siteConfig.stats) ? siteConfig.stats : [];
  const visibleCards = stats
    .map((item) => {
      const configuredValue = item?.id === "clientOrganisations"
        ? verifiedClientCount
        : Number(item?.value);
      const value = Math.round(configuredValue);
      const label = localisedConfigText(item?.label);
      const suffix = typeof item?.suffix === "string" ? item.suffix : "";

      if (!Number.isFinite(value) || value <= 0 || !label) return null;

      const card = document.createElement("article");
      const number = document.createElement("strong");
      const labelElement = document.createElement("p");

      card.dataset.statCard = item.id || "stat";
      card.setAttribute("data-reveal", "");
      number.dataset.statValue = "";
      number.textContent = `0${suffix}`;
      labelElement.textContent = label;
      card.append(number, labelElement);

      return { card, number, value, suffix };
    })
    .filter(Boolean);

  if (!visibleCards.length) {
    section.hidden = true;
    return;
  }

  grid.replaceChildren(...visibleCards.map(({ card }) => card));
  section.hidden = false;

  let hasAnimated = false;
  const showCounters = () => {
    if (hasAnimated) return;
    hasAnimated = true;
    visibleCards.forEach(({ number, value, suffix }) => animateCounter(number, value, suffix));
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

function configuredClients() {
  const clients = Array.isArray(siteConfig.clients)
    ? siteConfig.clients
    : Array.isArray(siteConfig.collaborations) ? siteConfig.collaborations : [];

  return clients.filter((item) => {
    const website = safeWebUrl(item?.website || item?.url);
    const logo = typeof item?.logo === "string" ? item.logo.trim() : "";
    return item?.verified === true
      && Boolean(localisedConfigText(item.name))
      && Boolean(website)
      && /^\/images\/partners\/[a-z0-9._%+-]+$/i.test(logo);
  });
}

function configuredPeople() {
  const people = Array.isArray(siteConfig.people) ? siteConfig.people : [];
  return people.filter((person) => {
    const image = typeof person?.image === "string" ? person.image.trim() : "";
    return person?.approved === true
      && Boolean(localisedConfigText(person.name))
      && /^\/images\/people\/[a-z0-9._%+-]+$/i.test(image);
  });
}

function createBouncingClientLogo(stage, logo, toggleButton) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  let bounds = { width: 0, height: 0, logoWidth: 0, logoHeight: 0 };
  let x = 0;
  let y = 0;
  let velocityX = 42;
  let velocityY = 34;
  let lastTime = 0;
  let animationFrame = 0;
  let isInView = !supportsIntersectionObserver;
  let isDestroyed = false;
  let userPaused = false;
  let hasMeasured = false;

  const stop = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastTime = 0;
  };

  const placeLogo = () => {
    logo.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  };

  const useStaticPosition = () => {
    x = Math.max(0, (bounds.width - bounds.logoWidth) / 2);
    y = Math.max(0, (bounds.height - bounds.logoHeight) / 2);
    logo.dataset.clientMotionState = "static";
    placeLogo();
  };

  const canAnimate = () => isInView
    && !document.hidden
    && !reducedMotion.matches
    && !saveData
    && !lowMemory
    && !userPaused
    && bounds.logoWidth > 0;

  const animate = (timestamp) => {
    if (!canAnimate()) {
      stop();
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    x += velocityX * delta;
    y += velocityY * delta;

    const maximumX = Math.max(0, bounds.width - bounds.logoWidth);
    const maximumY = Math.max(0, bounds.height - bounds.logoHeight);

    if (x <= 0 || x >= maximumX) {
      x = Math.min(maximumX, Math.max(0, x));
      velocityX *= -1;
    }
    if (y <= 0 || y >= maximumY) {
      y = Math.min(maximumY, Math.max(0, y));
      velocityY *= -1;
    }

    placeLogo();
    animationFrame = requestAnimationFrame(animate);
  };

  const sync = () => {
    stop();
    if (canAnimate()) {
      logo.dataset.clientMotionState = "running";
      animationFrame = requestAnimationFrame(animate);
    } else if (reducedMotion.matches || saveData || lowMemory) {
      useStaticPosition();
    } else {
      logo.dataset.clientMotionState = "paused";
      placeLogo();
    }
  };

  const measure = () => {
    const logoRect = logo.getBoundingClientRect();
    const previousMaximumX = Math.max(1, bounds.width - bounds.logoWidth);
    const previousMaximumY = Math.max(1, bounds.height - bounds.logoHeight);
    const relativeX = x / previousMaximumX;
    const relativeY = y / previousMaximumY;

    bounds = {
      width: stage.clientWidth,
      height: stage.clientHeight,
      logoWidth: logoRect.width,
      logoHeight: logoRect.height,
    };

    const maximumX = Math.max(0, bounds.width - bounds.logoWidth);
    const maximumY = Math.max(0, bounds.height - bounds.logoHeight);
    x = hasMeasured ? Math.min(maximumX, Math.max(0, relativeX * maximumX)) : maximumX * 0.14;
    y = hasMeasured ? Math.min(maximumY, Math.max(0, relativeY * maximumY)) : maximumY * 0.22;
    const directionX = Math.sign(velocityX) || 1;
    const directionY = Math.sign(velocityY) || 1;
    const speedFactor = bounds.width <= 480 ? 0.62 : 1;
    velocityX = directionX * 42 * speedFactor;
    velocityY = directionY * 34 * speedFactor;
    hasMeasured = true;
    placeLogo();
    sync();
  };

  const scheduleMeasure = () => requestAnimationFrame(measure);
  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(scheduleMeasure)
    : null;
  if (resizeObserver) {
    resizeObserver.observe(stage);
    resizeObserver.observe(logo);
  } else {
    window.addEventListener("resize", scheduleMeasure, { passive: true });
  }

  const visibilityObserver = supportsIntersectionObserver
    ? new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        sync();
      }, { rootMargin: "80px" })
    : null;
  visibilityObserver?.observe(stage);

  const handleVisibility = sync;
  const handlePageHide = stop;
  const updateToggle = () => {
    if (!toggleButton) return;
    const motionUnavailable = reducedMotion.matches || saveData || lowMemory;
    toggleButton.hidden = motionUnavailable;
    toggleButton.setAttribute("aria-pressed", String(userPaused));
    toggleButton.textContent = userPaused
      ? (toggleButton.dataset.resumeLabel || "Resume logo motion")
      : (toggleButton.dataset.pauseLabel || "Pause logo motion");
  };
  const handleMotion = () => {
    if (reducedMotion.matches) useStaticPosition();
    updateToggle();
    sync();
  };
  const handleToggle = () => {
    userPaused = !userPaused;
    updateToggle();
    sync();
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);
  reducedMotion.addEventListener?.("change", handleMotion);
  toggleButton?.addEventListener("click", handleToggle);
  updateToggle();
  requestAnimationFrame(measure);

  return {
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stop();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", scheduleMeasure);
      visibilityObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      reducedMotion.removeEventListener?.("change", handleMotion);
      toggleButton?.removeEventListener("click", handleToggle);
    },
  };
}

function initialiseClients() {
  const section = document.querySelector("[data-clients-section]");
  const stage = section?.querySelector("[data-client-motion-stage]");
  const caption = section?.querySelector("[data-client-caption]");
  const peopleContainer = section?.querySelector("[data-client-people]");
  const motionToggle = section?.querySelector("[data-client-motion-toggle]");
  const clients = configuredClients();
  const people = configuredPeople();
  if (!section || !stage || !caption || !clients.length) return;

  const featuredClient = clients[0];
  const movingLogo = document.createElement("div");
  const movingImage = document.createElement("img");

  movingLogo.className = "client-moving-logo";
  movingLogo.setAttribute("aria-hidden", "true");
  movingImage.src = featuredClient.logo;
  movingImage.alt = "";
  movingImage.width = 1000;
  movingImage.height = 405;
  movingImage.loading = "lazy";
  movingImage.decoding = "async";
  movingLogo.append(movingImage);

  const captionEntries = clients.map((client, index) => {
    const name = localisedConfigText(client.name);
    const description = localisedConfigText(client.description);
    const website = safeWebUrl(client.website || client.url);
    const linkLabel = localisedConfigText(client.linkLabel) || name;
    const entry = document.createElement("div");
    const captionCopy = document.createElement("div");
    const captionLabel = document.createElement("span");
    const captionName = document.createElement("strong");
    const captionDescription = document.createElement("small");
    const websiteLink = document.createElement("a");

    entry.className = "client-caption-entry";
    captionCopy.className = "client-caption-copy";
    captionLabel.textContent = localisedConfigText(client.captionLabel)
      || `${String(index + 1).padStart(2, "0")} / Verified client`;
    captionName.textContent = name;
    captionDescription.textContent = description;
    captionCopy.append(captionLabel, captionName, captionDescription);

    websiteLink.className = "client-website-link";
    websiteLink.href = website;
    websiteLink.target = "_blank";
    websiteLink.rel = "noopener noreferrer";
    websiteLink.setAttribute("aria-label", linkLabel);
    websiteLink.textContent = `${new URL(website).hostname.replace(/^www\./, "")} ↗`;
    entry.append(captionCopy, websiteLink);
    return entry;
  });

  stage.append(movingLogo);
  caption.replaceChildren(...captionEntries);
  if (peopleContainer && people.length) {
    const peopleCards = people.map((person) => {
      const name = localisedConfigText(person.name);
      const role = localisedConfigText(person.role);
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      const captionElement = document.createElement("figcaption");
      const nameElement = document.createElement("strong");
      const roleElement = document.createElement("small");

      figure.className = "client-person";
      image.src = person.image;
      image.alt = name;
      image.width = 640;
      image.height = 800;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => { figure.hidden = true; }, { once: true });
      nameElement.textContent = name;
      roleElement.textContent = role;
      captionElement.append(nameElement);
      if (role) captionElement.append(roleElement);
      figure.append(image, captionElement);
      return figure;
    });
    peopleContainer.replaceChildren(...peopleCards);
    peopleContainer.hidden = false;
  }
  const handleLogoError = () => {
    movingLogo.hidden = true;
    stage.classList.add("is-logo-missing");
  };
  movingImage.addEventListener("error", handleLogoError, { once: true });
  if (movingImage.complete) {
    if (movingImage.naturalWidth > 0) createBouncingClientLogo(stage, movingLogo, motionToggle);
    else handleLogoError();
  } else {
    movingImage.addEventListener("load", () => createBouncingClientLogo(stage, movingLogo, motionToggle), { once: true });
  }

  section.hidden = false;
}

function initialiseScrollReveal() {
  const elements = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!elements.length) return;

  const revealAll = () => {
    elements.forEach((element) => element.classList.add("is-revealed"));
  };

  if (prefersReducedMotion.matches || typeof IntersectionObserver !== "function") {
    revealAll();
    return;
  }

  document.documentElement.classList.add("reveal-ready");
  elements.forEach((element) => {
    const siblings = Array.from(element.parentElement?.children || [])
      .filter((sibling) => sibling.hasAttribute?.("data-reveal"));
    const siblingIndex = Math.max(0, siblings.indexOf(element));
    element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 45, 180)}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

  elements.forEach((element) => observer.observe(element));

  const handleMotionChange = () => {
    if (!prefersReducedMotion.matches) return;
    observer.disconnect();
    revealAll();
  };

  prefersReducedMotion.addEventListener?.("change", handleMotionChange, { once: true });
}

function initialiseBooking() {
  const modal = document.querySelector("[data-booking-modal]");
  const form = modal?.querySelector("[data-booking-form]");
  const formView = modal?.querySelector("[data-booking-form-view]");
  const successView = modal?.querySelector("[data-booking-success]");
  const status = modal?.querySelector("[data-booking-status]");
  const submitButton = modal?.querySelector("[data-booking-submit]");
  const timeSelect = modal?.querySelector("[data-booking-time]");
  const durationElement = modal?.querySelector("[data-booking-duration]");
  const emailFallback = modal?.querySelector("[data-booking-email-fallback]");
  const openButtons = Array.from(document.querySelectorAll("[data-booking-open]"));
  const closeButtons = Array.from(modal?.querySelectorAll("[data-booking-close]") || []);
  const booking = siteConfig.booking || {};

  if (!modal || !form || !formView || !successView || !submitButton || !timeSelect || !openButtons.length) return;

  const endpoint = typeof booking.endpoint === "string" && booking.endpoint.startsWith("/")
    ? booking.endpoint
    : "/api/booking";
  const recipient = typeof booking.recipient === "string" && booking.recipient.includes("@")
    ? booking.recipient
    : "egor@vooglin.ee";
  const minimumLeadDays = Number.isFinite(Number(booking.minimumLeadDays))
    ? Math.max(0, Math.round(Number(booking.minimumLeadDays)))
    : 1;
  const maximumDaysAhead = Number.isFinite(Number(booking.maximumDaysAhead))
    ? Math.max(minimumLeadDays + 1, Math.round(Number(booking.maximumDaysAhead)))
    : 90;
  const configuredDuration = Math.round(Number(booking.durationMinutes));
  const durationMinutes = [15, 30, 45, 60, 90].includes(configuredDuration)
    ? configuredDuration
    : 30;
  const preferredTimes = Array.isArray(booking.preferredTimes)
    ? booking.preferredTimes.filter((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    : [];
  const emailCopy = booking.emailCopy || {};
  let activeOpener = null;
  let formStartedAt = Date.now();
  let activeSubmission = 0;
  let requestController = null;

  function cancelPendingSubmission() {
    activeSubmission += 1;
    requestController?.abort();
    requestController = null;
  }

  function tallinnDate(daysFromNow) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Tallinn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return new Date(Date.UTC(
      Number(valueByType.year),
      Number(valueByType.month) - 1,
      Number(valueByType.day) + daysFromNow,
    )).toISOString().slice(0, 10);
  }

  const dateInput = form.elements.namedItem("preferredDate");
  if (dateInput instanceof HTMLInputElement) {
    dateInput.min = tallinnDate(minimumLeadDays);
    dateInput.max = tallinnDate(maximumDaysAhead);
  }

  preferredTimes.forEach((time) => {
    const option = document.createElement("option");
    option.value = time;
    option.textContent = time;
    timeSelect.append(option);
  });
  if (durationElement) durationElement.textContent = String(durationMinutes);

  function resetView() {
    cancelPendingSubmission();
    form.reset();
    if (dateInput instanceof HTMLInputElement) {
      dateInput.min = tallinnDate(minimumLeadDays);
      dateInput.max = tallinnDate(maximumDaysAhead);
    }
    form.hidden = false;
    formView.hidden = false;
    successView.hidden = true;
    form.removeAttribute("aria-busy");
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.defaultLabel || "Send meeting request";
    if (status) {
      status.textContent = "";
      status.setAttribute("role", "status");
    }
    if (emailFallback) emailFallback.hidden = true;
    formStartedAt = Date.now();
  }

  function openModal(event) {
    event?.preventDefault();
    activeOpener = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    closeMenu(false);
    resetView();
    document.body.classList.add("booking-open");

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");

    requestAnimationFrame(() => form.elements.namedItem("name")?.focus());
  }

  function closeModal() {
    cancelPendingSubmission();
    if (typeof modal.close === "function" && modal.open) modal.close();
    else modal.removeAttribute("open");
    document.body.classList.remove("booking-open");
    activeOpener?.focus();
    activeOpener = null;
  }

  function createEmailFallback(values) {
    if (!emailFallback) return;
    const label = (key, fallback) => localisedConfigText(emailCopy[key]) || fallback;
    const subject = `${label("subject", "Meeting request")} — ${values.organisation || values.name}`;
    const lines = [
      `${label("name", "Name")}: ${values.name}`,
      `${label("organisation", "Organisation")}: ${values.organisation}`,
      `${label("email", "Email")}: ${values.email}`,
      `${label("phone", "Phone")}: ${values.phone || "—"}`,
      `${label("date", "Preferred date")}: ${values.preferredDate}`,
      `${label("time", "Preferred time")}: ${values.preferredTime} Europe/Tallinn`,
      "",
      `${label("request", "What they would like to automate")}:`,
      values.message,
    ];
    emailFallback.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    emailFallback.hidden = false;
  }

  function focusFirstInvalidField() {
    const invalidField = form.querySelector(":invalid");
    invalidField?.focus();
  }

  openButtons.forEach((button) => button.addEventListener("click", openModal));
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href]'
    )).filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      focusFirstInvalidField();
      return;
    }

    const values = Object.fromEntries(new FormData(form).entries());
    const payload = {
      name: String(values.name || "").trim(),
      organisation: String(values.organisation || "").trim(),
      email: String(values.email || "").trim(),
      phone: String(values.phone || "").trim(),
      message: String(values.message || "").trim(),
      preferredDate: String(values.preferredDate || ""),
      preferredTime: String(values.preferredTime || ""),
      website: String(values.website || ""),
      locale: pageLocale,
      sourcePage: window.location.href,
      durationMinutes,
      formStartedAt,
      submittedAt: Date.now(),
    };
    const submissionId = ++activeSubmission;
    requestController = new AbortController();

    form.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    submitButton.textContent = submitButton.dataset.loadingLabel || "Sending…";
    if (status) status.textContent = "";
    if (emailFallback) emailFallback.hidden = true;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: requestController.signal,
      });
      if (submissionId !== activeSubmission) return;
      if (!response.ok) throw new Error("Booking request was not accepted");

      form.hidden = true;
      formView.hidden = true;
      successView.hidden = false;
      requestAnimationFrame(() => successView.focus());
    } catch (error) {
      if (submissionId !== activeSubmission || error?.name === "AbortError") return;
      if (status) {
        status.setAttribute("role", "alert");
        status.textContent = status.dataset.errorMessage || "We could not send the request.";
      }
      createEmailFallback(payload);
    } finally {
      if (submissionId !== activeSubmission) return;
      requestController = null;
      form.removeAttribute("aria-busy");
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.defaultLabel || "Send meeting request";
    }
  });
}

function initialiseSplitStory() {
  const section = document.querySelector("[data-split-story]");
  const left = section?.querySelector("[data-split-left]");
  const right = section?.querySelector("[data-split-right]");
  const reveal = section?.querySelector("[data-split-reveal]");
  if (!section || !left || !right || !reveal) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  let isActive = !supportsIntersectionObserver;
  let updateFrame = 0;

  const writeStaticState = () => {
    section.classList.remove("split-ready");
    section.dataset.splitState = "static";
    section.style.setProperty("--split-shift", "0px");
    section.style.setProperty("--split-reveal", "1");
    section.style.setProperty("--split-reveal-y", "0px");
  };

  const update = () => {
    updateFrame = 0;
    if (reducedMotion.matches || window.innerWidth <= 840) {
      writeStaticState();
      return;
    }

    const bounds = section.getBoundingClientRect();
    const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / scrollRange));
    const revealProgress = Math.min(1, Math.max(0, (progress - 0.2) / 0.52));
    const maximumShift = Math.min(window.innerWidth * 0.09, 140);

    section.classList.add("split-ready");
    section.dataset.splitState = "scrolling";
    section.dataset.splitProgress = progress.toFixed(3);
    section.style.setProperty("--split-shift", `${Math.round(maximumShift * progress)}px`);
    section.style.setProperty("--split-reveal", revealProgress.toFixed(3));
    section.style.setProperty("--split-reveal-y", `${Math.round((1 - revealProgress) * 18)}px`);
  };

  const scheduleUpdate = () => {
    if (!isActive || updateFrame) return;
    updateFrame = requestAnimationFrame(update);
  };

  const observer = supportsIntersectionObserver
    ? new IntersectionObserver(([entry]) => {
        isActive = entry.isIntersecting;
        if (isActive) scheduleUpdate();
      }, { rootMargin: "30% 0px" })
    : null;
  observer?.observe(section);

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", () => {
    isActive = true;
    scheduleUpdate();
  }, { passive: true });
  reducedMotion.addEventListener?.("change", () => {
    isActive = true;
    scheduleUpdate();
  });
  update();
}

initialiseSavingsCalculator();
initialiseStatistics();
initialiseClients();
initialiseBooking();
initialiseSplitStory();
initialiseScrollReveal();

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

function createAutomationField(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const variant = canvas.dataset.automationVariant || "calculator";
  const settingsByVariant = {
    calculator: {
      counts: [12, 8, 4],
      frameRates: [24, 20, 18],
      line: "rgba(247, 247, 242, 0.14)",
      node: "rgba(247, 247, 242, 0.46)",
      packet: "rgba(247, 247, 242, 0.82)",
      accent: "rgba(221, 255, 106, 0.9)",
      packetAlpha: 0.72,
    },
    pricing: {
      counts: [8, 6, 4],
      frameRates: [20, 18, 16],
      line: "rgba(17, 17, 17, 0.11)",
      node: "rgba(17, 17, 17, 0.34)",
      packet: "rgba(17, 17, 17, 0.58)",
      accent: "rgba(101, 119, 36, 0.82)",
      packetAlpha: 0.5,
    },
    privacy: {
      counts: [6, 4, 3],
      frameRates: [18, 16, 14],
      line: "rgba(247, 247, 242, 0.16)",
      node: "rgba(247, 247, 242, 0.4)",
      packet: "rgba(247, 247, 242, 0.68)",
      accent: "rgba(221, 255, 106, 0.82)",
      packetAlpha: 0.52,
    },
  };
  const settings = settingsByVariant[variant] || settingsByVariant.calculator;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  const packets = [];
  const packetPoint = { x: 0, y: 0 };

  let width = 0;
  let height = 0;
  let policyIndex = 0;
  let packetCount = 0;
  let frameRate = 18;
  let nodes = [];
  let edges = [];
  let sceneTime = 2600;
  let lastFrame = 0;
  let animationFrame = 0;
  let resizeFrame = 0;
  let isInView = !supportsIntersectionObserver;
  let isDestroyed = false;

  function randomBetween(minimum, maximum) {
    return minimum + (Math.random() * (maximum - minimum));
  }

  function addEdge(from, to, curve = 0, stage = 0, speed = 0.000045) {
    const start = nodes[from];
    const end = nodes[to];
    edges.push({
      from,
      to,
      stage,
      speed,
      controlX: (start.x + end.x) * 0.5,
      controlY: ((start.y + end.y) * 0.5) + (curve * height),
    });
  }

  function buildCalculatorLayout() {
    const startY = policyIndex === 0 ? [0.2, 0.37, 0.54, 0.71] : policyIndex === 1 ? [0.28, 0.5, 0.72] : [0.36, 0.64];
    nodes = startY.map((value) => ({ x: width * 0.035, y: height * value, processor: false }));
    const processorIndex = nodes.length;
    nodes.push({ x: width * (policyIndex === 2 ? 0.54 : 0.57), y: height * 0.5, processor: true });
    const firstExit = nodes.length;
    nodes.push(
      { x: width * 0.97, y: height * 0.39, processor: false },
      { x: width * 0.97, y: height * 0.61, processor: false }
    );
    edges = [];
    startY.forEach((_, index) => addEdge(index, processorIndex, (index - ((startY.length - 1) / 2)) * 0.045, 0, 0.000032));
    addEdge(processorIndex, firstExit, -0.045, 1, 0.000062);
    addEdge(processorIndex, firstExit + 1, 0.045, 1, 0.000062);
  }

  function buildPricingLayout() {
    const count = policyIndex === 0 ? 6 : policyIndex === 1 ? 5 : 4;
    nodes = Array.from({ length: count }, (_, index) => ({
      x: width * (0.08 + ((0.84 / Math.max(1, count - 1)) * index)),
      y: height * (index % 2 === 0 ? 0.31 : 0.62),
      processor: index === Math.floor(count / 2),
    }));
    edges = [];
    for (let index = 0; index < count - 1; index += 1) {
      addEdge(index, index + 1, index % 2 === 0 ? -0.04 : 0.04, 0, 0.000042);
    }
    if (count >= 6) addEdge(0, 3, 0.11, 0, 0.000033);
  }

  function buildPrivacyLayout() {
    const positions = policyIndex === 0
      ? [[0.04, 0.22], [0.28, 0.22], [0.48, 0.5], [0.72, 0.72], [0.96, 0.72]]
      : [[0.05, 0.3], [0.35, 0.3], [0.66, 0.68], [0.95, 0.68]];
    nodes = positions.map(([x, y], index) => ({
      x: width * x,
      y: height * y,
      processor: index === Math.floor(positions.length / 2),
    }));
    edges = [];
    for (let index = 0; index < nodes.length - 1; index += 1) {
      addEdge(index, index + 1, index % 2 === 0 ? 0.06 : -0.06, 0, 0.000032);
    }
  }

  function rebuildScene() {
    policyIndex = width >= 900 ? 0 : width > 480 ? 1 : 2;
    packetCount = settings.counts[policyIndex];
    frameRate = settings.frameRates[policyIndex];

    if (variant === "pricing") buildPricingLayout();
    else if (variant === "privacy") buildPrivacyLayout();
    else buildCalculatorLayout();

    while (packets.length < packetCount) packets.push({});
    packets.length = packetCount;

    const incomingEdges = edges.map((edge, index) => ({ edge, index })).filter(({ edge }) => edge.stage === 0);
    const outgoingEdges = edges.map((edge, index) => ({ edge, index })).filter(({ edge }) => edge.stage === 1);
    const incomingCount = variant === "calculator" ? Math.ceil(packetCount * 0.7) : packetCount;

    packets.forEach((packet, index) => {
      const pool = index < incomingCount || !outgoingEdges.length ? incomingEdges : outgoingEdges;
      const selected = pool[index % Math.max(1, pool.length)] || { edge: edges[0], index: 0 };
      packet.edgeIndex = selected.index;
      packet.phase = (index / Math.max(1, packetCount)) + randomBetween(0, 0.14);
      packet.speed = selected.edge.speed * randomBetween(0.86, 1.14);
      packet.size = index % 5 === 0 ? 3 : 2;
      packet.accent = index % 6 === 0;
    });

    canvas.dataset.automationPackets = String(packetCount);
    canvas.dataset.automationNodes = String(nodes.length);
    canvas.dataset.automationFps = String(frameRate);
  }

  function pointOnEdge(edge, progress) {
    const start = nodes[edge.from];
    const end = nodes[edge.to];
    const inverse = 1 - progress;
    packetPoint.x = (inverse * inverse * start.x) + (2 * inverse * progress * edge.controlX) + (progress * progress * end.x);
    packetPoint.y = (inverse * inverse * start.y) + (2 * inverse * progress * edge.controlY) + (progress * progress * end.y);
    return packetPoint;
  }

  function draw(time) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = settings.line;

    edges.forEach((edge) => {
      const start = nodes[edge.from];
      const end = nodes[edge.to];
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(edge.controlX, edge.controlY, end.x, end.y);
      context.stroke();
    });

    nodes.forEach((node) => {
      const size = node.processor ? 13 : 7;
      context.strokeStyle = node.processor ? settings.accent : settings.node;
      context.strokeRect(node.x - (size / 2), node.y - (size / 2), size, size);
      if (node.processor) {
        context.fillStyle = settings.accent;
        context.fillRect(node.x - 2, node.y - 2, 4, 4);
      }
    });

    packets.forEach((packet) => {
      const edge = edges[packet.edgeIndex];
      if (!edge) return;
      const progress = (packet.phase + (time * packet.speed)) % 1;
      const point = pointOnEdge(edge, progress);
      const alpha = Math.sin(Math.PI * progress) * settings.packetAlpha;
      context.globalAlpha = Math.max(0, alpha);
      context.fillStyle = packet.accent ? settings.accent : settings.packet;
      context.fillRect(point.x - (packet.size / 2), point.y - (packet.size / 2), packet.size, packet.size);
    });
    context.globalAlpha = 1;
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const dpr = width <= 480 ? 1 : Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildScene();
    draw(sceneTime);
  }

  function stopAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
  }

  function canAnimate() {
    return isInView
      && !document.hidden
      && !reducedMotion.matches
      && connection?.saveData !== true
      && !lowMemory
      && width > 340;
  }

  function animate(timestamp) {
    if (!canAnimate()) {
      syncAnimation();
      return;
    }

    const frameInterval = 1000 / frameRate;
    if (!lastFrame || timestamp - lastFrame >= frameInterval) {
      const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 96) : frameInterval;
      sceneTime += elapsed;
      lastFrame = timestamp;
      draw(sceneTime);
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    if (isDestroyed) return;
    stopAnimation();

    if (canAnimate()) {
      canvas.dataset.automationState = "running";
      animationFrame = requestAnimationFrame(animate);
      return;
    }

    const isStatic = reducedMotion.matches || connection?.saveData === true || lowMemory || width <= 340;
    canvas.dataset.automationState = isStatic ? "static" : "paused";
    draw(sceneTime);
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
  if (resizeObserver) resizeObserver.observe(canvas);
  else window.addEventListener("resize", handleResize, { passive: true });

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
automationCanvases.forEach(createAutomationField);
