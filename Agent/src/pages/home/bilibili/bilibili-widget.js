import { fetchAgentJson } from "../../../shared/api-client.js";

const bilibiliRefreshApiUrl = "/api/bilibili/refresh";
const bilibiliDefaultKeyword = "电影解说";
const bilibiliSeenStorageKey = "agent-dashboard-bilibili-seen-v1";
const bilibiliKeywordStorageKey = "agent-dashboard-bilibili-keyword-v1";
const bilibiliCustomKeywordsStorageKey = "agent-dashboard-bilibili-custom-keywords-v1";
const bilibiliHiddenKeywordsStorageKey = "agent-dashboard-bilibili-hidden-keywords-v1";
const bilibiliCustomCategoriesStorageKey = "agent-dashboard-bilibili-custom-categories-v1";
const bilibiliHiddenCategoriesStorageKey = "agent-dashboard-bilibili-hidden-categories-v1";
const bilibiliPreferenceStorageKey = "agent-dashboard-bilibili-preferences-v1";
const bilibiliRotationStorageKey = "agent-dashboard-bilibili-rotation-v1";
const bilibiliSeenLimit = 500;
const bilibiliDisplayCount = 3;
const bilibiliPreferenceLimit = 50;
const bilibiliTagAliases = {
  cs: ["CS", "CS2", "CSGO", "反恐精英", "反恐精英2"],
  cs2: ["CS2", "反恐精英2", "反恐精英", "CSGO"],
  csgo: ["CSGO", "反恐精英", "CS2"],
  反恐精英: ["反恐精英", "CS2", "CSGO", "反恐精英2"],
};
const bilibiliCategoryPresets = [
  {
    keyword: "电影解说",
    label: "电影解说",
    tags: ["电影解说"],
  },
  {
    keyword: "游戏视频",
    label: "游戏视频",
    tags: ["游戏视频", "游戏解说", "游戏实况", "单机游戏", "游戏攻略"],
  },
  {
    keyword: "知识科普",
    label: "知识科普",
    tags: ["知识科普", "科普", "纪录片", "人文历史", "科技科普"],
  },
  {
    keyword: "\u4fa6\u63a2\u6f2b\u753b",
    label: "\u4fa6\u63a2\u6f2b\u753b",
    tags: ["\u4fa6\u63a2\u6f2b\u753b", "\u63a8\u7406\u6f2b\u753b", "\u91d1\u7530\u4e00", "\u540d\u4fa6\u63a2\u67ef\u5357", "\u67ef\u5357\u5267\u573a\u7248", "\u6848\u4ef6\u89e3\u8bf4"],
    upMids: ["18698687"],
  },
];
const bilibiliSmallTagPresets = {
  电影解说: [
  {
    keyword: "电影解说",
    label: "电影解说",
    type: "tag",
    baseWeight: 10,
    tags: ["电影解说", "高分电影解说", "悬疑电影解说", "科幻电影解说", "犯罪电影解说"],
  },
  {
    keyword: "高分电影",
    label: "高分电影",
    type: "tag",
    baseWeight: 8,
    tags: ["高分电影", "高分电影解说", "经典电影解说", "电影推荐"],
  },
  {
    keyword: "悬疑推理",
    label: "悬疑推理",
    type: "tag",
    baseWeight: 7,
    tags: ["悬疑电影解说", "推理电影", "犯罪电影解说", "反转电影"],
  },
  {
    keyword: "科幻电影",
    label: "科幻电影",
    type: "tag",
    baseWeight: 6,
    tags: ["科幻电影解说", "硬科幻电影", "科幻神作", "未来世界电影"],
  },
  {
    keyword: "纪录片",
    label: "纪录片",
    type: "tag",
    baseWeight: 5,
    tags: ["纪录片", "纪录片解说", "高分纪录片", "人文纪录片"],
  },
  ],
  游戏视频: [
    {
      keyword: "游戏视频",
      label: "游戏视频",
      type: "tag",
      baseWeight: 10,
      tags: ["游戏视频", "游戏解说", "游戏实况", "单机游戏"],
    },
    {
      keyword: "单机游戏",
      label: "单机游戏",
      type: "tag",
      baseWeight: 8,
      tags: ["单机游戏", "剧情游戏", "独立游戏", "主机游戏"],
    },
    {
      keyword: "游戏攻略",
      label: "游戏攻略",
      type: "tag",
      baseWeight: 7,
      tags: ["游戏攻略", "通关攻略", "游戏教程", "游戏技巧"],
    },
    {
      keyword: "游戏实况",
      label: "游戏实况",
      type: "tag",
      baseWeight: 6,
      tags: ["游戏实况", "实况解说", "高能游戏", "娱乐实况"],
    },
  ],
  知识科普: [
    {
      keyword: "知识科普",
      label: "知识科普",
      type: "tag",
      baseWeight: 10,
      tags: ["知识科普", "科普", "泛知识"],
    },
    {
      keyword: "科技科普",
      label: "科技科普",
      type: "tag",
      baseWeight: 8,
      tags: ["科技科普", "前沿科技", "数码科技", "人工智能"],
    },
    {
      keyword: "人文历史",
      label: "人文历史",
      type: "tag",
      baseWeight: 7,
      tags: ["人文历史", "历史科普", "历史", "文化"],
    },
  ],
  "\u4fa6\u63a2\u6f2b\u753b": [
    {
      keyword: "\u4fa6\u63a2\u6f2b\u753b",
      label: "\u4fa6\u63a2\u6f2b\u753b",
      type: "tag",
      baseWeight: 10,
      tags: ["\u4fa6\u63a2\u6f2b\u753b", "\u63a8\u7406\u6f2b\u753b", "\u6848\u4ef6\u89e3\u8bf4", "\u6f2b\u753b\u89e3\u8bf4"],
    },
    {
      keyword: "\u91d1\u7530\u4e00",
      label: "\u91d1\u7530\u4e00",
      type: "tag",
      baseWeight: 9,
      tags: ["\u91d1\u7530\u4e00", "\u91d1\u7530\u4e00\u5c11\u5e74\u4e8b\u4ef6\u7c3f", "\u91d1\u7530\u4e00\u6848\u4ef6", "\u91d1\u7530\u4e00\u89e3\u8bf4"],
    },
    {
      keyword: "\u540d\u4fa6\u63a2\u67ef\u5357",
      label: "\u540d\u4fa6\u63a2\u67ef\u5357",
      type: "tag",
      baseWeight: 9,
      tags: ["\u540d\u4fa6\u63a2\u67ef\u5357", "\u67ef\u5357\u5267\u573a\u7248", "\u67ef\u5357\u6848\u4ef6", "\u67ef\u5357\u89e3\u8bf4"],
    },
    {
      keyword: "\u4e00\u53ea\u897f\u74dc\u554a_",
      label: "\u4e00\u53ea\u897f\u74dc\u554a_",
      type: "up",
      baseWeight: 12,
      tags: ["\u4e00\u53ea\u897f\u74dc\u554a_", "\u91d1\u7530\u4e00", "\u540d\u4fa6\u63a2\u67ef\u5357"],
      upMids: ["18698687"],
    },
  ],
};

