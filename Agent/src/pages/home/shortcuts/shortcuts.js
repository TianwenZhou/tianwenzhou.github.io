const shortcutStorageKey = "agent-dashboard-home-shortcuts-v1";
const shortcutEditStorageKey = "agent-dashboard-home-shortcuts-edit-v1";
const searchEngineStorageKey = "agent-dashboard-search-engine-v1";

const shortcutsPerPage = 12;
const maxShortcuts = 60;
const shortcutLongPressMs = 420;
const shortcutDragMoveTolerance = 8;
const shortcutPageFlipEdge = 76;
const shortcutPageFlipDelay = 520;

let shortcutEditMode = false;
let shortcutPageIndex = 0;
let shortcutDialogTitleTouched = false;
let shortcutDialogSelectedIcon = "";
let shortcutDialogIconCandidates = [];
let shortcutDialogFailedIcons = new Set();
let shortcutLongPressTimer = null;
let shortcutLongPressPointer = null;
let shortcutDragState = null;
let shortcutPageFlipTimer = null;
let shortcutSuppressClickUntil = 0;
let activeSearchEngine = "bing";

const defaultShortcuts = [
  { title: "GitHub", url: "https://github.com", icon: "https://www.google.com/s2/favicons?domain=github.com&sz=128" },
  { title: "ChatGPT", url: "https://chatgpt.com", icon: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128" },
  { title: "Google Scholar", url: "https://scholar.google.com", icon: "https://www.google.com/s2/favicons?domain=scholar.google.com&sz=128" },
  { title: "Overleaf", url: "https://www.overleaf.com", icon: "https://www.google.com/s2/favicons?domain=overleaf.com&sz=128" },
  { title: "Z-Library", url: "https://z-library.sk", icon: "https://www.google.com/s2/favicons?domain=z-library.sk&sz=128" },
  { title: "Deepseek", url: "https://chat.deepseek.com", icon: "https://www.google.com/s2/favicons?domain=chat.deepseek.com&sz=128" },
  { title: "Doubao", url: "https://www.doubao.com", icon: "https://www.google.com/s2/favicons?domain=doubao.com&sz=128" },
  { title: "QQ邮箱", url: "https://mail.qq.com", icon: "https://mail.qq.com/favicon.ico" },
  { title: "qweather", url: "https://dev.qweather.com", icon: "https://www.google.com/s2/favicons?domain=dev.qweather.com&sz=128" },
  { title: "Zhoutianwen", url: "https://tianwenzhou.github.io", icon: "https://www.google.com/s2/favicons?domain=tianwenzhou.github.io&sz=128" },
  { title: "GMail", url: "https://mail.google.com", icon: "https://www.google.com/s2/favicons?domain=mail.google.com&sz=128" },
  { title: "Bilibili", url: "https://www.bilibili.com", icon: "https://www.bilibili.com/favicon.ico" },
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

const shortcutIconOverrides = {
  "bilibili.com": [
    "https://www.bilibili.com/favicon.ico",
    "https://static.hdslb.com/images/favicon.ico",
    "https://www.bilibili.com/apple-touch-icon.png",
  ],
  "github.com": [
    "https://github.githubassets.com/favicons/favicon.svg",
    "https://github.githubassets.com/favicons/favicon.png",
  ],
  "chatgpt.com": [
    "https://chatgpt.com/favicon.ico",
    "https://chatgpt.com/apple-touch-icon.png",
  ],
  "openai.com": [
    "https://openai.com/favicon.ico",
    "https://openai.com/apple-touch-icon.png",
  ],
  "overleaf.com": [
    "https://www.overleaf.com/favicon.ico",
    "https://www.overleaf.com/apple-touch-icon.png",
  ],
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
    shortcutIconOptions: document.querySelector("#shortcutIconOptions"),
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

function getShortcutOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

function getShortcutIconOverrideKey(domain) {
  const normalizedDomain = String(domain || "").replace(/^www\./, "");
  return Object.keys(shortcutIconOverrides).find(
    (key) => normalizedDomain === key || normalizedDomain.endsWith(`.${key}`),
  );
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
  return buildShortcutIconCandidates(url)[0]?.url || "";
}

function buildShortcutIconCandidates(url) {
  const normalizedUrl = normalizeShortcutUrl(url);
  const domain = normalizedUrl ? getShortcutDomain(normalizedUrl) : "";
  const origin = normalizedUrl ? getShortcutOrigin(normalizedUrl) : "";
  if (!domain || !origin) {
    return [];
  }

  const overrideKey = getShortcutIconOverrideKey(domain);
  const candidates = [
    ...(overrideKey || shortcutIconOverrides[domain]
      ? (shortcutIconOverrides[overrideKey || domain] || []).map((urlValue, index) => ({
          label: index === 0 ? "推荐" : "备用",
          url: urlValue,
        }))
      : []),
    { label: "网站", url: `${origin}/favicon.ico` },
    { label: "PNG", url: `${origin}/favicon.png` },
    { label: "Apple", url: `${origin}/apple-touch-icon.png` },
    { label: "Touch", url: `${origin}/apple-touch-icon-precomposed.png` },
    { label: "Google", url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` },
    { label: "DDG", url: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico` },
  ];
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate.url || seen.has(candidate.url)) {
      return false;
    }

    seen.add(candidate.url);
    return true;
  });
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
  const isDragging = shortcutDragState?.draggedIndex === index;
  const cardBody = `
    <span class="shortcut-icon-wrap">
      <span class="shortcut-icon-fallback">${escapeHtml(getShortcutInitial(shortcut.title))}</span>
      <img
        src="${icon}"
        alt=""
        loading="lazy"
        draggable="false"
        onload="this.closest('.shortcut-icon-wrap')?.classList.add('has-icon')"
        onerror="this.closest('.shortcut-icon-wrap')?.classList.remove('has-icon'); this.remove()"
      />
    </span>
    <span class="shortcut-title">${title}</span>
  `;
  const cardAction = shortcutEditMode
    ? `
      <button class="shortcut-link" type="button" aria-label="Move ${title}" title="${title}">
        ${cardBody}
      </button>
    `
    : `
      <a class="shortcut-link" href="${url}" target="_blank" rel="noreferrer" draggable="false" aria-label="Open ${title}" title="${title}">
        ${cardBody}
      </a>
    `;

  return `
    <article
      class="shortcut-card${shortcutEditMode ? " is-editing" : ""}${isDragging ? " is-dragging" : ""}"
      data-shortcut-card
      data-shortcut-index="${index}"
      data-shortcut-key="${escapeHtml(shortcut.url)}"
      draggable="false"
    >
      ${cardAction}
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

function getShortcutCardRects() {
  return new Map(
    Array.from(dom.shortcutGrid?.querySelectorAll("[data-shortcut-key]") || []).map((card) => [
      card.dataset.shortcutKey,
      card.getBoundingClientRect(),
    ]),
  );
}

function animateShortcutLayout(renderCallback) {
  if (!dom.shortcutGrid) {
    renderCallback();
    return;
  }

  const previousRects = getShortcutCardRects();
  dom.shortcutGrid.classList.add("is-sorting");
  renderCallback();

  window.requestAnimationFrame(() => {
    dom.shortcutGrid?.querySelectorAll("[data-shortcut-key]").forEach((card) => {
      const previousRect = previousRects.get(card.dataset.shortcutKey);
      if (!previousRect) {
        card.animate(
          [
            { opacity: 0, transform: "scale(0.82)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 210, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
        return;
      }

      const nextRect = card.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
      }

      card.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    });

    window.setTimeout(() => dom.shortcutGrid?.classList.remove("is-sorting"), 260);
  });
}

function getShortcutPageCount(shortcuts = loadShortcuts()) {
  const count = shortcuts.length + (shortcutEditMode ? 1 : 0);
  return Math.max(1, Math.ceil(count / shortcutsPerPage));
}

function playShortcutPageMotion(direction) {
  if (!dom.shortcutGrid) {
    return;
  }

  dom.shortcutGrid.animate(
    [
      { opacity: 0.45, transform: `translateX(${direction > 0 ? -28 : 28}px) scale(0.985)` },
      { opacity: 1, transform: "translateX(0) scale(1)" },
    ],
    { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}

function changeShortcutPage(direction, { animate = true } = {}) {
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
  if (animate) {
    playShortcutPageMotion(direction);
  }
  return true;
}

function clearShortcutLongPress() {
  if (shortcutLongPressTimer) {
    window.clearTimeout(shortcutLongPressTimer);
    shortcutLongPressTimer = null;
  }
  shortcutLongPressPointer = null;
}

function clearShortcutPageFlip() {
  if (shortcutPageFlipTimer) {
    window.clearTimeout(shortcutPageFlipTimer);
    shortcutPageFlipTimer = null;
  }
}

function updateShortcutDragGhost(clientX, clientY) {
  if (!shortcutDragState?.ghost) {
    return;
  }

  shortcutDragState.ghost.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -46px) scale(1.06)`;
}

