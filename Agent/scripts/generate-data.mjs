import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve("data", "daily-brief.json");

const defaults = {
  weather: {
    latitude: Number.parseFloat(process.env.WEATHER_LATITUDE ?? "31.2304"),
    longitude: Number.parseFloat(process.env.WEATHER_LONGITUDE ?? "121.4737"),
    label: process.env.WEATHER_LABEL ?? "上海",
  },
  nbaFeedUrl:
    process.env.NBA_RSS_URL ?? "https://www.espn.com/espn/rss/nba/news",
  arxivQuery:
    process.env.ARXIV_QUERY ??
    "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV",
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
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value) {
  return cleanHtml(value)
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'");
}

function pickTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function pickAllTags(block, tagName) {
  return [...block.matchAll(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"))].map(
    (match) => decodeXml(match[1]),
  );
}

function pickCategoriesFromTerm(block) {
  return [...block.matchAll(/<category[^>]*term="([^"]+)"/gi)].map((match) =>
    decodeXml(match[1]),
  );
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
  url.searchParams.set("timezone", "auto");

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

async function fetchNbaNews() {
  const xml = await fetchText(defaults.nbaFeedUrl);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 6)
    .map((match) => {
      const block = match[1];
      return {
        title: pickTag(block, "title"),
        link: pickTag(block, "link"),
        summary: pickTag(block, "description"),
        publishedAt: new Date(pickTag(block, "pubDate")).toISOString(),
      };
    })
    .filter((item) => item.title && item.link);

  return items;
}

async function fetchAiPapers() {
  const url = new URL("https://export.arxiv.org/api/query");
  url.searchParams.set("search_query", defaults.arxivQuery);
  url.searchParams.set("sortBy", "submittedDate");
  url.searchParams.set("sortOrder", "descending");
  url.searchParams.set("start", "0");
  url.searchParams.set("max_results", "6");

  const xml = await fetchText(url);
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);

  return entries.map((entry) => {
    const authors = pickAllTags(entry, "name").slice(0, 4);
    return {
      title: pickTag(entry, "title"),
      summary: pickTag(entry, "summary"),
      link: pickTag(entry, "id"),
      publishedAt: new Date(pickTag(entry, "published")).toISOString(),
      updatedAt: new Date(pickTag(entry, "updated")).toISOString(),
      authors,
      categories: pickCategoriesFromTerm(entry).slice(0, 3),
    };
  });
}

async function main() {
  const [weather, nbaNews, aiPapers] = await Promise.all([
    fetchWeather(),
    fetchNbaNews(),
    fetchAiPapers(),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    weather,
    nbaNews,
    aiPapers,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Daily brief written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
