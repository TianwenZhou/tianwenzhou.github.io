const bilibiliDataUrl = "./data/bilibili-videos.json";
const bilibiliRefreshApiUrl = "/api/bilibili/refresh";
const bilibiliDefaultKeyword = "电影解说";
const bilibiliSeenStorageKey = "agent-dashboard-bilibili-seen-v1";
const bilibiliSeenLimit = 240;
const bilibiliDisplayCount = 3;

let dom = null;

function getBilibiliDom() {
  return {
    root: document.querySelector("#bilibiliWidget"),
    list: document.querySelector("#bilibiliVideoList"),
    refreshButton: document.querySelector("#bilibiliRefreshButton"),
    title: document.querySelector("#bilibiliWidgetTitle"),
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

function normalizeCover(value) {
  const url = String(value ?? "").trim();
  if (!url) {
    return "";
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  return url;
}

function buildSearchUrl(keyword = bilibiliDefaultKeyword) {
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`;
}

function normalizeVideo(item) {
  const keyword = item?.keyword || bilibiliDefaultKeyword;
  return {
    title: String(item?.title || "电影解说推荐").trim(),
    upName: String(item?.upName || item?.author || "Bilibili").trim(),
    cover: normalizeCover(item?.cover),
    url: String(item?.url || buildSearchUrl(keyword)).trim(),
    bvid: String(item?.bvid || "").trim(),
    keyword,
    publishedAt: String(item?.publishedAt || "").trim(),
    qualityScore: Number(item?.qualityScore || 0),
    stats: item?.stats && typeof item.stats === "object" ? item.stats : {},
    source: String(item?.source || "search").trim(),
  };
}

function getVideoKey(video) {
  return String(video?.bvid || video?.url || video?.title || "").trim();
}

function loadSeenVideos() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(bilibiliSeenStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, bilibiliSeenLimit) : [];
  } catch {
    return [];
  }
}

function saveSeenVideos(videos, previousSeen = loadSeenVideos()) {
  const merged = [];
  videos.forEach((video) => {
    const key = getVideoKey(video);
    if (key && !merged.includes(key)) {
      merged.push(key);
    }
  });

  previousSeen.forEach((key) => {
    if (key && !merged.includes(key)) {
      merged.push(key);
    }
  });

  try {
    window.localStorage.setItem(bilibiliSeenStorageKey, JSON.stringify(merged.slice(0, bilibiliSeenLimit)));
  } catch {
    // Ignore private-mode storage errors.
  }
}

function metricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function weightedVideoKey(video, index) {
  const stats = video.stats || {};
  const score = metricValue(video.qualityScore) || 1;
  const play = metricValue(stats.play);
  const rankBonus = Math.max(1, 22 - index * 0.18);
  const weight = Math.max(1, score * 1.4 + Math.min(32, Math.pow(play, 0.18)) + rankBonus);
  return Math.pow(Math.random(), 1 / weight);
}

function selectVideosFromPool(payload) {
  const source = Array.isArray(payload?.candidatePool) && payload.candidatePool.length
    ? payload.candidatePool
    : payload?.items;
  const videos = Array.isArray(source)
    ? source.map(normalizeVideo).filter((item) => item.title && item.url)
    : [];
  const deduped = [];
  const seenKeys = new Set();

  videos.forEach((video) => {
    const key = getVideoKey(video);
    if (!key || seenKeys.has(key)) {
      return;
    }
    seenKeys.add(key);
    deduped.push(video);
  });

  if (!deduped.length) {
    return [];
  }

  const seen = new Set(loadSeenVideos());
  const fresh = deduped.filter((video) => !seen.has(getVideoKey(video)));
  const pool = fresh.length >= bilibiliDisplayCount ? fresh : deduped;
  const selected = pool
    .map((video, index) => ({ video, key: weightedVideoKey(video, index) }))
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.video)
    .slice(0, bilibiliDisplayCount);

  saveSeenVideos(selected);
  return selected;
}

function getVideoDate(value) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return new Date(numericValue < 100000000000 ? numericValue * 1000 : numericValue);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPublishedTime(value) {
  const date = getVideoDate(value);
  if (!date) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 && Math.abs(diffMs) < 60000) {
    return "刚刚";
  }
  if (diffMs < 0) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  const diffMinutes = Math.floor(Math.max(0, diffMs) / 60000);
  if (diffMinutes < 1) {
    return "刚刚";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getPublishedDateTime(value) {
  const date = getVideoDate(value);
  return date ? date.toISOString() : "";
}

function renderCover(video) {
  if (!video.cover) {
    return `<span class="bilibili-video-cover-mark">B</span>`;
  }

  return `
    <img
      src="${escapeHtml(video.cover)}"
      alt=""
      loading="lazy"
      referrerpolicy="no-referrer"
      onerror="this.closest('.bilibili-video-cover')?.classList.add('is-missing'); this.remove()"
    />
    <span class="bilibili-video-cover-mark">B</span>
  `;
}

function renderVideoCard(video, index) {
  const className = index === 0 ? "bilibili-video-card is-featured" : "bilibili-video-card";
  const timeLabel = formatPublishedTime(video.publishedAt);
  const dateTime = getPublishedDateTime(video.publishedAt);
  const timeMarkup = timeLabel
    ? `<time class="bilibili-video-time" datetime="${escapeHtml(dateTime)}">${escapeHtml(timeLabel)}</time>`
    : "";

  return `
    <a class="${className}" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">
      <span class="bilibili-video-cover${video.cover ? "" : " is-missing"}">
        ${renderCover(video)}
      </span>
      <span class="bilibili-video-copy">
        <strong>${escapeHtml(video.title)}</strong>
        <span class="bilibili-video-meta">
          <span class="bilibili-up-name">
            <i aria-hidden="true">UP</i>
            <span>${escapeHtml(video.upName)}</span>
          </span>
          ${timeMarkup}
        </span>
      </span>
    </a>
  `;
}

function renderFallback(keyword = bilibiliDefaultKeyword) {
  const fallback = normalizeVideo({
    title: "打开 Bilibili 搜索电影解说",
    upName: "等待脚本刷新推荐视频",
    url: buildSearchUrl(keyword),
    keyword,
  });

  dom.list.innerHTML = renderVideoCard(fallback, 0);
}

function renderVideos(payload) {
  const keyword = payload?.keyword || bilibiliDefaultKeyword;
  const videos = selectVideosFromPool(payload);

  dom.title.textContent = keyword;

  if (!videos.length) {
    renderFallback(keyword);
    return;
  }

  dom.list.innerHTML = videos.map(renderVideoCard).join("");
}

export function setupBilibiliWidget() {
  dom = getBilibiliDom();
  dom.refreshButton?.addEventListener("click", () => {
    loadBilibiliWidget({ manual: true });
  });
}

function setBilibiliRefreshState(isLoading) {
  if (!dom?.refreshButton) {
    return;
  }

  dom.refreshButton.disabled = isLoading;
  dom.refreshButton.classList.toggle("is-loading", isLoading);
}

async function refreshBilibiliVideos() {
  const response = await fetch(bilibiliRefreshApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keyword: bilibiliDefaultKeyword,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error || "Bilibili refresh failed");
  }

  return payload.data || payload;
}

async function fetchBilibiliVideos() {
  const response = await fetch(`${bilibiliDataUrl}?ts=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export async function loadBilibiliWidget({ manual = false } = {}) {
  if (!dom?.root || !dom.list) {
    return;
  }

  if (manual) {
    setBilibiliRefreshState(true);
  }

  try {
    if (manual) {
      try {
        renderVideos(await refreshBilibiliVideos());
        return;
      } catch (refreshError) {
        dom.root.dataset.refreshError = refreshError.message;
      }
    }

    renderVideos(await fetchBilibiliVideos());
  } catch (error) {
    renderFallback();
    dom.root.dataset.error = error.message;
  } finally {
    if (manual) {
      setBilibiliRefreshState(false);
    }
  }
}