function createShortcutDragGhost(card, clientX, clientY) {
  const ghost = card.cloneNode(true);
  ghost.classList.remove("is-editing", "is-dragging");
  ghost.classList.add("shortcut-drag-ghost");
  ghost.removeAttribute("data-shortcut-card");
  ghost.querySelector(".shortcut-delete-button")?.remove();
  document.body.append(ghost);
  updateShortcutDragGhost(clientX, clientY);
  return ghost;
}

function moveShortcut(fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return false;
  }

  const shortcuts = loadShortcuts();
  if (!shortcuts[fromIndex] || toIndex >= shortcuts.length) {
    return false;
  }

  const [item] = shortcuts.splice(fromIndex, 1);
  shortcuts.splice(toIndex, 0, item);
  saveShortcuts(shortcuts);
  shortcutDragState.draggedIndex = toIndex;
  animateShortcutLayout(() => renderShortcuts(shortcuts));
  return true;
}

function moveShortcutToPageEdge(direction) {
  if (!shortcutDragState) {
    return false;
  }

  const shortcuts = loadShortcuts();
  const pageCount = getShortcutPageCount(shortcuts);
  const nextPageIndex = Math.min(Math.max(shortcutPageIndex + direction, 0), pageCount - 1);
  if (nextPageIndex === shortcutPageIndex || !shortcuts[shortcutDragState.draggedIndex]) {
    return false;
  }

  const [item] = shortcuts.splice(shortcutDragState.draggedIndex, 1);
  const edgeIndex =
    direction > 0
      ? Math.min(nextPageIndex * shortcutsPerPage, shortcuts.length)
      : Math.min((nextPageIndex + 1) * shortcutsPerPage - 1, shortcuts.length);
  shortcuts.splice(edgeIndex, 0, item);
  shortcutDragState.draggedIndex = edgeIndex;
  shortcutPageIndex = nextPageIndex;
  saveShortcuts(shortcuts);
  renderShortcuts(shortcuts);
  playShortcutPageMotion(direction);
  return true;
}

