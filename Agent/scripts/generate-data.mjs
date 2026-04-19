import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { paperLibrary } from "./paper-library.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, "..", "data", "daily-brief.json");
const execFileAsync = promisify(execFile);
const userAgent = "AgentDailyBrief/1.0 (+https://zhoutianwen.com/Agent)";

const featuredPlaces = [
  {
    id: "hallstatt",
    title: "哈尔施塔特",
    location: "奥地利 · Hallstatt",
    region: "Europe",
    summary: "湖光山色与尖顶小镇交错在一起，像一张被晨雾轻轻擦亮的明信片。",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Hallstatt",
  },
  {
    id: "santorini",
    title: "圣托里尼",
    location: "希腊 · Santorini",
    region: "Mediterranean",
    summary: "蓝白山城贴着火山海岸线展开，黄昏时分的光线尤其适合短暂逃离现实。",
    image:
      "https://images.unsplash.com/photo-1469796466635-455ede028aca?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Santorini",
  },
  {
    id: "kyoto",
    title: "岚山竹林",
    location: "日本 · 京都",
    region: "East Asia",
    summary: "风穿过竹林时像是一种很轻的回声，适合放在忙碌工作日的一角，让页面有一点呼吸感。",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Arashiyama",
  },
  {
    id: "banff",
    title: "梦莲湖",
    location: "加拿大 · Banff",
    region: "North America",
    summary: "冰川湖水像调过色的蓝宝石，雪山和松林把整个画面压得既安静又辽阔。",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Moraine_Lake",
  },
  {
    id: "cappadocia",
    title: "卡帕多奇亚",
    location: "土耳其 · Cappadocia",
    region: "Middle East",
    summary: "热气球、岩柱和柔和晨光一起出现的时候，会有一种很梦境的秩序感。",
    image:
      "https://images.unsplash.com/photo-1644331006861-6e1b0dc06405?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Cappadocia",
  },
  {
    id: "machu-picchu",
    title: "马丘比丘",
    location: "秘鲁 · Machu Picchu",
    region: "South America",
    summary: "云雾、山脊和古城石墙叠在一起，自带一种很强的历史纵深。",
    image:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1800&q=80",
    link: "https://en.wikipedia.org/wiki/Machu_Picchu",
  },
];

const newsFallbackImages = {
  domestic:
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1400&q=80",
  international:
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80",
  nba:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80",
};

