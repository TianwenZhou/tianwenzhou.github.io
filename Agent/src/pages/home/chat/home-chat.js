import { fetchAgentJson } from "../../../shared/api-client.js";

const homeChatStorageKey = "agent-dashboard-home-ai-chat-history-v1";
const maxHomeChatMessages = 18;
const idleGreetingDelayMs = 90 * 1000;
const proactiveMinimumGapMs = 4 * 60 * 1000;
const reloadGreetingDelayMs = 1400;
const proactiveThemeStorageKey = "agent-dashboard-home-ai-proactive-theme-v1";

let dom = null;
let chatHistory = [];
let chatPending = false;
let chatTokenCurrent = 0;
let chatTokenTotal = 0;
let activeModelName = "DeepSeek";
let chatSessionId = "";
let idleTimer = 0;
let lastProactiveAt = 0;
let activityListenersAttached = false;

const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];

function getHomeChatDom() {
  return {
    root: document.querySelector("#homeAiChat"),
    status: document.querySelector("#homeAiChatStatus"),
    messages: document.querySelector("#homeAiChatMessages"),
    form: document.querySelector("#homeAiChatForm"),
    input: document.querySelector("#homeAiChatInput"),
    send: document.querySelector("#homeAiChatSend"),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeMessages(value) {
  return Array.isArray(value)
    ? value
        .filter((item) => item && typeof item.content === "string")
        .map((item) => ({
          role: item.role === "user" ? "user" : "assistant",
          content: item.content.trim(),
          label: String(item.label || ""),
        }))
        .filter((item) => item.content)
        .slice(-maxHomeChatMessages)
    : [];
}

function getConfiguredModelName() {
  return window.AGENT_CHAT_CONFIG?.modelName || "DeepSeek";
}

function createChatSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `home-chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTokenCount(value) {
  const count = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return count.toLocaleString("en-US");
}

function updateTokenStatus() {
  if (!dom?.status) {
    return;
  }

  dom.status.innerHTML = `
    <span class="home-ai-chat-status-model">${escapeHtml(activeModelName)}</span>
    <span class="home-ai-chat-status-usage">${formatTokenCount(chatTokenCurrent)} / ${formatTokenCount(chatTokenTotal)}</span>
  `;
}

function getPayloadTokenValue(payload, keys) {
  for (const key of keys) {
    const value = Number(payload?.[key]);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }
  return null;
}

function applyBackendTokenUsage(payload) {
  const requestTokens =
    getPayloadTokenValue(payload, ["requestTokens", "tokenCurrent", "tokenUsage"]) ??
    getPayloadTokenValue(payload?.usage, ["total_tokens", "totalTokens", "total"]);
  const tokenTotal = Number(payload?.tokenTotal ?? payload?.token_total ?? payload?.tokens ?? 0);
  if (requestTokens !== null) {
    chatTokenCurrent = requestTokens;
  }
  if (Number.isFinite(tokenTotal) && tokenTotal >= 0) {
    chatTokenTotal = tokenTotal;
  }
}

async function loadBackendTokenUsage() {
  try {
    const payload = await fetchAgentJson("/api/chat/usage", { timeoutMs: 5000 });
    if (payload?.model) {
      activeModelName = payload.model;
    }
    applyBackendTokenUsage(payload);
    updateTokenStatus();
  } catch {
    updateTokenStatus();
  }
}

function loadHistory() {
  try {
    window.localStorage.removeItem(homeChatStorageKey);
  } catch {
    // Old persisted conversations are intentionally discarded on each page load.
  }
  return [];
}

function saveHistory() {
  // Keep chat history in memory only. A hard refresh starts a fresh conversation.
}

function textOf(selector) {
  return document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function collectList(selector, limit = 6) {
  return Array.from(document.querySelectorAll(selector))
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function collectBilibiliVideos() {
  return Array.from(document.querySelectorAll(".bilibili-video-card"))
    .slice(0, 3)
    .map((card, index) => ({
      title: card.querySelector("strong")?.textContent?.trim() || "",
      up: card.querySelector(".bilibili-up-name span")?.textContent?.trim() || "",
      time: card.querySelector(".bilibili-video-time")?.textContent?.trim() || "",
      url: card.getAttribute("href") || "",
      position:
        index === 0
          ? "Bilibili 组件左侧大卡片"
          : index === 1
            ? "Bilibili 组件右上小卡片"
            : "Bilibili 组件右下小卡片",
    }))
    .filter((item) => item.title);
}

function getNextProactiveTheme(context) {
  const videos = Array.isArray(context?.bilibili?.videos) ? context.bilibili.videos : [];
  const candidates = [
    "quiet",
    videos.length ? "video" : "",
    context?.market?.price ? "market" : "",
    context?.search?.engine ? "search" : "",
    context?.weather?.temperature ? "weather" : "",
    "layout",
  ].filter(Boolean);

  let previousIndex = -1;
  try {
    previousIndex = Number(window.localStorage.getItem(proactiveThemeStorageKey));
  } catch {
    previousIndex = -1;
  }

  const nextIndex = Number.isFinite(previousIndex) ? (previousIndex + 1) % candidates.length : 0;
  try {
    window.localStorage.setItem(proactiveThemeStorageKey, String(nextIndex));
  } catch {
    // Theme rotation is only a lightweight diversity hint.
  }

  return candidates[nextIndex] || "quiet";
}

function collectHomeContext() {
  const stockChange = document.querySelector(".stock-change");
  const searchEngine = document.querySelector("#searchEngineButton")?.getAttribute("title") || "";
  const weatherCurrent = document.querySelector("#weatherCurrent");
  return {
    time: textOf("#currentTime"),
    locale: navigator.language || "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    search: {
      engine: searchEngine,
      input: document.querySelector("#homeSearchInput")?.value?.trim() || "",
    },
    weather: {
      location: weatherCurrent?.dataset?.locationLabel || textOf("#weatherTitle") || textOf("#weatherLocation"),
      latitude: weatherCurrent?.dataset?.latitude || "",
      longitude: weatherCurrent?.dataset?.longitude || "",
      observedAt: weatherCurrent?.dataset?.observedAt || "",
      condition: textOf("#weatherCondition"),
      temperature: textOf("#weatherTemperature"),
      humidity: textOf("#weatherHumidity"),
      aqi: textOf("#weatherAirQuality"),
      feelsLike: textOf("#weatherFeelsLike"),
      metrics: collectList("#weatherMetrics > *", 6),
    },
    market: {
      name: textOf("#stockTitle"),
      symbol: textOf("#stockSymbolLabel"),
      price: textOf("#stockHeaderPrice"),
      change: stockChange?.dataset?.stockDefaultReadout || stockChange?.textContent?.trim() || "",
      interval: textOf("#stockIntervalLabel"),
    },
    bilibili: {
      category: textOf("#bilibiliWidgetTitle"),
      videos: collectBilibiliVideos(),
    },
    layout: {
      summary:
        "Home 页面中间是时间、搜索和快捷方式；Bilibili 推荐组件在下方偏左；AI Chat 在下方中间；天气和 MARKET 在右侧独立浮动组件中。",
      bilibili:
        "Bilibili 组件内部是左侧一张大卡片，右侧上下两张小卡片。只有描述组件内部卡片时才说右上/右下，不要把整个 Bilibili 组件说成在右边。",
    },
  };
}

function getReplyFromPayload(payload) {
  return (
    payload?.reply ||
    payload?.message ||
    payload?.content ||
    payload?.choices?.[0]?.message?.content ||
    ""
  ).trim();
}

function isNegativeMarket(changeText) {
  return /-\s*\d|下跌|跌/.test(String(changeText || ""));
}

function isBadWeather(conditionText) {
  return /雨|雪|雷|雾|霾|沙|阴|毛毛雨/.test(String(conditionText || ""));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildLocalReply(messageText, context) {
  const pieces = [];
  const message = String(messageText || "");
  const firstVideo = context.bilibili.videos[0];

  if (/股票|market|MARKET|跌|涨|比亚迪|黄金|白银|k线|K线/i.test(message)) {
    const marketMood = isNegativeMarket(context.market.change)
      ? "MARKET 现在有点低头走路，先别急着和 K 线互相伤害。"
      : "MARKET 现在看起来还算有精神，像是刚喝完一口热茶。";
    pieces.push(`${marketMood} ${context.market.name || "当前标的"} ${context.market.price || ""}，${context.market.change || "涨跌幅暂时没读到"}。`);
  }

  if (/天气|温度|出门|雨|冷|热|AQI|空气/i.test(message)) {
    const weatherMood = isBadWeather(context.weather.condition)
      ? "天气这边有点不太给面子，出门最好留点余量。"
      : "天气这边还算体面，可以把心情从省电模式切出来一点。";
    pieces.push(`${weatherMood} ${context.weather.location || "当前位置"} ${context.weather.condition || ""}，${context.weather.temperature || ""}，${context.weather.aqi || ""}。`);
  }

  if (/视频|B站|bilibili|电影|解说|推荐|看什么/i.test(message)) {
    if (firstVideo) {
      pieces.push(`视频我会先看《${firstVideo.title}》，UP 是 ${firstVideo.up || "未知"}。如果你想放松，它比盲刷首页更像一个有方向的入口。`);
    } else {
      pieces.push("当前 Bilibili 推荐还没完全加载出来，我可以等它刷新后再帮你挑。");
    }
  }

  if (!pieces.length) {
    pieces.push("我已经读到当前页面状态了，可以陪你看天气、MARKET、Bilibili 推荐，也能顺手帮你把搜索意图整理一下。");
  }

  return pieces.slice(0, 3).join("\n");
}

function buildProactiveReply(context, reason) {
  const firstVideo = context.bilibili.videos[0];
  const candidates = [
    reason === "reload"
      ? `刷新好了。现在 ${context.time || "时间刚好"}，我先看一眼天气和行情，有情况就提醒你。`
      : "刚刚页面安静了一会儿，我顺手看了看状态。",
    "天气、MARKET 和视频推荐都在这边，我可以直接结合当前页面帮你判断。",
  ];

  if (context.weather.condition && context.weather.temperature) {
    const weatherLine = isBadWeather(context.weather.condition)
      ? `天气这边是 ${context.weather.condition}，${context.weather.temperature}。如果要出门，我会建议稍微保守一点。`
      : `天气读到 ${context.weather.condition}，${context.weather.temperature}。这页现在看起来挺适合慢慢处理事情。`;
    candidates.push(weatherLine);
  }

  if (context.market.name && context.market.price) {
    const marketLine = isNegativeMarket(context.market.change)
      ? `${context.market.name} 现在 ${context.market.price}，${context.market.change || "走势偏弱"}。我先帮它盖一条小毯子。`
      : `${context.market.name} 现在 ${context.market.price}，${context.market.change || "走势还算稳"}。它今天看起来没有太摆烂。`;
    candidates.push(marketLine);
  }

  if (firstVideo) {
    candidates.push(`顺手看到一个视频：《${firstVideo.title}》。要是你想换脑子，我觉得它可以先进候选席。`);
  }

  if (Math.random() < 0.22) {
    return pickRandom(candidates.slice(0, 2));
  }
  return pickRandom(candidates);
}

function renderMessage(message) {
  const label = "";
  return `
    <article class="home-ai-message is-${message.role}">
      <div class="home-ai-bubble">
        <p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>
        ${label ? `<span>${escapeHtml(label)}</span>` : ""}
      </div>
    </article>
  `;
}

function renderMessages() {
  if (!dom?.messages) {
    return;
  }

  dom.messages.innerHTML = chatHistory.map(renderMessage).join("");
  dom.messages.scrollTop = dom.messages.scrollHeight;
}

function pushAssistantMessage(content, label = "AI") {
  const trimmed = String(content || "").trim();
  if (!trimmed) {
    return;
  }

  chatHistory.push({ role: "assistant", content: trimmed, label });
  chatHistory = chatHistory.slice(-maxHomeChatMessages);
  saveHistory();
  renderMessages();
}

function setPending(isPending) {
  chatPending = isPending;
  if (dom.send) {
    dom.send.disabled = isPending;
    dom.send.textContent = isPending ? "发送中" : "发送";
  }
  if (dom.input) {
    dom.input.disabled = isPending;
  }
  if (dom.status && isPending) {
    updateTokenStatus();
  }
}

async function requestAiReply(messageText, context) {
  const messages = chatHistory.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const payload = await fetchAgentJson("/api/chat", {
    method: "POST",
    body: { messages, context, sessionId: chatSessionId },
    timeoutMs: 22000,
  });
  const reply = getReplyFromPayload(payload);
  if (!reply) {
    throw new Error("empty reply");
  }

  return {
    content: reply,
    label: payload.assistantName || "AI",
    model: payload.model || "",
    requestTokens: payload.requestTokens,
    tokenTotal: payload.tokenTotal,
  };
}

async function requestAiProactiveGreeting(reason, context) {
  const theme = getNextProactiveTheme(context);
  const proactivePrompt =
    reason === "reload"
      ? `页面刚刷新完成。请用“${theme}”作为这次主动招呼的主视角，写一句自然、有一点活人感的话。不要每次都讲天气；如果主题不是 weather，就不要以天气开头。不要说明你读取了接口，不要写成操作说明。`
      : `用户安静了一会儿。请用“${theme}”作为这次主动开口的主视角，写一句轻松自然的话。不要每次都讲天气，也不要打扰感太强。`;
  const proactiveContext = {
    ...context,
    aiRequest: {
      reason,
      theme,
      instruction:
        "主动招呼需要轮换主题；提到页面位置必须遵守 layout 信息，Bilibili 在下方偏左，天气和 MARKET 在右侧。",
    },
  };
  const payload = await fetchAgentJson("/api/chat", {
    method: "POST",
    body: {
      messages: [{ role: "user", content: proactivePrompt }],
      context: proactiveContext,
      sessionId: chatSessionId,
      event: reason,
    },
    timeoutMs: 22000,
  });
  const reply = getReplyFromPayload(payload);
  if (!reply) {
    throw new Error("empty reply");
  }
  return {
    content: reply,
    model: payload.model || "",
    requestTokens: payload.requestTokens,
    tokenTotal: payload.tokenTotal,
  };
}

async function sendHomeChatMessage(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed || chatPending) {
    return;
  }

  const context = collectHomeContext();
  chatHistory.push({ role: "user", content: trimmed });
  chatHistory = chatHistory.slice(-maxHomeChatMessages);
  saveHistory();
  renderMessages();
  if (dom.input) {
    dom.input.value = "";
  }
  setPending(true);

  try {
    const reply = await requestAiReply(trimmed, context);
    if (reply.model) {
      activeModelName = reply.model;
    }
    applyBackendTokenUsage(reply);
    pushAssistantMessage(reply.content, reply.label);
    updateTokenStatus();
  } catch (error) {
    pushAssistantMessage(`${buildLocalReply(trimmed, context)}\n\nAI 后端还没有接通，我先用本地兜底陪你回一句。`, "Local");
    updateTokenStatus();
  } finally {
    setPending(false);
  }
}

function emitProactiveMessage(reason, { force = false } = {}) {
  if (!dom?.root || chatPending) {
    return;
  }

  const now = Date.now();
  if (!force && now - lastProactiveAt < proactiveMinimumGapMs) {
    return;
  }

  const context = collectHomeContext();
  const content = buildProactiveReply(context, reason);
  lastProactiveAt = now;
  pushAssistantMessage(content, "AI");
}

async function emitAiProactiveMessage(reason, { force = false } = {}) {
  if (!dom?.root || chatPending) {
    return;
  }

  const now = Date.now();
  if (!force && now - lastProactiveAt < proactiveMinimumGapMs) {
    return;
  }

  const context = collectHomeContext();
  lastProactiveAt = now;
  try {
    const reply = await requestAiProactiveGreeting(reason, context);
    if (reply.model) {
      activeModelName = reply.model;
    }
    applyBackendTokenUsage(reply);
    pushAssistantMessage(reply.content, "AI");
    updateTokenStatus();
  } catch {
    pushAssistantMessage(buildProactiveReply(context, reason), "AI");
    updateTokenStatus();
  }
}

function resetIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    emitAiProactiveMessage("idle");
    resetIdleTimer();
  }, idleGreetingDelayMs);
}

function handleActivity() {
  resetIdleTimer();
}

function attachActivityListeners() {
  if (activityListenersAttached) {
    activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, handleActivity, { capture: true });
    });
  }

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, handleActivity, { capture: true, passive: true });
  });
  activityListenersAttached = true;
  resetIdleTimer();
}

export function setupHomeAiChat() {
  dom = getHomeChatDom();
  if (!dom.root || !dom.form || !dom.messages) {
    return;
  }

  chatTokenCurrent = 0;
  chatTokenTotal = 0;
  activeModelName = getConfiguredModelName();
  chatSessionId = createChatSessionId();
  chatHistory = loadHistory();

  renderMessages();
  setPending(false);
  updateTokenStatus();
  loadBackendTokenUsage();

  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendHomeChatMessage(dom.input?.value);
    resetIdleTimer();
  });

  attachActivityListeners();
  window.setTimeout(() => {
    emitAiProactiveMessage("reload", { force: true });
  }, reloadGreetingDelayMs);
}
