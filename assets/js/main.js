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

const initWavesBlock = () => {
  const container = document.getElementById("waves_container");
  const waves = document.getElementById("waves");
  const wavesBefore = document.getElementById("waves_placeholder_before");
  const wavesAfter = document.getElementById("waves_placeholder_after");
  const wavesLine = document.getElementById("waves_line");
  const swimmer = document.getElementById("swimmer");
  const items = Array.from(document.querySelectorAll("#waves .info_itm"));

  if (!container || !waves || !wavesBefore || !wavesAfter || !wavesLine || !swimmer || !items.length) {
    return;
  }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => {
        item.style.opacity = "1";
      });
      return;
    }

  let lastScrollTop = window.scrollY;
  let stageHeight = 0;
  let wavesMaxHeight = 0;
  let waveHeight = 0;
  let wavePeriod = 1;
  let frameRequested = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smoothstep = (value) => {
    const clampedValue = clamp(value, 0, 1);
    return clampedValue * clampedValue * (3 - 2 * clampedValue);
  };

  const setPlaceholderHeight = (node, value) => {
    node.style.height = `${Math.max(0, value)}px`;
  };

  const clearPinnedState = () => {
    waves.classList.remove("fixed");
    waves.classList.remove("ended");
    waves.style.removeProperty("--waves-end-top");
  };

  const syncFixedBox = () => {
    const rect = container.getBoundingClientRect();
    waves.style.setProperty("--waves-fixed-left", `${Math.round(rect.left)}px`);
    waves.style.setProperty("--waves-fixed-width", `${Math.round(rect.width)}px`);
  };

  const setProgress = (state) => {
    const progress = clamp(state, 0, 1);
    const step = 1 / items.length;
    const stagger = step * 0.82;
    const fadeSpan = step * 1.35;

    items.forEach((item, index) => {
      const start = index * stagger;
      const rawOpacity = (progress - start) / fadeSpan;
      const opacity = smoothstep(rawOpacity);
      item.style.opacity = opacity.toFixed(3);
    });

    const wavesOffset = -progress * 2000;
    wavesLine.style.backgroundPositionX = `${wavesOffset}px`;

    const wavePeriodPosition = (
      Math.abs(wavesOffset - 30 - (wavesLine.clientWidth * 0.2)) % wavePeriod
    ) / wavePeriod;
    const heightOffset = 0.5 - Math.abs(0.5 - wavePeriodPosition);
    const pixelOffset = waveHeight * 0.6 * (Math.floor(heightOffset * 10) / 10);
    swimmer.style.backgroundPositionY = `${pixelOffset}px`;
  };

  const update = () => {
    if (!stageHeight) {
      return;
    }

    syncFixedBox();

    const scrollTop = Math.max(window.scrollY, 0);
    const beforeTop = wavesBefore.getBoundingClientRect().top;
    const scrollSpan = Math.max(wavesMaxHeight - stageHeight, 1);

    if (beforeTop < 0 && Math.abs(beforeTop) < scrollSpan) {
      setProgress(Math.abs(beforeTop) / scrollSpan);
    }

    const beforeBottom = beforeTop + wavesBefore.offsetHeight - stageHeight;
    const afterTop = wavesAfter.getBoundingClientRect().top;

    if (scrollTop > lastScrollTop) {
      if (beforeTop <= 0 && (beforeBottom > 0 || wavesBefore.offsetHeight === 0) && !waves.classList.contains("fixed")) {
        setPlaceholderHeight(wavesBefore, wavesMaxHeight);
        waves.classList.remove("ended");
        waves.style.removeProperty("--waves-end-top");
        waves.classList.add("fixed");
        setPlaceholderHeight(wavesAfter, 0);
        setProgress(0);
      } else if (beforeTop > 0) {
        setPlaceholderHeight(wavesBefore, 0);
        clearPinnedState();
        setPlaceholderHeight(wavesAfter, scrollSpan);
        setProgress(0);
      }

      if (afterTop < stageHeight && waves.classList.contains("fixed")) {
        const fixedTop = waves.getBoundingClientRect().top;
        waves.classList.remove("fixed");
        waves.classList.add("ended");
        waves.style.setProperty("--waves-end-top", `${Math.round(scrollSpan + fixedTop)}px`);
        setPlaceholderHeight(wavesBefore, wavesMaxHeight);
        setPlaceholderHeight(wavesAfter, 0);
        setProgress(1);
      }
    } else {
      if (afterTop > stageHeight && beforeTop <= 0 && !waves.classList.contains("fixed")) {
        setPlaceholderHeight(wavesBefore, wavesMaxHeight);
        waves.classList.remove("ended");
        waves.style.removeProperty("--waves-end-top");
        waves.classList.add("fixed");
        setPlaceholderHeight(wavesAfter, 0);
        setProgress(1);
      } else if (beforeTop > 0) {
        setPlaceholderHeight(wavesBefore, 0);
        clearPinnedState();
        setPlaceholderHeight(wavesAfter, scrollSpan);
        setProgress(0);
      }
    }

    lastScrollTop = scrollTop;
  };

  const requestUpdate = () => {
    if (frameRequested) {
      return;
    }

    frameRequested = true;
    window.requestAnimationFrame(() => {
      frameRequested = false;
      update();
    });
  };

  const calculate = () => {
    clearPinnedState();
    waves.dataset.wavesReady = "true";
    waves.style.removeProperty("--waves-fixed-left");
    waves.style.removeProperty("--waves-fixed-width");

    setPlaceholderHeight(wavesBefore, 0);
    setPlaceholderHeight(wavesAfter, 0);

    stageHeight = waves.offsetHeight;
    wavesMaxHeight = stageHeight * 5;
    waveHeight = wavesLine.offsetHeight;
    wavePeriod = (waveHeight / 80) * 130 || 1;

    setPlaceholderHeight(wavesAfter, wavesMaxHeight - stageHeight);
    setProgress(0);
    syncFixedBox();
    update();
  };

  const requestCalculate = () => {
    window.requestAnimationFrame(calculate);
  };

  calculate();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestCalculate);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(requestCalculate);
    resizeObserver.observe(container);
    resizeObserver.observe(wavesLine);
  }
};

