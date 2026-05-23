import { rebuildHomeShell } from "./src/pages/home/home-shell.js";
import { loadBilibiliWidget, setupBilibiliWidget } from "./src/pages/home/bilibili/bilibili-widget.js";
import { loadStockWidget, setupStockWidget } from "./src/pages/home/stock/stock-widget.js";
import { setupHomeSearchAndShortcuts } from "./src/pages/home/shortcuts/shortcuts.js";
import { setupHomeAiChat } from "./src/pages/home/chat/home-chat.js";
import { setupHomeWallpaperToggle } from "./src/pages/home/theme/wallpaper-toggle.js";
import { setupViewNavigation } from "./src/pages/home/navigation/arc-navigation.js";
import { loadSelectedWeather, renderBriefWeatherIfNeeded, setupWeatherControls } from "./src/pages/home/weather/weather-widget.js";

function buildDataUrl() {
  return `./data/daily-brief.json?ts=${Date.now()}`;
}

rebuildHomeShell();

const chatConfig = window.AGENT_CHAT_CONFIG ?? {};
const workflowUrl =
  "https://github.com/TianwenZhou/tianwenzhou.github.io/actions/workflows/update-brief.yml";
const chatStorageKey = "agent-dashboard-chat-history-v1";
const chatDockStateKey = "agent-dashboard-chat-open-v1";
const chatDockPositionKey = "agent-dashboard-chat-position-v1";
const chatUnreadKey = "agent-dashboard-chat-unread-v1";
const maxChatTurns = 8;
const chatDragThreshold = 10;
const isBrowserExtensionPage = ["chrome-extension:", "ms-browser-extension:", "moz-extension:"].includes(
  window.location.protocol,
);
let latestBriefData = null;
let newsPageModulePromise = null;
let nbaPageModulePromise = null;
let papersPageModulePromise = null;
let nbaScheduleNavigationReady = false;

const dom = {
  generatedAt: document.querySelector("#generatedAt"),
  refreshStatus: document.querySelector("#refreshStatus"),
  refreshDataButton: document.querySelector("#refreshDataButton"),
  chatDock: document.querySelector("#chatDock"),
  chatDragHandle: document.querySelector("#chatDragHandle"),
  chatToggleButton: document.querySelector("#chatToggleButton"),
  chatToggleLabel: document.querySelector("#chatToggleLabel"),
  chatUnreadBadge: document.querySelector("#chatUnreadBadge"),
  chatCollapseButton: document.querySelector("#chatCollapseButton"),
  chatAvailability: document.querySelector("#chatAvailability"),
  chatPeekText: document.querySelector("#chatPeekText"),
  chatMessages: document.querySelector("#chatMessages"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  chatHint: document.querySelector("#chatHint"),
  chatSendButton: document.querySelector("#chatSendButton"),
  chatShortcuts: Array.from(document.querySelectorAll("[data-chat-shortcut]")),
  weatherCurrent: document.querySelector("#weatherCurrent"),
  weatherDaily: document.querySelector("#weatherDaily"),
  calendarRangeHint: document.querySelector("#calendarRangeHint"),
  calendarPrev: document.querySelector("#calendarPrev"),
  calendarToday: document.querySelector("#calendarToday"),
  calendarNext: document.querySelector("#calendarNext"),
  currentMonthLabel: document.querySelector("#currentMonthLabel"),
  currentMonthCalendar: document.querySelector("#currentMonthCalendar"),
  nextMonthLabel: document.querySelector("#nextMonthLabel"),
  nextMonthCalendar: document.querySelector("#nextMonthCalendar"),
  historyTodayMeta: document.querySelector("#historyTodayMeta"),
  historyTodayList: document.querySelector("#historyTodayList"),
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  featuredPlacePanel: document.querySelector("#featuredPlacePanel"),
  classicQuoteCard: document.querySelector("#classicQuoteCard"),
  classicQuoteText: document.querySelector("#classicQuoteText"),
  classicQuoteSource: document.querySelector("#classicQuoteSource"),
  classicQuoteNote: document.querySelector("#classicQuoteNote"),
  bookExcerptText: document.querySelector("#bookExcerptText"),
  bookExcerptSource: document.querySelector("#bookExcerptSource"),
  chinaTopNews: document.querySelector("#chinaTopNews"),
  chinaSocietyNews: document.querySelector("#chinaSocietyNews"),
  chinaFinanceNews: document.querySelector("#chinaFinanceNews"),
  worldTopNews: document.querySelector("#worldTopNews"),
  worldBusinessNews: document.querySelector("#worldBusinessNews"),
  worldTechNews: document.querySelector("#worldTechNews"),
  nbaScoreboard: document.querySelector("#nbaScoreboard"),
  nbaNews: document.querySelector("#nbaNews"),
  paperHighlights: document.querySelector("#paperHighlights"),
  paperRotationLabel: document.querySelector("#paperRotationLabel"),
  petDock: document.querySelector("#petDock"),
  petCompanion: document.querySelector("#petCompanion"),
  petStage: document.querySelector("#petStage"),
  petMoodBadge: document.querySelector("#petMoodBadge"),
  petStatusText: document.querySelector("#petStatusText"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

let featuredPlaceTimer = null;
let lastCalendarKey = "";
let refreshInFlight = false;
let chatPending = false;
let chatDockOpen = false;
let chatUnreadCount = 0;
let chatHistory = [];
let chatDragState = null;
let chatSuppressToggleUntil = 0;
let petInteractCooldown = 0;
let petRoamFrame = 0;
let petRoamState = null;
const calendarState = {
  anchorYear: null,
  anchorMonthIndex: null,
};
// 2026 Chinese public holiday dates based on the State Council holiday notice.
const chinaHolidayRanges = [
  { label: "元旦", start: "2026-01-01", end: "2026-01-03" },
  { label: "春节", start: "2026-02-15", end: "2026-02-23" },
  { label: "清明", start: "2026-04-04", end: "2026-04-06" },
  { label: "劳动节", start: "2026-05-01", end: "2026-05-05" },
  { label: "端午", start: "2026-06-19", end: "2026-06-21" },
  { label: "中秋", start: "2026-09-25", end: "2026-09-27" },
  { label: "国庆", start: "2026-10-01", end: "2026-10-07" },
];

function getDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildHolidayMap(ranges) {
  const map = new Map();

  ranges.forEach((range) => {
    const start = new Date(`${range.start}T12:00:00Z`);
    const end = new Date(`${range.end}T12:00:00Z`);

    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      map.set(cursor.toISOString().slice(0, 10), range.label);
    }
  });

  return map;
}

const chinaHolidayMap = buildHolidayMap(chinaHolidayRanges);

const petStatusCatalog = {
  roaming: [
    "A tiny 3D cat is patrolling the bottom edge of your dashboard.",
    "Neo Cat is on patrol and keeping an eye on the page.",
    "This little companion is wandering under the panels today.",
  ],
  hover: [
    "Hover here to pause the patrol and say hi.",
    "Neo Cat pauses when you come closer.",
    "The patrol is paused. The cat is watching you now.",
  ],
  pet: [
    "Soft tap received. Neo Cat seems pleased.",
    "The little cat leans in for another pat.",
    "Purr... the 3D cat approves of that.",
  ],
};

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function getChatEndpoint() {
  return typeof chatConfig.endpoint === "string" ? chatConfig.endpoint.trim() : "";
}

function getDefaultChatMessage(endpointConfigured) {
  if (!endpointConfigured) {
    return {
      role: "assistant",
      content:
        "聊天入口已经放好了，但还需要把 Cloudflare Worker 的地址填进 chat-config.js，配置完成后这里就可以直接聊天。",
      label: "Setup",
    };
  }

  return {
    role: "assistant",
    content: "你好，我在这里陪你简短聊几句。可以问我新闻、NBA、论文，或者随便聊聊天。",
    label: chatConfig.assistantName || "Agent",
  };
}

function normalizeChatHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item.content === "string")
    .map((item) => ({
      role: item.role === "user" ? "user" : "assistant",
      content: item.content.trim(),
      label: typeof item.label === "string" ? item.label : "",
    }))
    .filter((item) => item.content)
    .slice(-maxChatTurns);
}

