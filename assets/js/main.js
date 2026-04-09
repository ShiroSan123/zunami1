const rootPrefix = document.documentElement.dataset.rootPrefix || "./";

const toSitePath = (route = "") => {
  if (!route) {
    return rootPrefix;
  }

  const cleanRoute = route.replace(/^\/+|\/+$/g, "");
  return `${rootPrefix}${cleanRoute}/`;
};

const selectors = {
  body: document.body,
  header: document.getElementById("masthead"),
  mobileToggle: document.getElementById("mobile_menu_open"),
  mobileMenu: document.getElementById("mobile_menu"),
  searchOpen: document.getElementById("search_popup_open"),
  searchClose: document.getElementById("search_popup_close"),
  searchPopup: document.getElementById("search_popup"),
  searchForm: document.getElementById("search_form"),
  searchInput: document.getElementById("search_input"),
  searchResults: document.getElementById("search_popup_results_text"),
  modal: document.getElementById("modal_request"),
  modalOpen: document.getElementById("open_main_popup"),
  loadMore: document.getElementById("load_more_posts"),
};

let searchIndex = null;
let mapLoader = null;

const setBodyLock = (value) => {
  selectors.body.classList.toggle("is-locked", value);
};

const toggleMobileMenu = (forceState) => {
  if (!selectors.header || !selectors.mobileMenu) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : !selectors.header.classList.contains("is-open");

  selectors.header.classList.toggle("is-open", nextState);
  selectors.mobileMenu.hidden = !nextState;
};

const toggleSearchPopup = (forceState) => {
  if (!selectors.searchPopup) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : selectors.searchPopup.hidden;

  selectors.searchPopup.hidden = !nextState;
  setBodyLock(nextState);

  if (nextState && selectors.searchInput) {
    selectors.searchInput.focus();
  }

  if (!nextState && selectors.searchInput) {
    selectors.searchInput.value = "";
    renderSearchResults([]);
  }
};

const toggleModal = (forceState) => {
  if (!selectors.modal) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : selectors.modal.hidden;

  selectors.modal.hidden = !nextState;
  setBodyLock(nextState);
};

const renderSearchResults = (results) => {
  if (!selectors.searchResults) {
    return;
  }

  if (!results.length) {
    selectors.searchResults.innerHTML = `
      <div class="search-popup-results__count">Ничего не найдено</div>
    `;
    return;
  }

  const items = results.map((item) => {
    const href = toSitePath(item.route);
    const excerpt = item.excerpt ? `<div class="search-res-excerpt">${item.excerpt}</div>` : "";
    return `<a class="search-res-post" href="${href}"><strong>${item.title}</strong>${excerpt}</a>`;
  }).join("");

  selectors.searchResults.innerHTML = `
    <div class="search-popup-results__count">Результатов: <strong>${results.length}</strong></div>
    ${items}
  `;
};

const normalizeSearchValue = (value) => value
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();

const ensureSearchIndex = async () => {
  if (searchIndex) {
    return searchIndex;
  }

  const response = await fetch(`${rootPrefix}assets/data/search-index.json`);
  if (!response.ok) {
    throw new Error("Search index request failed");
  }

  searchIndex = await response.json();
  return searchIndex;
};

const handleSearch = async (event) => {
  event.preventDefault();

  if (!selectors.searchInput) {
    return;
  }

  const query = normalizeSearchValue(selectors.searchInput.value);
  if (!query) {
    renderSearchResults([]);
    return;
  }

  try {
    const index = await ensureSearchIndex();
    const results = index.filter((item) => {
      const haystack = normalizeSearchValue(`${item.title} ${item.excerpt || ""}`);
      return haystack.includes(query);
    }).slice(0, 12);

    renderSearchResults(results);
  } catch (error) {
    selectors.searchResults.innerHTML = `
      <div class="search-popup-results__count">Не удалось выполнить поиск</div>
    `;
  }
};