const initHistoryParallax = () => {
  const holder = document.querySelector(".zunami_visible-lg.zunami-history-blocks-holder");
  if (!holder) {
    return;
  }

  let frameRequested = false;
  const toggleParallax = () => {
    const isVisible = holder.offsetParent !== null && holder.clientWidth > 0;
    if (!isVisible) {
      holder.classList.remove("zunami-history-blocks-holder_parallax");
      return;
    }

    const maxScrollLeft = holder.scrollWidth - holder.clientWidth;
    const tolerance = 4;
    const atEnd = maxScrollLeft <= tolerance || holder.scrollLeft >= maxScrollLeft - tolerance;

    holder.classList.toggle("zunami-history-blocks-holder_parallax", atEnd);
  };

  const requestToggle = () => {
    if (frameRequested) {
      return;
    }

    frameRequested = true;
    window.requestAnimationFrame(() => {
      frameRequested = false;
      toggleParallax();
    });
  };

  holder.addEventListener("scroll", requestToggle, { passive: true });
  window.addEventListener("resize", requestToggle);
  toggleParallax();
};

const initHistoryPopups = () => {
  const modals = Array.from(document.querySelectorAll(".history-modal[data-history-modal]"));
  if (modals.length === 0) {
    return;
  }

  const modalMap = new Map();
  modals.forEach((modal) => {
    if (modal.dataset.historyModal) {
      modalMap.set(modal.dataset.historyModal, modal);
    }
  });

  let lastActive = null;
  const isMobile = () => window.matchMedia("(max-width: 1199px)").matches;

  const closeModal = (modal) => {
    if (!modal.classList.contains("is-open")) {
      return;
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("history-modal-open");

    if (lastActive && document.contains(lastActive)) {
      lastActive.focus();
    }
    lastActive = null;
  };

  const closeAll = () => {
    modals.forEach(closeModal);
  };

  const openModal = (modal) => {
    closeAll();
    lastActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("history-modal-open");

    const closeBtn = modal.querySelector(".history-modal__close");
    if (closeBtn) {
      closeBtn.focus();
    }
  };

  document.querySelectorAll(".zunami-history-card__link").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!isMobile()) {
        return;
      }

      const target = link.getAttribute("href") || "";
      const key = target.replace("#", "");
      const modal = modalMap.get(key);
      if (!modal) {
        return;
      }

      event.preventDefault();
      openModal(modal);
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });

    modal.querySelectorAll("[data-history-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(modal));
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAll();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeAll();
    }
  });
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

const initPageProgress = () => {
  const progress = document.createElement("div");
  progress.className = "page-progress";
  progress.innerHTML = '<div class="page-progress__bar"></div>';
  document.body.appendChild(progress);

  requestAnimationFrame(() => {
    progress.classList.add("page-progress_visible");
  });

  window.addEventListener("load", () => {
    progress.classList.add("page-progress_done");
    setTimeout(() => {
      progress.classList.add("page-progress_hidden");
    }, 150);
    setTimeout(() => {
      progress.remove();
    }, 600);
  });
};

const initPageTransitions = () => {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const link = target.closest("a");
    if (!link) {
      return;
    }

    if (link.target === "_blank" || link.hasAttribute("download")) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return;
    }

    if (url.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    document.documentElement.classList.add("page-fadeout");
    setTimeout(() => {
      window.location.href = url.href;
    }, 250);
  }, { capture: true });
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
initWavesBlock();
initHistoryParallax();
initHistoryPopups();
initShareLinks();
initPageProgress();
initPageTransitions();