function loadChatHistory() {
  try {
    const raw = window.localStorage.getItem(chatStorageKey);
    return normalizeChatHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function persistChatHistory() {
  try {
    window.localStorage.setItem(chatStorageKey, JSON.stringify(chatHistory.slice(-maxChatTurns)));
  } catch {
    // Ignore storage failures so the chat still works in private mode.
  }
}

function loadStoredInteger(storageKey) {
  try {
    const raw = Number(window.localStorage.getItem(storageKey));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch {
    return 0;
  }
}

function persistChatUnreadCount() {
  try {
    if (chatUnreadCount > 0) {
      window.localStorage.setItem(chatUnreadKey, String(chatUnreadCount));
    } else {
      window.localStorage.removeItem(chatUnreadKey);
    }
  } catch {
    // Ignore storage failures so unread state does not break the UI.
  }
}

function renderChatUnreadBadge() {
  const hasUnread = chatUnreadCount > 0;
  dom.chatUnreadBadge.hidden = !hasUnread;
  dom.chatUnreadBadge.textContent = chatUnreadCount > 9 ? "9+" : String(chatUnreadCount);
  dom.chatToggleButton.classList.toggle("has-unread", hasUnread);
}

function resetChatUnreadCount() {
  chatUnreadCount = 0;
  persistChatUnreadCount();
  renderChatUnreadBadge();
}

function incrementChatUnreadCount() {
  chatUnreadCount = Math.min(chatUnreadCount + 1, 99);
  persistChatUnreadCount();
  renderChatUnreadBadge();
}

function buildChatPreviewText() {
  const latest = chatHistory[chatHistory.length - 1];
  if (!latest?.content) {
    return "Ask about NBA, weather, news, or papers.";
  }

  return latest.content
    .replace(/```[\s\S]*?```/g, " code ")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);
}

function renderChatPreview() {
  dom.chatPeekText.textContent = buildChatPreviewText();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdownInline(value) {
  const codeTokens = [];
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `__CHAT_CODE_${codeTokens.length}__`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  codeTokens.forEach((tokenMarkup, index) => {
    html = html.replace(`__CHAT_CODE_${index}__`, tokenMarkup);
  });

  return html.replace(/\n/g, "<br>");
}

function renderMarkdown(value) {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];

  const isFence = (line) => line.trim().startsWith("```");
  const isHeading = (line) => /^(#{1,4})\s+/.test(line);
  const isQuote = (line) => /^>\s?/.test(line.trim());
  const isUnordered = (line) => /^[-*+]\s+/.test(line.trim());
  const isOrdered = (line) => /^\d+\.\s+/.test(line.trim());

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const language = line.trim().slice(3).trim();
      index += 1;
      const codeLines = [];
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (isHeading(line)) {
      const match = line.match(/^(#{1,4})\s+(.*)$/);
      const level = Math.min(match[1].length + 1, 4);
      blocks.push(`<h${level}>${renderMarkdownInline(match[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (isQuote(line)) {
      const quoteLines = [];
      while (index < lines.length && isQuote(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote>${renderMarkdownInline(quoteLines.join("\n"))}</blockquote>`);
      continue;
    }

    if (isUnordered(line) || isOrdered(line)) {
      const ordered = isOrdered(line);
      const tag = ordered ? "ol" : "ul";
      const items = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        if (!(ordered ? /^\d+\.\s+/.test(current) : /^[-*+]\s+/.test(current))) {
          break;
        }

        items.push(
          ordered
            ? current.replace(/^\d+\.\s+/, "")
            : current.replace(/^[-*+]\s+/, ""),
        );
        index += 1;
      }

      blocks.push(
        `<${tag}>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</${tag}>`,
      );
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isFence(lines[index]) &&
      !isHeading(lines[index]) &&
      !isQuote(lines[index]) &&
      !isUnordered(lines[index]) &&
      !isOrdered(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(`<p>${renderMarkdownInline(paragraphLines.join("\n"))}</p>`);
  }

  return blocks.join("");
}

function pickPetStatus(kind) {
  const options = petStatusCatalog[kind] ?? petStatusCatalog.roaming;
  return options[Math.floor(Math.random() * options.length)];
}

function setPetStatus(mood, text) {
  dom.petMoodBadge.textContent = mood;
  dom.petStatusText.textContent = text;
}

function handlePetting() {
  const now = Date.now();
  if (now - petInteractCooldown < 180) {
    return;
  }

  petInteractCooldown = now;
  dom.petStage.classList.remove("is-happy");
  void dom.petStage.offsetWidth;
  dom.petStage.classList.add("is-happy");
  window.setTimeout(() => dom.petStage.classList.remove("is-happy"), 720);
  setPetStatus("Purring", pickPetStatus("pet"));
}

function updatePetFacing() {
  if (!petRoamState) {
    return;
  }

  dom.petStage.classList.toggle("is-facing-left", petRoamState.direction < 0);
}

function clampPetRoamPosition() {
  if (!petRoamState || !dom.petDock || !dom.petCompanion) {
    return;
  }

  const laneWidth = dom.petDock.clientWidth || 0;
  const companionWidth = dom.petCompanion.offsetWidth || 180;
  const maxX = Math.max(0, laneWidth - companionWidth);
  petRoamState.x = Math.max(0, Math.min(maxX, petRoamState.x));
}

function applyPetRoamPosition() {
  if (!petRoamState || !dom.petCompanion) {
    return;
  }

  const laneWidth = dom.petDock?.clientWidth || 0;
  const companionWidth = dom.petCompanion.offsetWidth || 180;
  const maxX = Math.max(0, laneWidth - companionWidth);

  dom.petCompanion.style.transform = `translate3d(${petRoamState.x}px, 0, 0)`;
  dom.petCompanion.classList.toggle("is-near-left", petRoamState.x < 24);
  dom.petCompanion.classList.toggle("is-near-right", maxX - petRoamState.x < 24);
  updatePetFacing();
}

function maybePausePetRoam(isPaused) {
  if (!petRoamState) {
    return;
  }

  petRoamState.isPaused = isPaused;
  dom.petCompanion.classList.toggle("is-open", isPaused);
  setPetStatus(isPaused ? "Watching" : "Roaming", pickPetStatus(isPaused ? "hover" : "roaming"));
}

function randomizePetRoamSpeed() {
  if (!petRoamState) {
    return;
  }

  petRoamState.speed = 18 + Math.random() * 20;
}

function stepPetRoam(timestamp) {
  if (!petRoamState) {
    return;
  }

  if (!petRoamState.lastTimestamp) {
    petRoamState.lastTimestamp = timestamp;
  }

  const delta = Math.min(48, timestamp - petRoamState.lastTimestamp);
  petRoamState.lastTimestamp = timestamp;

  if (!petRoamState.isPaused) {
    const laneWidth = dom.petDock?.clientWidth || 0;
    const companionWidth = dom.petCompanion?.offsetWidth || 180;
    const maxX = Math.max(0, laneWidth - companionWidth);

    petRoamState.x += petRoamState.direction * petRoamState.speed * (delta / 1000);

    if (petRoamState.x <= 0) {
      petRoamState.x = 0;
      petRoamState.direction = 1;
      randomizePetRoamSpeed();
    } else if (petRoamState.x >= maxX) {
      petRoamState.x = maxX;
      petRoamState.direction = -1;
      randomizePetRoamSpeed();
    }
  }

  applyPetRoamPosition();
  petRoamFrame = window.requestAnimationFrame(stepPetRoam);
}

function startPetRoam() {
  if (!dom.petDock || !dom.petCompanion) {
    return;
  }

  if (petRoamFrame) {
    window.cancelAnimationFrame(petRoamFrame);
  }

  petRoamState = {
    x: 12,
    direction: 1,
    speed: 24,
    isPaused: false,
    lastTimestamp: 0,
  };

  clampPetRoamPosition();
  applyPetRoamPosition();
  petRoamFrame = window.requestAnimationFrame(stepPetRoam);
}

function setupCyberPet() {
  setPetStatus("Roaming", pickPetStatus("roaming"));
  startPetRoam();

  dom.petStage.addEventListener("click", handlePetting);
  dom.petStage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePetting();
    }
  });

  dom.petCompanion.addEventListener("pointerenter", () => {
    maybePausePetRoam(true);
  });

  dom.petCompanion.addEventListener("pointerleave", () => {
    maybePausePetRoam(false);
  });

  dom.petCompanion.addEventListener("focusin", () => {
    maybePausePetRoam(true);
  });

  dom.petCompanion.addEventListener("focusout", (event) => {
    if (!dom.petCompanion.contains(event.relatedTarget)) {
      maybePausePetRoam(false);
    }
  });

  window.addEventListener("resize", () => {
    clampPetRoamPosition();
    applyPetRoamPosition();
  });
}

function loadChatDockPreference() {
  try {
    const raw = window.localStorage.getItem(chatDockStateKey);
    if (raw === "open") {
      return true;
    }
    if (raw === "closed") {
      return false;
    }
  } catch {
    // Ignore storage failures and fall back to viewport-based defaults.
  }

  return false;
}

function persistChatDockPreference(isOpen) {
  try {
    window.localStorage.setItem(chatDockStateKey, isOpen ? "open" : "closed");
  } catch {
    // Ignore storage failures so the dock can still be toggled.
  }
}

function loadChatDockPosition() {
  try {
    const raw = window.localStorage.getItem(chatDockPositionKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.left) || !Number.isFinite(parsed?.top)) {
      return null;
    }

    return {
      left: parsed.left,
      top: parsed.top,
    };
  } catch {
    return null;
  }
}

function persistChatDockPosition(position) {
  try {
    if (!position) {
      window.localStorage.removeItem(chatDockPositionKey);
      return;
    }

    window.localStorage.setItem(chatDockPositionKey, JSON.stringify(position));
  } catch {
    // Ignore storage failures so dragging still works within the session.
  }
}

function clampChatDockPosition(position) {
  const rect = dom.chatDock.getBoundingClientRect();
  const width = Math.min(rect.width || 360, window.innerWidth - 24);
  const height = Math.min(rect.height || 120, window.innerHeight - 24);
  const maxLeft = Math.max(12, window.innerWidth - width - 12);
  const maxTop = Math.max(12, window.innerHeight - height - 12);

  return {
    left: Math.min(Math.max(12, position.left), maxLeft),
    top: Math.min(Math.max(12, position.top), maxTop),
  };
}

function applyChatDockPosition(position, { persist = true } = {}) {
  if (!position) {
    dom.chatDock.classList.remove("is-custom-position");
    dom.chatDock.style.left = "";
    dom.chatDock.style.top = "";
    dom.chatDock.style.right = "";
    dom.chatDock.style.bottom = "";
    if (persist) {
      persistChatDockPosition(null);
    }
    return;
  }

  const clamped = clampChatDockPosition(position);
  dom.chatDock.classList.add("is-custom-position");
  dom.chatDock.style.left = `${clamped.left}px`;
  dom.chatDock.style.top = `${clamped.top}px`;
  dom.chatDock.style.right = "auto";
  dom.chatDock.style.bottom = "auto";

  if (persist) {
    persistChatDockPosition(clamped);
  }
}

function setChatDockState(isOpen, { persist = true } = {}) {
  chatDockOpen = isOpen;
  dom.chatDock.classList.toggle("is-open", isOpen);
  dom.chatToggleButton.setAttribute("aria-expanded", String(isOpen));
  dom.chatToggleLabel.textContent = isOpen ? "\u6536\u8d77" : "\u804a\u5929";

  if (isOpen) {
    resetChatUnreadCount();
  }

  if (persist) {
    persistChatDockPreference(isOpen);
  }

  if (dom.chatDock.classList.contains("is-custom-position")) {
    applyChatDockPosition(
      {
        left: Number.parseFloat(dom.chatDock.style.left) || dom.chatDock.getBoundingClientRect().left,
        top: Number.parseFloat(dom.chatDock.style.top) || dom.chatDock.getBoundingClientRect().top,
      },
      { persist: true },
    );
  }
}

function setupChatDock() {
  chatUnreadCount = loadStoredInteger(chatUnreadKey);
  renderChatUnreadBadge();
  renderChatPreview();
  setChatDockState(loadChatDockPreference(), { persist: false });
  applyChatDockPosition(loadChatDockPosition(), { persist: false });

  dom.chatToggleButton.addEventListener("click", () => {
    if (Date.now() < chatSuppressToggleUntil) {
      return;
    }
    setChatDockState(!chatDockOpen);
  });

  dom.chatCollapseButton.addEventListener("click", () => {
    setChatDockState(false);
  });

  dom.chatDock.addEventListener("click", (event) => {
    if (chatDockOpen || Date.now() < chatSuppressToggleUntil) {
      return;
    }

    if (event.target.closest("#chatToggleButton")) {
      return;
    }

    setChatDockState(true);
  });

  setupChatDockDragging();
  window.addEventListener("resize", () => {
    if (dom.chatDock.classList.contains("is-custom-position")) {
      applyChatDockPosition(loadChatDockPosition(), { persist: false });
    }
  });
}

function setupChatDockDragging() {
  const handles = [dom.chatToggleButton, dom.chatDragHandle].filter(Boolean);

  handles.forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      if (event.target.closest("#chatCollapseButton")) {
        return;
      }

      const rect = dom.chatDock.getBoundingClientRect();
      chatDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };

      handle.setPointerCapture?.(event.pointerId);
    });
  });

  window.addEventListener("pointermove", (event) => {
    if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - chatDragState.startX;
    const deltaY = event.clientY - chatDragState.startY;

    if (!chatDragState.moved && Math.hypot(deltaX, deltaY) < chatDragThreshold) {
      return;
    }

    chatDragState.moved = true;
    dom.chatDock.classList.add("is-dragging");
    applyChatDockPosition(
      {
        left: chatDragState.left + deltaX,
        top: chatDragState.top + deltaY,
      },
      { persist: true },
    );
  });

  const endDragging = (event) => {
    if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
      return;
    }

    if (chatDragState.moved) {
      chatSuppressToggleUntil = Date.now() + 220;
    }

    chatDragState = null;
    dom.chatDock.classList.remove("is-dragging");
  };

  window.addEventListener("pointerup", endDragging);
  window.addEventListener("pointercancel", endDragging);
}

