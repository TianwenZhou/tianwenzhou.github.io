const stockSelectionStorageKey = "agent-dashboard-active-stock-v1";
const stockCustomStorageKey = "agent-dashboard-custom-stocks-v1";
const stockHiddenStorageKey = "agent-dashboard-hidden-stocks-v1";
const stockNameCacheUrl = "./data/stocks/a-share-code-name.json";
const stockDefaultKey = "byd";

const stockFallbackProfile = {
  symbol: "002594",
  code: "002594.SZ",
  name: "比亚迪",
  exchange: "SZSE",
  currency: "CNY",
};

const stockEmptyProfile = {
  symbol: "",
  code: "--",
  name: "添加股票",
  exchange: "",
  currency: "CNY",
};

const stockCatalog = [
  {
    key: "byd",
    label: "比亚迪",
    dataUrl: "./data/stocks/byd.json",
    demoPrice: 248.6,
    profile: stockFallbackProfile,
  },
  {
    key: "moutai",
    label: "贵州茅台",
    dataUrl: "./data/stocks/moutai.json",
    demoPrice: 1460,
    profile: { symbol: "600519", code: "600519.SH", name: "贵州茅台", exchange: "SSE", currency: "CNY" },
  },
  {
    key: "catl",
    label: "宁德时代",
    dataUrl: "./data/stocks/catl.json",
    demoPrice: 230,
    profile: { symbol: "300750", code: "300750.SZ", name: "宁德时代", exchange: "SZSE", currency: "CNY" },
  },
  {
    key: "pingan",
    label: "中国平安",
    dataUrl: "./data/stocks/pingan.json",
    demoPrice: 48,
    profile: { symbol: "601318", code: "601318.SH", name: "中国平安", exchange: "SSE", currency: "CNY" },
  },
];

const stockCandlePointCount = 60;

export const stockIntervals = [
  { key: "1m", label: "1分K", points: stockCandlePointCount, minutes: 1, volatility: 0.2 },
  { key: "5m", label: "5分K", points: stockCandlePointCount, minutes: 5, volatility: 0.34 },
  { key: "15m", label: "15分K", points: stockCandlePointCount, minutes: 15, volatility: 0.42 },
  { key: "30m", label: "30分K", points: stockCandlePointCount, minutes: 30, volatility: 0.52 },
  { key: "60m", label: "60分K", points: stockCandlePointCount, minutes: 60, volatility: 0.62 },
  { key: "1d", label: "日K", points: stockCandlePointCount, minutes: 1440, volatility: 1.08 },
  { key: "1w", label: "周K", points: stockCandlePointCount, minutes: 10080, volatility: 1.4 },
  { key: "1mo", label: "月K", points: stockCandlePointCount, minutes: 43200, volatility: 1.8 },
];

let activeStockInterval = "1m";
let activeStockKey = getInitialStockKey();
let stockDataState = createEmptyStockDataState(getActiveStockConfig()?.profile ?? stockEmptyProfile);
let stockRefreshResetTimer = null;
let stockNameCachePromise = null;

function inferStockExchange(symbol) {
  return String(symbol).startsWith("6") ? "SSE" : "SZSE";
}

function inferStockCode(symbol, exchange = inferStockExchange(symbol)) {
  return `${symbol}.${exchange === "SSE" ? "SH" : "SZ"}`;
}

function normalizeStockSymbol(value) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/(\d{6})/);
  return match ? match[1] : "";
}

function normalizeStockProfile(profile) {
  const symbol = normalizeStockSymbol(profile?.symbol ?? profile?.code);
  if (!symbol) {
    return null;
  }

  const exchange = profile?.exchange === "SSE" || /\.SH$/i.test(String(profile?.code || "")) ? "SSE" : inferStockExchange(symbol);
  const code = profile?.code || inferStockCode(symbol, exchange);
  const name = String(profile?.name || profile?.label || code).trim().slice(0, 18) || code;
  return {
    symbol,
    name,
    code,
    exchange,
    currency: "CNY",
  };
}

function isStockNamePlaceholder(profile) {
  const name = String(profile?.name || "").trim();
  const symbol = normalizeStockSymbol(profile?.symbol ?? profile?.code);
  if (!name || !symbol) {
    return true;
  }

  return name === symbol || name.toUpperCase() === inferStockCode(symbol).toUpperCase() || normalizeStockSymbol(name) === symbol;
}