let dom = null;
let lastRenderedVideos = new Map();

function getBilibiliDom() {
  return {
    root: document.querySelector("#bilibiliWidget"),
    list: document.querySelector("#bilibiliVideoList"),
    refreshButton: document.querySelector("#bilibiliRefreshButton"),
    title: document.querySelector("#bilibiliWidgetTitle"),
    categoryButton: document.querySelector("#bilibiliCategoryButton"),
    categoryMenu: document.querySelector("#bilibiliCategoryMenu"),
    keywordButton: document.querySelector("#bilibiliKeywordButton"),
    keywordMenu: document.querySelector("#bilibiliKeywordMenu"),
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

function normalizeKeyword(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function getStorageList(storageKey, scope = getActiveKeyword(), limit = 24) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    const scopedKey = normalizeKeyword(scope) || bilibiliDefaultKeyword;
    const source = Array.isArray(parsed) ? (scopedKey === bilibiliDefaultKeyword ? parsed : []) : parsed?.[scopedKey];

    if (!Array.isArray(source)) {
      return [];
    }

    const seen = new Set();
    return source
      .map(normalizeKeyword)
      .filter(Boolean)
      .filter((keyword) => {
        if (seen.has(keyword)) {
          return false;
        }
        seen.add(keyword);
        return true;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

function setStorageList(storageKey, values, scope = getActiveKeyword(), limit = 24) {
  try {
    const scopedKey = normalizeKeyword(scope) || bilibiliDefaultKeyword;
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    const store = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    if (Array.isArray(parsed) && scopedKey === bilibiliDefaultKeyword) {
      store[scopedKey] = parsed;
    }
    store[scopedKey] = values.map(normalizeKeyword).filter(Boolean).slice(0, limit);
    window.localStorage.setItem(storageKey, JSON.stringify(store));
  } catch {
    // Presets remain usable when localStorage is unavailable.
  }
}

function loadCustomKeywords(category = getActiveKeyword()) {
  const presetKeywords = new Set(getSmallTagPresets(category).map((item) => item.keyword));
  return getStorageList(bilibiliCustomKeywordsStorageKey, category, 12).filter((keyword) => !presetKeywords.has(keyword));
}

function saveCustomKeywords(keywords, category = getActiveKeyword()) {
  setStorageList(bilibiliCustomKeywordsStorageKey, keywords, category, 12);
}

function loadHiddenKeywords(category = getActiveKeyword()) {
  return getStorageList(bilibiliHiddenKeywordsStorageKey, category, 24);
}

function saveHiddenKeywords(keywords, category = getActiveKeyword()) {
  setStorageList(bilibiliHiddenKeywordsStorageKey, keywords, category, 24);
}

function getSmallTagPresets(category = getActiveKeyword()) {
  return (bilibiliSmallTagPresets[normalizeKeyword(category)] || bilibiliSmallTagPresets[bilibiliDefaultKeyword]).map(
    (option) => ({ ...option }),
  );
}

function loadCustomCategories() {
  const presetKeywords = new Set(bilibiliCategoryPresets.map((item) => item.keyword));
  return getStorageList(bilibiliCustomCategoriesStorageKey, "categories", 12).filter((keyword) => !presetKeywords.has(keyword));
}

function saveCustomCategories(categories) {
  setStorageList(bilibiliCustomCategoriesStorageKey, categories, "categories", 12);
}

function loadHiddenCategories() {
  return getStorageList(bilibiliHiddenCategoriesStorageKey, "categories", 24);
}

function saveHiddenCategories(categories) {
  setStorageList(bilibiliHiddenCategoriesStorageKey, categories, "categories", 24);
}

function getCategoryOptions() {
  const hiddenCategories = new Set(loadHiddenCategories());
  const presetOptions = bilibiliCategoryPresets
    .filter((option) => !hiddenCategories.has(option.keyword))
    .map((option) => ({ ...option, isPreset: true }));
  const customOptions = loadCustomCategories()
    .map((keyword) => ({
      keyword,
      label: keyword,
      tags: [keyword],
      isCustom: true,
    }))
    .filter((option) => !hiddenCategories.has(option.keyword));

  return [...presetOptions, ...customOptions];
}

function getKeywordOptions(category = getActiveKeyword()) {
  const hiddenKeywords = new Set(loadHiddenKeywords(category));
  const presetOptions = getSmallTagPresets(category)
    .filter((option) => !hiddenKeywords.has(option.keyword))
    .map((option) => ({ ...option, isPreset: true }));
  const customOptions = loadCustomKeywords(category).map((keyword) => ({
    keyword,
    label: keyword,
    tags: [keyword],
    type: "tag",
    baseWeight: 3,
    isCustom: true,
  })).filter((option) => !hiddenKeywords.has(option.keyword));

  return [...presetOptions, ...customOptions];
}

function getActiveKeyword() {
  try {
    const savedKeyword = normalizeKeyword(window.localStorage.getItem(bilibiliKeywordStorageKey));
    const options = getCategoryOptions();
    if (savedKeyword && (!options.length || options.some((option) => option.keyword === savedKeyword))) {
      return savedKeyword;
    }

    if (options.length) {
      return options[0].keyword;
    }
  } catch {
    // Fall through to the default keyword.
  }

  return bilibiliDefaultKeyword;
}

function saveActiveKeyword(keyword) {
  try {
    window.localStorage.setItem(bilibiliKeywordStorageKey, normalizeKeyword(keyword) || bilibiliDefaultKeyword);
  } catch {
    // The current tab can still switch until it is refreshed.
  }
}

function getKeywordConfig(keyword = getActiveKeyword()) {
  const normalizedKeyword = normalizeKeyword(keyword) || bilibiliDefaultKeyword;
  return {
    keyword: normalizedKeyword,
    label: normalizedKeyword,
    tags: getWeightedSearchTags(),
    upMids: getWeightedUpMids(),
  };
}

function getSeenStorageKey(keyword = getActiveKeyword()) {
  return `${bilibiliSeenStorageKey}:${normalizeKeyword(keyword) || bilibiliDefaultKeyword}`;
}

function loadPreferenceStore() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(bilibiliPreferenceStorageKey) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeScoreMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, score]) => [normalizeKeyword(key), Number(score)])
      .filter(([key, score]) => key && Number.isFinite(score) && score > 0)
      .slice(0, bilibiliPreferenceLimit),
  );
}

