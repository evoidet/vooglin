const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const headerBrand = header?.querySelector(".header-inner > .brand");
const year = document.querySelector("[data-year]");
const mainContent = document.querySelector("main");
const footer = document.querySelector("footer");

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
  headerBrand?.addEventListener("click", () => closeMenu(false));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) closeMenu(true);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMenu();
  });
}

const siteConfig = window.vooglinSiteConfig || { clients: [], booking: {} };
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

function initialiseClientCount(element, target, section) {
  if (!element) return;
  const finalValue = String(target).padStart(2, "0");
  if (prefersReducedMotion.matches || typeof IntersectionObserver !== "function") {
    element.textContent = finalValue;
    return;
  }

  element.textContent = "00";
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    const duration = 850;
    let startTime = 0;
    const update = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      element.textContent = String(Math.round(target * eased)).padStart(2, "0");
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, { threshold: 0.35 });
  observer.observe(section);
}

function createBouncingClientLogos(stage, movers, toggleButton) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  const directionSeeds = [
    [0.78, 0.63],
    [-0.72, 0.69],
    [0.66, -0.75],
    [-0.81, -0.58],
    [0.58, 0.82],
    [-0.62, 0.78],
    [0.84, -0.54],
    [-0.76, -0.65],
  ];
  const sprites = movers.map((element, index) => ({
    element,
    index,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    hovered: false,
    focused: false,
  }));
  let bounds = { width: 0, height: 0, inset: 18 };
  let obstacles = [];
  let lastTime = 0;
  let animationFrame = 0;
  let measureFrame = 0;
  let isInView = !supportsIntersectionObserver;
  let isDestroyed = false;
  let userPaused = false;
  let hasMeasured = false;

  const stop = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastTime = 0;
  };

  const placeSprite = (sprite) => {
    sprite.element.style.transform = `translate3d(${Math.round(sprite.x)}px, ${Math.round(sprite.y)}px, 0)`;
  };

  const overlaps = (x, y, width, height, obstacle, padding = 0) => (
    x < obstacle.right + padding
    && x + width > obstacle.left - padding
    && y < obstacle.bottom + padding
    && y + height > obstacle.top - padding
  );

  const findOpenPosition = (sprite, preferredX, preferredY, placed = []) => {
    const minimumX = bounds.inset;
    const minimumY = bounds.inset;
    const maximumX = Math.max(minimumX, bounds.width - sprite.width - bounds.inset);
    const maximumY = Math.max(minimumY, bounds.height - sprite.height - bounds.inset);
    const clampX = (value) => Math.min(maximumX, Math.max(minimumX, value));
    const clampY = (value) => Math.min(maximumY, Math.max(minimumY, value));
    const overlapArea = (x, y, width, height, obstacle, padding) => {
      const overlapWidth = Math.max(0, Math.min(x + width, obstacle.right + padding) - Math.max(x, obstacle.left - padding));
      const overlapHeight = Math.max(0, Math.min(y + height, obstacle.bottom + padding) - Math.max(y, obstacle.top - padding));
      return overlapWidth * overlapHeight;
    };
    const blockageScore = (x, y) => {
      const obstacleScore = obstacles.reduce(
        (total, obstacle) => total + overlapArea(x, y, sprite.width, sprite.height, obstacle, 12),
        0,
      );
      const moverScore = placed.reduce((total, other) => total + overlapArea(x, y, sprite.width, sprite.height, {
        left: other.x,
        top: other.y,
        right: other.x + other.width,
        bottom: other.y + other.height,
      }, 18), 0);
      return obstacleScore + moverScore;
    };
    const preferred = { x: clampX(preferredX), y: clampY(preferredY) };
    let best = preferred;
    let bestScore = blockageScore(preferred.x, preferred.y);
    if (bestScore === 0) return preferred;

    const columns = 7;
    const rows = 6;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = clampX(minimumX + ((maximumX - minimumX) * (column / Math.max(1, columns - 1))));
        const y = clampY(minimumY + ((maximumY - minimumY) * (row / Math.max(1, rows - 1))));
        const score = blockageScore(x, y);
        if (score === 0) return { x, y };
        if (score < bestScore) {
          best = { x, y };
          bestScore = score;
        }
      }
    }

    return best;
  };

  const useStaticPositions = () => {
    const placed = [];
    sprites.forEach((sprite, index) => {
      if (sprite.element.hidden || !sprite.width) return;
      const preferredX = ((bounds.width - sprite.width) / 2) + ((index % 3) - 1) * (sprite.width * 0.52);
      const preferredY = ((bounds.height - sprite.height) / 2) + (Math.floor(index / 3) * (sprite.height + 18));
      const position = findOpenPosition(sprite, preferredX, preferredY, placed);
      sprite.x = position.x;
      sprite.y = position.y;
      sprite.element.dataset.clientMotionState = "static";
      placeSprite(sprite);
      placed.push(sprite);
    });
  };

  const canAnimate = () => isInView
    && !document.hidden
    && !reducedMotion.matches
    && !saveData
    && !lowMemory
    && !userPaused
    && sprites.some((sprite) => !sprite.element.hidden && !sprite.hovered && !sprite.focused && sprite.width > 0);

  const resolveObstacleCollision = (sprite, previousX, previousY) => {
    obstacles.forEach((obstacle) => {
      if (!overlaps(sprite.x, sprite.y, sprite.width, sprite.height, obstacle, 8)) return;
      const minimum = bounds.inset;
      const maximumX = Math.max(minimum, bounds.width - sprite.width - bounds.inset);
      const maximumY = Math.max(minimum, bounds.height - sprite.height - bounds.inset);
      const candidates = [
        { axis: "x", value: obstacle.left - sprite.width - 8, velocity: -Math.abs(sprite.velocityX) },
        { axis: "x", value: obstacle.right + 8, velocity: Math.abs(sprite.velocityX) },
        { axis: "y", value: obstacle.top - sprite.height - 8, velocity: -Math.abs(sprite.velocityY) },
        { axis: "y", value: obstacle.bottom + 8, velocity: Math.abs(sprite.velocityY) },
      ].filter((candidate) => candidate.axis === "x"
        ? candidate.value >= minimum && candidate.value <= maximumX
        : candidate.value >= minimum && candidate.value <= maximumY);

      const cameFromLeft = previousX + sprite.width <= obstacle.left;
      const cameFromRight = previousX >= obstacle.right;
      const cameFromTop = previousY + sprite.height <= obstacle.top;
      const cameFromBottom = previousY >= obstacle.bottom;
      const preferredAxis = cameFromLeft || cameFromRight ? "x" : cameFromTop || cameFromBottom ? "y" : null;
      candidates.sort((first, second) => {
        const firstPenalty = preferredAxis && first.axis !== preferredAxis ? 100000 : 0;
        const secondPenalty = preferredAxis && second.axis !== preferredAxis ? 100000 : 0;
        const firstPosition = first.axis === "x" ? sprite.x : sprite.y;
        const secondPosition = second.axis === "x" ? sprite.x : sprite.y;
        return (Math.abs(first.value - firstPosition) + firstPenalty)
          - (Math.abs(second.value - secondPosition) + secondPenalty);
      });

      const correction = candidates[0];
      if (!correction) return;
      if (correction.axis === "x") {
        sprite.x = correction.value;
        sprite.velocityX = correction.velocity;
      } else {
        sprite.y = correction.value;
        sprite.velocityY = correction.velocity;
      }
    });
  };

  const animate = (timestamp) => {
    if (!canAnimate()) {
      stop();
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    sprites.forEach((sprite) => {
      if (sprite.element.hidden || sprite.hovered || sprite.focused || !sprite.width) return;
      const previousX = sprite.x;
      const previousY = sprite.y;
      const minimum = bounds.inset;
      const maximumX = Math.max(minimum, bounds.width - sprite.width - bounds.inset);
      const maximumY = Math.max(minimum, bounds.height - sprite.height - bounds.inset);

      if (maximumX > minimum) {
        sprite.x += sprite.velocityX * delta;
      } else {
        sprite.x = Math.max(0, (bounds.width - sprite.width) / 2);
        sprite.velocityX = 0;
      }
      if (maximumY > minimum) {
        sprite.y += sprite.velocityY * delta;
      } else {
        sprite.y = Math.max(0, (bounds.height - sprite.height) / 2);
        sprite.velocityY = 0;
      }

      if (maximumX > minimum && (sprite.x <= minimum || sprite.x >= maximumX)) {
        sprite.x = Math.min(maximumX, Math.max(minimum, sprite.x));
        sprite.velocityX *= -1;
      }
      if (maximumY > minimum && (sprite.y <= minimum || sprite.y >= maximumY)) {
        sprite.y = Math.min(maximumY, Math.max(minimum, sprite.y));
        sprite.velocityY *= -1;
      }

      resolveObstacleCollision(sprite, previousX, previousY);
      sprite.x = Math.min(maximumX, Math.max(minimum, sprite.x));
      sprite.y = Math.min(maximumY, Math.max(minimum, sprite.y));
      placeSprite(sprite);
    });
    animationFrame = requestAnimationFrame(animate);
  };

  const sync = () => {
    stop();
    if (canAnimate()) {
      sprites.forEach((sprite) => {
        sprite.element.dataset.clientMotionState = sprite.hovered || sprite.focused ? "interaction-paused" : "running";
      });
      animationFrame = requestAnimationFrame(animate);
    } else if (reducedMotion.matches || saveData || lowMemory) {
      useStaticPositions();
    } else {
      sprites.forEach((sprite) => {
        sprite.element.dataset.clientMotionState = "paused";
        placeSprite(sprite);
      });
    }
  };

  const syncInteraction = (sprite) => {
    const interactionPaused = sprite.hovered || sprite.focused;
    sprite.element.dataset.clientMotionState = interactionPaused
      ? "interaction-paused"
      : canAnimate() ? "running" : "paused";
    if (!canAnimate()) {
      stop();
      return;
    }
    if (!animationFrame) {
      lastTime = 0;
      animationFrame = requestAnimationFrame(animate);
    }
  };

  const measure = () => {
    measureFrame = 0;
    stop();
    const previousBounds = bounds;
    const stageRect = stage.getBoundingClientRect();
    bounds = {
      width: stage.clientWidth,
      height: stage.clientHeight,
      inset: stage.clientWidth <= 480 ? 12 : 20,
    };
    obstacles = Array.from(stage.querySelectorAll("[data-client-safe-zone]"))
      .filter((element) => !element.hidden)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: Math.max(0, rect.left - stageRect.left - 14),
          top: Math.max(0, rect.top - stageRect.top - 14),
          right: Math.min(bounds.width, rect.right - stageRect.left + 14),
          bottom: Math.min(bounds.height, rect.bottom - stageRect.top + 14),
        };
      })
      .filter((obstacle) => obstacle.right > obstacle.left && obstacle.bottom > obstacle.top);

    const placed = [];
    sprites.forEach((sprite, index) => {
      const rect = sprite.element.getBoundingClientRect();
      const previousTravelX = Math.max(1, previousBounds.width - sprite.width - (previousBounds.inset * 2));
      const previousTravelY = Math.max(1, previousBounds.height - sprite.height - (previousBounds.inset * 2));
      const relativeX = (sprite.x - previousBounds.inset) / previousTravelX;
      const relativeY = (sprite.y - previousBounds.inset) / previousTravelY;
      sprite.width = rect.width;
      sprite.height = rect.height;

      const maximumX = Math.max(bounds.inset, bounds.width - sprite.width - bounds.inset);
      const maximumY = Math.max(bounds.inset, bounds.height - sprite.height - bounds.inset);
      const preferredX = hasMeasured
        ? bounds.inset + (Math.max(0, Math.min(1, relativeX)) * (maximumX - bounds.inset))
        : bounds.inset + ((maximumX - bounds.inset) * ((0.18 + (index * 0.29)) % 0.82));
      const preferredY = hasMeasured
        ? bounds.inset + (Math.max(0, Math.min(1, relativeY)) * (maximumY - bounds.inset))
        : bounds.inset + ((maximumY - bounds.inset) * ((0.27 + (index * 0.31)) % 0.78));
      const position = findOpenPosition(sprite, preferredX, preferredY, placed);
      sprite.x = position.x;
      sprite.y = position.y;

      const speed = bounds.width <= 480 ? 23 : bounds.width <= 840 ? 29 : 36;
      const [directionX, directionY] = directionSeeds[index % directionSeeds.length];
      sprite.velocityX = directionX * speed;
      sprite.velocityY = directionY * speed;
      placeSprite(sprite);
      if (!sprite.element.hidden && sprite.width) placed.push(sprite);
    });

    hasMeasured = true;
    sync();
  };

  const scheduleMeasure = () => {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measure);
  };
  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(scheduleMeasure)
    : null;
  if (resizeObserver) {
    resizeObserver.observe(stage);
    sprites.forEach((sprite) => resizeObserver.observe(sprite.element));
    stage.querySelectorAll("[data-client-safe-zone]").forEach((element) => resizeObserver.observe(element));
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
  const handlePageShow = scheduleMeasure;
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
    if (reducedMotion.matches) useStaticPositions();
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
  window.addEventListener("pageshow", handlePageShow);
  reducedMotion.addEventListener?.("change", handleMotion);
  toggleButton?.addEventListener("click", handleToggle);
  const interactionHandlers = sprites.map((sprite) => {
    const handlePointerEnter = () => {
      sprite.hovered = true;
      syncInteraction(sprite);
    };
    const handlePointerLeave = () => {
      sprite.hovered = false;
      syncInteraction(sprite);
    };
    const handleFocus = () => {
      sprite.focused = true;
      syncInteraction(sprite);
    };
    const handleBlur = () => {
      sprite.focused = false;
      syncInteraction(sprite);
    };
    sprite.element.addEventListener("pointerenter", handlePointerEnter);
    sprite.element.addEventListener("pointerleave", handlePointerLeave);
    sprite.element.addEventListener("focus", handleFocus);
    sprite.element.addEventListener("blur", handleBlur);
    return { sprite, handlePointerEnter, handlePointerLeave, handleFocus, handleBlur };
  });
  updateToggle();
  requestAnimationFrame(measure);

  return {
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      stop();
      if (measureFrame) cancelAnimationFrame(measureFrame);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", scheduleMeasure);
      visibilityObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
      reducedMotion.removeEventListener?.("change", handleMotion);
      toggleButton?.removeEventListener("click", handleToggle);
      interactionHandlers.forEach(({ sprite, handlePointerEnter, handlePointerLeave, handleFocus, handleBlur }) => {
        sprite.element.removeEventListener("pointerenter", handlePointerEnter);
        sprite.element.removeEventListener("pointerleave", handlePointerLeave);
        sprite.element.removeEventListener("focus", handleFocus);
        sprite.element.removeEventListener("blur", handleBlur);
      });
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

  const movingClients = clients.slice(0, 8);
  const countElement = section.querySelector("[data-client-count]");
  section.dataset.clientCount = String(Math.min(movingClients.length, 6));
  initialiseClientCount(countElement, clients.length, section);

  const movingLogos = movingClients.map((client) => {
    const name = localisedConfigText(client.name);
    const website = safeWebUrl(client.website || client.url);
    const linkLabel = localisedConfigText(client.linkLabel) || name;
    const actionLabel = localisedConfigText(client.actionLabel) || "View organisation →";
    const movingLogo = document.createElement("a");
    const logoSurface = document.createElement("span");
    const movingImage = document.createElement("img");
    const action = document.createElement("span");

    movingLogo.className = "client-moving-logo";
    movingLogo.href = website;
    movingLogo.target = "_blank";
    movingLogo.rel = "noopener noreferrer";
    movingLogo.setAttribute("aria-label", linkLabel);
    logoSurface.className = "client-logo-surface";
    movingImage.src = client.logo;
    movingImage.alt = "";
    movingImage.width = 1000;
    movingImage.height = 405;
    movingImage.loading = "lazy";
    movingImage.decoding = "async";
    action.className = "client-logo-action";
    action.textContent = actionLabel;
    logoSurface.append(movingImage, action);
    movingLogo.append(logoSurface);
    movingImage.addEventListener("error", () => {
      movingLogo.hidden = true;
    }, { once: true });
    return movingLogo;
  });

  const captionEntries = clients.map((client, index) => {
    const name = localisedConfigText(client.name);
    const website = safeWebUrl(client.website || client.url);
    const linkLabel = localisedConfigText(client.linkLabel) || name;
    const entry = document.createElement("div");
    const captionCopy = document.createElement("div");
    const captionLabel = document.createElement("span");
    const captionName = document.createElement("strong");
    const websiteLink = document.createElement("a");

    entry.className = "client-caption-entry";
    captionCopy.className = "client-caption-copy";
    captionLabel.textContent = `${String(index + 1).padStart(2, "0")} / ${localisedConfigText(client.captionLabel) || "Client"}`;
    captionName.textContent = name;
    captionCopy.append(captionLabel, captionName);

    websiteLink.className = "client-website-link";
    websiteLink.href = website;
    websiteLink.target = "_blank";
    websiteLink.rel = "noopener noreferrer";
    websiteLink.setAttribute("aria-label", linkLabel);
    websiteLink.textContent = `${new URL(website).hostname.replace(/^www\./, "")} ↗`;
    entry.append(captionCopy, websiteLink);
    return entry;
  });

  stage.append(...movingLogos);
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
  section.hidden = false;
  requestAnimationFrame(() => createBouncingClientLogos(stage, movingLogos, motionToggle));
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
    : "/api/meeting";
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
  let isSubmitting = false;
  let requestTimeout = 0;

  function cancelPendingSubmission() {
    activeSubmission += 1;
    if (requestTimeout) window.clearTimeout(requestTimeout);
    requestTimeout = 0;
    requestController?.abort();
    requestController = null;
    isSubmitting = false;
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
    modal.setAttribute("aria-labelledby", "booking-title");
    modal.setAttribute("aria-describedby", "booking-intro");
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
    const focusTarget = activeOpener?.closest(".mobile-nav")
      ? menuToggle
      : activeOpener?.isConnected && activeOpener.offsetParent !== null ? activeOpener : null;
    focusTarget?.focus();
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

  const trimmedRequiredFields = ["name", "organisation", "message"]
    .map((fieldName) => form.elements.namedItem(fieldName))
    .filter((field) => field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement);
  function validateTrimmedRequiredFields() {
    trimmedRequiredFields.forEach((field) => {
      field.setCustomValidity(String(field.value).trim() ? "" : "Please enter a value.");
    });
  }
  trimmedRequiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      if (String(field.value).trim()) field.setCustomValidity("");
    });
  });

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
    if (isSubmitting) return;
    validateTrimmedRequiredFields();
    if (!form.checkValidity()) {
      form.reportValidity();
      focusFirstInvalidField();
      return;
    }

    const values = Object.fromEntries(new FormData(form).entries());
    const clientSubmissionId = crypto.randomUUID();
    const payload = {
      submissionId: clientSubmissionId,
      name: String(values.name || "").trim(),
      organisation: String(values.organisation || "").trim(),
      email: String(values.email || "").trim(),
      phone: String(values.phone || "").trim(),
      message: String(values.message || "").trim(),
      preferredDate: String(values.preferredDate || ""),
      preferredTime: String(values.preferredTime || ""),
      website: String(values.website || ""),
      locale: pageLocale,
      durationMinutes,
      formStartedAt,
      submittedAt: Date.now(),
    };
    const submissionId = ++activeSubmission;
    requestController = new AbortController();
    let requestTimedOut = false;
    requestTimeout = window.setTimeout(() => {
      requestTimedOut = true;
      requestController?.abort();
    }, 10000);
    isSubmitting = true;

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

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Booking request returned an invalid response");
      }
      if (submissionId !== activeSubmission) return;
      if (!response.ok || result?.ok !== true) throw new Error("Booking request was not accepted");

      form.reset();
      formStartedAt = Date.now();
      form.hidden = true;
      formView.hidden = true;
      successView.hidden = false;
      modal.setAttribute("aria-labelledby", "booking-success-title");
      modal.setAttribute("aria-describedby", "booking-success-message");
      requestAnimationFrame(() => successView.focus());
    } catch (error) {
      if (submissionId !== activeSubmission) return;
      const wasTimedOut = error?.name === "AbortError" && requestTimedOut;
      if (error?.name === "AbortError" && !wasTimedOut) return;
      if (status) {
        status.setAttribute("role", "alert");
        status.textContent = status.dataset.errorMessage || "We could not send the request.";
      }
      createEmailFallback(payload);
    } finally {
      if (submissionId !== activeSubmission) return;
      if (requestTimeout) window.clearTimeout(requestTimeout);
      requestTimeout = 0;
      requestController = null;
      isSubmitting = false;
      form.removeAttribute("aria-busy");
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.defaultLabel || "Send meeting request";
    }
  });
}

