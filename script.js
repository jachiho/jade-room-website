// pages inside /menu/ live one level down
const BASE = document.body.dataset.menuPageId ? "../" : "";

const contentPaths = {
  site: `${BASE}content/site.json`,
  menu: `${BASE}content/menu.json`,
};

// embedded snapshot (content-data.js) — used when fetch is unavailable (file://)
const embedded = window.JADE_CONTENT || {};

const fallbackContent = {
  site: embedded.site || {},
  menu: embedded.menu || { highlights: [], sections: [] },
};

// content JSON refers to assets with absolute paths ("/assets/...");
// rewrite them so they work from a subfolder or straight off the disk
function localAsset(src) {
  if (typeof src === "string" && src.startsWith("/") && !src.startsWith("//")) {
    return `${BASE}${src.slice(1)}`;
  }
  return src;
}

async function getJson(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function setText(selector, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function setHref(selector, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach((element) => {
    element.href = value;
  });
}

function renderHours(hours = []) {
  const targets = document.querySelectorAll("[data-hours-list]");
  if (!targets.length || !hours.length) return;

  targets.forEach((target) => {
    target.innerHTML = "";
    hours.forEach((row) => {
      const line = document.createElement("span");
      line.textContent = `${row.days}: ${row.hours}`;
      target.append(line);
    });
  });
}

function getResponsiveImageAttrs(src) {
  if (!src) return {};

  if (src.includes("assets/menu-responsive/") && src.endsWith("-700.jpg")) {
    return {
      srcset: `${src.replace("-700.jpg", "-450.jpg")} 450w, ${src} 700w`,
      sizes: "(max-width: 820px) calc(100vw - 2rem), 33vw",
    };
  }

  const responsivePairs = [
    ["jade-room-food-1100.jpg", "jade-room-food-700.jpg", "700w", "1100w"],
    ["jade-room-bar-1100.jpg", "jade-room-bar-700.jpg", "700w", "1100w"],
    ["jade-room-materials-1100.jpg", "jade-room-materials-700.jpg", "700w", "1100w"],
    ["jade-room-private-dining-1400.jpg", "jade-room-private-dining-900.jpg", "900w", "1400w"],
    ["private-room-wide-900.jpg", "private-room-wide-900.jpg", "900w", "900w"],
  ];

  const match = responsivePairs.find(([large]) => src.endsWith(large));
  if (!match) return {};

  const [large, small, smallWidth, largeWidth] = match;
  const smallSrc = src.replace(large, small);
  return {
    srcset: smallSrc === src ? `${src} ${largeWidth}` : `${smallSrc} ${smallWidth}, ${src} ${largeWidth}`,
    sizes: "(max-width: 820px) calc(100vw - 2rem), 50vw",
  };
}

function applyResponsiveImageAttrs(image, src) {
  const attrs = getResponsiveImageAttrs(src);
  if (attrs.srcset) image.srcset = attrs.srcset;
  if (attrs.sizes) image.sizes = attrs.sizes;
}

function renderMenuHighlights(items = []) {
  const list = document.querySelector("[data-menu-list]");
  if (!list) return;

  list.innerHTML = "";
  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "menu-item";

    if (item.image) {
      const imageWrap = document.createElement("figure");
      imageWrap.className = "menu-item-image";

      const image = document.createElement("img");
      image.src = localAsset(item.image);
      image.alt = item.imageAlt || item.name;
      image.loading = "lazy";
      applyResponsiveImageAttrs(image, localAsset(item.image));

      imageWrap.append(image);
      article.append(imageWrap);
    }

    const body = document.createElement("div");
    body.className = "menu-item-body";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    const price = document.createElement("span");
    price.className = "menu-price";
    price.textContent = item.price;

    body.append(title, description, price);
    article.append(body);
    list.append(article);
  });
}

function menuPageHref(section) {
  // keep links working whether v2 is served as site root or as a /v2/ preview
  const base = document.body.dataset.menuPageId ? "" : "menu/";
  if (document.body.dataset.menuPageId) {
    return `${section.id}.html`;
  }
  return `${base}${section.id}.html`;
}

