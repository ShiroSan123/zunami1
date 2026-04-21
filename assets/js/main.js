const rootPrefix = document.documentElement.dataset.rootPrefix || "./";

const toSitePath = (route = "", type = "page") => {
  if (!route) {
    return `${rootPrefix}index.html`;
  }

  const cleanRoute = route.replace(/^\/+|\/+$/g, "");
  if (type === "post") {
    return `${rootPrefix}news/${cleanRoute}/index.html`;
  }
  return `${rootPrefix}${cleanRoute}/index.html`;
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

const normalizeSearchValue = (value) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const toggleMobileMenu = (forceState) => {
  if (!selectors.header) {
    return;
  }

  const nextState =
    typeof forceState === "boolean"
      ? forceState
      : !selectors.header.classList.contains("menu-open");

  selectors.header.classList.toggle("menu-open", nextState);
};

const toggleSearchPopup = (forceState) => {
  if (!selectors.searchPopup || !selectors.searchResults) {
    return;
  }

  const nextState =
    typeof forceState === "boolean"
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

  const nextState =
    typeof forceState === "boolean"
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

  const items = results
    .map((item) => {
      const href = toSitePath(item.route, item.type);
      return `<a class="search-res-post" href="${href}">${item.title}</a>`;
    })
    .join("");

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
    const results = index
      .filter((item) => {
        const haystack = normalizeSearchValue(
          `${item.title} ${item.excerpt || ""}`,
        );
        return haystack.includes(query);
      })
      .slice(0, 12);

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
    const hiddenCards = Array.from(
      document.querySelectorAll("article[data-is-hidden]"),
    );
    hiddenCards.slice(0, 9).forEach((card) => {
      card.removeAttribute("data-is-hidden");
    });

    if (!document.querySelector("article[data-is-hidden]")) {
      selectors.loadMore
        .closest(".load-more-holder")
        ?.setAttribute("hidden", "hidden");
    }
  });
};