function getPreferenceProfile(category = getActiveKeyword()) {
  const store = loadPreferenceStore();
  const key = normalizeKeyword(category) || bilibiliDefaultKeyword;
  const profile = store[key] || {};
  return {
    tags: normalizeScoreMap(profile.tags),
    upNames: normalizeScoreMap(profile.upNames),
  };
}

function trimScoreMap(map, limit = bilibiliPreferenceLimit) {
  return Object.fromEntries(
    Object.entries(map)
      .filter(([key, value]) => key && Number.isFinite(Number(value)) && Number(value) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, limit)
      .map(([key, value]) => [key, Math.min(99, Math.round(Number(value) * 100) / 100)]),
  );
}

function savePreferenceProfile(profile, category = getActiveKeyword()) {
  try {
    const store = loadPreferenceStore();
    const key = normalizeKeyword(category) || bilibiliDefaultKeyword;
    store[key] = {
      tags: trimScoreMap(profile.tags || {}),
      upNames: trimScoreMap(profile.upNames || {}),
    };
    window.localStorage.setItem(bilibiliPreferenceStorageKey, JSON.stringify(store));
  } catch {
    // The recommendation panel still works with the built-in small tags.
  }
}

function getVideoTags(video) {
  const tags = [
    ...(Array.isArray(video?.tags) ? video.tags : []),
    video?.query,
  ];
  const seen = new Set();

  return tags
    .map(normalizeKeyword)
    .filter(Boolean)
    .filter((tag) => {
      if (seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    })
    .slice(0, 8);
}

function getExpandedBilibiliTags(tag) {
  const normalizedTag = normalizeKeyword(tag);
  if (!normalizedTag) {
    return [];
  }

  const aliases = bilibiliTagAliases[normalizedTag.toLowerCase()] || [normalizedTag];
  const tags = [];
  aliases.forEach((alias) => {
    const normalizedAlias = normalizeKeyword(alias);
    if (normalizedAlias && !tags.includes(normalizedAlias)) {
      tags.push(normalizedAlias);
    }
  });
  return tags;
}

function boostPreferenceTag(tag, amount = 1.5) {
  const normalizedTag = normalizeKeyword(tag);
  if (!normalizedTag) {
    return;
  }

  const profile = getPreferenceProfile();
  profile.tags[normalizedTag] = Math.min(99, Number(profile.tags[normalizedTag] || 0) + amount);
  savePreferenceProfile(profile);
}

function boostPreferenceRow(label, type = "tag", amount = 1.5) {
  const normalizedLabel = normalizeKeyword(label);
  if (!normalizedLabel) {
    return;
  }

  const profile = getPreferenceProfile();
  if (type === "up") {
    profile.upNames[normalizedLabel] = Math.min(99, Number(profile.upNames[normalizedLabel] || 0) + amount);
  } else {
    profile.tags[normalizedLabel] = Math.min(99, Number(profile.tags[normalizedLabel] || 0) + amount);
  }
  savePreferenceProfile(profile);
}

function recordVideoPreference(video) {
  if (!video) {
    return;
  }

  const profile = getPreferenceProfile();
  const upName = normalizeKeyword(video.upName);
  if (upName) {
    profile.upNames[upName] = Math.min(99, Number(profile.upNames[upName] || 0) + 3);
  }

  getVideoTags(video).forEach((tag) => {
    profile.tags[tag] = Math.min(99, Number(profile.tags[tag] || 0) + 2);
  });

  savePreferenceProfile(profile);
}

function getPreferenceRows() {
  const hiddenKeywords = new Set(loadHiddenKeywords());
  const profile = getPreferenceProfile();
  const rows = new Map();

  getKeywordOptions().forEach((option) => {
    const label = normalizeKeyword(option.label || option.keyword);
    if (!label || hiddenKeywords.has(label)) {
      return;
    }

    rows.set(label, {
      label,
      type: option.type || "tag",
      score: Number(option.baseWeight || 1) + Number(profile.tags[label] || 0),
      isPreset: option.isPreset,
      isCustom: option.isCustom,
      tags: option.tags || [label],
      upMids: option.upMids || [],
    });
  });

  Object.entries(profile.tags).forEach(([label, score]) => {
    if (!label || hiddenKeywords.has(label)) {
      return;
    }

    const existing = rows.get(label);
    rows.set(label, {
      ...(existing || { label, type: "tag", tags: [label] }),
      score: Number(existing?.score || 0) + Number(score || 0),
      upMids: existing?.upMids || [],
    });
  });

  Object.entries(profile.upNames).forEach(([label, score]) => {
    if (!label || hiddenKeywords.has(label)) {
      return;
    }

    rows.set(`UP:${label}`, {
      label,
      type: "up",
      score: Number(score || 0),
      tags: [],
    });
  });

  return [...rows.values()]
    .filter((row) => Number(row.score) > 0)
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 18);
}

