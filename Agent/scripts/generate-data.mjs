import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { paperLibrary } from "./paper-library.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, "..", "data", "daily-brief.json");

const defaults = {
  weather: {
    latitude: Number.parseFloat(process.env.WEATHER_LATITUDE ?? "39.9593"),
    longitude: Number.parseFloat(process.env.WEATHER_LONGITUDE ?? "116.2981"),
    label: process.env.WEATHER_LABEL ?? "北京市海淀区",
  },
  newsFeeds: {
    domestic:
      process.env.DOMESTIC_NEWS_RSS_URL ??
      "https://www.chinadaily.com.cn/rss/china_rss.xml",
    international:
      process.env.INTERNATIONAL_NEWS_RSS_URL ??
      "http://feeds.bbci.co.uk/news/world/rss.xml",
    nba:
      process.env.NBA_RSS_URL ??
      "https://www.espn.com/espn/rss/nba/news",
  },
  calendar: {
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
    icsUrl: process.env.GOOGLE_CALENDAR_ICS_URL ?? "",
    label: process.env.GOOGLE_CALENDAR_LABEL ?? "Google Calendar",
  },
  paperSections: [
    {
      id: "data-storage",
      title: "数据存储相关",
      description: "数据库、分布式存储、向量检索与存储系统方向的经典与高影响力论文。",
    },
    {
      id: "computer-vision",
      title: "计算机视觉相关",
      description: "视觉基础模型、识别、检测、分割和多模态视觉方向的代表性论文。",
    },
    {
      id: "llm-memory",
      title: "大模型记忆库相关",
      description: "RAG、长期记忆、外部记忆和知识增强方向的高质量论文。",
    },
    {
      id: "agents",
      title: "Agent 相关",
      description: "自主智能体、工具调用、多 Agent 协同与软件 Agent 的代表性论文。",
    },
  ],
};

const weatherCodeMap = {
  0: "晴朗",
  1: "基本晴",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨",
  95: "雷暴",
};

function cleanHtml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTag(block, tagName) {
  const match = block.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match ? cleanHtml(match[1]) : "";
}

function shortenSummary(text, maxLength = 140) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AgentDailyBrief/1.0 (+https://zhoutianwen.com/Agent)",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchWeather() {
  const { latitude, longitude, label } = defaults.weather;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "Asia/Shanghai");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API failed: ${response.status}`);
  }

  const data = await response.json();
  const forecast = data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    description: weatherCodeMap[data.daily.weather_code[index]] ?? "天气更新中",
    max: Math.round(data.daily.temperature_2m_max[index]),
    min: Math.round(data.daily.temperature_2m_min[index]),
    precipitationProbability: data.daily.precipitation_probability_max[index],
  }));

  return {
    location: label,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      windSpeed: Math.round(data.current.wind_speed_10m),
    },
    today: forecast[0],
    forecast,
  };
}

async function fetchRssFeed(url, limit, source) {
  const xml = await fetchText(url);
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1];
      const publishedRaw = pickTag(block, "pubDate");
      return {
        title: pickTag(block, "title"),
        link: pickTag(block, "link"),
        summary: shortenSummary(pickTag(block, "description")),
        publishedAt: publishedRaw ? new Date(publishedRaw).toISOString() : new Date().toISOString(),
        source,
      };
    })
    .filter((item) => item.title && item.link);
}

function getDaySeed(date) {
  const dateKey = date.toISOString().slice(0, 10);
  return Number.parseInt(dateKey.replaceAll("-", ""), 10);
}

function rotateItems(items, count, seed) {
  if (!items.length) {
    return [];
  }

  const start = seed % items.length;
  const rotated = items.slice(start).concat(items.slice(0, start));
  return rotated.slice(0, Math.min(count, items.length));
}

function unfoldIcsLines(icsText) {
  return icsText.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDate(value) {
  if (!value) {
    return null;
  }

  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
    return new Date(normalized);
  }

  if (/^\d{8}T\d{6}$/.test(value)) {
    const normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}+08:00`;
    return new Date(normalized);
  }

  if (/^\d{8}$/.test(value)) {
    const normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00+08:00`;
    return new Date(normalized);
  }

  return null;
}

function pickIcsValue(block, fieldName) {
  const match = block.match(new RegExp(`^${fieldName}(?:;[^:\\n]*)?:(.+)$`, "m"));
  return match ? cleanHtml(match[1]) : "";
}

async function fetchSchedule() {
  const { icsUrl, calendarId, label } = defaults.calendar;
  const effectiveIcsUrl =
    icsUrl ||
    (calendarId
      ? `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`
      : "");
  if (!effectiveIcsUrl) {
    return {
      enabled: false,
      source: label,
      items: [],
    };
  }

  const icsText = unfoldIcsLines(await fetchText(effectiveIcsUrl));
  const now = new Date();

  const items = [...icsText.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)]
    .map((match) => {
      const block = match[1];
      const start = parseIcsDate(pickIcsValue(block, "DTSTART"));
      const end = parseIcsDate(pickIcsValue(block, "DTEND"));
      return {
        title: pickIcsValue(block, "SUMMARY") || "未命名日程",
        location: pickIcsValue(block, "LOCATION") || label,
        start: start?.toISOString(),
        end: end?.toISOString(),
      };
    })
    .filter((item) => item.start && new Date(item.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  return {
    enabled: true,
    source: label,
    items,
  };
}

function buildPaperSections(date) {
  const seed = getDaySeed(date);

  return defaults.paperSections.map((section, index) => {
    const candidates = paperLibrary.filter((paper) => paper.sectionId === section.id);
    const selected = rotateItems(candidates, 3, seed + index).map((paper, itemIndex) => ({
      ...paper,
      trackLabel: itemIndex === 0 ? "今日主推" : "轮换精选",
    }));

    return {
      ...section,
      rotationHint: `每日轮换 ${selected.length} 篇`,
      items: selected,
    };
  });
}

async function main() {
  const now = new Date();

  const [weatherResult, scheduleResult, domesticResult, internationalResult, nbaResult] =
    await Promise.allSettled([
      fetchWeather(),
      fetchSchedule(),
      fetchRssFeed(defaults.newsFeeds.domestic, 5, "China Daily"),
      fetchRssFeed(defaults.newsFeeds.international, 5, "BBC World"),
      fetchRssFeed(defaults.newsFeeds.nba, 6, "ESPN"),
    ]);

  const payload = {
    generatedAt: now.toISOString(),
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : {
            location: defaults.weather.label,
            current: { temperature: "--", weatherCode: 0, windSpeed: "--" },
            today: { max: "--", min: "--", precipitationProbability: "--" },
            forecast: [],
          },
    schedule:
      scheduleResult.status === "fulfilled"
        ? scheduleResult.value
        : {
            enabled: false,
            source: defaults.calendar.label,
            items: [],
          },
    news: {
      domestic: domesticResult.status === "fulfilled" ? domesticResult.value : [],
      international: internationalResult.status === "fulfilled" ? internationalResult.value : [],
      nba: nbaResult.status === "fulfilled" ? nbaResult.value : [],
    },
    aiPapers: {
      rotationLabel: `Curated Rotation · ${now.toISOString().slice(0, 10)}`,
      sections: buildPaperSections(now),
    },
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Daily brief written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