function getCustomStockKey(symbol) {
  return `custom-${symbol}`;
}

function getCustomStockDataUrl(symbol) {
  return `./data/stocks/custom-${symbol}.json`;
}

function normalizeCustomStock(item) {
  const symbol = normalizeStockSymbol(item?.symbol ?? item?.code);
  if (!symbol) {
    return null;
  }

  const exchange = item?.exchange === "SSE" || /\.SH$/i.test(String(item?.code || "")) ? "SSE" : inferStockExchange(symbol);
  const code = inferStockCode(symbol, exchange);
  const name = String(item?.name || item?.label || code).trim().slice(0, 18) || code;

  return {
    key: getCustomStockKey(symbol),
    label: name,
    dataUrl: getCustomStockDataUrl(symbol),
    demoPrice: Number(item?.demoPrice) || 100,
    isCustom: true,
    profile: {
      symbol,
      code,
      name,
      exchange,
      currency: "CNY",
    },
  };
}

function loadCustomStocks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(stockCustomStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeCustomStock).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveCustomStocks(stocks) {
  try {
    const payload = stocks.map((stock) => stock.profile);
    window.localStorage.setItem(stockCustomStorageKey, JSON.stringify(payload));
  } catch {
    // The built-in stock list remains available when storage is blocked.
  }
}

function saveOrReplaceCustomStock(stock) {
  const normalizedStock = normalizeCustomStock(stock?.profile ?? stock);
  if (!normalizedStock) {
    return null;
  }

  const nextStocks = loadCustomStocks().filter((item) => item.profile.symbol !== normalizedStock.profile.symbol);
  saveCustomStocks([...nextStocks, normalizedStock]);
  return normalizedStock;
}

async function resolveStockProfile(symbol) {
  const builtInStock = stockCatalog.find((stock) => stock.profile.symbol === symbol);
  if (builtInStock && !isStockNamePlaceholder(builtInStock.profile)) {
    return builtInStock.profile;
  }

  return lookupStockProfile(symbol);
}

async function repairStoredStockNames() {
  const customStocks = loadCustomStocks();
  const brokenStocks = customStocks.filter((stock) => isStockNamePlaceholder(stock.profile));
  if (!brokenStocks.length) {
    return;
  }

  const repairedStocks = [...customStocks];
  let changed = false;
  for (const stock of brokenStocks) {
    const profile = await resolveStockProfile(stock.profile.symbol);
    const repairedStock = normalizeCustomStock({
      ...stock.profile,
      ...profile,
      symbol: stock.profile.symbol,
    });
    if (repairedStock && !isStockNamePlaceholder(repairedStock.profile)) {
      const index = repairedStocks.findIndex((item) => item.profile.symbol === stock.profile.symbol);
      if (index >= 0) {
        repairedStocks[index] = repairedStock;
        changed = true;
      }
    }
  }

  if (changed) {
    saveCustomStocks(repairedStocks);
    stockDataState = createEmptyStockDataState(getActiveStockConfig()?.profile ?? stockEmptyProfile);
    renderStockWidget();
  }
}

