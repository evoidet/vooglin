const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");
const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = new Date().getFullYear();
}

function closeMenu() {
  if (!header || !menuToggle) return;

  header.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.querySelector("span").textContent = "Menu";
}

if (header && menuToggle) {
  menuToggle.addEventListener("click", () => {
    const shouldOpen = !header.classList.contains("is-open");

    header.classList.toggle("is-open", shouldOpen);
    document.body.classList.toggle("menu-open", shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    menuToggle.querySelector("span").textContent = shouldOpen ? "Close" : "Menu";
  });

  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });
}