function getWeightedSearchTags() {
  const rows = getPreferenceRows().filter((row) => row.type === "tag" || row.tags?.length);
  const activeKeyword = getActiveKeyword();
  const tags = [];

  const appendRowTags = (row) => {
    (row.tags?.length ? row.tags : [row.label]).forEach((tag) => {
      getExpandedBilibiliTags(tag).forEach((expandedTag) => {
        if (expandedTag && !tags.includes(expandedTag)) {
          tags.push(expandedTag);
        }
      });
    });
  };

  rows
    .filter((row) => row.label !== activeKeyword)
    .forEach(appendRowTags);
  rows
    .filter((row) => row.label === activeKeyword)
    .forEach(appendRowTags);

  return (tags.length ? tags : [getActiveKeyword()]).slice(0, 10);
}

function getWeightedUpMids() {
  const activeCategory = getCategoryOptions().find((option) => option.keyword === getActiveKeyword());
  const mids = [];
  const appendMid = (mid) => {
    const normalizedMid = String(mid || "").replace(/\D/g, "");
    if (normalizedMid && !mids.includes(normalizedMid)) {
      mids.push(normalizedMid);
    }
  };

  (activeCategory?.upMids || []).forEach(appendMid);
  getPreferenceRows().forEach((row) => {
    (row.upMids || []).forEach(appendMid);
  });

  return mids.slice(0, 6);
}

function deleteKeywordOption(keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return;
  }

  const category = getActiveKeyword();
  const presetKeywords = new Set(getSmallTagPresets(category).map((option) => option.keyword));
  if (presetKeywords.has(normalizedKeyword)) {
    const hiddenKeywords = loadHiddenKeywords(category).filter((item) => item !== normalizedKeyword);
    saveHiddenKeywords([normalizedKeyword, ...hiddenKeywords], category);
  }

  saveCustomKeywords(loadCustomKeywords(category).filter((item) => item !== normalizedKeyword), category);
  const profile = getPreferenceProfile();
  delete profile.tags[normalizedKeyword];
  delete profile.upNames[normalizedKeyword];
  savePreferenceProfile(profile);
}

