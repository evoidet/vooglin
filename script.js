const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const year = document.querySelector("[data-year]");
const mainContent = document.querySelector("main");
const footer = document.querySelector("footer");
const wordmarkCanvas = document.querySelector("[data-wordmark-network]");

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
  menuToggle.querySelector("span").textContent = "Menu";

  if (restoreFocus) menuToggle.focus();
}

if (header && menuToggle) {
  menuToggle.addEventListener("click", () => {
    const shouldOpen = !header.classList.contains("is-open");

    header.classList.toggle("is-open", shouldOpen);
    document.body.classList.toggle("menu-open", shouldOpen);
    setPageInert(shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.querySelector("span").textContent = shouldOpen ? "Close" : "Menu";

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

function createWordmarkNetwork(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4;
  const trackSteps = 180;
  const trackPoints = new Float32Array((trackSteps + 1) * 2);
  const nodes = Array.from({ length: 7 }, () => ({ x: 0, y: 0 }));
  const tau = Math.PI * 2;
  const loopDuration = 18000;

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let radiusX = 0;
  let radiusY = 0;
  let nodeCount = 7;
  let frameRate = 30;
  let elapsed = 0;
  let lastFrame = 0;
  let animationFrame = 0;
  let isInView = true;

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
    centerX = width * 0.47;
    centerY = height * 0.51;
    radiusX = Math.min(width * 0.43, 540);
    radiusY = height * 0.72;
    nodeCount = width < 720 ? 5 : 7;
    frameRate = width < 720 ? 24 : 30;
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

    drawConnections();
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
      && width >= 340
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
    stopAnimation();

    if (canAnimate()) {
      canvas.dataset.networkState = "running";
      animationFrame = requestAnimationFrame(animate);
    } else {
      const usesStaticFrame = reducedMotion.matches || saveData || lowMemory || width < 340;
      canvas.dataset.networkState = usesStaticFrame ? "static" : "paused";
      draw(elapsed || loopDuration * 0.18);
    }
  }

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => resizeCanvas())
    : null;

  if (resizeObserver) {
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener("resize", resizeCanvas, { passive: true });
  }

  const visibilityObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        syncAnimation();
      }, { rootMargin: "80px" })
    : null;

  visibilityObserver?.observe(canvas);

  const handleMotionChange = () => syncAnimation();
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleMotionChange);
  } else {
    reducedMotion.addListener(handleMotionChange);
  }

  document.addEventListener("visibilitychange", syncAnimation);
  window.addEventListener("pagehide", stopAnimation);
  window.addEventListener("pageshow", syncAnimation);

  resizeCanvas();
  syncAnimation();
}

if (wordmarkCanvas) {
  createWordmarkNetwork(wordmarkCanvas);
}