function renderMenuNav(sections = []) {
  const nav = document.querySelector("[data-menu-nav]");
  if (!nav) return;

  const currentId = document.body.dataset.menuPageId;
  nav.innerHTML = "";
  sections.forEach((section) => {
    const link = document.createElement("a");
    link.href = menuPageHref(section);
    link.textContent = section.label;
    if (section.id === currentId) link.className = "active";
    nav.append(link);
  });
}

function createMenuRows(items = []) {
  const hasCategories = items.some((item) => item.category);
  if (hasCategories) {
    const panels = document.createElement("div");
    panels.className = "menu-category-list";

    const categories = new Map();
    items.forEach((item) => {
      const category = item.category || "Menu";
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(item);
    });

    categories.forEach((categoryItems, category) => {
      const panel = document.createElement("section");
      panel.className = "menu-category-panel";

      const title = document.createElement("h3");
      title.className = "menu-category-title";
      title.textContent = category;

      panel.append(title, createMenuRows(categoryItems.map(({ category: _category, ...item }) => item)));
      panels.append(panel);
    });

    return panels;
  }

  const list = document.createElement("div");
  list.className = "menu-list";

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "menu-row";

    const itemCopy = document.createElement("div");
    const itemName = document.createElement("h3");
    itemName.textContent = item.name;
    itemCopy.append(itemName);
    if (item.description) {
      const itemDescription = document.createElement("p");
      itemDescription.textContent = item.description;
      itemCopy.append(itemDescription);
    }

    const price = document.createElement("span");
    price.className = "menu-price";
    price.textContent = item.price;

    row.append(itemCopy, price);
    list.append(row);
  });

  return list;
}

function renderMenuDirectory(sections = []) {
  const directory = document.querySelector("[data-menu-directory]");
  if (!directory) return;

  directory.innerHTML = "";
  sections.forEach((section) => {
    const card = document.createElement("article");
    card.className = "menu-directory-card";

    if (section.image) {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = localAsset(section.image);
      image.alt = section.imageAlt || section.label;
      image.loading = "lazy";
      applyResponsiveImageAttrs(image, localAsset(section.image));
      figure.append(image);
      card.append(figure);
    }

    const body = document.createElement("div");
    body.className = "menu-directory-body";

    const title = document.createElement("h3");
    title.textContent = section.label;

    const intro = document.createElement("p");
    intro.textContent = section.intro;

    const actions = document.createElement("div");
    actions.className = "menu-directory-actions";

    const pageLink = document.createElement("a");
    pageLink.className = "button jade";
    pageLink.href = `menu/${section.id}.html`;
    pageLink.textContent = "View menu";
    actions.append(pageLink);

    if (section.pdfUrl) {
      const pdfLink = document.createElement("a");
      pdfLink.className = "button ghost";
      pdfLink.href = localAsset(section.pdfUrl);
      pdfLink.textContent = "PDF";
      actions.append(pdfLink);
    }

    body.append(title, intro, actions);
    card.append(body);
    directory.append(card);
  });
}

function renderMenuDetail(sections = []) {
  const target = document.querySelector("[data-menu-detail]");
  if (!target) return;

  const pageId = document.body.dataset.menuPageId;
  const section = sections.find((item) => item.id === pageId);
  if (!section) return;

  const title = document.querySelector("[data-menu-detail-title]");
  if (title) title.textContent = section.label;

  const intro = document.querySelector("[data-menu-detail-intro]");
  if (intro) intro.textContent = section.intro;

  const hero = document.querySelector("[data-menu-detail-hero]");
  if (hero && section.image) {
    hero.style.backgroundImage = `url("${localAsset(section.image)}")`;
  }

  target.innerHTML = "";
  const heading = document.createElement("div");
  heading.className = "menu-panel-heading";

  const headingTitle = document.createElement("h2");
  headingTitle.textContent = `${section.label} Menu`;
  heading.append(headingTitle);

  if (section.pdfUrl) {
    const pdfLink = document.createElement("a");
    pdfLink.className = "button ghost menu-pdf-link";
    pdfLink.href = localAsset(section.pdfUrl);
    pdfLink.textContent = "Download PDF";
    heading.append(pdfLink);
  }

  target.append(heading, createMenuRows(section.items));
}