function deleteCategoryOption(keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return;
  }

  const presetKeywords = new Set(bilibiliCategoryPresets.map((option) => option.keyword));
  if (presetKeywords.has(normalizedKeyword)) {
    const hiddenCategories = loadHiddenCategories().filter((item) => item !== normalizedKeyword);
    saveHiddenCategories([normalizedKeyword, ...hiddenCategories]);
  }

  saveCustomCategories(loadCustomCategories().filter((item) => item !== normalizedKeyword));
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
    query: String(item?.query || keyword).trim(),
    tags: Array.isArray(item?.tags) ? item.tags.map(normalizeKeyword).filter(Boolean).slice(0, 16) : [],
    description: String(item?.description || "").trim(),
    publishedAt: String(item?.publishedAt || "").trim(),
    qualityScore: Number(item?.qualityScore || 0),
    stats: item?.stats && typeof item.stats === "object" ? item.stats : {},
    source: String(item?.source || "search").trim(),
  };
}

function getVideoKey(video) {
  return String(video?.bvid || video?.url || video?.title || "").trim();
}

function loadSeenVideos(keyword = getActiveKeyword()) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getSeenStorageKey(keyword)) || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, bilibiliSeenLimit) : [];
  } catch {
    return [];
  }
}

function saveSeenVideos(videos, previousSeen = loadSeenVideos(), keyword = getActiveKeyword()) {
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
    window.localStorage.setItem(getSeenStorageKey(keyword), JSON.stringify(merged.slice(0, bilibiliSeenLimit)));
  } catch {
    // Ignore private-mode storage errors.
  }
}

function getSelectionScopeKey(keyword = getActiveKeyword()) {
  const config = getKeywordConfig(keyword);
  return [normalizeKeyword(keyword) || bilibiliDefaultKeyword, ...config.tags, ...config.upMids].join("|");
}

function loadRotationStore() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(bilibiliRotationStorageKey) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getRotationCursor(scopeKey) {
  const store = loadRotationStore();
  return Math.max(0, Number(store[scopeKey] || 0));
}

function saveRotationCursor(scopeKey, cursor) {
  try {
    const store = loadRotationStore();
    store[scopeKey] = Math.max(0, Number(cursor) || 0);
    window.localStorage.setItem(bilibiliRotationStorageKey, JSON.stringify(store));
  } catch {
    // Rotation is a convenience; recommendation still works without it.
  }
}

function metricValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function getVideoPreferenceScore(video, profile = getPreferenceProfile()) {
  let score = 0;
  const upName = normalizeKeyword(video?.upName);
  if (upName && profile.upNames[upName]) {
    score += Number(profile.upNames[upName]) * 2.6;
  }

  const searchable = [
    video?.title,
    video?.description,
    ...(Array.isArray(video?.tags) ? video.tags : []),
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  Object.entries(profile.tags || {}).forEach(([tag, value]) => {
    const aliases = getExpandedBilibiliTags(tag);
    if (!aliases.length) {
      return;
    }
    const matched = aliases.some((alias) => searchable.includes(alias.toLowerCase()));
    if (matched) {
      score += Number(value || 0) * 2.2;
    }
  });

  return score;
}

function getVideoRecommendationScore(video, index, profile = getPreferenceProfile()) {
  const stats = video.stats || {};
  const qualityScore = metricValue(video.qualityScore);
  const recencyScore = metricValue(video.recencyScore);
  const playScore = metricValue(stats.play);
  const preferenceScore = getVideoPreferenceScore(video, profile);
  const rankScore = Math.max(1, 24 - index * 0.18);
  const explorationNoise = Math.random() * 12;

  return (
    preferenceScore * 3.2 +
    qualityScore * 1.35 +
    recencyScore * 1.1 +
    Math.min(36, Math.pow(playScore, 0.18)) +
    rankScore +
    explorationNoise
  );
}

function weightedVideoKey(video, index, profile = getPreferenceProfile()) {
  const stats = video.stats || {};
  const score = metricValue(video.qualityScore) || 1;
  const play = metricValue(stats.play);
  const rankBonus = Math.max(1, 22 - index * 0.18);
  const preferenceBonus = getVideoPreferenceScore(video, profile);
  const weight = Math.max(1, score * 1.4 + Math.min(32, Math.pow(play, 0.18)) + rankBonus + preferenceBonus);
  return Math.pow(Math.random(), 1 / weight);
}

function videoMatchesKeyword(video, keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  const fields = [
    video.keyword,
    video.query,
    video.title,
    video.description,
    ...(Array.isArray(video.tags) ? video.tags : []),
  ]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);

  return fields.some((field) => field.includes(normalizedKeyword.toLowerCase()));
}

function selectDiverseVideos(rankedVideos, limit) {
  const selected = [];
  const selectedKeys = new Set();
  const usedUps = new Set();

  const tryPick = (strict = true) => {
    rankedVideos.forEach((video) => {
      if (selected.length >= limit) {
        return;
      }
      const key = getVideoKey(video);
      const upName = normalizeKeyword(video.upName);
      if (!key || selectedKeys.has(key)) {
        return;
      }
      if (strict && upName && usedUps.has(upName) && rankedVideos.length - selected.length > 1) {
        return;
      }
      selected.push(video);
      selectedKeys.add(key);
      if (upName) {
        usedUps.add(upName);
      }
    });
  };

  tryPick(true);
  tryPick(false);
  return selected.slice(0, limit);
}

