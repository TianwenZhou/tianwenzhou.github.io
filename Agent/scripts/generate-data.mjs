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

const classicQuotes = [
  {
    id: "analects-learning",
    text: "学而不思则罔，思而不学则殆。",
    source: "《论语》",
    author: "孔子",
    note: "提醒自己既要输入，也要沉淀，不要只忙不想。",
  },
  {
    id: "taoteching-accumulate",
    text: "合抱之木，生于毫末；九层之台，起于累土。",
    source: "《道德经》",
    author: "老子",
    note: "再大的目标，也要拆成今天能推进的一小步。",
  },
  {
    id: "taoteching-self",
    text: "知人者智，自知者明；胜人者有力，自胜者强。",
    source: "《道德经》",
    author: "老子",
    note: "比起和别人比较，更重要的是把自己的节奏稳住。",
  },
  {
    id: "zhuangzi-time",
    text: "人生天地之间，若白驹之过隙，忽然而已。",
    source: "《庄子》",
    author: "庄周",
    note: "事情很多的时候，更值得把注意力放在真正重要的事上。",
  },
  {
    id: "dream-red-mansions",
    text: "世事洞明皆学问，人情练达即文章。",
    source: "《红楼梦》",
    author: "曹雪芹",
    note: "技术之外，理解人和场景，往往更能拉开差距。",
  },
  {
    id: "mencius-perseverance",
    text: "虽千万人，吾往矣。",
    source: "《孟子》",
    author: "孟子",
    note: "认准方向之后，关键是稳稳地往前走。",
  },
  {
    id: "records-historical",
    text: "桃李不言，下自成蹊。",
    source: "《史记》",
    author: "司马迁",
    note: "真正有分量的作品，本身就会替你说话。",
  },
  {
    id: "chuci-seek",
    text: "路漫漫其修远兮，吾将上下而求索。",
    source: "《离骚》",
    author: "屈原",
    note: "长期主义最难，但也最值得。",
  },
];