function loadHiddenStockKeys() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(stockHiddenStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveHiddenStockKeys(keys) {
  try {
    window.localStorage.setItem(stockHiddenStorageKey, JSON.stringify([...new Set(keys)]));
  } catch {
    // Built-in stocks remain visible when storage is blocked.
  }
}

function getStockCatalog() {
  const hiddenKeys = new Set(loadHiddenStockKeys());
  const builtInStocks = stockCatalog.filter((stock) => !hiddenKeys.has(stock.key));
  const seen = new Set(builtInStocks.map((stock) => stock.profile.symbol));
  const customStocks = loadCustomStocks().filter((stock) => {
    if (seen.has(stock.profile.symbol)) {
      return false;
    }
    seen.add(stock.profile.symbol);
    return true;
  });
  return [...builtInStocks, ...customStocks];
}

function getInitialStockKey() {
  try {
    const storedKey = window.localStorage.getItem(stockSelectionStorageKey);
    const catalog = getStockCatalog();
    return catalog.some((stock) => stock.key === storedKey) ? storedKey : catalog[0]?.key ?? "";
  } catch {
    return stockDefaultKey;
  }
}

function persistActiveStockKey() {
  try {
    if (activeStockKey) {
      window.localStorage.setItem(stockSelectionStorageKey, activeStockKey);
      return;
    }

    window.localStorage.removeItem(stockSelectionStorageKey);
  } catch {
    // The stock picker still works when storage is unavailable.
  }
}

function getActiveStockConfig() {
  const catalog = getStockCatalog();
  return catalog.find((stock) => stock.key === activeStockKey) ?? catalog[0] ?? null;
}

function getStockRefreshUrl(stockConfig) {
  return `./api/stocks/${encodeURIComponent(stockConfig.key)}/refresh`;
}

async function requestStockDataRefresh(stockConfig) {
  const response = await fetch(`${getStockRefreshUrl(stockConfig)}?ts=${Date.now()}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stock: {
        symbol: stockConfig.profile.symbol,
        name: stockConfig.profile.name,
        code: stockConfig.profile.code,
        exchange: stockConfig.profile.exchange,
      },
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  return payload.data ?? null;
}

async function lookupStockProfile(symbol) {
  const fallbackExchange = inferStockExchange(symbol);
  const fallbackCode = inferStockCode(symbol, fallbackExchange);
  const fallbackProfile = {
    symbol,
    code: fallbackCode,
    exchange: fallbackExchange,
    name: fallbackCode,
    currency: "CNY",
  };
  const cachedProfile = await lookupStockProfileFromLocalCache(symbol);
  if (cachedProfile) {
    return cachedProfile;
  }

  try {
    const response = await fetch(`./api/stocks/lookup?symbol=${encodeURIComponent(symbol)}&ts=${Date.now()}`, {
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload?.stock) {
      return fallbackProfile;
    }

    return {
      ...fallbackProfile,
      ...payload.stock,
      symbol,
      currency: "CNY",
    };
  } catch {
    return fallbackProfile;
  }
}

function loadStockNameCache() {
  if (!stockNameCachePromise) {
    stockNameCachePromise = fetch(`${stockNameCacheUrl}?ts=${Date.now()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }

  return stockNameCachePromise;
}

async function lookupStockProfileFromLocalCache(symbol) {
  const cache = await loadStockNameCache();
  const stockMap = cache?.stocks;
  if (!stockMap || typeof stockMap !== "object") {
    return null;
  }

  return normalizeStockProfile(stockMap[symbol]);
}

function createEmptyStockDataState(profile = stockFallbackProfile) {
  return {
    profile,
    source: "Demo",
    generatedAt: null,
    quote: {},
    intervals: {},
    hasLiveData: false,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hashString(value) {
  return Array.from(String(value)).reduce((hash, char) => {
    const next = (hash << 5) - hash + char.charCodeAt(0);
    return next >>> 0;
  }, 0);
}

function formatStockPrice(value) {
  const profile = getActiveStockProfile();
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: profile.currency || stockFallbackProfile.currency,
        maximumFractionDigits: 2,
      }).format(value)
    : "--";
}

function formatStockChange(value, percent) {
  if (!Number.isFinite(value) || !Number.isFinite(percent)) {
    return "--";
  }

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} / ${sign}${percent.toFixed(2)}%`;
}

function getStockIntervalConfig(intervalKey = activeStockInterval) {
  return stockIntervals.find((item) => item.key === intervalKey) ?? stockIntervals[0];
}

function getActiveStockProfile() {
  const activeConfig = getActiveStockConfig();
  return stockDataState?.profile ?? activeConfig?.profile ?? stockEmptyProfile;
}

function formatStockCandleTime(date, interval) {
  if (interval.minutes >= 1440) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatStockAxisTime(candle, interval) {
  if (!candle?.time) {
    return "--";
  }

  if (interval.key === "1w" || interval.key === "1mo") {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(candle.time);
  }

  if (interval.minutes >= 1440) {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    }).format(candle.time);
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(candle.time);
}

function buildStockDemoCandles(intervalKey = activeStockInterval) {
  const interval = getStockIntervalConfig(intervalKey);
  const profile = getActiveStockProfile();
  const seed = hashString(`${profile.symbol}-${interval.key}`);
  const now = new Date();
  let previousClose = 245 + (seed % 120) / 10;

  const candles = Array.from({ length: interval.points }, (_, index) => {
    const reverseIndex = interval.points - 1 - index;
    const time = new Date(now.getTime() - reverseIndex * interval.minutes * 60 * 1000);
    const wave = Math.sin((index + (seed % 11)) * 0.62) * interval.volatility;
    const pulse = Math.cos((index + (seed % 7)) * 0.31) * interval.volatility * 0.52;
    const drift = (index - interval.points / 2) * interval.volatility * 0.018;
    const open = previousClose;
    const close = Math.max(1, open + wave + pulse + drift);
    const wickTop = Math.abs(Math.sin(index * 0.83 + seed)) * interval.volatility * 0.95 + 0.08;
    const wickBottom = Math.abs(Math.cos(index * 0.71 + seed)) * interval.volatility * 0.85 + 0.08;
    const candle = {
      time,
      label: formatStockCandleTime(time, interval),
      open,
      close,
      high: Math.max(open, close) + wickTop,
      low: Math.min(open, close) - wickBottom,
    };

    previousClose = close;
    return candle;
  });
  const anchorPrice = getStockAnchorPrice();
  const lastClose = candles.at(-1)?.close;
  const offset = Number.isFinite(anchorPrice) && Number.isFinite(lastClose) ? anchorPrice - lastClose : 0;

  return candles.map((candle) => ({
    ...candle,
    open: candle.open + offset,
    close: candle.close + offset,
    high: candle.high + offset,
    low: candle.low + offset,
  }));
}

function normalizeStockCandle(item, interval) {
  const time = new Date(item?.time);
  const open = Number(item?.open);
  const high = Number(item?.high);
  const low = Number(item?.low);
  const close = Number(item?.close);

  if (
    Number.isNaN(time.getTime()) ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null;
  }

  return {
    time,
    label: formatStockCandleTime(time, interval),
    open,
    high,
    low,
    close,
  };
}

function getStockSourceCandles(intervalKey) {
  const interval = getStockIntervalConfig(intervalKey);
  const sourceCandles = stockDataState?.intervals?.[interval.key];
  return Array.isArray(sourceCandles)
    ? sourceCandles
        .map((item) => normalizeStockCandle(item, interval))
        .filter(Boolean)
        .sort((a, b) => a.time.getTime() - b.time.getTime())
    : [];
}

function getLatestLiveStockCandle() {
  return (
    stockIntervals
      .flatMap((interval) => getStockSourceCandles(interval.key).map((candle) => ({ ...candle, intervalKey: interval.key })))
      .sort((a, b) => b.time.getTime() - a.time.getTime())[0] ?? null
  );
}

function getMostRecentLiveStockCandles() {
  const candidates = stockIntervals
    .map((interval) => ({
      interval,
      candles: getStockSourceCandles(interval.key),
    }))
    .filter((item) => item.candles.length >= 2)
    .sort((a, b) => b.candles.at(-1).time.getTime() - a.candles.at(-1).time.getTime());

  return candidates[0]?.candles ?? [];
}

function getStockAnchorPrice() {
  const quote = stockDataState?.quote ?? {};
  const quotePrice = Number(quote.price ?? quote.close ?? quote.latest);
  if (Number.isFinite(quotePrice)) {
    return quotePrice;
  }

  return getLatestLiveStockCandle()?.close ?? getActiveStockConfig()?.demoPrice ?? 248.6;
}

function aggregateStockCandles(sourceCandles, interval) {
  if (!sourceCandles.length || interval.minutes < 2) {
    return [];
  }

  const bucketSize = interval.minutes * 60 * 1000;
  const buckets = new Map();
  sourceCandles.forEach((candle) => {
    const bucketTime = Math.floor(candle.time.getTime() / bucketSize) * bucketSize;
    const bucket = buckets.get(bucketTime);
    if (!bucket) {
      buckets.set(bucketTime, {
        time: new Date(bucketTime),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      });
      return;
    }

    bucket.high = Math.max(bucket.high, candle.high);
    bucket.low = Math.min(bucket.low, candle.low);
    bucket.close = candle.close;
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .map((candle) => ({
      ...candle,
      label: formatStockCandleTime(candle.time, interval),
    }));
}

function getAggregatedStockCandles(interval) {
  if (interval.minutes > 60) {
    return [];
  }

  const source = getStockSourceCandles("1m");
  return source.length >= 2 ? aggregateStockCandles(source, interval) : [];
}

function getStockQuoteSnapshot(fallbackCandles = []) {
  const quote = stockDataState?.quote ?? {};
  const quotePrice = Number(quote.price ?? quote.close ?? quote.latest);
  const quoteChange = Number(quote.change);
  const quotePercent = Number(quote.percent ?? quote.changePercent);

  if (Number.isFinite(quotePrice)) {
    return {
      price: quotePrice,
      change: Number.isFinite(quoteChange) ? quoteChange : NaN,
      percent: Number.isFinite(quotePercent) ? quotePercent : NaN,
    };
  }

  const candles = getMostRecentLiveStockCandles().length ? getMostRecentLiveStockCandles() : fallbackCandles;
  const latest = candles.at(-1);
  const first = candles[0];
  const change = latest && first ? latest.close - first.open : NaN;
  const percent = first?.open ? (change / first.open) * 100 : NaN;

  return {
    price: latest?.close ?? NaN,
    change,
    percent,
  };
}

function getStockCandles(intervalKey = activeStockInterval) {
  const interval = getStockIntervalConfig(intervalKey);
  const candles = getStockSourceCandles(interval.key);
  if (candles.length >= interval.points) {
    return candles.slice(-interval.points);
  }

  const aggregated = getAggregatedStockCandles(interval);
  if (aggregated.length >= interval.points) {
    return aggregated.slice(-interval.points);
  }

  return buildStockDemoCandles(interval.key);
}

function mapStockPriceToY(value, min, max, top, height) {
  const range = Math.max(max - min, 0.01);
  return top + (1 - (value - min) / range) * height;
}

function getStockDom() {
  return {
    kicker: document.querySelector("#stockKicker"),
    title: document.querySelector("#stockTitle"),
    symbolLabel: document.querySelector("#stockSymbolLabel"),
    headerPrice: document.querySelector("#stockHeaderPrice"),
    refreshButton: document.querySelector("#stockRefreshButton"),
    pickerButton: document.querySelector("#stockPickerButton"),
    pickerMenu: document.querySelector("#stockPickerMenu"),
    pickerOptions: Array.from(document.querySelectorAll("[data-stock-symbol]")),
    intervalButton: document.querySelector("#stockIntervalButton"),
    intervalLabel: document.querySelector("#stockIntervalLabel"),
    intervalControls: document.querySelector("#stockIntervalControls"),
    intervalButtons: Array.from(document.querySelectorAll("[data-stock-interval]")),
    chart: document.querySelector("#stockChart"),
  };
}

export function renderStockIntervalMenu() {
  return stockIntervals
    .map(
      (interval, index) =>
        `<button type="button" class="stock-interval-option ${index === 0 ? "is-active" : ""}" role="menuitemradio" data-stock-interval="${interval.key}">${interval.label}</button>`,
    )
    .join("");
}

export function renderStockPickerMenu() {
  const stocks = getStockCatalog();
  const stockOptions = stocks.length
    ? stocks
        .map(
          (stock) => `
        <div class="stock-picker-row">
          <button
            type="button"
            class="stock-picker-option${stock.key === activeStockKey ? " is-active" : ""}"
            role="menuitemradio"
            data-stock-symbol="${stock.key}"
          >
            <strong>${escapeHtml(stock.profile.name)}</strong>
            <span>${escapeHtml(stock.profile.code)}</span>
          </button>
          <button class="stock-picker-delete" type="button" data-stock-delete="${escapeHtml(stock.key)}" aria-label="删除${escapeHtml(stock.profile.name)}">×</button>
        </div>
      `,
        )
        .join("")
    : `<div class="stock-picker-empty">暂无股票</div>`;

  return `
    <div class="stock-picker-list">${stockOptions}</div>
    <form id="stockCustomForm" class="stock-custom-form">
      <input id="stockCustomCode" name="code" inputmode="text" autocomplete="off" placeholder="股票代码" />
      <button type="submit">添加</button>
    </form>
  `;
}

function renderStockWidget() {
  const dom = getStockDom();
  if (!dom.chart) {
    return;
  }

  const activeConfig = getActiveStockConfig();
  const interval = getStockIntervalConfig();
  const candles = activeConfig ? getStockCandles(interval.key) : [];
  const profile = getActiveStockProfile();
  const quote = activeConfig ? getStockQuoteSnapshot(candles) : { price: NaN, change: NaN, percent: NaN };
  const state = Number.isFinite(quote.change) ? (quote.change >= 0 ? "up" : "down") : "neutral";

  if (dom.kicker) {
    dom.kicker.textContent = "MARKET";
  }
  dom.title.textContent = profile.name || profile.symbol || stockFallbackProfile.name;
  dom.symbolLabel.textContent = activeConfig
    ? `${profile.code || profile.symbol} · ${profile.exchange || stockFallbackProfile.exchange}`
    : "--";
  if (dom.headerPrice) {
    dom.headerPrice.textContent = formatStockPrice(quote.price);
  }
  if (dom.intervalLabel) {
    dom.intervalLabel.textContent = interval.label;
  }
  if (dom.pickerMenu) {
    dom.pickerMenu.innerHTML = renderStockPickerMenu();
  }
  dom.pickerOptions = Array.from(document.querySelectorAll("[data-stock-symbol]"));
  dom.pickerOptions.forEach((button) => {
    const isActive = button.dataset.stockSymbol === activeStockKey;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-checked", isActive ? "true" : "false");
  });
  dom.intervalButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stockInterval === interval.key);
    button.setAttribute("aria-checked", button.dataset.stockInterval === interval.key ? "true" : "false");
  });

  if (!candles.length) {
    dom.chart.innerHTML = `
      <div class="stock-chart-empty">添加股票后刷新数据</div>
    `;
    return;
  }

  const rawMin = Math.min(...candles.map((candle) => candle.low));
  const rawMax = Math.max(...candles.map((candle) => candle.high));
  const valuePadding = Math.max((rawMax - rawMin) * 0.12, 0.16);
  const min = rawMin - valuePadding;
  const max = rawMax + valuePadding;
  const viewBoxWidth = 320;
  const viewBoxHeight = 142;
  const padding = { top: 10, right: 10, bottom: 22, left: 10 };
  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;
  const slot = plotWidth / Math.max(candles.length - 1, 1);
  const candleWidth = Math.max(2.8, Math.min(7.2, slot * 0.44));
  const y = (value) => mapStockPriceToY(value, min, max, padding.top, plotHeight);
  const closePath = candles
    .map((candle, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${(padding.left + slot * index).toFixed(2)} ${y(candle.close).toFixed(2)}`;
    })
    .join(" ");
  const gridLines = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const lineY = padding.top + plotHeight * ratio;
      return `<line class="stock-chart-grid-line" x1="${padding.left}" y1="${lineY}" x2="${
        viewBoxWidth - padding.right
      }" y2="${lineY}" />`;
    })
    .join("");
  const candleMarkup = candles
    .map((candle, index) => {
      const centerX = padding.left + slot * index;
      const openY = y(candle.open);
      const closeY = y(candle.close);
      const highY = y(candle.high);
      const lowY = y(candle.low);
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(openY - closeY));
      const candleState = candle.close >= candle.open ? "up" : "down";

      return `
        <g class="stock-candle is-${candleState}">
          <line class="stock-candle-wick" x1="${centerX.toFixed(2)}" y1="${highY.toFixed(2)}" x2="${centerX.toFixed(
        2,
      )}" y2="${lowY.toFixed(2)}" />
          <rect class="stock-candle-body" x="${(centerX - candleWidth / 2).toFixed(2)}" y="${bodyY.toFixed(
        2,
      )}" width="${candleWidth.toFixed(2)}" height="${bodyHeight.toFixed(2)}" rx="1.4" />
        </g>
      `;
    })
    .join("");
  const firstTimeLabel = formatStockAxisTime(candles[0], interval);
  const lastTimeLabel = formatStockAxisTime(candles.at(-1), interval);

  dom.chart.innerHTML = `
    <div class="stock-chart-meta">
      <span class="stock-chart-meta-spacer"></span>
      <span class="stock-change is-${state}">${escapeHtml(formatStockChange(quote.change, quote.percent))}</span>
    </div>
    <svg class="stock-chart-svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" aria-hidden="true" focusable="false">
      ${gridLines}
      <path class="stock-close-guide" d="${closePath}" />
      ${candleMarkup}
    </svg>
    <div class="stock-chart-times" aria-hidden="true">
      <span>${escapeHtml(firstTimeLabel)}</span>
      <span>${escapeHtml(lastTimeLabel)}</span>
    </div>
  `;
}

function formatStockRefreshTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function setStockRefreshState(state, detail = "") {
  const dom = getStockDom();
  if (!dom.refreshButton) {
    return;
  }

  if (stockRefreshResetTimer) {
    window.clearTimeout(stockRefreshResetTimer);
    stockRefreshResetTimer = null;
  }

  dom.refreshButton.classList.toggle("is-loading", state === "loading");
  dom.refreshButton.disabled = state === "loading";

  if (state === "loading") {
    dom.refreshButton.textContent = "";
    return;
  }

  if (state === "success") {
    dom.refreshButton.textContent = detail || "已更新";
    stockRefreshResetTimer = window.setTimeout(() => {
      const freshDom = getStockDom();
      if (freshDom.refreshButton) {
        freshDom.refreshButton.textContent = "";
      }
      stockRefreshResetTimer = null;
    }, 1800);
    return;
  }

  if (state === "error") {
    dom.refreshButton.textContent = "失败";
    stockRefreshResetTimer = window.setTimeout(() => {
      const freshDom = getStockDom();
      if (freshDom.refreshButton) {
        freshDom.refreshButton.textContent = "";
      }
      stockRefreshResetTimer = null;
    }, 2000);
    return;
  }

  dom.refreshButton.textContent = "";
}

function closeStockPickerMenu() {
  const dom = getStockDom();
  if (!dom.pickerMenu || !dom.pickerButton) {
    return;
  }

  dom.pickerMenu.hidden = true;
  dom.pickerButton.setAttribute("aria-expanded", "false");
}