const defaults = {
  weather: {
    latitude: Number.parseFloat(process.env.WEATHER_LATITUDE ?? "39.9593"),
    longitude: Number.parseFloat(process.env.WEATHER_LONGITUDE ?? "116.2981"),
    label: process.env.WEATHER_LABEL ?? "北京市海淀区",
  },
  newsFeeds: {
    domestic:
      process.env.DOMESTIC_NEWS_RSS_URL ??
      "https://news.google.com/rss/search?q=(site:news.cn%20OR%20site:gov.cn%20OR%20site:people.com.cn)%20%E5%9B%BD%E5%86%85&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    internationalBbc:
      process.env.INTERNATIONAL_BBC_RSS_URL ??
      "https://feeds.bbci.co.uk/news/world/rss.xml",
    internationalCnn:
      process.env.INTERNATIONAL_CNN_RSS_URL ??
      "https://news.google.com/rss/search?q=site:cnn.com%20world&hl=en-US&gl=US&ceid=US:en",
    nba:
      process.env.NBA_RSS_URL ??
      "https://www.espn.com/espn/rss/nba/news",
  },
  nbaScoreboardUrl:
    process.env.NBA_SCOREBOARD_URL ??
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  paperSections: [
    {
      id: "data-storage",
      title: "数据存储相关",
      description: "数据库、分布式存储、向量检索与数据系统方向的经典与高影响力论文。",
    },
    {
      id: "computer-vision",
      title: "计算机视觉相关",
      description: "视觉基础模型、识别、检测、分割和多模态视觉方向的代表论文。",
    },
    {
      id: "llm-memory",
      title: "大模型记忆库相关",
      description: "RAG、长期记忆、外部记忆和知识增强方向的高质量论文。",
    },
    {
      id: "agents",
      title: "Agent 相关",
      description: "自主智能体、工具调用、多 Agent 协同与软件 Agent 的代表论文。",
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
  51: "毛毛雨",
  53: "小雨",
  55: "中雨",
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

function pickAttribute(block, tagName, attributeName) {
  const match = block.match(
    new RegExp(
      `<${tagName}[^>]*${attributeName}=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  );
  return match ? match[1].trim() : "";
}

function shortenSummary(text, maxLength = 150) {
  if (!text) {
    return "";
  }

  const normalized = text.trim();
  if (!normalized || /^null$/i.test(normalized)) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function normalizeSummary(summary, title) {
  if (!summary) {
    return "";
  }

  const compactSummary = summary.replace(/\s+/g, " ").trim();
  const compactTitle = title.replace(/\s+/g, " ").trim();
  if (compactSummary === compactTitle) {
    return "";
  }

  if (
    compactSummary.startsWith(compactTitle) &&
    compactSummary.length <= compactTitle.length + 18
  ) {
    return "";
  }

  return compactSummary;
}

function extractImage(block) {
  return (
    pickAttribute(block, "media:content", "url") ||
    pickAttribute(block, "media:thumbnail", "url") ||
    pickAttribute(block, "enclosure", "url") ||
    block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
    ""
  );
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${url}: ${response.status}`);
    }

    return response.text();
  } catch (error) {
    return fetchTextWithPowerShell(url, error);
  }
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function fetchTextWithPowerShell(url, originalError) {
  const shell = process.platform === "win32" ? "powershell" : "pwsh";
  const command =
    "$ProgressPreference='SilentlyContinue';" +
    "$headers=@{'User-Agent'='" +
    userAgent.replace(/'/g, "''") +
    "'};" +
    `(Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri '${url.replace(/'/g, "''")}').Content`;

  try {
    const { stdout } = await execFileAsync(
      shell,
      ["-NoLogo", "-NoProfile", "-Command", command],
      {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      },
    );

    if (!stdout.trim()) {
      throw new Error(`Empty response returned by ${shell} for ${url}`);
    }

    return stdout;
  } catch (fallbackError) {
    throw new Error(
      `Request failed for ${url}: ${
        originalError instanceof Error ? originalError.message : String(originalError)
      }; ${shell} fallback failed: ${
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError)
      }`,
    );
  }
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
    description:
      weatherCodeMap[data.daily.weather_code[index]] ?? "天气更新中",
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

async function fetchArticlePreview(url) {
  try {
    const html = await fetchText(url);
    const image =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      "";
    const description =
      html.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      "";

    return {
      image: cleanHtml(image),
      summary: shortenSummary(cleanHtml(description)),
    };
  } catch {
    return {
      image: "",
      summary: "",
    };
  }
}

function getNewsFallbackImage(section) {
  return newsFallbackImages[section] ?? newsFallbackImages.international;
}

async function fetchRssFeed(url, limit, source) {
  const xml = await fetchText(url);
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, limit)
    .map((match) => {
      const block = match[1];
      const publishedRaw = pickTag(block, "pubDate");
      const itemSource = pickTag(block, "source") || source;
      const rawTitle = pickTag(block, "title");
      const cleanTitle =
        itemSource && rawTitle.endsWith(` - ${itemSource}`)
          ? rawTitle.slice(0, -(` - ${itemSource}`).length)
          : rawTitle;
      const summary = normalizeSummary(
        shortenSummary(pickTag(block, "description")),
        cleanTitle,
      );

      return {
        title: cleanTitle,
        link: pickTag(block, "link"),
        summary,
        image: extractImage(block),
        publishedAt: publishedRaw
          ? new Date(publishedRaw).toISOString()
          : new Date().toISOString(),
        source: itemSource,
      };
    })
    .filter((item) => item.title && item.link);
}

async function enrichNewsItems(items, section) {
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.image && item.summary) {
        return item;
      }

      const preview = await fetchArticlePreview(item.link);
      return {
        ...item,
        image: item.image || preview.image || getNewsFallbackImage(section),
        summary: item.summary || preview.summary || "",
      };
    }),
  );

  return enriched.map((item) => ({
    ...item,
    image: item.image || getNewsFallbackImage(section),
  }));
}