function createChatMessageElement(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `chat-message is-${message.role}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  const content = document.createElement("div");
  content.className = "chat-markdown";
  content.innerHTML = renderMarkdown(message.content);
  bubble.append(content);

  const meta = document.createElement("p");
  meta.className = "chat-message-meta";
  meta.textContent = message.role === "user" ? "You" : message.label || "Agent";
  bubble.append(meta);
  wrapper.append(bubble);

  return wrapper;
}

function renderChatMessages() {
  dom.chatMessages.innerHTML = "";
  chatHistory.forEach((message) => {
    dom.chatMessages.append(createChatMessageElement(message));
  });
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  renderChatPreview();
}

function setChatPendingState(isPending) {
  chatPending = isPending;
  dom.chatSendButton.disabled = isPending || !getChatEndpoint();
  dom.chatInput.disabled = isPending || !getChatEndpoint();
  dom.chatShortcuts.forEach((button) => {
    button.disabled = isPending || !getChatEndpoint();
  });
  dom.chatSendButton.textContent = isPending ? "发送中..." : "发送";
}

async function sendChatMessage(messageText) {
  const endpoint = getChatEndpoint();
  if (!endpoint) {
    dom.chatHint.textContent = "先部署 Worker，并把 endpoint 写进 chat-config.js。";
    setChatDockState(true);
    return;
  }

  const trimmed = messageText.trim();
  if (!trimmed) {
    return;
  }

  setChatDockState(true);
  chatHistory.push({ role: "user", content: trimmed, label: "You" });
  chatHistory = chatHistory.slice(-maxChatTurns);
  persistChatHistory();
  renderChatMessages();
  dom.chatInput.value = "";
  dom.chatHint.textContent = "正在等待回复...";
  setChatPendingState(true);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload.reply) {
      throw new Error("empty reply");
    }

    chatHistory.push({
      role: "assistant",
      content: payload.reply,
      label: payload.assistantName || chatConfig.assistantName || "Agent",
    });
    chatHistory = chatHistory.slice(-maxChatTurns);
    persistChatHistory();
    if (!chatDockOpen) {
      incrementChatUnreadCount();
    }
    renderChatMessages();
    dom.chatHint.textContent = "已连接聊天接口，可以继续追问。";
  } catch (error) {
    dom.chatHint.textContent = `聊天失败：${error.message}`;
  } finally {
    setChatPendingState(false);
  }
}

function setupChatInterface() {
  const endpoint = getChatEndpoint();
  chatHistory = loadChatHistory();
  if (!chatHistory.length) {
    chatHistory = [getDefaultChatMessage(Boolean(endpoint))];
    persistChatHistory();
  } else if (endpoint && chatHistory.length === 1 && chatHistory[0].label === "Setup") {
    chatHistory = [getDefaultChatMessage(true)];
    persistChatHistory();
  }

  dom.chatAvailability.textContent = endpoint ? "Live Chat" : "Needs Worker";
  dom.chatHint.textContent = endpoint
    ? "简短对话，默认保留最近几轮。"
    : "先部署 Worker 并配置 endpoint，聊天才会真正可用。";
  renderChatMessages();
  setChatPendingState(false);

  dom.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatMessage(dom.chatInput.value);
  });

  dom.chatShortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      sendChatMessage(button.dataset.chatShortcut ?? "");
    });
  });
}

function renderClock() {
  const now = new Date();
  dom.currentDate.textContent = "";
  dom.currentTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const parts = getShanghaiDateParts(now);
  const calendarKey = `${parts.year}-${parts.month}-${parts.day}`;
  if (calendarKey !== lastCalendarKey) {
    const previousMonthDate = new Date(Date.UTC(parts.year, parts.month - 2, 1, 12));
    if (
      calendarState.anchorYear === null ||
      (calendarState.anchorYear === previousMonthDate.getUTCFullYear() &&
        calendarState.anchorMonthIndex === previousMonthDate.getUTCMonth())
    ) {
      syncCalendarAnchor(parts);
    }

    renderCalendars(parts);
    lastCalendarKey = calendarKey;
  }
}

function getShanghaiDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getShanghaiDateKey(date = new Date()) {
  const parts = getShanghaiDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function parseDateKey(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), 12);
}

function getFeaturedPlaceStartIndex(featuredPlaces, generatedAt) {
  if (!featuredPlaces?.length) {
    return 0;
  }

  if (!generatedAt) {
    return 0;
  }

  const generatedDateKey = getShanghaiDateKey(new Date(generatedAt));
  const todayDateKey = getShanghaiDateKey(new Date());
  const generatedValue = parseDateKey(generatedDateKey);
  const todayValue = parseDateKey(todayDateKey);

  if (generatedValue === null || todayValue === null) {
    return 0;
  }

  const diffDays = Math.round((todayValue - generatedValue) / 86400000);
  const normalizedOffset =
    ((diffDays % featuredPlaces.length) + featuredPlaces.length) %
    featuredPlaces.length;

  return normalizedOffset;
}

function getMonthLabel(year, monthIndex) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

function syncCalendarAnchor(todayParts = getShanghaiDateParts()) {
  calendarState.anchorYear = todayParts.year;
  calendarState.anchorMonthIndex = todayParts.month - 1;
}

function shiftCalendarAnchor(monthOffset) {
  const next = new Date(
    Date.UTC(calendarState.anchorYear, calendarState.anchorMonthIndex + monthOffset, 1, 12),
  );
  calendarState.anchorYear = next.getUTCFullYear();
  calendarState.anchorMonthIndex = next.getUTCMonth();
}

function isCalendarOnTodayMonth(todayParts = getShanghaiDateParts()) {
  return (
    calendarState.anchorYear === todayParts.year &&
    calendarState.anchorMonthIndex === todayParts.month - 1
  );
}

function buildCalendarMonth(year, monthIndex, todayParts) {
  const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
  const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  const cells = [];

  weekdayLabels.forEach((label) => {
    cells.push(`<span class="calendar-weekday">${label}</span>`);
  });

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(`<span class="calendar-day is-empty"></span>`);
      continue;
    }

    const isToday =
      todayParts.year === year &&
      todayParts.month === monthIndex + 1 &&
      todayParts.day === dayNumber;
    const dateKey = getDateKey(year, monthIndex + 1, dayNumber);
    const holidayLabel = chinaHolidayMap.get(dateKey);
    const weekday = (index % 7) + 1;
    const classNames = [
      "calendar-day",
      isToday ? "is-today" : "",
      holidayLabel ? "is-holiday" : "",
      weekday >= 6 ? "is-weekend" : "",
    ]
      .filter(Boolean)
      .join(" ");

    cells.push(`
      <span class="${classNames}" title="${holidayLabel ?? dateKey}">
        <span class="calendar-day-number">${dayNumber}</span>
        ${holidayLabel ? `<span class="calendar-day-label">${holidayLabel}</span>` : ""}
      </span>
    `);
  }

  return cells.join("");
}

function renderCalendars(todayParts) {
  if (calendarState.anchorYear === null || calendarState.anchorMonthIndex === null) {
    syncCalendarAnchor(todayParts);
  }

  const currentMonthIndex = calendarState.anchorMonthIndex;
  const currentMonthYear = calendarState.anchorYear;
  const nextMonthDate = new Date(Date.UTC(currentMonthYear, currentMonthIndex + 1, 1, 12));
  const nextMonthIndex = nextMonthDate.getUTCMonth();
  const nextMonthYear = nextMonthDate.getUTCFullYear();

  dom.currentMonthLabel.textContent = getMonthLabel(currentMonthYear, currentMonthIndex);
  dom.currentMonthCalendar.innerHTML = buildCalendarMonth(
    currentMonthYear,
    currentMonthIndex,
    todayParts,
  );

  dom.nextMonthLabel.textContent = getMonthLabel(nextMonthYear, nextMonthIndex);
  dom.nextMonthCalendar.innerHTML = buildCalendarMonth(
    nextMonthYear,
    nextMonthIndex,
    todayParts,
  );

  dom.calendarRangeHint.textContent = isCalendarOnTodayMonth(todayParts)
    ? "当前与下一个月"
    : `查看：${getMonthLabel(currentMonthYear, currentMonthIndex)} · ${getMonthLabel(nextMonthYear, nextMonthIndex)}`;
  dom.calendarToday.disabled = isCalendarOnTodayMonth(todayParts);
}

function setupCalendarNavigation() {
  dom.calendarPrev.addEventListener("click", () => {
    shiftCalendarAnchor(-1);
    renderCalendars(getShanghaiDateParts());
  });

  dom.calendarNext.addEventListener("click", () => {
    shiftCalendarAnchor(1);
    renderCalendars(getShanghaiDateParts());
  });

  dom.calendarToday.addEventListener("click", () => {
    syncCalendarAnchor(getShanghaiDateParts());
    renderCalendars(getShanghaiDateParts());
  });
}

function clearElement(element) {
  element.innerHTML = "";
}

function renderEmpty(element) {
  clearElement(element);
  element.append(dom.emptyStateTemplate.content.cloneNode(true));
}

function renderTodayInHistory(historyBlock) {
  const items = historyBlock?.items ?? [];
  dom.historyTodayMeta.textContent = historyBlock?.dateLabel ?? "今天";

  if (!items.length) {
    dom.historyTodayList.innerHTML = "<p>今天的历史切片正在补充中。</p>";
    return;
  }

  dom.historyTodayList.innerHTML = items
    .slice(0, 2)
    .map((item) => {
      const year = item.year ? `<strong>${item.year}</strong>` : "";
      const linkStart = item.link ? `<a href="${item.link}" target="_blank" rel="noreferrer">` : "";
      const linkEnd = item.link ? "</a>" : "";

      return `
        <p class="history-today-item">
          ${linkStart}${year}<span>${item.text}</span>${linkEnd}
        </p>
      `;
    })
    .join("");
}

function renderClassicQuote(classicQuote) {
  dom.classicQuoteCard.classList.remove("skeleton");

  if (!classicQuote) {
    dom.classicQuoteText.textContent = "今天的摘抄还在整理中。";
    dom.classicQuoteSource.textContent = "名著摘抄";
    dom.classicQuoteNote.textContent = "稍后会自动补上。";
    return;
  }

  dom.classicQuoteText.textContent = `“${classicQuote.text}”`;
  dom.classicQuoteSource.textContent = `${classicQuote.source} · ${classicQuote.author}`;
  dom.classicQuoteNote.textContent = classicQuote.note;
}

function renderBookExcerpt(bookExcerpt) {
  if (!bookExcerpt) {
    dom.bookExcerptText.textContent = "今天的书籍摘抄还在整理中。";
    dom.bookExcerptSource.textContent = "每日书摘";
    return;
  }

  dom.bookExcerptText.textContent = `“${bookExcerpt.text}”`;
  dom.bookExcerptSource.textContent = `${bookExcerpt.book} · ${bookExcerpt.author}`;
}

function renderFeaturedPlace(featuredPlaces, generatedAt) {
  if (featuredPlaceTimer) {
    clearInterval(featuredPlaceTimer);
    featuredPlaceTimer = null;
  }

  clearElement(dom.featuredPlacePanel);

  if (!featuredPlaces?.length) {
    dom.featuredPlacePanel.innerHTML = `
      <div class="empty-state neutral-state">
        <p>今天的世界风景还在路上。</p>
      </div>
    `;
    return;
  }

  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `
    <a class="featured-place-card" target="_blank" rel="noreferrer">
      <div class="featured-place-content">
        <span class="featured-place-tag" id="featuredPlaceRegion">--</span>
        <h3 id="featuredPlaceName">--</h3>
        <p class="featured-place-location" id="featuredPlaceLocation">--</p>
        <p class="featured-place-summary" id="featuredPlaceSummary">--</p>
        <div class="featured-place-footer">
          <span class="featured-place-rotation">每日更新 · 支持手动翻看</span>
          <div class="featured-place-dots" id="featuredPlaceDots"></div>
        </div>
      </div>
    </a>
    <button
      type="button"
      class="featured-place-arrow is-prev"
      id="featuredPlacePrev"
      aria-label="上一张风景"
    >
      ‹
    </button>
    <button
      type="button"
      class="featured-place-arrow is-next"
      id="featuredPlaceNext"
      aria-label="下一张风景"
    >
      ›
    </button>
  `;

  const card = dom.featuredPlacePanel.querySelector(".featured-place-card");
  const region = dom.featuredPlacePanel.querySelector("#featuredPlaceRegion");
  const name = dom.featuredPlacePanel.querySelector("#featuredPlaceName");
  const location = dom.featuredPlacePanel.querySelector("#featuredPlaceLocation");
  const summary = dom.featuredPlacePanel.querySelector("#featuredPlaceSummary");
  const dots = dom.featuredPlacePanel.querySelector("#featuredPlaceDots");
  const prevButton = dom.featuredPlacePanel.querySelector("#featuredPlacePrev");
  const nextButton = dom.featuredPlacePanel.querySelector("#featuredPlaceNext");
  let activeIndex = getFeaturedPlaceStartIndex(featuredPlaces, generatedAt);

  function renderDots(index) {
    dots.innerHTML = "";
    featuredPlaces.forEach((place, dotIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `featured-place-dot${dotIndex === index ? " is-active" : ""}`;
      button.setAttribute("aria-label", `查看 ${place.title}`);
      button.setAttribute("aria-pressed", String(dotIndex === index));
      button.dataset.index = String(dotIndex);
      dots.append(button);
    });
  }

  function renderSlide(index) {
    const place = featuredPlaces[index];
    card.href = place.link;
    card.style.backgroundImage = `linear-gradient(180deg, rgba(6, 16, 28, 0.08), rgba(6, 16, 28, 0.82)), url(${place.image})`;
    region.textContent = place.region;
    name.textContent = place.title;
    location.textContent = place.location;
    summary.textContent = place.summary;
    renderDots(index);
    card.classList.remove("is-entering");
    void card.offsetWidth;
    card.classList.add("is-entering");
  }

  function restartFeaturedPlaceTimer() {
    if (featuredPlaceTimer) {
      clearInterval(featuredPlaceTimer);
      featuredPlaceTimer = null;
    }

    if (featuredPlaces.length > 1) {
      featuredPlaceTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % featuredPlaces.length;
        renderSlide(activeIndex);
      }, 8000);
    }
  }

  renderSlide(activeIndex);
  dots.addEventListener("click", (event) => {
    const button = event.target.closest(".featured-place-dot");
    if (!button) {
      return;
    }

    activeIndex = Number(button.dataset.index ?? activeIndex);
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  prevButton?.addEventListener("click", () => {
    activeIndex = (activeIndex - 1 + featuredPlaces.length) % featuredPlaces.length;
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  nextButton?.addEventListener("click", () => {
    activeIndex = (activeIndex + 1) % featuredPlaces.length;
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  restartFeaturedPlaceTimer();
}

function loadNewsPageModule() {
  newsPageModulePromise ||= import("./src/pages/news/news-page.js");
  return newsPageModulePromise;
}

function loadNbaPageModule() {
  nbaPageModulePromise ||= import("./src/pages/nba/nba-page.js");
  return nbaPageModulePromise;
}

function loadPapersPageModule() {
  papersPageModulePromise ||= import("./src/pages/papers/papers-page.js");
  return papersPageModulePromise;
}

async function renderActiveSecondaryPage(data = latestBriefData) {
  if (!data) {
    return;
  }

  const activeView = document.body.dataset.activeView || "home";
  if (activeView === "news") {
    const { renderNewsPage } = await loadNewsPageModule();
    renderNewsPage(data.news);
    return;
  }

  if (activeView === "nba") {
    const { renderNbaPage, setupNbaScheduleNavigation } = await loadNbaPageModule();
    renderNbaPage(data.nbaScoreboard);
    if (!nbaScheduleNavigationReady) {
      setupNbaScheduleNavigation();
      nbaScheduleNavigationReady = true;
    }
    return;
  }

  if (activeView === "papers") {
    const { renderPapersPage } = await loadPapersPageModule();
    renderPapersPage(data.aiPapers);
  }
}

function renderPage(data) {
  latestBriefData = data;
  dom.generatedAt.textContent = `数据更新时间：${formatDateTime(data.generatedAt)}`;
  if (!refreshInFlight) {
    dom.refreshStatus.textContent = "可立即触发 GitHub Actions 更新数据";
  }
  renderBriefWeatherIfNeeded(data.weather);
  renderActiveSecondaryPage(data);
}

function renderError(message) {
  if (featuredPlaceTimer) {
    clearInterval(featuredPlaceTimer);
    featuredPlaceTimer = null;
  }

  dom.generatedAt.textContent = message;
  dom.refreshStatus.textContent = "暂时无法刷新数据";
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.classicQuoteCard.classList.remove("skeleton");
  dom.classicQuoteCard.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  clearElement(dom.weatherDaily);
  dom.historyTodayMeta.textContent = "今天";
  dom.historyTodayList.innerHTML = `<p>${message}</p>`;
  renderEmpty(dom.chinaTopNews);
  renderEmpty(dom.chinaSocietyNews);
  renderEmpty(dom.chinaFinanceNews);
  renderEmpty(dom.worldTopNews);
  renderEmpty(dom.worldBusinessNews);
  renderEmpty(dom.worldTechNews);
  clearElement(dom.nbaScoreboard);
  dom.nbaScoreboard.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
  renderEmpty(dom.nbaNews);
  renderEmpty(dom.paperHighlights);
}

function setRefreshButtonState(isLoading) {
  refreshInFlight = isLoading;
  dom.refreshDataButton.disabled = isLoading;
  dom.refreshDataButton.textContent = isLoading ? "载入中..." : "立即更新数据";
}

function setupRefreshControl() {
  dom.refreshDataButton.addEventListener("click", () => {
    if (refreshInFlight) {
      return;
    }

    dom.refreshStatus.textContent = "已打开 GitHub Actions，请点击 Run workflow 立即生成新数据";
    window.open(workflowUrl, "_blank", "noopener,noreferrer");
    loadBrief({ manual: true });
  });
}

async function loadBrief({ manual = false } = {}) {
  if (refreshInFlight) {
    return;
  }

  setRefreshButtonState(true);
  dom.refreshStatus.textContent = manual ? "正在拉取最新页面数据..." : "正在载入摘要...";

  try {
    const response = await fetch(buildDataUrl(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderPage(data);
  } catch (error) {
    if (manual) {
      dom.refreshStatus.textContent = `刷新失败：${error.message}`;
    } else {
      renderError(`读取每日摘要失败：${error.message}`);
    }
  } finally {
    setRefreshButtonState(false);
  }
}

function runAfterFirstPaint(callback, delay = 0) {
  window.requestAnimationFrame(() => {
    window.setTimeout(callback, delay);
  });
}

function runWhenIdle(callback, timeout = 2500) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, Math.min(timeout, 800));
}

function loadExternalModule(src) {
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.src = src;
  document.head.append(script);
}

function loadHomeDataAfterFirstPaint() {
  runAfterFirstPaint(() => {
    loadSelectedWeather();
  });

  runAfterFirstPaint(() => {
    loadStockWidget();
  }, 100);

  runAfterFirstPaint(() => {
    loadBilibiliWidget();
  }, 180);

  runWhenIdle(() => {
    loadBrief();
  }, 1800);

  runWhenIdle(() => {
    if (!isBrowserExtensionPage) {
      loadExternalModule("./assets/vendor/model-viewer/model-viewer.min.js");
    }
  }, 5000);
}

setupViewNavigation();
window.addEventListener("agent:viewchange", () => {
  renderActiveSecondaryPage();
});
setupHomeSearchAndShortcuts();
setupHomeAiChat();
setupHomeWallpaperToggle();
setupBilibiliWidget();
setupWeatherControls();
setupStockWidget();
setupChatDock();
setupChatInterface();
setupCyberPet();
setupRefreshControl();
setupCalendarNavigation();
renderClock();
setInterval(renderClock, 1000);
loadHomeDataAfterFirstPaint();