function closeStockIntervalMenu() {
  const dom = getStockDom();
  if (!dom.intervalControls || !dom.intervalButton) {
    return;
  }

  dom.intervalControls.hidden = true;
  dom.intervalButton.setAttribute("aria-expanded", "false");
}

export function setupStockWidget() {
  const dom = getStockDom();
  dom.refreshButton?.addEventListener("click", (event) => {
    event.preventDefault();
    loadStockWidget({ manual: true });
  });

  dom.pickerButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!dom.pickerMenu) {
      return;
    }

    const willOpen = dom.pickerMenu.hidden;
    dom.pickerMenu.hidden = !willOpen;
    dom.pickerButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    closeStockIntervalMenu();
  });

  dom.pickerMenu?.addEventListener("click", (event) => {
    event.stopPropagation();
    const deleteButton = event.target instanceof Element ? event.target.closest("[data-stock-delete]") : null;
    if (deleteButton) {
      event.preventDefault();
      const deleteKey = deleteButton.getAttribute("data-stock-delete");
      const customStocks = loadCustomStocks();
      const isCustomStock = customStocks.some((stock) => stock.key === deleteKey);

      if (isCustomStock) {
        saveCustomStocks(customStocks.filter((stock) => stock.key !== deleteKey));
      } else if (deleteKey) {
        saveHiddenStockKeys([...loadHiddenStockKeys(), deleteKey]);
      }

      const nextCatalog = getStockCatalog();
      if (activeStockKey === deleteKey || !nextCatalog.some((stock) => stock.key === activeStockKey)) {
        activeStockKey = nextCatalog[0]?.key ?? "";
        persistActiveStockKey();
        stockDataState = createEmptyStockDataState(getActiveStockConfig()?.profile ?? stockEmptyProfile);
        if (activeStockKey) {
          loadStockWidget();
          return;
        }
      }
      renderStockWidget();
      return;
    }

    const button = event.target instanceof Element ? event.target.closest("[data-stock-symbol]") : null;
    if (!button) {
      return;
    }

    event.preventDefault();
    const nextStockKey = button.dataset.stockSymbol || activeStockKey;
    if (!getStockCatalog().some((stock) => stock.key === nextStockKey)) {
      return;
    }

    activeStockKey = nextStockKey;
    persistActiveStockKey();
    stockDataState = createEmptyStockDataState(getActiveStockConfig().profile);
    closeStockPickerMenu();
    renderStockWidget();
    loadStockWidget({ manual: true });
  });

  dom.pickerMenu?.addEventListener("submit", async (event) => {
    const form = event.target instanceof Element ? event.target.closest("#stockCustomForm") : null;
    if (!form) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(form);
    const symbol = normalizeStockSymbol(formData.get("code"));
    const submitButton = form.querySelector("button[type='submit']");
    if (!symbol) {
      form.querySelector("#stockCustomCode")?.focus();
      return;
    }

    const existingStock = getStockCatalog().find((stock) => stock.profile.symbol === symbol);
    if (existingStock) {
      if (isStockNamePlaceholder(existingStock.profile)) {
        const profile = await resolveStockProfile(symbol);
        saveOrReplaceCustomStock({
          ...existingStock,
          profile: {
            ...existingStock.profile,
            ...profile,
            symbol,
          },
        });
      }

      activeStockKey = getStockCatalog().find((stock) => stock.profile.symbol === symbol)?.key ?? existingStock.key;
      persistActiveStockKey();
      closeStockPickerMenu();
      stockDataState = createEmptyStockDataState(getActiveStockConfig()?.profile ?? stockEmptyProfile);
      renderStockWidget();
      loadStockWidget({ manual: true });
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "匹配中";
    }

    const profile = await lookupStockProfile(symbol);
    const customStock = normalizeCustomStock(profile);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "添加";
    }
    if (!customStock) {
      return;
    }

    saveOrReplaceCustomStock(customStock);
    activeStockKey = customStock.key;
    persistActiveStockKey();
    closeStockPickerMenu();
    stockDataState = createEmptyStockDataState(customStock.profile);
    renderStockWidget();
    loadStockWidget({ manual: true });
  });

  dom.intervalButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!dom.intervalControls) {
      return;
    }

    const willOpen = dom.intervalControls.hidden;
    dom.intervalControls.hidden = !willOpen;
    dom.intervalButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
    closeStockPickerMenu();
  });

  dom.intervalControls?.addEventListener("click", (event) => {
    event.stopPropagation();
    const button = event.target instanceof Element ? event.target.closest("[data-stock-interval]") : null;
    if (!button) {
      return;
    }

    event.preventDefault();
    activeStockInterval = button.dataset.stockInterval || activeStockInterval;
    closeStockIntervalMenu();
    renderStockWidget();
  });

  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(".stock-interval-picker, .stock-interval-menu, .stock-title-picker, .stock-picker-menu")
    ) {
      return;
    }

    closeStockIntervalMenu();
    closeStockPickerMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStockIntervalMenu();
      closeStockPickerMenu();
    }
  });

  repairStoredStockNames();
}