const initLoadMore = () => {
  if (!selectors.loadMore) {
    return;
  }

  selectors.loadMore.addEventListener("click", () => {
    const hiddenCards = Array.from(document.querySelectorAll("[data-is-hidden]"));
    hiddenCards.slice(0, 9).forEach((card) => {
      card.removeAttribute("data-is-hidden");
      card.classList.remove("is-hidden");
    });

    if (document.querySelectorAll("[data-is-hidden]").length === 0) {
      selectors.loadMore.closest(".load-more-holder")?.setAttribute("hidden", "hidden");
    }
  });
};

const initAccordions = () => {
  document.querySelectorAll(".wp-block-accordion-item").forEach((item) => {
    const button = item.querySelector(".wp-block-accordion-heading__toggle");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      document.querySelectorAll(".wp-block-accordion-item.is-open").forEach((openedItem) => {
        if (openedItem !== item) {
          openedItem.classList.remove("is-open");
        }
      });

      item.classList.toggle("is-open", !isOpen);
    });
  });
};

const animateCount = (element) => {
  if (!element || element.dataset.animated === "true") {
    return;
  }

  const from = Number(element.dataset.from || 0);
  const to = Number(element.dataset.to || 0);
  const valueNode = element.querySelector(".zunami-countdown__value");

  if (!valueNode) {
    return;
  }

  element.dataset.animated = "true";
  const duration = 1200;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const value = Math.round(from + (to - from) * progress);
    valueNode.textContent = String(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const initCountups = () => {
  const nodes = document.querySelectorAll(".js-countdown");
  if (!nodes.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    nodes.forEach(animateCount);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  nodes.forEach((node) => observer.observe(node));
};

const initForms = () => {
  document.querySelectorAll(".js-static-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const successUrl = form.dataset.successUrl || toSitePath("successfully");
      window.location.href = successUrl;
    });
  });
};

const loadYandexMaps = (apiKey) => {
  if (window.ymaps3) {
    return Promise.resolve(window.ymaps3);
  }

  if (mapLoader) {
    return mapLoader;
  }

  mapLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.onload = async () => {
      try {
        await window.ymaps3.ready;
        resolve(window.ymaps3);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return mapLoader;
};

const initMaps = async () => {
  const mapNode = document.querySelector(".ya-map-holder[data-map]");
  if (!mapNode) {
    return;
  }

  try {
    const ymaps3 = await loadYandexMaps(mapNode.dataset.apikey || "");
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;
    const center = [Number(mapNode.dataset.lon), Number(mapNode.dataset.lat)];
    const zoom = Number(mapNode.dataset.zoom || 14);

    const map = new YMap(
      mapNode,
      { location: { center, zoom } },
      [
        new YMapDefaultSchemeLayer({
          customization: [{ stylers: [{ saturation: -1 }, { lightness: 0.15 }] }],
        }),
        new YMapDefaultFeaturesLayer({}),
      ],
    );

    const marker = document.createElement("div");
    marker.className = "ya-map-marker";
    map.addChild(new YMapMarker({ coordinates: center }, marker));
  } catch (error) {
    mapNode.innerHTML = `
      <div class="ya-map-fallback">
        <p>Карта временно недоступна.</p>
      </div>
    `;
  }
};

const initEvents = () => {
  selectors.mobileToggle?.addEventListener("click", () => toggleMobileMenu());
  selectors.searchOpen?.addEventListener("click", () => toggleSearchPopup(true));
  selectors.searchClose?.addEventListener("click", () => toggleSearchPopup(false));
  selectors.searchForm?.addEventListener("submit", handleSearch);
  selectors.searchInput?.addEventListener("input", handleSearch);
  selectors.modalOpen?.addEventListener("click", () => toggleModal(true));

  selectors.modal?.querySelector("[data-modal-close]")?.addEventListener("click", () => toggleModal(false));

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('a[href="#main_popup"]') || target.closest('button[data-href="#main_popup"]')) {
      event.preventDefault();
      toggleModal(true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleSearchPopup(false);
      toggleModal(false);
      toggleMobileMenu(false);
    }
  });
};

initEvents();
initLoadMore();
initAccordions();
initCountups();
initForms();
initMaps();