function rotateRankedVideos(rankedVideos, scopeKey, shouldRotate) {
  if (!shouldRotate || rankedVideos.length <= bilibiliDisplayCount) {
    return rankedVideos;
  }

  const bandSize = Math.min(rankedVideos.length, Math.max(18, bilibiliDisplayCount * 8));
  const band = rankedVideos.slice(0, bandSize);
  const tail = rankedVideos.slice(bandSize);
  const cursor = getRotationCursor(scopeKey) % band.length;
  const rotatedBand = [...band.slice(cursor), ...band.slice(0, cursor)];
  saveRotationCursor(scopeKey, cursor + bilibiliDisplayCount + 1);
  return [...rotatedBand, ...tail];
}

function selectVideosFromPool(payload, keyword = getActiveKeyword()) {
  const source = Array.isArray(payload?.candidatePool) && payload.candidatePool.length
    ? payload.candidatePool
    : payload?.items;
  const videos = Array.isArray(source)
    ? source.map(normalizeVideo).filter((item) => item.title && item.url)
    : [];
  const requestedKeyword = normalizeKeyword(keyword);
  const payloadKeyword = normalizeKeyword(payload?.keyword || "");
  const keywordFilteredVideos =
    requestedKeyword && requestedKeyword !== payloadKeyword
      ? videos.filter((video) => videoMatchesKeyword(video, requestedKeyword))
      : videos;
  const deduped = [];
  const seenKeys = new Set();

  keywordFilteredVideos.forEach((video) => {
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

  const seen = new Set(loadSeenVideos(requestedKeyword));
  const fresh = deduped.filter((video) => !seen.has(getVideoKey(video)));
  const pool = fresh.length >= bilibiliDisplayCount ? fresh : deduped;
  const profile = getPreferenceProfile(requestedKeyword);
  const scopeKey = getSelectionScopeKey(requestedKeyword);
  const ranked = pool
    .map((video, index) => ({
      video,
      score: getVideoRecommendationScore(video, index, profile),
      key: weightedVideoKey(video, index, profile),
    }))
    .sort((a, b) => b.score - a.score || b.key - a.key)
    .map((entry) => entry.video)
  const selected = selectDiverseVideos(rotateRankedVideos(ranked, scopeKey, Boolean(payload?.__manualRefresh)), bilibiliDisplayCount);

  saveSeenVideos(selected, loadSeenVideos(requestedKeyword), requestedKeyword);
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
    />
    <span class="bilibili-video-cover-mark">B</span>
  `;
}

function hydrateBilibiliCovers() {
  dom?.list?.querySelectorAll(".bilibili-video-cover img").forEach((image) => {
    const cover = image.closest(".bilibili-video-cover");
    const markMissing = () => {
      cover?.classList.add("is-missing");
      image.remove();
    };

    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && image.naturalWidth <= 0) {
      markMissing();
    }
  });
}

function renderVideoCard(video, index) {
  const className = index === 0 ? "bilibili-video-card is-featured" : "bilibili-video-card";
  const timeLabel = formatPublishedTime(video.publishedAt);
  const dateTime = getPublishedDateTime(video.publishedAt);
  const timeMarkup = timeLabel
    ? `<time class="bilibili-video-time" datetime="${escapeHtml(dateTime)}">${escapeHtml(timeLabel)}</time>`
    : "";

  return `
    <a class="${className}" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer" data-bilibili-video-key="${escapeHtml(getVideoKey(video))}">
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

function renderFallback(keyword = getActiveKeyword()) {
  const fallback = normalizeVideo({
    title: "打开 Bilibili 搜索电影解说",
    upName: "等待脚本刷新推荐视频",
    url: buildSearchUrl(keyword),
    keyword,
  });

  lastRenderedVideos = new Map([[getVideoKey(fallback), fallback]]);
  dom.list.innerHTML = renderVideoCard(fallback, 0);
  hydrateBilibiliCovers();
}

function renderVideos(payload) {
  const keyword = getActiveKeyword();
  const videos = selectVideosFromPool(payload, keyword);

  dom.title.textContent = keyword;
  renderCategoryMenu();
  renderKeywordMenu();

  if (!videos.length) {
    renderFallback(keyword);
    return;
  }

  lastRenderedVideos = new Map(videos.map((video) => [getVideoKey(video), video]));
  dom.list.innerHTML = videos.map(renderVideoCard).join("");
  hydrateBilibiliCovers();
}

function renderKeywordMenu() {
  if (!dom?.keywordMenu) {
    return;
  }

  const category = getActiveKeyword();
  const rows = getPreferenceRows();
  const maxScore = Math.max(1, ...rows.map((row) => Number(row.score) || 0));
  const keywordOptions = rows
    .map((row) => {
      const score = Math.max(1, Math.round((Number(row.score) / maxScore) * 100));
      const typeLabel = row.type === "up" ? "UP" : "TAG";
      const deleteButton = `<button class="bilibili-keyword-delete" type="button" data-bilibili-keyword-delete="${escapeHtml(row.label)}" aria-label="删除 ${escapeHtml(row.label)}">×</button>`;

      return `
        <div class="bilibili-keyword-row">
          <button
            class="bilibili-keyword-option"
            type="button"
            data-bilibili-weight-tag="${escapeHtml(row.label)}"
            data-bilibili-weight-type="${escapeHtml(row.type)}"
            title="点击提高这个小标签的权重"
          >
            <span class="bilibili-keyword-option-label">${escapeHtml(row.label)}</span>
            <span class="bilibili-keyword-option-score">${typeLabel} ${score}</span>
          </button>
          ${deleteButton}
        </div>
      `;
    })
    .join("");

  dom.keywordMenu.innerHTML = `
    <div class="bilibili-keyword-summary">
      <span>分类：${escapeHtml(category)}</span>
      <strong>小标签权重</strong>
    </div>
    <div class="bilibili-keyword-list">${keywordOptions || '<div class="bilibili-keyword-empty">添加小标签后开始个性化推荐</div>'}</div>
    <form id="bilibiliKeywordForm" class="bilibili-keyword-form">
      <input id="bilibiliKeywordInput" name="keyword" type="text" autocomplete="off" maxlength="24" placeholder="添加小标签" />
      <button type="submit">加入</button>
    </form>
  `;
  dom.keywordButton?.classList.toggle("is-active", !dom.keywordMenu.hidden);
}

function renderCategoryMenu() {
  if (!dom?.categoryMenu) {
    return;
  }

  const activeCategory = getActiveKeyword();
  const options = getCategoryOptions();
  const categoryOptions = options
    .map((option) => {
      const isActive = option.keyword === activeCategory;
      const deleteButton = `<button class="bilibili-keyword-delete" type="button" data-bilibili-category-delete="${escapeHtml(option.keyword)}" aria-label="删除分类 ${escapeHtml(option.keyword)}">×</button>`;

      return `
        <div class="bilibili-keyword-row${isActive ? " is-active" : ""}">
          <button
            class="bilibili-keyword-option${isActive ? " is-active" : ""}"
            type="button"
            data-bilibili-category="${escapeHtml(option.keyword)}"
            title="切换到 ${escapeHtml(option.label)}"
          >
            <span class="bilibili-keyword-option-label">${escapeHtml(option.label)}</span>
            <span class="bilibili-keyword-option-score">分类</span>
          </button>
          ${deleteButton}
        </div>
      `;
    })
    .join("");

  dom.categoryMenu.innerHTML = `
    <div class="bilibili-keyword-summary">
      <span>当前：${escapeHtml(activeCategory)}</span>
      <strong>分类切换</strong>
    </div>
    <div class="bilibili-keyword-list">${categoryOptions || '<div class="bilibili-keyword-empty">添加分类后开始推荐</div>'}</div>
    <form id="bilibiliCategoryForm" class="bilibili-keyword-form">
      <input id="bilibiliCategoryInput" name="category" type="text" autocomplete="off" maxlength="24" placeholder="添加分类" />
      <button type="submit">加入</button>
    </form>
  `;
  dom.categoryButton?.classList.toggle("is-active", !dom.categoryMenu.hidden);
}

function closeKeywordMenu() {
  if (!dom?.keywordMenu || !dom.keywordButton) {
    return;
  }

  dom.keywordMenu.hidden = true;
  dom.keywordButton.setAttribute("aria-expanded", "false");
  dom.keywordButton.classList.remove("is-active");
}

function closeCategoryMenu() {
  if (!dom?.categoryMenu || !dom.categoryButton) {
    return;
  }

  dom.categoryMenu.hidden = true;
  dom.categoryButton.setAttribute("aria-expanded", "false");
  dom.categoryButton.classList.remove("is-active");
}

function toggleKeywordMenu() {
  if (!dom?.keywordMenu || !dom.keywordButton) {
    return;
  }

  const willOpen = dom.keywordMenu.hidden;
  closeCategoryMenu();
  dom.keywordMenu.hidden = !willOpen;
  dom.keywordButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
  dom.keywordButton.classList.toggle("is-active", willOpen);
  if (willOpen) {
    renderKeywordMenu();
    dom.keywordMenu.querySelector("#bilibiliKeywordInput")?.focus();
  }
}

function toggleCategoryMenu() {
  if (!dom?.categoryMenu || !dom.categoryButton) {
    return;
  }

  const willOpen = dom.categoryMenu.hidden;
  closeKeywordMenu();
  dom.categoryMenu.hidden = !willOpen;
  dom.categoryButton.setAttribute("aria-expanded", willOpen ? "true" : "false");
  dom.categoryButton.classList.toggle("is-active", willOpen);
  if (willOpen) {
    renderCategoryMenu();
    dom.categoryMenu.querySelector("#bilibiliCategoryInput")?.focus();
  }
}

function setActiveKeyword(keyword, { shouldRefresh = true } = {}) {
  const nextKeyword = normalizeKeyword(keyword) || bilibiliDefaultKeyword;
  saveActiveKeyword(nextKeyword);
  dom.title.textContent = nextKeyword;
  renderCategoryMenu();
  renderKeywordMenu();
  closeCategoryMenu();
  closeKeywordMenu();

  if (shouldRefresh) {
    loadBilibiliWidget({ manual: true });
  }
}

export function setupBilibiliWidget() {
  dom = getBilibiliDom();
  dom.title.textContent = getActiveKeyword();
  renderCategoryMenu();
  renderKeywordMenu();

  dom.refreshButton?.addEventListener("click", () => {
    loadBilibiliWidget({ manual: true });
  });

  dom.categoryButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCategoryMenu();
  });

  dom.keywordButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleKeywordMenu();
  });

  dom.categoryMenu?.addEventListener("click", (event) => {
    event.stopPropagation();
    const deleteButton =
      event.target instanceof Element ? event.target.closest("[data-bilibili-category-delete]") : null;
    if (deleteButton) {
      event.preventDefault();
      const category = deleteButton.getAttribute("data-bilibili-category-delete") || "";
      const wasActive = normalizeKeyword(getActiveKeyword()) === normalizeKeyword(category);
      deleteCategoryOption(category);
      const nextCategory = getCategoryOptions()[0]?.keyword || bilibiliDefaultKeyword;
      if (wasActive) {
        setActiveKeyword(nextCategory);
        return;
      }
      renderCategoryMenu();
      return;
    }

    const categoryButton =
      event.target instanceof Element ? event.target.closest("[data-bilibili-category]") : null;
    if (!categoryButton) {
      return;
    }

    event.preventDefault();
    setActiveKeyword(categoryButton.getAttribute("data-bilibili-category") || bilibiliDefaultKeyword);
  });

  dom.categoryMenu?.addEventListener("submit", (event) => {
    const form = event.target instanceof Element ? event.target.closest("#bilibiliCategoryForm") : null;
    if (!form) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(form);
    const category = normalizeKeyword(formData.get("category"));
    if (!category) {
      form.querySelector("#bilibiliCategoryInput")?.focus();
      return;
    }

    saveHiddenCategories(loadHiddenCategories().filter((item) => item !== category));
    const isPresetCategory = bilibiliCategoryPresets.some((option) => option.keyword === category);
    if (!isPresetCategory) {
      const categories = loadCustomCategories().filter((item) => item !== category);
      saveCustomCategories([category, ...categories]);
    }
    setActiveKeyword(category);
  });

  dom.keywordMenu?.addEventListener("click", (event) => {
    event.stopPropagation();
    const deleteButton =
      event.target instanceof Element ? event.target.closest("[data-bilibili-keyword-delete]") : null;
    if (deleteButton) {
      event.preventDefault();
      const keyword = deleteButton.getAttribute("data-bilibili-keyword-delete") || "";
      deleteKeywordOption(keyword);
      renderKeywordMenu();
      loadBilibiliWidget();
      return;
    }

    const weightButton =
      event.target instanceof Element ? event.target.closest("[data-bilibili-weight-tag]") : null;
    if (!weightButton) {
      return;
    }

    event.preventDefault();
    boostPreferenceRow(
      weightButton.getAttribute("data-bilibili-weight-tag") || "",
      weightButton.getAttribute("data-bilibili-weight-type") || "tag",
      1.25,
    );
    renderKeywordMenu();
    loadBilibiliWidget();
  });

  dom.keywordMenu?.addEventListener("submit", (event) => {
    const form = event.target instanceof Element ? event.target.closest("#bilibiliKeywordForm") : null;
    if (!form) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(form);
    const keyword = normalizeKeyword(formData.get("keyword"));
    if (!keyword) {
      form.querySelector("#bilibiliKeywordInput")?.focus();
      return;
    }

    saveHiddenKeywords(loadHiddenKeywords().filter((item) => item !== keyword));
    const isPresetKeyword = getSmallTagPresets().some((option) => option.keyword === keyword);
    if (!isPresetKeyword) {
      const keywords = loadCustomKeywords().filter((item) => item !== keyword);
      saveCustomKeywords([keyword, ...keywords]);
    }
    boostPreferenceTag(keyword, 4);
    renderKeywordMenu();
    loadBilibiliWidget({ manual: true });
  });

  dom.list?.addEventListener("click", (event) => {
    const videoCard = event.target instanceof Element ? event.target.closest("[data-bilibili-video-key]") : null;
    if (!videoCard) {
      return;
    }

    const video = lastRenderedVideos.get(videoCard.getAttribute("data-bilibili-video-key") || "");
    if (video) {
      recordVideoPreference(video);
      renderKeywordMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(".bilibili-keyword-menu, .bilibili-category-menu, .bilibili-keyword-button, .bilibili-category-button")
    ) {
      return;
    }

    closeCategoryMenu();
    closeKeywordMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCategoryMenu();
      closeKeywordMenu();
    }
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
  return fetchBilibiliVideos({ refresh: true });
}

async function forceRefreshBilibiliVideos() {
  const keywordConfig = getKeywordConfig();
  const payload = await fetchAgentJson(bilibiliRefreshApiUrl, {
    method: "POST",
    body: {
      keyword: keywordConfig.keyword,
      tags: keywordConfig.tags,
      upMids: keywordConfig.upMids,
    },
    timeoutMs: 90000,
  });

  const data = payload.data || payload;
  data.__manualRefresh = true;
  return data;
}

async function fetchBilibiliVideos(options = {}) {
  const keywordConfig = getKeywordConfig();
  const payload = await fetchAgentJson("/api/bilibili", {
    params: {
      keyword: keywordConfig.keyword,
      tags: keywordConfig.tags.join(","),
      upMids: keywordConfig.upMids.join(","),
      refresh: options.refresh ? "true" : "",
      ts: Date.now(),
    },
    timeoutMs: 12000,
  });
  const data = payload.data || payload;
  data.__manualRefresh = Boolean(options.refresh);
  return data;
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