async function fetchMergedRssFeeds(feeds, limit, section) {
  const results = await Promise.allSettled(
    feeds.map((feed) =>
      fetchRssFeed(feed.url, feed.limit ?? limit, feed.source),
    ),
  );

  const merged = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .sort(
      (left, right) =>
        new Date(right.publishedAt) - new Date(left.publishedAt),
    )
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.link === item.link) === index,
    )
    .slice(0, limit);

  return enrichNewsItems(merged, section);
}

function getGameStatus(status) {
  const state = status?.type?.state ?? "pre";
  const detail =
    status?.type?.shortDetail ??
    status?.type?.detail ??
    status?.type?.description ??
    "";

  if (state === "in") {
    return { state: "in", label: "Live", detail };
  }

  if (state === "post") {
    return { state: "post", label: "Final", detail };
  }

  return { state: "pre", label: "Scheduled", detail };
}

async function fetchNbaScoreboard() {
  const data = await fetchJson(defaults.nbaScoreboardUrl);
  const games = (data.events ?? []).slice(0, 4).map((event) => {
    const competition = event.competitions?.[0] ?? {};
    const competitors = competition.competitors ?? [];
    const homeTeam = competitors.find((team) => team.homeAway === "home");
    const awayTeam = competitors.find((team) => team.homeAway === "away");
    const status = getGameStatus(event.status ?? competition.status);

    return {
      id: event.id,
      link:
        event.links?.find((link) => link.href)?.href ??
        `https://www.espn.com/nba/game/_/gameId/${event.id}`,
      startTime: event.date,
      state: status.state,
      statusText: status.label,
      detail: status.detail,
      note: competition.notes?.[0]?.headline ?? event.name,
      homeTeam: {
        abbreviation: homeTeam?.team?.abbreviation ?? "HOME",
        score: homeTeam?.score ?? "-",
        logo: homeTeam?.team?.logo ?? "",
      },
      awayTeam: {
        abbreviation: awayTeam?.team?.abbreviation ?? "AWAY",
        score: awayTeam?.score ?? "-",
        logo: awayTeam?.team?.logo ?? "",
      },
    };
  });

  return {
    date: data.day?.date ?? new Date().toISOString().slice(0, 10),
    games,
  };
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

function buildFeaturedPlace(date) {
  return rotateItems(featuredPlaces, 1, getDaySeed(date))[0] ?? null;
}

function buildPaperSections(date) {
  const seed = getDaySeed(date);

  return defaults.paperSections.map((section, index) => {
    const candidates = paperLibrary.filter(
      (paper) => paper.sectionId === section.id,
    );
    const selected = rotateItems(candidates, 3, seed + index).map(
      (paper, itemIndex) => ({
        ...paper,
        trackLabel: itemIndex === 0 ? "今日主推" : "轮换精选",
      }),
    );

    return {
      ...section,
      rotationHint: `每日轮换 ${selected.length} 篇`,
      items: selected,
    };
  });
}

async function main() {
  const now = new Date();

  const [
    weatherResult,
    domesticResult,
    internationalResult,
    nbaScoreboardResult,
    nbaResult,
  ] = await Promise.allSettled([
    fetchWeather(),
    fetchMergedRssFeeds(
      [{ url: defaults.newsFeeds.domestic, source: "Google News", limit: 8 }],
      5,
      "domestic",
    ),
    fetchMergedRssFeeds(
      [
        { url: defaults.newsFeeds.internationalBbc, source: "BBC", limit: 5 },
        { url: defaults.newsFeeds.internationalCnn, source: "CNN", limit: 5 },
      ],
      5,
      "international",
    ),
    fetchNbaScoreboard(),
    fetchRssFeed(defaults.newsFeeds.nba, 6, "ESPN").then((items) =>
      enrichNewsItems(items, "nba"),
    ),
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
    featuredPlace: buildFeaturedPlace(now),
    news: {
      domestic: domesticResult.status === "fulfilled" ? domesticResult.value : [],
      international:
        internationalResult.status === "fulfilled"
          ? internationalResult.value
          : [],
      nba: nbaResult.status === "fulfilled" ? nbaResult.value : [],
    },
    nbaScoreboard:
      nbaScoreboardResult.status === "fulfilled"
        ? nbaScoreboardResult.value
        : {
            date: now.toISOString().slice(0, 10),
            games: [],
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
