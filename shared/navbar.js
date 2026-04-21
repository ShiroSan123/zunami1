const initNavbar = () => {
  const navbar = document.querySelector("[data-navbar]");
  if (!navbar) {
    return;
  }

  const menuButton = navbar.querySelector("[data-menu-button]");
  const mobileMenu = navbar.querySelector("[data-mobile-menu]");
  const navKey = document.body.dataset.nav || "";
  const theme = document.body.dataset.navbarTheme || "";

  navbar.querySelectorAll("[data-nav-link]").forEach((link) => {
    if (link.dataset.navLink === navKey) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  const syncScrollState = () => {
    navbar.classList.toggle("is-scrolled", theme === "light" || window.scrollY > 12);
  };

  const toggleMenu = (forceState) => {
    const nextState =
      typeof forceState === "boolean" ? forceState : !document.body.classList.contains("menu-open");

    document.body.classList.toggle("menu-open", nextState);
    document.body.classList.toggle("is-locked", nextState);
    menuButton?.setAttribute("aria-expanded", String(nextState));
    mobileMenu?.setAttribute("aria-hidden", String(!nextState));
  };

  menuButton?.addEventListener("click", () => toggleMenu());

  mobileMenu?.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    if (event.target === mobileMenu || event.target.closest("a")) {
      toggleMenu(false);
    }
  });

  window.addEventListener("scroll", syncScrollState, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleMenu(false);
    }
  });

  syncScrollState();
};

document.addEventListener("shared:loaded", initNavbar);