function scheduleShortcutPageFlip(direction) {
  if (!shortcutDragState || shortcutPageFlipTimer) {
    return;
  }

  shortcutPageFlipTimer = window.setTimeout(() => {
    shortcutPageFlipTimer = null;
    if (moveShortcutToPageEdge(direction)) {
      scheduleShortcutPageFlip(direction);
    }
  }, shortcutPageFlipDelay);
}

function updateShortcutDragPageFlip(clientX) {
  const panelRect = dom.homeShortcutsPanel?.getBoundingClientRect();
  if (!panelRect) {
    clearShortcutPageFlip();
    return;
  }

  if (clientX < panelRect.left + shortcutPageFlipEdge) {
    scheduleShortcutPageFlip(-1);
    return;
  }

  if (clientX > panelRect.right - shortcutPageFlipEdge) {
    scheduleShortcutPageFlip(1);
    return;
  }

  clearShortcutPageFlip();
}

function getShortcutCardFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  return target instanceof Element ? target.closest("[data-shortcut-card]") : null;
}

function startShortcutDrag(card, index, pointer) {
  if (!card || !Number.isInteger(index)) {
    return;
  }

  clearShortcutLongPress();
  shortcutDragState = {
    draggedIndex: index,
    pointerId: pointer.pointerId,
    lastX: pointer.clientX,
    lastY: pointer.clientY,
    ghost: createShortcutDragGhost(card, pointer.clientX, pointer.clientY),
  };
  shortcutSuppressClickUntil = Date.now() + 900;
  setShortcutEditMode(true);
  dom.homeShortcutsPanel?.classList.add("is-drag-sorting");
}