const bookExcerpts = [
  {
    id: "border-town-river",
    text:
      "月光如银子，无处不可照及，山上篁竹在月光下变成了一片黑色，身边草丛中虫声繁密如落雨。",
    book: "《边城》",
    author: "沈从文",
  },
  {
    id: "fortress-besieged-night",
    text:
      "夜仿佛纸浸了油，变成半透明体；它给太阳拥抱住了，分不出身来，也许是给太阳溶了，所以夕照晚霞隐褪后的夜色也带着酡红。",
    book: "《围城》",
    author: "钱钟书",
  },
  {
    id: "camel-xiangzi-sky",
    text:
      "天是越来越晴朗了，一轮火一样的太阳悬在空中，街上的一切都像在明晃晃地发着白光。",
    book: "《骆驼祥子》",
    author: "老舍",
  },
  {
    id: "norwegian-wood-rain",
    text:
      "雨还在下，细得像雾，落在草地和树叶上，世界像被一种安静的潮气轻轻包住。",
    book: "《挪威的森林》",
    author: "村上春树",
  },
  {
    id: "one-hundred-years-yellow",
    text:
      "许多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会想起父亲带他去见识冰块的那个遥远的下午。",
    book: "《百年孤独》",
    author: "加西亚·马尔克斯",
  },
  {
    id: "floating-life-lotus",
    text:
      "芸坐其侧，素手烹茶，窗外新荷微香，连晚风也像带着水意，从竹帘间一寸寸地漫进来。",
    book: "《浮生六记》",
    author: "沈复",
  },
  {
    id: "red-mansion-snow",
    text:
      "只见大地白茫茫一片真干净，山川树木都隐在雪光里，天地像忽然静下来，只余风过回廊的细响。",
    book: "《红楼梦》",
    author: "曹雪芹",
  },
  {
    id: "remembrance-madeleine",
    text:
      "那一点点浸过茶水的点心，忽然把整个旧日时光都唤醒了，仿佛往昔并未消失，只是沉在心底等待一个气味。",
    book: "《追忆似水年华》",
    author: "马塞尔·普鲁斯特",
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
    chinaTop:
      process.env.CHINA_TOP_NEWS_RSS_URL ??
      "https://www.chinanews.com/rss/china.xml",
    chinaSociety:
      process.env.CHINA_SOCIETY_NEWS_RSS_URL ??
      "https://www.chinanews.com/rss/society.xml",
    chinaFinance:
      process.env.CHINA_FINANCE_NEWS_RSS_URL ??
      "https://www.chinanews.com/rss/finance.xml",
    internationalBbc:
      process.env.INTERNATIONAL_BBC_RSS_URL ??
      "https://feeds.bbci.co.uk/news/world/rss.xml",
    internationalBusinessBbc:
      process.env.INTERNATIONAL_BUSINESS_BBC_RSS_URL ??
      "https://feeds.bbci.co.uk/news/business/rss.xml",
    internationalTechBbc:
      process.env.INTERNATIONAL_TECH_BBC_RSS_URL ??
      "https://feeds.bbci.co.uk/news/technology/rss.xml",
    internationalCnn:
      process.env.INTERNATIONAL_CNN_RSS_URL ??
      "https://news.google.com/rss/search?q=site:cnn.com%20world&hl=en-US&gl=US&ceid=US:en",
    internationalBusinessCnn:
      process.env.INTERNATIONAL_BUSINESS_CNN_RSS_URL ??
      "https://news.google.com/rss/search?q=site:cnn.com%20business&hl=en-US&gl=US&ceid=US:en",
    internationalTechCnn:
      process.env.INTERNATIONAL_TECH_CNN_RSS_URL ??
      "https://news.google.com/rss/search?q=site:cnn.com%20technology&hl=en-US&gl=US&ceid=US:en",
    nba:
      process.env.NBA_RSS_URL ??
      "https://www.espn.com/espn/rss/nba/news",
  },
  nbaScoreboardUrl:
    process.env.NBA_SCOREBOARD_URL ??
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  featuredImageFeedUrl:
    process.env.FEATURED_IMAGE_FEED_URL ??
    "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN",
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
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

function stripPhotoCredit(text) {
  return String(text || "")
    .replace(/\s*\((?:\u00A9|Copyright).*?\)\s*$/i, "")
    .trim();
}

function absolutizeBingUrl(url) {
  if (!url) {
    return "";
  }

  return url.startsWith("http") ? url : `https://www.bing.com${url}`;
}

function absolutizeUrl(url, baseUrl = "") {
  if (!url) {
    return "";
  }

  try {
    return new URL(url, baseUrl || "https://zhoutianwen.com/Agent/").toString();
  } catch {
    return "";
  }
}

function normalizeSummary(summary, title) {
  if (!summary) {
    return "";
  }

  const compactSummary = summary.replace(/\s+/g, " ").trim();
  const compactTitle = title.replace(/\s+/g, " ").trim();
  const lowerSummary = compactSummary.toLowerCase();
  if (
    (lowerSummary.includes("comprehensive up-to-date news coverage") &&
      lowerSummary.includes("google news")) ||
    compactSummary.includes("完整、最新的新闻报道") ||
    compactSummary.includes("Google 新闻")
  ) {
    return "";
  }

  if (compactSummary === compactTitle) {
    return "";
  }

  if (
    compactSummary.startsWith(compactTitle) &&
    compactSummary.length <= compactTitle.length + 32
  ) {
    return "";
  }

  return compactSummary;
}

function hasUsableNewsImage(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      /^https?:$/.test(parsed.protocol) &&
      !host.includes("googleusercontent.com") &&
      !host.includes("gstatic.com") &&
      !host.includes("news.google.com")
    );
  } catch {
    return false;
  }
}