const initAccordions = () => {
  const items = document.querySelectorAll(".wp-block-accordion-item");
  if (!items.length) {
    return;
  }

  const setItemState = (item, isOpen) => {
    item.classList.toggle("is-open", isOpen);
    const panel = item.querySelector(".wp-block-accordion-panel");
    const button = item.querySelector(".wp-block-accordion-heading--toggle");

    if (button) {
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    if (panel) {
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
      if (isOpen) {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      } else {
        panel.style.maxHeight = "0px";
      }
    }
  };

  const itemList = Array.from(items);
  itemList.forEach((item, index) => {
    const button = item.querySelector(".wp-block-accordion-heading--toggle");
    const panel = item.querySelector(".wp-block-accordion-panel");
    if (button && panel && !panel.id) {
      panel.id = `faq-panel-${index + 1}`;
      button.setAttribute("aria-controls", panel.id);
    }
  });

  itemList.forEach((item) =>
    setItemState(item, item.classList.contains("is-open")),
  );

  let hasOpen = itemList.some((item) => item.classList.contains("is-open"));
  if (!hasOpen && itemList[0]) {
    setItemState(itemList[0], true);
    hasOpen = true;
  }

  itemList.forEach((item) => {
    const button = item.querySelector(".wp-block-accordion-heading--toggle");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      itemList.forEach((openedItem) => setItemState(openedItem, false));
      setItemState(item, !isOpen);
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markInViewport(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  nodes.forEach((node) => observer.observe(node));
};

const initForms = () => {
  document.querySelectorAll(".js-static-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.remove("invalid", "unaccepted");

      const requiredCheckboxes = Array.from(
        form.querySelectorAll('input[type="checkbox"][required]'),
      );
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

const buildFooterMenuMarkup = (items) =>
  items
    .map(
      (item) => `
        <li class="menu-item${item.className ? ` ${item.className}` : ""}">
          <a href="${toSitePath(item.route)}">${item.label}</a>
        </li>
      `,
    )
    .join("");

const initInternalPageFooter = () => {
  if (
    document.body.classList.contains("home") ||
    document.body.classList.contains("single-post")
  ) {
    return;
  }

  const footer = document.querySelector(".site-footer");
  if (!footer) {
    return;
  }

  const columns = footer.querySelectorAll(".footer-column");
  if (columns.length < 3) {
    return;
  }

  const mainMenu = columns[1].querySelector(".widget_nav_menu .menu");
  if (mainMenu) {
    mainMenu.innerHTML = buildFooterMenuMarkup([
      { label: "О компании", route: "company" },
      { label: "Услуги", route: "uslugi" },
      { label: "Раскрытие информации", route: "info" },
      { label: "Реквизиты", route: "company/requisites" },
      { label: "Блог", route: "blog" },
      { label: "Контакты", route: "contacts" },
    ]);
  }

  const metaColumn = columns[2];
  if (!metaColumn.querySelector("[data-footer-date-info]")) {
    const dateWidget = document.createElement("div");
    dateWidget.className = "widget widget_date_info";
    dateWidget.dataset.footerDateInfo = "true";
    dateWidget.innerHTML = "<p>Дата обновления информации:</p>";
    metaColumn.append(dateWidget);
  }
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
    const {
      YMap,
      YMapDefaultSchemeLayer,
      YMapDefaultFeaturesLayer,
      YMapMarker,
    } = ymaps3;
    const center = [Number(mapNode.dataset.lon), Number(mapNode.dataset.lat)];
    const zoom = Number(mapNode.dataset.zoom || 14);

    const map = new YMap(mapNode, { location: { center, zoom } }, [
      new YMapDefaultSchemeLayer({
        customization: [{ stylers: [{ saturation: -1 }, { lightness: 0.15 }] }],
      }),
      new YMapDefaultFeaturesLayer({}),
    ]);

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
  const record = document.getElementById("rec771645295");
  if (!record) {
    return;
  }

  const artboard = record.querySelector(".t396--artboard");
  const spacerBefore = record.querySelector(".t396--pin-spacer--before");
  const spacerAfter = record.querySelector(".t396--pin-spacer--after");

  if (!artboard || !spacerBefore || !spacerAfter) {
    return;
  }

  const elements = Array.from(
    record.querySelectorAll(".tn-elem[data-animate-sbs-opts]"),
  );
  if (elements.length === 0) {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const parseOptions = (raw) => {
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw.replace(/'/g, '"'));
    } catch (error) {
      return null;
    }
  };

  const getResponsiveValue = (el, base, res320, res640) => {
    const width = window.innerWidth;
    if (width <= 639 && el.dataset[res320]) {
      return el.dataset[res320];
    }
    if (width <= 1199 && el.dataset[res640]) {
      return el.dataset[res640];
    }
    return el.dataset[base];
  };

  const normalizeFrame = (frame) => ({
    mx: toNumber(frame.mx, 0),
    my: toNumber(frame.my, 0),
    sx: frame.sx !== undefined ? toNumber(frame.sx, 1) : 1,
    sy: frame.sy !== undefined ? toNumber(frame.sy, 1) : 1,
    op: frame.op !== undefined ? toNumber(frame.op, 1) : 1,
    ro: frame.ro !== undefined ? toNumber(frame.ro, 0) : 0,
  });

  const buildTimeline = (frames) => {
    let current = normalizeFrame(frames[0]);
    let startState = current;
    const segments = [];
    let pos = 0;

    for (let i = 1; i < frames.length; i += 1) {
      const next = normalizeFrame(frames[i]);
      const delay = toNumber(frames[i].dd, 0);
      const duration = toNumber(frames[i].di, 0);

      if (delay === 0 && duration === 0) {
        current = next;
        startState = current;
        continue;
      }

      if (delay > 0) {
        segments.push({
          start: pos,
          end: pos + delay,
          from: current,
          to: current,
        });
        pos += delay;
      }

      if (duration > 0) {
        segments.push({
          start: pos,
          end: pos + duration,
          from: current,
          to: next,
        });
        pos += duration;
      }

      current = next;
    }

    return {
      start: startState,
      end: current,
      total: pos,
      segments,
    };
  };

  const findOpacityStart = (timeline) => {
    for (const segment of timeline.segments) {
      if (
        segment.from.op !== segment.to.op &&
        segment.to.op > segment.from.op
      ) {
        return segment.start;
      }
    }
    return null;
  };

  const buildConfig = (el) => {
    const optsRaw = getResponsiveValue(
      el,
      "animateSbsOpts",
      "animateSbsOptsRes320",
      "animateSbsOptsRes640",
    );
    const frames = parseOptions(optsRaw);
    if (!frames || frames.length === 0) {
      return null;
    }

    const trgRaw = getResponsiveValue(
      el,
      "animateSbsTrgofst",
      "animateSbsTrgofstRes320",
      "animateSbsTrgofstRes640",
    );
    const trgOffset = toNumber(trgRaw, 0);

    return {
      el,
      trgOffset,
      timeline: buildTimeline(frames),
      isText: el.dataset.elemType === "text",
      hasAnimHidden: el.classList.contains("t396--elem--anim-hidden"),
    };
  };

  const applyState = (el, frame) => {
    const opacity = clamp(frame.op, 0, 1);
    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translate3d(${frame.mx}px, ${frame.my}px, 0) scale(${frame.sx}, ${frame.sy}) rotate(${frame.ro}deg)`;
  };

  const resolveFrame = (timeline, distance) => {
    if (distance <= 0 || timeline.total === 0) {
      return timeline.start;
    }
    if (distance >= timeline.total) {
      return timeline.end;
    }
    const progress = distance;
    for (const segment of timeline.segments) {
      if (progress >= segment.start && progress <= segment.end) {
        const span = segment.end - segment.start || 1;
        const ratio = clamp((progress - segment.start) / span, 0, 1);
        return {
          mx: segment.from.mx + (segment.to.mx - segment.from.mx) * ratio,
          my: segment.from.my + (segment.to.my - segment.from.my) * ratio,
          sx: segment.from.sx + (segment.to.sx - segment.from.sx) * ratio,
          sy: segment.from.sy + (segment.to.sy - segment.from.sy) * ratio,
          op: segment.from.op + (segment.to.op - segment.from.op) * ratio,
          ro: segment.from.ro + (segment.to.ro - segment.from.ro) * ratio,
        };
      }
    }
    return timeline.end;
  };

  let configs = [];
  let animationSpan = 0;
  let pinSpan = 0;
  let artboardHeight = 0;
  let pinHeight = 0;
  let frameRequested = false;
  let pinnedState = "normal";
  let fixedTop = 0;
  let isMobile = window.innerWidth <= 639;
  const mobileTextBaseOpacity = 0.2;
  const getRecordTop = () =>
    record.getBoundingClientRect().top + (window.scrollY || 0);
  let recordTop = 0;

  const setPlaceholderHeight = (node, value) => {
    node.style.height = `${Math.max(0, value)}px`;
  };

  const syncFixedBox = () => {
    const rect = record.getBoundingClientRect();
    artboard.style.setProperty(
      "--t396-fixed-left",
      `${Math.round(rect.left)}px`,
    );
    artboard.style.setProperty(
      "--t396-fixed-width",
      `${Math.round(rect.width)}px`,
    );
  };

  const clearPinnedState = () => {
    artboard.classList.remove("t396--artboard--fixed");
    artboard.classList.remove("t396--artboard--ended");
    artboard.style.removeProperty("--t396-end-top");
  };

  const setPinnedState = (nextState, force = false) => {
    if (!force && pinnedState === nextState) {
      if (nextState === "fixed") {
        fixedTop = artboard.getBoundingClientRect().top;
      }
      return;
    }

    pinnedState = nextState;

    if (nextState === "fixed") {
      setPlaceholderHeight(spacerBefore, pinHeight);
      setPlaceholderHeight(spacerAfter, 0);
      artboard.classList.remove("t396--artboard--ended");
      artboard.classList.add("t396--artboard--fixed");
      artboard.style.removeProperty("--t396-end-top");
      fixedTop = artboard.getBoundingClientRect().top;
      return;
    }

    if (nextState === "ended") {
      setPlaceholderHeight(spacerBefore, pinHeight);
      setPlaceholderHeight(spacerAfter, 0);
      artboard.classList.remove("t396--artboard--fixed");
      artboard.classList.add("t396--artboard--ended");
      artboard.style.setProperty("--t396-end-top", `${Math.round(pinSpan)}px`);
      return;
    }

    clearPinnedState();
    fixedTop = 0;
    setPlaceholderHeight(spacerBefore, 0);
    setPlaceholderHeight(spacerAfter, pinSpan);
  };

  const applySbs = (distance) => {
    configs.forEach((config) => {
      const localDistance = distance - config.trgOffset;
      const frame = resolveFrame(config.timeline, localDistance);
      let nextFrame = frame;

      if (isMobile && config.isText && config.hasAnimHidden) {
        const gatedOpacity = localDistance < 0 ? 0 : frame.op;
        const easedOpacity =
          mobileTextBaseOpacity +
          (1 - mobileTextBaseOpacity) * clamp(gatedOpacity, 0, 1);
        nextFrame = { ...frame, op: easedOpacity };
      }

      applyState(config.el, nextFrame);
    });
  };

  const update = () => {
    if (!artboardHeight) {
      return;
    }

    syncFixedBox();

    const scrollY = window.scrollY || 0;
    recordTop = getRecordTop();
    const distance = clamp(scrollY - recordTop, 0, animationSpan || 1);

    applySbs(distance);

    if (scrollY < recordTop) {
      setPinnedState("normal");
      return;
    }

    if (pinnedState === "normal") {
      setPinnedState("fixed");
    }

    const endPoint = recordTop + pinSpan - fixedTop;
    if (scrollY >= endPoint) {
      setPinnedState("ended");
    } else {
      setPinnedState("fixed");
    }
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
    isMobile = window.innerWidth <= 639;
    configs = elements.map(buildConfig).filter(Boolean);
    if (configs.length === 0) {
      return;
    }

    animationSpan = configs.reduce(
      (acc, config) => Math.max(acc, config.trgOffset + config.timeline.total),
      0,
    );
    pinSpan = animationSpan;
    artboardHeight = artboard.offsetHeight;
    pinHeight = artboardHeight + pinSpan;
    recordTop = getRecordTop();

    const targetId =
      window.innerWidth >= 1200 ? "1719214219036" : "1716205332561";
    const pinTarget = configs.find(
      (config) => config.el.dataset.elemId === targetId,
    );
    if (pinTarget) {
      const opacityStart = findOpacityStart(pinTarget.timeline);
      if (opacityStart !== null) {
        const revealOffset = Math.round(
          window.innerHeight * (window.innerWidth >= 1200 ? 0.45 : 0.55),
        );
        pinSpan = Math.max(
          0,
          Math.min(
            animationSpan,
            pinTarget.trgOffset + opacityStart + revealOffset,
          ),
        );
      } else {
        pinSpan = Math.max(0, Math.min(animationSpan, pinTarget.trgOffset));
      }
      pinHeight = artboardHeight + pinSpan;
    }

    if (prefersReducedMotion) {
      clearPinnedState();
      setPlaceholderHeight(spacerBefore, 0);
      setPlaceholderHeight(spacerAfter, 0);
      configs.forEach((config) => applyState(config.el, config.timeline.end));
      return;
    }

    setPinnedState("normal", true);
    applySbs(0);
    syncFixedBox();
    update();
  };

  calculate();

  if (prefersReducedMotion) {
    return;
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", calculate);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(calculate);
    resizeObserver.observe(record);
    resizeObserver.observe(artboard);
  }
};

const initWavesStickyRelease = () => {
  const record = document.getElementById("rec771645295");
  if (!record || window.innerWidth < 1200) {
    return;
  }

  const children = Array.from(record.children);
  if (children.length === 0) {
    record.style.position = "relative";
    return;
  }

  let released = false;
  let frameId = 0;
  let frameScheduled = false;
  let observer = null;

  const releaseSticky = () => {
    if (released) {
      return;
    }

    released = true;
    record.style.position = "relative";

    if (observer) {
      observer.disconnect();
    }

    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    frameScheduled = false;
  };

  const areAllChildrenVisible = () =>
    children.every((child) => getComputedStyle(child).opacity === "1");

  const checkChildrenOpacity = () => {
    if (window.innerWidth < 1200) {
      if (observer) {
        observer.disconnect();
      }
      return;
    }

    if (areAllChildrenVisible()) {
      releaseSticky();
      return;
    }

    frameScheduled = true;
    frameId = window.requestAnimationFrame(() => {
      frameScheduled = false;
      checkChildrenOpacity();
    });
  };

  observer = new MutationObserver(() => {
    if (!released && !frameScheduled && window.innerWidth >= 1200) {
      checkChildrenOpacity();
    }
  });

  children.forEach((child) => {
    observer.observe(child, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: true,
    });
  });

  checkChildrenOpacity();
};

const initHistoryParallax = () => {
  const holder = document.querySelector(
    ".zunami_visible-lg.zunami-history-blocks-holder",
  );
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
    const atEnd =
      maxScrollLeft <= tolerance ||
      holder.scrollLeft >= maxScrollLeft - tolerance;

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

const initHistoryStacking = () => {
  const stack = document.querySelector(".zunami-history-stack");
  if (!stack) {
    return;
  }

  const sampleBlock = stack.querySelector(".zunami-history-block");
  const blocks = Array.from(stack.querySelectorAll(".zunami-history-block"));
  const nextSection = stack
    .closest(".zunami_hidden-lg")
    ?.querySelector(".zunami-history-block--next");
  const parseSize = (value) => {
    if (!value) {
      return 0;
    }

    const raw = value.trim();
    if (!raw) {
      return 0;
    }

    if (raw.endsWith("px")) {
      const px = Number(raw.slice(0, -2));
      return Number.isFinite(px) ? px : 0;
    }

    if (raw.endsWith("rem")) {
      const rem = Number(raw.slice(0, -3));
      const rootSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16",
      );
      return (Number.isFinite(rem) ? rem : 0) * (rootSize || 16);
    }

    if (raw.endsWith("vh")) {
      const vh = Number(raw.slice(0, -2));
      return (Number.isFinite(vh) ? vh : 0) * (window.innerHeight / 100);
    }

    const fallback = Number(raw);
    return Number.isFinite(fallback) ? fallback : 0;
  };
  const updateOffset = () => {
    blocks.forEach((block) => {
      const width = block.getBoundingClientRect().width || 1100;
      const scale = width / 1100;
      block.style.setProperty("--history-block-scale", scale.toFixed(4));
    });

    const blockHeight = sampleBlock?.getBoundingClientRect().height || 450;
    const offset = Math.max(
      0,
      Math.round((window.innerHeight - blockHeight) / 2),
    );
    const overlapValue = nextSection
      ? getComputedStyle(nextSection).getPropertyValue("--history-blog-overlap")
      : "";
    const overlapPx = parseSize(overlapValue);
    const extraValue = getComputedStyle(stack).getPropertyValue(
      "--history-stack-extra",
    );
    const extraPx = parseSize(extraValue);
    stack.style.setProperty("--history-stack-top", `${offset}px`);
    stack.style.setProperty(
      "--history-stack-tail",
      `${Math.round(offset + overlapPx + extraPx)}px`,
    );
  };

  updateOffset();
  window.addEventListener("resize", updateOffset);
};

const initHistoryPopups = () => {
  const modals = Array.from(
    document.querySelectorAll(".history-modal[data-history-modal]"),
  );
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
    lastActive =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("history-modal-open");

    const closeBtn = modal.querySelector(".history-modal--close");
    if (closeBtn) {
      closeBtn.focus();
    }
  };

  document.querySelectorAll(".zunami-history-card--link").forEach((link) => {
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
      window.open(
        shareUrl.toString(),
        "_blank",
        "noopener,noreferrer,width=700,height=500",
      );
    });
  });
};

const initPageProgress = () => {
  const progress = document.createElement("div");
  progress.className = "page-progress";
  progress.innerHTML = '<div class="page-progress--bar"></div>';
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
  document.addEventListener(
    "click",
    (event) => {
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
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
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
    },
    { capture: true },
  );
};

const initEvents = () => {
  selectors.mobileToggle?.addEventListener("click", () => toggleMobileMenu());
  selectors.searchOpen?.addEventListener("click", () =>
    toggleSearchPopup(true),
  );
  selectors.searchClose?.addEventListener("click", () =>
    toggleSearchPopup(false),
  );
  selectors.searchForm?.addEventListener("submit", handleSearch);
  selectors.searchInput?.addEventListener("input", () => {
    if (!selectors.searchInput?.value.trim()) {
      renderSearchResults([], "");
    }
  });
  selectors.modalOpen?.addEventListener("click", () => toggleModal(true));
  selectors.modal
    ?.querySelector("[data-modal-close]")
    ?.addEventListener("click", () => toggleModal(false));

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (
      target.closest('a[href="#main_popup"]') ||
      target.closest('button[data-href="#main_popup"]')
    ) {
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
initInternalPageFooter();
initLoadMore();
initAccordions();
initViewportAnimations();
initForms();
initMaps();
initWavesBlock();
initWavesStickyRelease();
initHistoryParallax();
initHistoryStacking();
initHistoryPopups();
initShareLinks();
initPageProgress();
initPageTransitions();
