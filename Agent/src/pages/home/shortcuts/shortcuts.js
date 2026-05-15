const shortcutStorageKey = "agent-dashboard-home-shortcuts-v1";
const shortcutEditStorageKey = "agent-dashboard-home-shortcuts-edit-v1";
const searchEngineStorageKey = "agent-dashboard-search-engine-v1";

const shortcutsPerPage = 12;
const maxShortcuts = 60;

let shortcutEditMode = false;
let shortcutPageIndex = 0;
let shortcutDialogTitleTouched = false;
let activeSearchEngine = "bing";

const defaultShortcuts = [
  { title: "GitHub", url: "https://github.com", icon: "https://www.google.com/s2/favicons?domain=github.com&sz=128" },
  { title: "ChatGPT", url: "https://chatgpt.com", icon: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128" },
  { title: "Google Scholar", url: "https://scholar.google.com", icon: "https://www.google.com/s2/favicons?domain=scholar.google.com&sz=128" },
  { title: "arXiv", url: "https://arxiv.org", icon: "https://www.google.com/s2/favicons?domain=arxiv.org&sz=128" },
  { title: "Overleaf", url: "https://www.overleaf.com", icon: "https://www.google.com/s2/favicons?domain=overleaf.com&sz=128" },
  { title: "Z-Library", url: "https://z-library.sk", icon: "https://www.google.com/s2/favicons?domain=z-library.sk&sz=128" },
];
const searchEngines = {
  bing: {
    label: "Bing",
    logo: "./assets/search/bing.svg",
    placeholder: "Search Bing...",
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
  baidu: {
    label: "百度",
    logo: "./assets/search/baidu.svg",
    placeholder: "百度一下...",
    buildUrl: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
  },
  google: {
    label: "Google",
    logo: "./assets/search/google.svg",
    placeholder: "Search Google...",
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
};

let dom = null;

function getShortcutDom() {
  return {
    homeShortcutsPanel: document.querySelector("#homeShortcutsPanel"),
    homeSearchForm: document.querySelector("#homeSearchForm"),
    homeSearchInput: document.querySelector("#homeSearchInput"),
    searchEngineButton: document.querySelector("#searchEngineButton"),
    searchEngineIcon: document.querySelector("#searchEngineIcon"),
    searchEngineMenu: document.querySelector("#searchEngineMenu"),
    searchEngineOptions: Array.from(document.querySelectorAll("[data-search-engine-option]")),
    shortcutAddForm: document.querySelector("#shortcutAddForm"),
    shortcutUrlInput: document.querySelector("#shortcutUrlInput"),
    shortcutGrid: document.querySelector("#shortcutGrid"),
    shortcutPager: document.querySelector("#shortcutPager"),
    shortcutDialog: document.querySelector("#shortcutDialog"),
    shortcutDialogForm: document.querySelector("#shortcutDialogForm"),
    shortcutDialogUrl: document.querySelector("#shortcutDialogUrl"),
    shortcutDialogTitleInput: document.querySelector("#shortcutDialogTitleInput"),
    shortcutDialogIcon: document.querySelector("#shortcutDialogIcon"),
    shortcutDialogInitial: document.querySelector("#shortcutDialogInitial"),
    shortcutDialogPreviewName: document.querySelector("#shortcutDialogPreviewName"),
    shortcutDialogPreviewDomain: document.querySelector("#shortcutDialogPreviewDomain"),
    shortcutDialogCloseButtons: Array.from(document.querySelectorAll("[data-shortcut-dialog-close]")),
    shortcutResetButton: document.querySelector("#shortcutResetButton"),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


function normalizeShortcutUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getShortcutDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inferShortcutTitle(url) {
  const domain = getShortcutDomain(url);
  if (!domain) {
    return "Shortcut";
  }

  const first = domain.split(".")[0] || domain;
  return first
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getShortcutIcon(url) {
  const domain = getShortcutDomain(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : "";
}

function getShortcutInitial(title) {
  return String(title || "S")
    .trim()
    .charAt(0)
    .toUpperCase() || "S";
}

function normalizeShortcutList(value) {
  const list = Array.isArray(value) ? value : defaultShortcuts;
  return list
    .map((item) => {
      const url = normalizeShortcutUrl(item?.url);
      if (!url) {
        return null;
      }

      return {
        title: String(item?.title || inferShortcutTitle(url)).trim().slice(0, 28),
        url,
        icon: String(item?.icon || getShortcutIcon(url)),
      };
    })
    .filter(Boolean)
    .slice(0, maxShortcuts);
}

function loadShortcuts() {
  try {
    const raw = window.localStorage.getItem(shortcutStorageKey);
    return normalizeShortcutList(raw ? JSON.parse(raw) : defaultShortcuts);
  } catch {
    return normalizeShortcutList(defaultShortcuts);
  }
}

function saveShortcuts(shortcuts) {
  try {
    window.localStorage.setItem(shortcutStorageKey, JSON.stringify(shortcuts));
  } catch {
    // The dashboard still works when storage is unavailable.
  }
}

function renderShortcutPager(pageCount) {
  if (!dom.shortcutPager) {
    return;
  }

  dom.shortcutPager.hidden = pageCount <= 1;
  dom.shortcutPager.innerHTML =
    pageCount > 1
      ? Array.from(
          { length: pageCount },
          (_, index) => `
            <button
              class="shortcut-page-dot${index === shortcutPageIndex ? " is-active" : ""}"
              type="button"
              data-shortcut-page="${index}"
              aria-label="Shortcut page ${index + 1}"
              aria-current="${index === shortcutPageIndex ? "page" : "false"}"
            ></button>
          `,
        ).join("")
      : "";
}

function renderShortcutCard({ shortcut, index }) {
  const title = escapeHtml(shortcut.title);
  const url = escapeHtml(shortcut.url);
  const icon = escapeHtml(shortcut.icon);

  return `
    <article class="shortcut-card${shortcutEditMode ? " is-editing" : ""}">
      <a href="${url}" target="_blank" rel="noreferrer" aria-label="Open ${title}" title="${title}">
        <span class="shortcut-icon-wrap">
          <span class="shortcut-icon-fallback">${escapeHtml(getShortcutInitial(shortcut.title))}</span>
          <img src="${icon}" alt="" loading="lazy" onerror="this.remove()" />
        </span>
        <span class="shortcut-title">${title}</span>
      </a>
      <button class="shortcut-delete-button" type="button" data-shortcut-action="remove" data-shortcut-index="${index}" aria-label="Remove ${title}"></button>
    </article>
  `;
}

function renderShortcutAddCard() {
  return `
    <article class="shortcut-card shortcut-add-card">
      <button type="button" data-shortcut-action="add" aria-label="Add shortcut">
        <span class="shortcut-icon-wrap shortcut-add-icon" aria-hidden="true"></span>
        <span class="shortcut-title">添加</span>
      </button>
    </article>
  `;
}

function renderShortcuts(shortcuts = loadShortcuts()) {
  if (!dom.shortcutGrid) {
    return;
  }

  const entries = shortcuts.map((shortcut, index) => ({ type: "shortcut", shortcut, index }));

  if (shortcutEditMode) {
    entries.push({ type: "add" });
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / shortcutsPerPage));
  shortcutPageIndex = Math.min(Math.max(shortcutPageIndex, 0), pageCount - 1);

  const pageEntries = entries.slice(
    shortcutPageIndex * shortcutsPerPage,
    shortcutPageIndex * shortcutsPerPage + shortcutsPerPage,
  );

  dom.shortcutGrid.innerHTML = pageEntries
    .map((entry) => (entry.type === "add" ? renderShortcutAddCard() : renderShortcutCard(entry)))
    .join("");
  renderShortcutPager(pageCount);
}

function getShortcutPageCount(shortcuts = loadShortcuts()) {
  const count = shortcuts.length + (shortcutEditMode ? 1 : 0);
  return Math.max(1, Math.ceil(count / shortcutsPerPage));
}

function changeShortcutPage(direction) {
  const pageCount = getShortcutPageCount();
  if (pageCount <= 1) {
    return false;
  }

  const nextIndex = Math.min(Math.max(shortcutPageIndex + direction, 0), pageCount - 1);
  if (nextIndex === shortcutPageIndex) {
    return false;
  }

  shortcutPageIndex = nextIndex;
  renderShortcuts();
  return true;
}

function addShortcut(urlValue, options = {}) {
  const url = normalizeShortcutUrl(urlValue);
  if (!url) {
    return false;
  }

  const shortcuts = loadShortcuts().filter((item) => item.url !== url);
  const title = String(options.title || inferShortcutTitle(url)).trim().slice(0, 28);
  shortcuts.push({
    title: title || inferShortcutTitle(url),
    url,
    icon: String(options.icon || getShortcutIcon(url)),
  });
  shortcutPageIndex = Math.floor((shortcuts.length - 1) / shortcutsPerPage);
  saveShortcuts(shortcuts);
  renderShortcuts(shortcuts);
  return true;
}

function setShortcutEditMode(isEditing) {
  shortcutEditMode = isEditing;
  dom.homeShortcutsPanel?.classList.toggle("is-editing", shortcutEditMode);
  try {
    window.localStorage.setItem(shortcutEditStorageKey, shortcutEditMode ? "1" : "0");
  } catch {
    // Edit mode preference is optional.
  }
  renderShortcuts();
}
function buildShortcutDraft(urlValue) {
  const url = normalizeShortcutUrl(urlValue);
  const domain = url ? getShortcutDomain(url) : "";

  return {
    url,
    domain,
    title: url ? inferShortcutTitle(url) : "",
    icon: url ? getShortcutIcon(url) : "",
  };
}

function syncShortcutDialogPreview() {
  const draft = buildShortcutDraft(dom.shortcutDialogUrl?.value);
  const titleInput = dom.shortcutDialogTitleInput;

  if (titleInput && !shortcutDialogTitleTouched) {
    titleInput.value = draft.title;
  }

  const title = titleInput?.value.trim() || draft.title || "Shortcut";
  const domain = draft.domain || "example.com";
  const initial = getShortcutInitial(title);

  if (dom.shortcutDialogPreviewName) {
    dom.shortcutDialogPreviewName.textContent = title;
  }

  if (dom.shortcutDialogPreviewDomain) {
    dom.shortcutDialogPreviewDomain.textContent = domain;
  }

  if (dom.shortcutDialogInitial) {
    dom.shortcutDialogInitial.textContent = initial;
    dom.shortcutDialogInitial.hidden = Boolean(draft.icon);
  }

  if (dom.shortcutDialogIcon) {
    dom.shortcutDialogIcon.hidden = !draft.icon;
    if (draft.icon) {
      dom.shortcutDialogIcon.src = draft.icon;
    }
  }

  const submitButton = dom.shortcutDialogForm?.querySelector("[data-shortcut-dialog-submit]");
  if (submitButton) {
    submitButton.disabled = !draft.url;
  }
}

function openShortcutDialog(initialUrl = "") {
  if (!dom.shortcutDialog) {
    return;
  }

  shortcutDialogTitleTouched = false;

  if (dom.shortcutDialogUrl) {
    dom.shortcutDialogUrl.value = initialUrl;
  }

  if (dom.shortcutDialogTitleInput) {
    dom.shortcutDialogTitleInput.value = "";
  }

  syncShortcutDialogPreview();
  dom.shortcutDialog.hidden = false;
  window.requestAnimationFrame(() => dom.shortcutDialogUrl?.focus());
}

function closeShortcutDialog() {
  if (dom.shortcutDialog) {
    dom.shortcutDialog.hidden = true;
  }
}

function setSearchEngineMenuOpen(isOpen) {
  if (!dom.searchEngineButton || !dom.searchEngineMenu) {
    return;
  }

  dom.searchEngineButton.setAttribute("aria-expanded", String(isOpen));
  dom.searchEngineMenu.hidden = !isOpen;
}

function setSearchEngine(engine, { persist = true } = {}) {
  activeSearchEngine = searchEngines[engine] ? engine : "bing";
  const config = searchEngines[activeSearchEngine];

  if (dom.searchEngineIcon) {
    dom.searchEngineIcon.className = `search-engine-logo is-${activeSearchEngine}`;
    dom.searchEngineIcon.src = config.logo;
    dom.searchEngineIcon.alt = "";
  }

  if (dom.searchEngineButton) {
    dom.searchEngineButton.setAttribute("aria-label", `Search with ${config.label}`);
    dom.searchEngineButton.title = config.label;
  }

  if (dom.homeSearchInput) {
    dom.homeSearchInput.placeholder = config.placeholder;
  }

  dom.searchEngineOptions.forEach((option) => {
    const isSelected = option.dataset.searchEngineOption === activeSearchEngine;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });

  if (persist) {
    window.localStorage.setItem(searchEngineStorageKey, activeSearchEngine);
  }
}

export function setupHomeSearchAndShortcuts() {
  dom = getShortcutDom();
  const savedEngine = window.localStorage.getItem(searchEngineStorageKey);
  setSearchEngine(searchEngines[savedEngine] ? savedEngine : "bing", { persist: false });
  shortcutEditMode = window.localStorage.getItem(shortcutEditStorageKey) === "1";
  dom.homeShortcutsPanel?.classList.toggle("is-editing", shortcutEditMode);

  dom.searchEngineButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dom.searchEngineButton.getAttribute("aria-expanded") === "true";
    setSearchEngineMenuOpen(!isOpen);
  });

  dom.searchEngineMenu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-search-engine-option]");
    if (!option) {
      return;
    }

    setSearchEngine(option.dataset.searchEngineOption);
    setSearchEngineMenuOpen(false);
    dom.homeSearchInput?.focus();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#searchEnginePicker")) {
      setSearchEngineMenuOpen(false);
    }

    if (!shortcutEditMode || !(event.target instanceof Element)) {
      return;
    }

    const shouldKeepEditMode = Boolean(
      event.target.closest(
        "#shortcutDialog, [data-shortcut-action], [data-shortcut-page], .shortcut-dialog-card",
      ),
    );

    if (!shouldKeepEditMode) {
      setShortcutEditMode(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSearchEngineMenuOpen(false);
      closeShortcutDialog();
    }
  });

  dom.homeSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = dom.homeSearchInput?.value.trim();
    if (!query) {
      return;
    }

    const directUrl = normalizeShortcutUrl(query);
    const searchUrl = searchEngines[activeSearchEngine].buildUrl(query);
    const target = /\s/.test(query) || !query.includes(".") ? searchUrl : directUrl;
    window.open(target, "_blank", "noopener,noreferrer");
  });

  dom.shortcutAddForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (addShortcut(dom.shortcutUrlInput?.value)) {
      dom.shortcutUrlInput.value = "";
      dom.shortcutUrlInput.focus();
    }
  });

  dom.homeShortcutsPanel?.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const addButton = event.target.closest("[data-shortcut-action='add']");
    if (addButton) {
      setShortcutEditMode(true);
      openShortcutDialog();
      return;
    }

    setShortcutEditMode(!shortcutEditMode);
  });

  dom.homeShortcutsPanel?.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      const pageCount = getShortcutPageCount();
      if (pageCount <= 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      changeShortcutPage(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false },
  );

  dom.shortcutGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortcut-action]");
    if (!button) {
      const shortcutLink = event.target.closest(".shortcut-card a");
      if (shortcutEditMode && shortcutLink) {
        event.preventDefault();
        setShortcutEditMode(false);
      }
      return;
    }

    const shortcuts = loadShortcuts();
    const action = button.dataset.shortcutAction;

    if (action === "add") {
      setShortcutEditMode(true);
      openShortcutDialog();
      return;
    }

    const index = Number(button.dataset.shortcutIndex);
    if (!Number.isInteger(index) || !shortcuts[index]) {
      return;
    }

    if (action === "remove") {
      shortcuts.splice(index, 1);
      saveShortcuts(shortcuts);
      setShortcutEditMode(true);
    }
  });

  dom.shortcutPager?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortcut-page]");
    if (!button) {
      return;
    }

    shortcutPageIndex = Number(button.dataset.shortcutPage);
    renderShortcuts();
  });

  dom.shortcutDialogUrl?.addEventListener("input", () => {
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogTitleInput?.addEventListener("input", () => {
    shortcutDialogTitleTouched = true;
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogIcon?.addEventListener("error", () => {
    dom.shortcutDialogIcon.hidden = true;
    if (dom.shortcutDialogInitial) {
      dom.shortcutDialogInitial.hidden = false;
    }
  });

  dom.shortcutDialogCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeShortcutDialog();
    });
  });

  dom.shortcutDialogForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = buildShortcutDraft(dom.shortcutDialogUrl?.value);
    const title = dom.shortcutDialogTitleInput?.value.trim() || draft.title;

    if (addShortcut(draft.url, { title, icon: draft.icon })) {
      setShortcutEditMode(true);
      closeShortcutDialog();
    } else {
      dom.shortcutDialogUrl?.focus();
    }
  });

  dom.shortcutResetButton?.addEventListener("click", () => {
    const shortcuts = normalizeShortcutList(defaultShortcuts);
    saveShortcuts(shortcuts);
    renderShortcuts(shortcuts);
  });

  renderShortcuts();
}