export async function loadStockWidget({ manual = false } = {}) {
  const activeConfig = getActiveStockConfig();
  renderStockWidget();
  if (!activeConfig) {
    stockDataState = createEmptyStockDataState(stockEmptyProfile);
    renderStockWidget();
    return;
  }

  let refreshedData = null;
  let refreshError = null;

  if (manual) {
    setStockRefreshState("loading");
    try {
      refreshedData = await requestStockDataRefresh(activeConfig);
    } catch (error) {
      refreshError = error;
    }
  }

  try {
    let data = refreshedData;
    if (!data) {
      const response = await fetch(`${activeConfig.dataUrl}?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      data = await response.json();
    }

    const intervals = data?.intervals ?? {};
    const hasLiveData = stockIntervals.some((interval) => Array.isArray(intervals[interval.key]) && intervals[interval.key].length >= 2);
    stockDataState = {
      profile: { ...(data?.profile ?? {}), ...activeConfig.profile },
      source: data?.source || "AKShare",
      generatedAt: data?.generatedAt || null,
      quote: data?.quote ?? {},
      intervals,
      hasLiveData,
    };
    if (manual) {
      setStockRefreshState(hasLiveData && !refreshError ? "success" : "error", formatStockRefreshTime(data?.quote?.time ?? data?.generatedAt));
    }
  } catch {
    stockDataState = createEmptyStockDataState(activeConfig.profile);
    if (manual) {
      setStockRefreshState("error");
    }
  }

  renderStockWidget();
}
