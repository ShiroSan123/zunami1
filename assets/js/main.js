const rootPrefix = document.documentElement.dataset.rootPrefix || "./";

const toSitePath = (route = "") => {
  if (!route) {
    return rootPrefix;
  }

  const cleanRoute = route.replace(/^\/+|\/+$/g, "");
  return `${rootPrefix}${cleanRoute}/`;
};

const selectors = {
  header: document.getElementById("masthead"),
  mobileToggle: document.getElementById("mobile_menu_open"),
  mobileMenu: document.getElementById("mobile_menu"),
  searchOpen: document.getElementById("search_popup_open"),
  searchClose: document.getElementById("search_popup_close"),
  searchPopup: document.getElementById("search_popup"),
  searchResults: document.getElementById("search_popup_results"),
  searchResultsText: document.getElementById("search_popup_results_text"),
  searchForm: document.getElementById("search_form"),
  searchInput: document.getElementById("search_input"),
  modal: document.getElementById("modal_request"),
  modalOpen: document.getElementById("open_main_popup"),
  loadMore: document.getElementById("load_more_posts"),
};

let searchIndex = null;
let mapLoader = null;

const normalizeSearchValue = (value) => value.toLowerCase().replace(/\s+/g, " ").trim();

const toggleMobileMenu = (forceState) => {
  if (!selectors.header) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : !selectors.header.classList.contains("menu-open");

  selectors.header.classList.toggle("menu-open", nextState);
};

const toggleSearchPopup = (forceState) => {
  if (!selectors.searchPopup || !selectors.searchResults) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : !selectors.searchPopup.classList.contains("search-popup_open");

  selectors.searchPopup.classList.toggle("search-popup_open", nextState);
  selectors.searchResults.classList.toggle(
    "search-popup-results_open",
    nextState && !!selectors.searchResultsText?.innerHTML.trim(),
  );

  if (nextState) {
    selectors.searchInput?.focus();
    return;
  }

  if (selectors.searchInput) {
    selectors.searchInput.value = "";
  }
  if (selectors.searchResultsText) {
    selectors.searchResultsText.innerHTML = "";
  }
};

const toggleModal = (forceState) => {
  if (!selectors.modal) {
    return;
  }

  const nextState = typeof forceState === "boolean"
    ? forceState
    : !selectors.modal.classList.contains("modal-open");

  selectors.modal.classList.toggle("modal-open", nextState);
};

const renderSearchResults = (results, query) => {
  if (!selectors.searchResults || !selectors.searchResultsText) {
    return;
  }

  if (!query) {
    selectors.searchResultsText.innerHTML = "";
    selectors.searchResults.classList.remove("search-popup-results_open");
    return;
  }

  if (!results.length) {
    selectors.searchResultsText.innerHTML = `
      <div class="search-res-count">Ничего не найдено</div>
    `;
    selectors.searchResults.classList.add("search-popup-results_open");
    return;
  }

  const items = results.map((item) => {
    const href = toSitePath(item.route);
    return `<a class="search-res-post" href="${href}">${item.title}</a>`;
  }).join("");

  selectors.searchResultsText.innerHTML = `
    <div class="search-res-count">Результатов: <strong>${results.length}</strong></div>
    ${items}
  `;
  selectors.searchResults.classList.add("search-popup-results_open");
};

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
  event?.preventDefault();

  if (!selectors.searchInput) {
    return;
  }

  const query = normalizeSearchValue(selectors.searchInput.value);
  if (!query) {
    renderSearchResults([], "");
    return;
  }

  try {
    const index = await ensureSearchIndex();
    const results = index.filter((item) => {
      const haystack = normalizeSearchValue(`${item.title} ${item.excerpt || ""}`);
      return haystack.includes(query);
    }).slice(0, 12);

    renderSearchResults(results, query);
  } catch (error) {
    selectors.searchResultsText.innerHTML = `
      <div class="search-res-count">Не удалось выполнить поиск</div>
    `;
    selectors.searchResults?.classList.add("search-popup-results_open");
  }
};

const initLoadMore = () => {
  if (!selectors.loadMore) {
    return;
  }

  selectors.loadMore.addEventListener("click", () => {
    const hiddenCards = Array.from(document.querySelectorAll("article[data-is-hidden]"));
    hiddenCards.slice(0, 9).forEach((card) => {
      card.removeAttribute("data-is-hidden");
    });

    if (!document.querySelector("article[data-is-hidden]")) {
      selectors.loadMore.closest(".load-more-holder")?.setAttribute("hidden", "hidden");
    }
  });
};

const initAccordions = () => {
  const items = document.querySelectorAll(".wp-block-accordion-item");
  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    const button = item.querySelector(".wp-block-accordion-heading__toggle");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((openedItem) => {
        if (openedItem !== item) {
          openedItem.classList.remove("is-open");
        }
      });

      item.classList.toggle("is-open", !isOpen);
    });
  });
};

const markInViewport = (element) => {
  if (!element || element.classList.contains("in-viewport")) {
    return;
  }

  element.classList.add("in-viewport");
};

const initViewportAnimations = () => {
  const nodes = Array.from(document.querySelectorAll("[animate-on-visible]"));
  if (!nodes.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    nodes.forEach(markInViewport);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        markInViewport(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  nodes.forEach((node) => observer.observe(node));
};

const initForms = () => {
  document.querySelectorAll(".js-static-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.remove("invalid", "unaccepted");

      const requiredCheckboxes = Array.from(form.querySelectorAll('input[type="checkbox"][required]'));
      if (requiredCheckboxes.some((checkbox) => !checkbox.checked)) {
        form.classList.add("unaccepted");
      }

      const textFields = Array.from(form.querySelectorAll("input, textarea"));
      textFields.forEach((field) => {
        field.classList.toggle("wpcf7-not-valid", !field.checkValidity());
      });

      if (textFields.some((field) => !field.checkValidity())) {
        form.classList.add("invalid");
      }

      if (!form.reportValidity() || form.classList.contains("unaccepted")) {
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

const initShareLinks = () => {
  document.querySelectorAll("[data-share-vk]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const shareUrl = new URL("https://vk.com/share.php");
      shareUrl.searchParams.set("url", window.location.href);
      shareUrl.searchParams.set("title", document.title);
      shareUrl.searchParams.set("noparse", "true");
      window.open(shareUrl.toString(), "_blank", "noopener,noreferrer,width=700,height=500");
    });
  });
};

const initEvents = () => {
  selectors.mobileToggle?.addEventListener("click", () => toggleMobileMenu());
  selectors.searchOpen?.addEventListener("click", () => toggleSearchPopup(true));
  selectors.searchClose?.addEventListener("click", () => toggleSearchPopup(false));
  selectors.searchForm?.addEventListener("submit", handleSearch);
  selectors.searchInput?.addEventListener("input", () => {
    if (!selectors.searchInput?.value.trim()) {
      renderSearchResults([], "");
    }
  });
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

    if (target.closest("#mobile_menu .menu a")) {
      toggleMobileMenu(false);
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
initViewportAnimations();
initForms();
initMaps();
initShareLinks();