function initialiseMessengerConversation() {
  const section = document.querySelector("[data-messenger]");
  const transcriptWindow = section?.querySelector("[data-messenger-window]");
  const frame = section?.querySelector(".messenger-frame");
  const typingIndicator = section?.querySelector("[data-messenger-typing]");
  const typingName = section?.querySelector("[data-messenger-typing-name]");
  const control = section?.querySelector("[data-messenger-control]");
  const controlLabel = section?.querySelector("[data-messenger-control-label]");
  const messageElements = Array.from(section?.querySelectorAll("[data-messenger-message]") || []);
  if (!section || !frame || !transcriptWindow || !typingIndicator || !typingName || !control || !messageElements.length) return;

  const supportsIntersectionObserver = typeof IntersectionObserver === "function";
  const saveData = navigator.connection?.saveData === true;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const parseDuration = (value, fallback) => {
    const duration = Number(value);
    return Number.isFinite(duration) ? Math.min(3000, Math.max(250, duration)) : fallback;
  };
  const conversation = messageElements.map((element) => ({
    element,
    side: element.dataset.side === "vooglin" ? "vooglin" : "organisation",
    speaker: element.dataset.speaker || "Organisation",
    typingDuration: parseDuration(element.dataset.typingDuration, 850),
    holdDuration: parseDuration(element.dataset.holdDuration, 800),
  }));

  let sequenceId = 0;
  let waitTimer = 0;
  let waitResolve = null;
  let waitRemaining = 0;
  let waitStartedAt = 0;
  let waitRunId = 0;
  let scrollFrame = 0;
  let scrollSettleTimer = 0;
  let isInView = !supportsIntersectionObserver;
  let hasStarted = false;
  let isPaused = false;
  let activePhase = "idle";

  const canAnimate = () => (
    supportsIntersectionObserver
    && !prefersReducedMotion.matches
    && !saveData
    && !lowMemory
  );

  function setControl(mode) {
    const labels = {
      pause: control.dataset.pauseLabel || "Pause conversation",
      resume: control.dataset.resumeLabel || "Resume conversation",
      replay: control.dataset.replayLabel || "Replay conversation",
    };
    const label = labels[mode];
    control.dataset.controlMode = mode;
    control.setAttribute("aria-label", label);
    control.title = label;
    if (controlLabel) controlLabel.textContent = label;
  }

  function cancelScheduledWork() {
    sequenceId += 1;
    if (waitTimer) window.clearTimeout(waitTimer);
    if (scrollSettleTimer) window.clearTimeout(scrollSettleTimer);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    const resolve = waitResolve;
    waitTimer = 0;
    waitResolve = null;
    waitRemaining = 0;
    waitStartedAt = 0;
    scrollFrame = 0;
    scrollSettleTimer = 0;
    resolve?.(false);
  }

  function scrollTranscript(behavior = "smooth", followLayout = false) {
    if (!canAnimate()) return;
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    if (scrollSettleTimer) window.clearTimeout(scrollSettleTimer);

    const moveToLatestMessage = () => {
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        transcriptWindow.scrollTo({
          top: transcriptWindow.scrollHeight,
          behavior,
        });
      });
    };

    moveToLatestMessage();
    if (followLayout) {
      scrollSettleTimer = window.setTimeout(() => {
        scrollSettleTimer = 0;
        moveToLatestMessage();
      }, 480);
    }
  }

  function prepareSequence() {
    cancelScheduledWork();
    isPaused = false;
    activePhase = "idle";
    section.classList.add("is-sequencing");
    section.dataset.messengerState = "idle";
    conversation.forEach(({ element }) => element.classList.remove("is-visible"));
    typingIndicator.hidden = true;
    control.hidden = false;
    setControl("pause");
    transcriptWindow.scrollTop = 0;
    return sequenceId;
  }

  function showStaticConversation() {
    cancelScheduledWork();
    hasStarted = false;
    isPaused = false;
    activePhase = "static";
    section.classList.remove("is-sequencing");
    section.dataset.messengerState = "static";
    conversation.forEach(({ element }) => element.classList.add("is-visible"));
    typingIndicator.hidden = true;
    control.hidden = true;
    transcriptWindow.scrollTop = 0;
  }

  function pauseWait() {
    if (!waitTimer) return;
    window.clearTimeout(waitTimer);
    waitTimer = 0;
    waitRemaining = Math.max(0, waitRemaining - (performance.now() - waitStartedAt));
  }

  function resumeWait() {
    if (
      waitTimer
      || !waitResolve
      || waitRunId !== sequenceId
      || isPaused
      || !isInView
      || document.hidden
    ) return;

    waitStartedAt = performance.now();
    waitTimer = window.setTimeout(() => {
      waitTimer = 0;
      const resolve = waitResolve;
      waitResolve = null;
      waitRemaining = 0;
      waitStartedAt = 0;
      resolve?.(waitRunId === sequenceId);
    }, waitRemaining);
  }

  function waitFor(duration, runId) {
    return new Promise((resolve) => {
      waitResolve = resolve;
      waitRemaining = duration;
      waitStartedAt = 0;
      waitRunId = runId;
      resumeWait();
    });
  }

  async function startConversation() {
    if (!canAnimate()) {
      showStaticConversation();
      return;
    }

    const runId = prepareSequence();
    hasStarted = true;

    if (!await waitFor(320, runId)) return;

    for (const message of conversation) {
      if (runId !== sequenceId) return;
      activePhase = "typing";
      section.dataset.messengerState = "typing";
      typingIndicator.dataset.side = message.side;
      typingName.textContent = message.speaker;
      typingIndicator.hidden = false;
      scrollTranscript();

      if (!await waitFor(message.typingDuration, runId)) return;

      typingIndicator.hidden = true;
      message.element.classList.add("is-visible");
      activePhase = "message";
      section.dataset.messengerState = "message";
      scrollTranscript("smooth", true);

      if (!await waitFor(message.holdDuration, runId)) return;
    }

    activePhase = "complete";
    section.dataset.messengerState = "complete";
    setControl("replay");
  }

  control.addEventListener("click", () => {
    if (!canAnimate()) return;
    if (activePhase === "complete") {
      startConversation();
      return;
    }

    isPaused = !isPaused;
    if (isPaused) {
      section.dataset.messengerState = "paused";
      setControl("resume");
      pauseWait();
      return;
    }

    section.dataset.messengerState = activePhase;
    setControl("pause");
    resumeWait();
  });

  const observer = supportsIntersectionObserver
    ? new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        if (!isInView) {
          if (hasStarted && !isPaused && activePhase !== "complete") {
            section.dataset.messengerState = "paused";
          }
          pauseWait();
          return;
        }
        if (!hasStarted && canAnimate()) startConversation();
        else {
          if (!isPaused && activePhase !== "complete") {
            section.dataset.messengerState = activePhase;
          }
          resumeWait();
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -12%" })
    : null;
  observer?.observe(frame);

  const handleMotionChange = () => {
    if (!canAnimate()) {
      showStaticConversation();
      return;
    }

    hasStarted = false;
    prepareSequence();
    if (isInView) startConversation();
  };
  prefersReducedMotion.addEventListener?.("change", handleMotionChange);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (hasStarted && !isPaused && activePhase !== "complete") {
        section.dataset.messengerState = "paused";
      }
      pauseWait();
      return;
    }
    if (!isPaused && isInView && activePhase !== "complete") {
      section.dataset.messengerState = activePhase;
    }
    resumeWait();
  });
  window.addEventListener("pagehide", pauseWait);
  window.addEventListener("pageshow", resumeWait);

  if (canAnimate()) prepareSequence();
  else showStaticConversation();
}

initialiseSavingsCalculator();
initialiseClients();
initialiseBooking();
initialiseMessengerConversation();
initialiseScrollReveal();