function renderBookingWidget() {
  const target = document.querySelector("[data-opentable-widget]");
  if (!target) return;

  const desktopQuery = window.matchMedia("(min-width: 821px)");
  const loadWidget = () => {
    const theme = desktopQuery.matches ? "wide" : "standard";
    if (target.dataset.theme === theme) return;

    target.dataset.theme = theme;
    target.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//www.opentable.com.au/widget/reservation/loader?rid=307232&type=standard&theme=${theme}&color=4&dark=false&iframe=true&domain=comau&lang=en-AU&newtab=false&ot_source=Restaurant%20website&cfe=true`;
    target.append(script);
  };

  loadWidget();
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", loadWidget);
  } else if (desktopQuery.addListener) {
    desktopQuery.addListener(loadWidget);
  }
}

function initMobileMenu() {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (!toggle || !nav) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    nav.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.textContent = isOpen ? "Menu" : "Close";
    nav.classList.toggle("is-open", !isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initMarquees() {
  document.querySelectorAll(".marquee-track").forEach((track) => {
    // duplicate the content so the loop is seamless
    const clone = track.firstElementChild?.cloneNode(true);
    if (clone) {
      clone.setAttribute("aria-hidden", "true");
      track.append(clone);
    }
  });
}

function initMotion() {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) return;

  const revealTargets = [
    ".intro-copy",
    ".intro-media figure",
    ".section-heading",
    ".booking-panel",
    ".booking-aside .aside-card",
    ".menu-item",
    ".feature-copy",
    ".feature-photo",
    ".gift-inner > *",
    ".press-card",
    ".visit-panel",
    ".map-panel",
    ".visual-tile",
    ".menu-directory-card",
    ".menu-panel-heading",
    ".menu-category-panel",
    ".private-room-intro",
    ".stat-chip",
  ];

  const elements = document.querySelectorAll(revealTargets.join(","));
  elements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -4% 0px", threshold: 0.1 },
  );

  elements.forEach((element) => observer.observe(element));
}

async function init() {
  const [site, menu] = await Promise.all([
    getJson(contentPaths.site, fallbackContent.site),
    getJson(contentPaths.menu, fallbackContent.menu),
  ]);

  setText("[data-content='heroText']", site.heroText);
  setText("[data-content='introText']", site.introText);
  setText("[data-content='eventsText']", site.eventsText);
  setText("[data-content='privateEventsEmail']", site.privateEventsEmail);
  setText("[data-content='giftCardText']", site.giftCardText);
  setText("[data-content='address']", site.address);
  setText("[data-content='parking']", site.parking);
  setText("[data-content='phone']", site.phone);
  setText("[data-content='email']", site.email);

  setHref("[data-content='enquiryUrl']", site.enquiryUrl || `mailto:${site.email || ""}`);
  setHref("[data-content='privateEventsUrl']", site.privateEventsUrl || "private-room.html");
  setHref(
    "[data-content='privateEventsEmailUrl']",
    site.privateEventsEmail ? `mailto:${site.privateEventsEmail}` : "mailto:info@jaderoomchinese.com.au",
  );
  setHref("[data-content='banquetMenuUrl']", localAsset(site.banquetMenuUrl) || `${BASE}menu/banquet.html`);
  setHref("[data-content='drinksPackageUrl']", localAsset(site.drinksPackageUrl) || `${BASE}assets/menus/drinks-package.pdf`);
  setHref("[data-content='giftCardUrl']", site.giftCardUrl || "#visit");
  setHref("[data-content='mapUrl']", site.mapUrl || "https://maps.app.goo.gl/iH2ejvEQFr9DbDYf6");
  setHref("[data-map-link]", site.mapUrl || "https://maps.app.goo.gl/iH2ejvEQFr9DbDYf6");
  setHref("[data-content='phone']", site.phone ? `tel:${site.phone.replace(/\s/g, "")}` : "");
  setHref("[data-tel-link]", site.phone ? `tel:${site.phone.replace(/\s/g, "")}` : "");
  setHref("[data-content='email']", site.email ? `mailto:${site.email}` : "");

  renderHours(site.hours);
  renderMenuHighlights(menu.highlights || menu.items);
  renderMenuNav(menu.sections);
  renderMenuDirectory(menu.sections);
  renderMenuDetail(menu.sections);
  renderBookingWidget();
  initMobileMenu();
  initMarquees();
  initMotion();
}

init();