function updateShortcutDrag(event) {
  if (!shortcutDragState || event.pointerId !== shortcutDragState.pointerId) {
    return;
  }

  event.preventDefault();
  shortcutDragState.lastX = event.clientX;
  shortcutDragState.lastY = event.clientY;
  updateShortcutDragGhost(event.clientX, event.clientY);
  updateShortcutDragPageFlip(event.clientX);

  const card = getShortcutCardFromPoint(event.clientX, event.clientY);
  const targetIndex = Number(card?.dataset.shortcutIndex);
  if (
    Number.isInteger(targetIndex) &&
    targetIndex !== shortcutDragState.draggedIndex &&
    !card?.classList.contains("shortcut-add-card")
  ) {
    moveShortcut(shortcutDragState.draggedIndex, targetIndex);
  }
}

function endShortcutDrag() {
  clearShortcutLongPress();
  clearShortcutPageFlip();
  if (!shortcutDragState) {
    return;
  }

  shortcutDragState.ghost?.remove();
  shortcutDragState = null;
  shortcutSuppressClickUntil = Date.now() + 400;
  dom.homeShortcutsPanel?.classList.remove("is-drag-sorting");
  renderShortcuts();
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
  const iconCandidates = url ? buildShortcutIconCandidates(url) : [];

  return {
    url,
    domain,
    title: url ? inferShortcutTitle(url) : "",
    iconCandidates,
    icon: iconCandidates[0]?.url || "",
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
  const previousSelectedIcon = shortcutDialogSelectedIcon;
  shortcutDialogIconCandidates = draft.iconCandidates;
  if (!draft.url) {
    shortcutDialogSelectedIcon = "";
    shortcutDialogFailedIcons = new Set();
  } else if (
    !previousSelectedIcon ||
    !shortcutDialogIconCandidates.some((candidate) => candidate.url === previousSelectedIcon)
  ) {
    shortcutDialogSelectedIcon =
      shortcutDialogIconCandidates.find((candidate) => !shortcutDialogFailedIcons.has(candidate.url))?.url ||
      draft.icon;
  }
  const selectedIcon = shortcutDialogSelectedIcon || draft.icon;

  if (dom.shortcutDialogPreviewName) {
    dom.shortcutDialogPreviewName.textContent = title;
  }

  if (dom.shortcutDialogPreviewDomain) {
    dom.shortcutDialogPreviewDomain.textContent = domain;
  }

  if (dom.shortcutDialogInitial) {
    dom.shortcutDialogInitial.textContent = initial;
    dom.shortcutDialogInitial.hidden = Boolean(selectedIcon);
  }

  if (dom.shortcutDialogIcon) {
    dom.shortcutDialogIcon.hidden = !selectedIcon;
    if (selectedIcon) {
      dom.shortcutDialogIcon.src = selectedIcon;
    }
  }

  renderShortcutIconOptions();

  const submitButton = dom.shortcutDialogForm?.querySelector("[data-shortcut-dialog-submit]");
  if (submitButton) {
    submitButton.disabled = !draft.url;
  }
}

function renderShortcutIconOptions() {
  if (!dom.shortcutIconOptions) {
    return;
  }

  const candidates = shortcutDialogIconCandidates.filter((candidate) => !shortcutDialogFailedIcons.has(candidate.url));
  dom.shortcutIconOptions.hidden = !candidates.length;
  dom.shortcutIconOptions.innerHTML = candidates
    .map(
      (candidate, index) => `
        <button
          class="shortcut-icon-option${candidate.url === shortcutDialogSelectedIcon ? " is-selected" : ""}"
          type="button"
          data-shortcut-icon-option="${escapeHtml(candidate.url)}"
          aria-label="选择${escapeHtml(candidate.label)}图标"
          aria-pressed="${candidate.url === shortcutDialogSelectedIcon ? "true" : "false"}"
        >
          <img src="${escapeHtml(candidate.url)}" alt="" loading="lazy" data-shortcut-icon-candidate="${index}" />
          <span>${escapeHtml(candidate.label)}</span>
        </button>
      `,
    )
    .join("");
}

function selectShortcutDialogIcon(iconUrl) {
  if (!iconUrl || shortcutDialogFailedIcons.has(iconUrl)) {
    return;
  }

  shortcutDialogSelectedIcon = iconUrl;
  renderShortcutIconOptions();
  syncShortcutDialogPreview();
}

function openShortcutDialog(initialUrl = "") {
  if (!dom.shortcutDialog) {
    return;
  }

  shortcutDialogTitleTouched = false;
  shortcutDialogSelectedIcon = "";
  shortcutDialogIconCandidates = [];
  shortcutDialogFailedIcons = new Set();

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

  dom.shortcutGrid?.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  dom.shortcutGrid?.addEventListener("click", (event) => {
    if (Date.now() < shortcutSuppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const button = event.target.closest("[data-shortcut-action]");
    if (!button) {
      const shortcutLink = event.target.closest(".shortcut-card .shortcut-link");
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
    playShortcutPageMotion(shortcutPageIndex > 0 ? 1 : -1);
  });

  dom.shortcutGrid?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || shortcutDragState) {
      return;
    }

    const card = event.target instanceof Element ? event.target.closest("[data-shortcut-card]") : null;
    if (
      !card ||
      event.target.closest("[data-shortcut-action]") ||
      card.classList.contains("shortcut-add-card")
    ) {
      return;
    }

    const index = Number(card.dataset.shortcutIndex);
    if (!Number.isInteger(index)) {
      return;
    }

    shortcutLongPressPointer = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      card,
      index,
    };
    shortcutLongPressTimer = window.setTimeout(() => {
      startShortcutDrag(card, index, event);
    }, shortcutLongPressMs);
  });

  document.addEventListener(
    "pointermove",
    (event) => {
      if (shortcutDragState) {
        updateShortcutDrag(event);
        return;
      }

      if (!shortcutLongPressPointer || event.pointerId !== shortcutLongPressPointer.pointerId) {
        return;
      }

      const moved = Math.hypot(
        event.clientX - shortcutLongPressPointer.startX,
        event.clientY - shortcutLongPressPointer.startY,
      );
      if (moved > shortcutDragMoveTolerance) {
        clearShortcutLongPress();
      }
    },
    { passive: false },
  );

  document.addEventListener("pointerup", endShortcutDrag);
  document.addEventListener("pointercancel", endShortcutDrag);

  dom.shortcutDialogUrl?.addEventListener("input", () => {
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogTitleInput?.addEventListener("input", () => {
    shortcutDialogTitleTouched = true;
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogIcon?.addEventListener("error", () => {
    const failedIcon = dom.shortcutDialogIcon.currentSrc || dom.shortcutDialogIcon.src || shortcutDialogSelectedIcon;
    if (failedIcon) {
      shortcutDialogFailedIcons.add(failedIcon);
    }
    const nextIcon = shortcutDialogIconCandidates.find((candidate) => !shortcutDialogFailedIcons.has(candidate.url))?.url || "";
    shortcutDialogSelectedIcon = nextIcon;
    dom.shortcutDialogIcon.hidden = !nextIcon;
    if (nextIcon) {
      dom.shortcutDialogIcon.src = nextIcon;
    }
    if (dom.shortcutDialogInitial) {
      dom.shortcutDialogInitial.hidden = Boolean(nextIcon);
    }
    renderShortcutIconOptions();
  });

  dom.shortcutIconOptions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortcut-icon-option]");
    if (!button) {
      return;
    }

    selectShortcutDialogIcon(button.dataset.shortcutIconOption);
  });

  dom.shortcutIconOptions?.addEventListener(
    "error",
    (event) => {
      const image = event.target instanceof Element ? event.target.closest("[data-shortcut-icon-candidate]") : null;
      if (!image) {
        return;
      }

      const iconUrl = image.currentSrc || image.src;
      shortcutDialogFailedIcons.add(iconUrl);
      image.closest(".shortcut-icon-option")?.remove();
    },
    true,
  );

  dom.shortcutDialogCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeShortcutDialog();
    });
  });

  dom.shortcutDialogForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = buildShortcutDraft(dom.shortcutDialogUrl?.value);
    const title = dom.shortcutDialogTitleInput?.value.trim() || draft.title;
    const icon = shortcutDialogSelectedIcon || draft.icon;

    if (addShortcut(draft.url, { title, icon })) {
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
