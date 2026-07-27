const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
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
    if (window.innerWidth > 980) closeMenu();
  });
}