function extractImage(block) {
  const candidate =
    pickAttribute(block, "media:content", "url") ||
    pickAttribute(block, "media:thumbnail", "url") ||
    pickAttribute(block, "enclosure", "url") ||
    block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
    "";

  return hasUsableNewsImage(candidate) ? candidate : "";
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

function formatMonthDayLabel(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

async function fetchTodayInHistory(referenceDate = new Date()) {
  const dateKey = getDateKeyInTimeZone(referenceDate);
  const [, month, day] = dateKey.split("-");
  const data = await fetchJson(
    `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
  );

  const items = (data.events ?? [])
    .map((event) => ({
      year: event.year ? String(event.year) : "",
      text: shortenSummary((event.text ?? "").replace(/\s+/g, " ").trim(), 92),
      link:
        event.pages?.find((page) => page.content_urls?.desktop?.page)?.content_urls
          ?.desktop?.page ?? "",
    }))
    .filter(
      (item, index, list) =>
        item.text &&
        list.findIndex(
          (candidate) => candidate.year === item.year && candidate.text === item.text,
        ) === index,
    )
    .slice(0, 2);

  return {
    dateKey,
    dateLabel: formatMonthDayLabel(dateKey),
    items,
  };
}

function buildTodayInHistoryFallback(referenceDate = new Date()) {
  const dateKey = getDateKeyInTimeZone(referenceDate);
  return {
    dateKey,
    dateLabel: formatMonthDayLabel(dateKey),
    items: [],
  };
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

async function fetchFeaturedPlaces() {
  const data = await fetchJson(defaults.featuredImageFeedUrl);

  const items = (data.images ?? [])
    .map((item, index) => {
      const scenicTitle = stripPhotoCredit(item.copyright);
      const summary = cleanHtml(item.title || scenicTitle || "Bing Daily Image");

      return {
        id: item.fullstartdate || item.startdate || `bing-${index}`,
        title: scenicTitle || summary || `Daily Escape ${index + 1}`,
        location: "Bing Daily Image",
        region: "Daily Scenic",
        summary,
        image: absolutizeBingUrl(item.url),
        link: absolutizeBingUrl(item.copyrightlink || item.url),
      };
    })
    .filter(
      (item, index, list) =>
        item.image &&
        list.findIndex((candidate) => candidate.id === item.id) === index,
    );

  if (!items.length) {
    throw new Error("No featured images returned from Bing feed.");
  }

  return items;
}

async function fetchArticlePreview(url) {
  try {
    const html = await fetchText(url);
    const image = extractPreviewImage(html, url);
    const description =
      html.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
      )?.[1] ||
      "";

    return {
      image: hasUsableNewsImage(cleanHtml(image)) ? cleanHtml(image) : "",
      summary: shortenSummary(cleanHtml(description)),
    };
  } catch {
    return {
      image: "",
      summary: "",
    };
  }
}

function extractPreviewImage(html, url) {
  const preferredMatches = [
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,
    )?.[1],
    html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i,
    )?.[1],
  ]
    .map((candidate) => absolutizeUrl(cleanHtml(candidate || ""), url))
    .filter(Boolean);

  if (preferredMatches.length) {
    const direct = preferredMatches.find((candidate) => hasUsableNewsImage(candidate));
    if (direct) {
      return direct;
    }
  }

  const articleRegion =
    html.match(
      /<div[^>]+class=["'][^"']*content_maincontent_content[^"']*["'][^>]*>([\s\S]*?)<div[^>]+class=["'][^"']*channel[^"']*["']/i,
    )?.[1] ||
    html.match(
      /<div[^>]+class=["'][^"']*left_zw[^"']*["'][^>]*>([\s\S]*?)<div[^>]+class=["'][^"']*(?:adEditor|channel)[^"']*["']/i,
    )?.[1] ||
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    html;

  const articleMatches = [
    ...articleRegion.matchAll(
      /<(?:img|source)[^>]+(?:src|data-src|data-original|data-echo|data-lazy-src)=["']([^"']+)["']/gi,
    ),
    ...articleRegion.matchAll(
      /https?:\/\/[^"'\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\s>]*)?/gi,
    ),
  ]
    .map((match) => absolutizeUrl(cleanHtml(match[1] || match[0] || ""), url))
    .filter(Boolean);

  const primaryArticleImage = articleMatches.find(
    (candidate) =>
      hasUsableNewsImage(candidate) &&
      !/(?:logo|icon|avatar|qr|qrcode|weixin|wechat|banner|sprite|favicon)/i.test(candidate),
  );

  if (primaryArticleImage) {
    return primaryArticleImage;
  }

  if (/chinanews\.com/i.test(url)) {
    return "";
  }

  const imageCandidates = [
    ...articleMatches,
    ...html.matchAll(
      /<(?:img|source)[^>]+(?:src|data-src|data-original|data-echo|data-lazy-src)=["']([^"']+)["']/gi,
    ),
    ...html.matchAll(
      /https?:\/\/[^"'\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\s>]*)?/gi,
    ),
  ]
    .map((match) =>
      typeof match === "string"
        ? match
        : absolutizeUrl(cleanHtml(match[1] || match[0] || ""), url),
    )
    .filter(Boolean)
    .filter((candidate, index, list) => list.indexOf(candidate) === index)
    .filter((candidate) => hasUsableNewsImage(candidate))
    .filter((candidate) => !/(?:logo|icon|avatar|qr|qrcode|weixin|wechat|banner|sprite|favicon)/i.test(candidate));

  if (!imageCandidates.length) {
    return "";
  }

  return imageCandidates
    .map((candidate) => {
      let score = 0;
      if (/\/cspimp\//i.test(candidate)) {
        score += 120;
      }
      if (articleMatches.includes(candidate)) {
        score += 140;
      }
      if (/\/20\d{2}[/-]\d{2}[/-]\d{2}\//i.test(candidate)) {
        score += 60;
      }
      if (/image\./i.test(candidate)) {
        score += 30;
      }
      if (/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(candidate)) {
        score += 20;
      }
      if (/(?:thumb|small|mini)/i.test(candidate)) {
        score -= 40;
      }

      return {
        candidate,
        score,
      };
    })
    .sort((left, right) => right.score - left.score)[0]?.candidate ?? "";
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
      if (hasUsableNewsImage(item.image) && item.summary) {
        return item;
      }

      const preview = await fetchArticlePreview(item.link);
      return {
        ...item,
        image: preview.image || item.image || "",
        summary: normalizeSummary(item.summary || preview.summary || "", item.title),
      };
    }),
  );

  return enriched.map((item) => ({
    ...item,
    image: hasUsableNewsImage(item.image) ? item.image : "",
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

const nbaLeaderSlots = [
  { names: ["pointsPerGame", "points"], fallbackLabel: "PTS" },
  { names: ["reboundsPerGame", "rebounds"], fallbackLabel: "REB" },
  { names: ["assistsPerGame", "assists"], fallbackLabel: "AST" },
];
const nbaScheduleRadius = 4;
const nbaSummaryCache = new Map();

function getAthleteHeadshot(athlete) {
  if (!athlete) {
    return "";
  }

  if (typeof athlete.headshot === "string") {
    return athlete.headshot;
  }

  return athlete.headshot?.href ?? "";
}

function formatLeaderCategories(categories) {
  return nbaLeaderSlots
    .map((slot) =>
      (categories ?? []).find((category) => slot.names.includes(category.name)),
    )
    .filter(Boolean)
    .map((category) => {
      const leader = category.leaders?.[0];
      const athlete = leader?.athlete ?? {};
      return {
        label:
          leader?.mainStat?.label ??
          category.shortDisplayName ??
          category.abbreviation ??
          category.displayName ??
          "",
        value: leader?.displayValue ?? leader?.mainStat?.value ?? "--",
        player: athlete.displayName ?? athlete.shortName ?? "--",
        position: athlete.position?.abbreviation ?? "",
        jersey: athlete.jersey ?? "",
        summary: leader?.summary ?? "",
        headshot: getAthleteHeadshot(athlete),
        link: athlete.links?.find((link) => link.href)?.href ?? "",
      };
    });
}

function getDateKeyInTimeZone(date, timeZone = "Asia/Shanghai") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey, offset) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function toEspnDate(dateKey) {
  return dateKey.replaceAll("-", "");
}

function buildNbaDateWindow(todayKey) {
  return Array.from({ length: nbaScheduleRadius * 2 + 1 }, (_, index) =>
    addDaysToDateKey(todayKey, index - nbaScheduleRadius),
  );
}

async function fetchNbaGameLeaders(eventId) {
  if (nbaSummaryCache.has(eventId)) {
    return nbaSummaryCache.get(eventId);
  }

  const promise = fetchJson(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`,
  )
    .then((summary) =>
      Object.fromEntries(
        (summary.leaders ?? []).map((team) => [
          team.team?.abbreviation,
          {
            displayName: team.team?.displayName ?? "",
            logo: team.team?.logo ?? team.team?.logos?.[0]?.href ?? "",
            leaderContext: "Game Leaders",
            leaders: formatLeaderCategories(team.leaders),
          },
        ]),
      ),
    )
    .catch(() => null);

  nbaSummaryCache.set(eventId, promise);
  return promise;
}

async function buildNbaGame(event) {
  const competition = event.competitions?.[0] ?? {};
  const competitors = competition.competitors ?? [];
  const homeTeam = competitors.find((team) => team.homeAway === "home");
  const awayTeam = competitors.find((team) => team.homeAway === "away");
  const status = getGameStatus(event.status ?? competition.status);

  const game = {
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
      displayName: homeTeam?.team?.displayName ?? "Home Team",
      score: homeTeam?.score ?? "-",
      logo: homeTeam?.team?.logo ?? "",
      leaderContext: "Season Leaders",
      leaders: formatLeaderCategories(homeTeam?.leaders),
    },
    awayTeam: {
      abbreviation: awayTeam?.team?.abbreviation ?? "AWAY",
      displayName: awayTeam?.team?.displayName ?? "Away Team",
      score: awayTeam?.score ?? "-",
      logo: awayTeam?.team?.logo ?? "",
      leaderContext: "Season Leaders",
      leaders: formatLeaderCategories(awayTeam?.leaders),
    },
  };

  if (status.state !== "pre") {
    const liveLeaders = await fetchNbaGameLeaders(event.id);

    if (liveLeaders?.[game.homeTeam.abbreviation]) {
      game.homeTeam = {
        ...game.homeTeam,
        ...liveLeaders[game.homeTeam.abbreviation],
      };
    }

    if (liveLeaders?.[game.awayTeam.abbreviation]) {
      game.awayTeam = {
        ...game.awayTeam,
        ...liveLeaders[game.awayTeam.abbreviation],
      };
    }
  }

  return game;
}

async function fetchNbaScheduleDay(dateKey) {
  const data = await fetchJson(
    `${defaults.nbaScoreboardUrl}?dates=${toEspnDate(dateKey)}`,
  );
  const games = await Promise.all((data.events ?? []).map(buildNbaGame));

  return {
    date: data.day?.date ?? dateKey,
    games,
  };
}

async function fetchNbaScoreboard(referenceDate = new Date()) {
  const todayKey = getDateKeyInTimeZone(referenceDate);
  const dateWindow = buildNbaDateWindow(todayKey);
  const days = await Promise.all(dateWindow.map(fetchNbaScheduleDay));
  const currentIndex = dateWindow.findIndex((dateKey) => dateKey === todayKey);

  return {
    date: todayKey,
    currentIndex,
    days,
    games: days[currentIndex]?.games ?? [],
  };
}

function getDaySeed(date) {
  const dateKey = getDateKeyInTimeZone(date);
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

function buildFeaturedPlaceCarousel(date) {
  return rotateItems(featuredPlaces, featuredPlaces.length, getDaySeed(date));
}

function buildClassicQuote(date) {
  return rotateItems(classicQuotes, 1, getDaySeed(date))[0] ?? null;
}

function buildBookExcerpt(date) {
  return rotateItems(bookExcerpts, 1, getDaySeed(date) + 17)[0] ?? null;
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
  const todayKey = getDateKeyInTimeZone(now);

  const [
    weatherResult,
    chinaTopResult,
    chinaSocietyResult,
    chinaFinanceResult,
    worldTopResult,
    worldBusinessResult,
    worldTechResult,
    featuredPlacesResult,
    nbaScoreboardResult,
    nbaResult,
    todayInHistoryResult,
  ] = await Promise.allSettled([
    fetchWeather(),
    fetchMergedRssFeeds(
      [{ url: defaults.newsFeeds.chinaTop, source: "中新网", limit: 8 }],
      5,
      "chinaTop",
    ),
    fetchMergedRssFeeds(
      [{ url: defaults.newsFeeds.chinaSociety, source: "中新网", limit: 8 }],
      5,
      "chinaSociety",
    ),
    fetchMergedRssFeeds(
      [{ url: defaults.newsFeeds.chinaFinance, source: "中新网", limit: 8 }],
      5,
      "chinaFinance",
    ),
    fetchMergedRssFeeds(
      [
        { url: defaults.newsFeeds.internationalBbc, source: "BBC", limit: 5 },
        { url: defaults.newsFeeds.internationalCnn, source: "CNN", limit: 5 },
      ],
      5,
      "worldTop",
    ),
    fetchMergedRssFeeds(
      [
        {
          url: defaults.newsFeeds.internationalBusinessBbc,
          source: "BBC",
          limit: 5,
        },
        {
          url: defaults.newsFeeds.internationalBusinessCnn,
          source: "CNN",
          limit: 5,
        },
      ],
      5,
      "worldBusiness",
    ),
    fetchMergedRssFeeds(
      [
        {
          url: defaults.newsFeeds.internationalTechBbc,
          source: "BBC",
          limit: 5,
        },
        {
          url: defaults.newsFeeds.internationalTechCnn,
          source: "CNN",
          limit: 5,
        },
      ],
      5,
      "worldTech",
    ),
    fetchFeaturedPlaces(),
    fetchNbaScoreboard(),
    fetchRssFeed(defaults.newsFeeds.nba, 6, "ESPN").then((items) =>
      enrichNewsItems(items, "nba"),
    ),
    fetchTodayInHistory(now),
  ]);

  const featuredPlaceCarousel =
    featuredPlacesResult.status === "fulfilled"
      ? featuredPlacesResult.value
      : buildFeaturedPlaceCarousel(now);

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
    classicQuote: buildClassicQuote(now),
    bookExcerpt: buildBookExcerpt(now),
    featuredPlace: featuredPlaceCarousel[0] ?? buildFeaturedPlace(now),
    featuredPlaces: featuredPlaceCarousel,
    todayInHistory:
      todayInHistoryResult.status === "fulfilled"
        ? todayInHistoryResult.value
        : buildTodayInHistoryFallback(now),
    news: {
      chinaTop: chinaTopResult.status === "fulfilled" ? chinaTopResult.value : [],
      chinaSociety:
        chinaSocietyResult.status === "fulfilled"
          ? chinaSocietyResult.value
          : [],
      chinaFinance:
        chinaFinanceResult.status === "fulfilled" ? chinaFinanceResult.value : [],
      worldTop: worldTopResult.status === "fulfilled" ? worldTopResult.value : [],
      worldBusiness:
        worldBusinessResult.status === "fulfilled"
          ? worldBusinessResult.value
          : [],
      worldTech: worldTechResult.status === "fulfilled" ? worldTechResult.value : [],
      domestic: chinaTopResult.status === "fulfilled" ? chinaTopResult.value : [],
      international: worldTopResult.status === "fulfilled" ? worldTopResult.value : [],
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
      rotationLabel: `Curated Rotation · ${todayKey}`,
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
